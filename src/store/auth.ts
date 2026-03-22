import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const AUTH_KEY = '@auth_config';

type AuthConfig = {
  userName: string;
  passwordHash: string;
  biometricEnabled: boolean;
};

type AuthStore = {
  isAuthenticated: boolean;
  config: AuthConfig | null;
  loaded: boolean;
  loadConfig: () => Promise<void>;
  saveConfig: (config: AuthConfig) => Promise<void>;
  authenticate: () => void;
  logout: () => void;
};

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString();
}

export { simpleHash };

export const useAuthStore = create<AuthStore>((set, get) => ({
  isAuthenticated: false,
  config: null,
  loaded: false,

  loadConfig: async () => {
    try {
      const data = await AsyncStorage.getItem(AUTH_KEY);
      set({ config: data ? JSON.parse(data) : null, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  saveConfig: async (config) => {
    set({ config });
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(config));
  },

  authenticate: () => set({ isAuthenticated: true }),

  logout: () => set({ isAuthenticated: false }),
}));
