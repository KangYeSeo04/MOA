import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

type FavoriteRestaurant = {
  id: number;
  name: string;
};

type FavoriteStore = {
  favorites: FavoriteRestaurant[];
  toggleFavorite: (r: FavoriteRestaurant) => void;
  isFavorite: (id: number) => boolean;
  loadFavorites: () => Promise<void>;
};

export const useFavoriteStore = create<FavoriteStore>((set, get) => ({
  favorites: [],

  loadFavorites: async () => {
    const raw = await AsyncStorage.getItem("favorites");
    if (raw) set({ favorites: JSON.parse(raw) });
  },

  toggleFavorite: (r) => {
    const current = get().favorites;
    const exists = current.find((f) => f.id === r.id);

    const next = exists
      ? current.filter((f) => f.id !== r.id)
      : [...current, r];

    set({ favorites: next });
    AsyncStorage.setItem("favorites", JSON.stringify(next));
  },

  isFavorite: (id) => {
    return get().favorites.some((f) => f.id === id);
  },
}));
