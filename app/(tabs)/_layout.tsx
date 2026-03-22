import { Tabs, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Text } from 'react-native';
import { Provider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuthStore } from '@/src/store/auth';

function TabIcon({ icon }: { icon: string }) {
  return <Text style={{ fontSize: 20 }}>{icon}</Text>;
}

export default function TabLayout() {
  const { isAuthenticated, loaded, loadConfig } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (!isAuthenticated) {
      router.replace('/login' as any);
    }
  }, [loaded, isAuthenticated]);

  if (!loaded || !isAuthenticated) return null;

  return (
    <SafeAreaProvider>
      <Provider>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#6200ee',
          }}>
          <Tabs.Screen
            name="index"
            options={{
              title: 'Manifesto',
              tabBarIcon: () => <TabIcon icon="📋" />,
            }}
          />
          <Tabs.Screen
            name="products"
            options={{
              title: 'Produtos',
              tabBarIcon: () => <TabIcon icon="📦" />,
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              title: 'Configurações',
              tabBarIcon: () => <TabIcon icon="⚙️" />,
            }}
          />
        </Tabs>
      </Provider>
    </SafeAreaProvider>
  );
}
