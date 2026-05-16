import { createContext, useContext, useState, useCallback } from 'react';

const LS_KEY = 'usaruna_wishlist';

const load = () => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]'); }
  catch { return []; }
};

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [items, setItems] = useState(load);

  const toggle = useCallback((product) => {
    setItems((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      const next = exists
        ? prev.filter((p) => p.id !== product.id)
        : [...prev, {
            id:          product.id,
            name:        product.name,
            nameEn:      product.nameEn,
            price:       product.price,
            emoji:       product.emoji,
            gradient:    product.gradient,
            image_url:   product.image_url,
            family:      product.family,
            familyEn:    product.familyEn,
            sellerCity:  product.sellerCity,
            sellerCityEn:product.sellerCityEn,
          }];
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isLiked = useCallback((id) => items.some((p) => p.id === id), [items]);

  return (
    <WishlistContext.Provider value={{ items, toggle, isLiked }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
