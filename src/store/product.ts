import { create } from 'zustand';

type Product = {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
};

type ProductStore = {
  products: Product[];
};

export const useProductStore = create<ProductStore>(() => ({
  products: [],
}));
