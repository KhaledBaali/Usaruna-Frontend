import { createContext, useContext, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  // meta = { deliveryOption, deliveryLocation, deliveryPrice }
  const addItem = (product, qty = 1, meta = {}) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id
            ? { ...i, qty: i.qty + qty, ...meta }
            : i
        );
      }
      return [...prev, { ...product, qty, ...meta }];
    });
  };

  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id));

  const updateQty = (id, qty) => {
    if (qty < 1) { removeItem(id); return; }
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, qty } : i));
  };

  const clearCart = () => setItems([]);

  const totalCount = items.reduce((sum, i) => sum + i.qty, 0);
  const subtotal   = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, totalCount, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
