import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export type ManifestProduct = {
  id: string;
  productName: string;
  lote: string;
  unit: string;
  type: 'entrada' | 'saida';
  date: string;
  validade: string;
  responsible: string;
  observations?: string;
  createdAt: number;
};

const STORAGE_KEY = '@manifest_products';

type ManifestStore = {
  products: ManifestProduct[];
  loaded: boolean;
  load: () => Promise<void>;
  add: (product: Omit<ManifestProduct, 'id' | 'createdAt'>) => Promise<void>;
  update: (id: string, product: Omit<ManifestProduct, 'id' | 'createdAt'>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  clear: () => Promise<void>;
};

export const useManifestStore = create<ManifestStore>((set, get) => ({
  products: [],
  loaded: false,

  load: async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      set({ products: data ? JSON.parse(data) : [], loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  add: async (product) => {
    const newProduct: ManifestProduct = {
      ...product,
      id: Date.now().toString(),
      createdAt: Date.now(),
    };
    const products = [...get().products, newProduct];
    set({ products });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  },

  update: async (id, product) => {
    const products = get().products.map((p) =>
      p.id === id ? { ...p, ...product } : p
    );
    set({ products });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  },

  remove: async (id) => {
    const products = get().products.filter((p) => p.id !== id);
    set({ products });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  },

  clear: async () => {
    set({ products: [] });
    await AsyncStorage.removeItem(STORAGE_KEY);
  },
}));
