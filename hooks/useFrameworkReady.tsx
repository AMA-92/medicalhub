import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types de données
export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
}

export interface Sale {
  id: string;
  customerName: string;
  items: { productId: string; productName: string; quantity: number; price: number }[];
  total: number;
  date: string;
  status: 'completed' | 'pending';
  paymentMethod: 'cash' | 'wave' | 'orange' | 'debt';
  isPaid: boolean;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
}

export interface ShopSettings {
  name: string;
  logoUri?: string;
  phone?: string;
  address?: string;
  email?: string;
}

interface AppDataContextType {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  settings: ShopSettings;
  setSettings: (settings: ShopSettings) => void;
  loadAll: () => Promise<void>;
  saveAll: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider = ({ children }: { children: React.ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<ShopSettings>({ name: 'Ma Boutique', logoUri: undefined, phone: '', address: '', email: '' });

  // Chargement initial
  useEffect(() => {
    loadAll();
  }, []);

  // Synchronisation automatique à chaque changement
  useEffect(() => {
    const sync = async () => {
      try {
        await AsyncStorage.setItem('products', JSON.stringify(products));
        await AsyncStorage.setItem('sales', JSON.stringify(sales));
        await AsyncStorage.setItem('expenses', JSON.stringify(expenses));
        await AsyncStorage.setItem('settings', JSON.stringify(settings));
      } catch (e) {
        // Gestion d'erreur simple
      }
    };
    sync();
  }, [products, sales, expenses, settings]);

  const loadAll = async () => {
    try {
      const productsStr = await AsyncStorage.getItem('products');
      const salesStr = await AsyncStorage.getItem('sales');
      const expensesStr = await AsyncStorage.getItem('expenses');
      const settingsStr = await AsyncStorage.getItem('settings');
      if (productsStr) setProducts(JSON.parse(productsStr));
      if (salesStr) setSales(JSON.parse(salesStr));
      if (expensesStr) setExpenses(JSON.parse(expensesStr));
      if (settingsStr) setSettings(JSON.parse(settingsStr));
    } catch (e) {
      // Gestion d'erreur simple
    }
  };

  // saveAll reste pour compatibilité mais n'est plus nécessaire
  const saveAll = async () => {};

  return (
    <AppDataContext.Provider value={{ products, setProducts, sales, setSales, expenses, setExpenses, settings, setSettings, loadAll, saveAll }}>
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData doit être utilisé dans AppDataProvider');
  return ctx;
};