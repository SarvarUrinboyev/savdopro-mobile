// Shared cart state for cashier POS screens.

import React, { createContext, useCallback, useContext, useMemo, useReducer } from 'react';

export type CartItem = {
  id: number;
  name: string;
  sellingPrice: number;
  quantity: number;
  availableQty?: number;
  barcode?: string | null;
};

type Action =
  | { type: 'ADD'; product: Omit<CartItem, 'quantity'> }
  | { type: 'REMOVE'; id: number }
  | { type: 'SET_QTY'; id: number; qty: number }
  | { type: 'CLEAR' };

function reducer(state: CartItem[], action: Action): CartItem[] {
  switch (action.type) {
    case 'ADD': {
      const existing = state.find((i) => i.id === action.product.id);
      if (existing) {
        return state.map((i) =>
          i.id === action.product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...state, { ...action.product, quantity: 1 }];
    }
    case 'REMOVE':
      return state.filter((i) => i.id !== action.id);
    case 'SET_QTY':
      return action.qty <= 0
        ? state.filter((i) => i.id !== action.id)
        : state.map((i) =>
            i.id === action.id ? { ...i, quantity: action.qty } : i,
          );
    case 'CLEAR':
      return [];
    default:
      return state;
  }
}

type CartContextType = {
  items: CartItem[];
  addItem: (product: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: number) => void;
  setQty: (id: number, qty: number) => void;
  clearCart: () => void;
  totalUsd: number;
  itemCount: number;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, dispatch] = useReducer(reducer, []);

  const addItem = useCallback(
    (product: Omit<CartItem, 'quantity'>) => dispatch({ type: 'ADD', product }),
    [],
  );
  const removeItem = useCallback(
    (id: number) => dispatch({ type: 'REMOVE', id }),
    [],
  );
  const setQty = useCallback(
    (id: number, qty: number) => dispatch({ type: 'SET_QTY', id, qty }),
    [],
  );
  const clearCart = useCallback(() => dispatch({ type: 'CLEAR' }), []);

  const totalUsd = useMemo(
    () => items.reduce((sum, i) => sum + i.sellingPrice * i.quantity, 0),
    [items],
  );
  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items],
  );

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, setQty, clearCart, totalUsd, itemCount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
