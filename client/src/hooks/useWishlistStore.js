import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useWishlistStore = create(
  // The persist middleware saves the wishlist to localStorage,
  // so it doesn't disappear when you refresh! So cool!
  persist(
    (set, get) => ({
      // Our list of product IDs that are in the wishlist!
      wishlist: [],

      // A function to add or remove an item!
      toggleWishlist: (productId) => {
        const { wishlist } = get();
        const isInWishlist = wishlist.includes(productId);

        if (isInWishlist) {
          // If it's already there, we remove it!
          set({ wishlist: wishlist.filter((id) => id !== productId) });
        } else {
          // If it's not there, we add it!
          set({ wishlist: [...wishlist, productId] });
        }
      },
    }),
    {
      name: 'realmmaid-wishlist', // The key for saving in localStorage!
    }
  )
);