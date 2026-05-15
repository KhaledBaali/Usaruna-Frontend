/**
 * CartContext — Hybrid Persistence Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * GUEST  (not logged in): items live in localStorage under GUEST_KEY.
 * MEMBER (logged in):     items live in Supabase `cart_items` table.
 *
 * On LOGIN:  guest cart is merged into DB, then localStorage is cleared.
 * On LOGOUT: in-memory state is reset; DB rows remain for next login.
 *
 * The DB only stores { product_id, quantity }. Full product objects are
 * always rehydrated from the products catalogue (products.js) because
 * prices, names, and metadata can change — we never cache stale snapshots.
 *
 * Public API (identical to old CartContext so all consumers need no changes):
 *   items        – array of cart item objects (full product shape + qty)
 *   addItem      – addItem(product, qty?, meta?)
 *   removeItem   – removeItem(productId)
 *   updateQty    – updateQty(productId, newQty)
 *   clearCart    – wipe everything for the current mode
 *   totalCount   – sum of all quantities
 *   subtotal     – sum of price × qty
 *   cartReady    – false while initial load is in flight (avoids flicker)
 *
 * Sync helper (called by LoginPage after signIn):
 *   syncGuestCartToDB(userId) – merges localStorage into DB and clears it
 */

import {
  createContext, useContext, useState, useEffect, useCallback, useRef,
} from 'react';
import { supabase } from '../supabase';
import { useAuth } from './AuthContext';
import { fetchProductById } from '../lib/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const GUEST_KEY = 'usaruna_guest_cart'; // localStorage key for guest sessions

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Read the guest cart from localStorage. Returns [] on parse failure. */
function readGuestCart() {
  try {
    return JSON.parse(localStorage.getItem(GUEST_KEY) ?? '[]');
  } catch {
    return [];
  }
}

/** Write the guest cart to localStorage. */
function writeGuestCart(items) {
  localStorage.setItem(GUEST_KEY, JSON.stringify(items));
}

/**
 * Given a product_id string, return the full product object from the DB.
 * Returns null if not found (handles stale/deleted products gracefully).
 */
async function hydrateProduct(productId) {
  return await fetchProductById(productId);
}

/** Merge a DB row { product_id, quantity } into a rich cart item. */
async function dbRowToItem(row) {
  const product = await hydrateProduct(row.product_id);
  if (!product) return null; // product was removed
  return { ...product, id: String(product.id), qty: row.quantity };
}

// ─── Context ──────────────────────────────────────────────────────────────────

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items,     setItems]     = useState([]);
  const [cartReady, setCartReady] = useState(false);

  // Track the previous user id so we know when the auth state actually changed
  const prevUserIdRef = useRef(undefined);

  // ── Load cart on auth state change ─────────────────────────────────────────
  // This fires on BOTH login and signup — the sync is centralised here so no
  // individual page (LoginPage, UserRegisterPage, FamilyRegisterPage) needs to
  // manually call a sync function.

  useEffect(() => {
    const userId = user?.id ?? null;

    // No change — skip (prevents double-load on hot reload)
    if (userId === prevUserIdRef.current) return;
    prevUserIdRef.current = userId;

    setCartReady(false);

    if (!userId) {
      // ── GUEST mode: read from localStorage ──
      (async () => {
        const guestRows = readGuestCart();
        const hydrated = await Promise.all(
          guestRows.map(async ({ product_id, quantity }) => {
            const product = await hydrateProduct(product_id);
            if (!product) return null;
            return { ...product, id: String(product.id), qty: quantity };
          })
        );
        setItems(hydrated.filter(Boolean));
        setCartReady(true);
      })();
      return;
    }

    // ── MEMBER mode: sync guest cart → DB, then load merged result ──
    (async () => {
      const guestRows = readGuestCart();

      if (guestRows.length > 0) {
        // Fetch existing DB rows so we can merge quantities intelligently
        const { data: existing } = await supabase
          .from('cart_items')
          .select('product_id, quantity')
          .eq('user_id', userId);

        const existingMap = new Map(
          (existing ?? []).map((r) => [r.product_id, r.quantity]),
        );

        const upsertRows = guestRows.map(({ product_id, quantity }) => ({
          user_id:    userId,
          product_id: String(product_id),
          // Add guest qty on top of any existing DB qty for this product
          quantity:   (existingMap.get(String(product_id)) ?? 0) + quantity,
        }));

        await supabase
          .from('cart_items')
          .upsert(upsertRows, { onConflict: 'user_id,product_id' });

        // Guest cart promoted to DB — clear localStorage immediately
        localStorage.removeItem(GUEST_KEY);
      }

      // Load the now-merged cart from DB
      const { data, error } = await supabase
        .from('cart_items')
        .select('product_id, quantity')
        .eq('user_id', userId);

      if (!error && data) {
        const hydrated = await Promise.all(data.map(dbRowToItem));
        setItems(hydrated.filter(Boolean));
      }
      setCartReady(true);
    })();
  }, [user]);


  // ── GUEST helpers ───────────────────────────────────────────────────────────

  const setGuestItems = useCallback((updater) => {
    setItems((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      // Persist slim shape (product_id + quantity only)
      writeGuestCart(next.map(({ id, qty }) => ({ product_id: id, quantity: qty })));
      return next;
    });
  }, []);

  // ── DB helpers ──────────────────────────────────────────────────────────────

  const upsertDBItem = useCallback(async (productId, quantity) => {
    if (!user?.id) return;
    await supabase
      .from('cart_items')
      .upsert(
        { user_id: user.id, product_id: String(productId), quantity },
        { onConflict: 'user_id,product_id' },
      );
  }, [user]);

  const deleteDBItem = useCallback(async (productId) => {
    if (!user?.id) return;
    await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', String(productId));
  }, [user]);

  // ── Public API ──────────────────────────────────────────────────────────────

  /**
   * addItem(product, qty = 1, meta = {})
   * meta is delivery metadata kept in local state only — it is NOT persisted
   * to DB because it's ephemeral per-session delivery preference.
   */
  const addItem = useCallback((product, qty = 1, meta = {}) => {
    const pid = String(product.id);

    if (!user) {
      // GUEST
      setGuestItems((prev) => {
        const existing = prev.find((i) => i.id === pid);
        if (existing) {
          return prev.map((i) => i.id === pid
            ? { ...i, qty: i.qty + qty, ...meta }
            : i);
        }
        return [...prev, { ...product, id: pid, qty, ...meta }];
      });
    } else {
      // MEMBER — optimistic UI update first, then sync to DB
      setItems((prev) => {
        const existing = prev.find((i) => i.id === pid);
        const newQty = existing ? existing.qty + qty : qty;
        const next = existing
          ? prev.map((i) => i.id === pid ? { ...i, qty: newQty, ...meta } : i)
          : [...prev, { ...product, id: pid, qty, ...meta }];
        upsertDBItem(pid, newQty); // fire-and-forget
        return next;
      });
    }
  }, [user, setGuestItems, upsertDBItem]);

  const removeItem = useCallback((productId) => {
    const pid = String(productId);
    if (!user) {
      setGuestItems((prev) => prev.filter((i) => i.id !== pid));
    } else {
      setItems((prev) => prev.filter((i) => i.id !== pid));
      deleteDBItem(pid);
    }
  }, [user, setGuestItems, deleteDBItem]);

  const updateQty = useCallback((productId, qty) => {
    if (qty < 1) { removeItem(productId); return; }
    const pid = String(productId);
    if (!user) {
      setGuestItems((prev) =>
        prev.map((i) => i.id === pid ? { ...i, qty } : i));
    } else {
      setItems((prev) =>
        prev.map((i) => i.id === pid ? { ...i, qty } : i));
      upsertDBItem(pid, qty);
    }
  }, [user, setGuestItems, removeItem, upsertDBItem]);

  const clearCart = useCallback(async () => {
    setItems([]);
    if (!user) {
      localStorage.removeItem(GUEST_KEY);
    } else {
      await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);
    }
  }, [user]);

  // ── Derived values ──────────────────────────────────────────────────────────

  const totalCount = items.reduce((sum, i) => sum + i.qty, 0);
  const subtotal   = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        totalCount,
        subtotal,
        cartReady,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
