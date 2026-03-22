import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { simpleHash, useAuthStore } from '@/src/store/auth';

export default function LoginScreen() {
  const { config, loaded, loadConfig, authenticate } = useAuthStore();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    // sem config: entra direto
    if (!config) {
      authenticate();
      router.replace('/(tabs)');
      return;
    }
    // mobile com biometria habilitada: tenta automaticamente
    if (Platform.OS !== 'web' && config.biometricEnabled) {
      triggerBiometric();
    }
  }, [loaded, config]);

  const triggerBiometric = async () => {
    setChecking(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autentique-se para continuar',
        fallbackLabel: 'Usar senha',
      });
      if (result.success) {
        authenticate();
        router.replace('/(tabs)');
      }
    } finally {
      setChecking(false);
    }
  };

  const handlePasswordLogin = () => {
    if (!config) return;
    if (simpleHash(password) === config.passwordHash) {
      authenticate();
      router.replace('/(tabs)');
    } else {
      setError('Senha incorreta');
    }
  };

  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <Text variant="headlineMedium" style={styles.title}>
          Manifest
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          {config ? `Olá, ${config.userName}` : 'Bem-vindo!'}
        </Text>

        {Platform.OS !== 'web' && config?.biometricEnabled && (
          <Button
            mode="contained"
            onPress={triggerBiometric}
            loading={checking}
            style={styles.button}
            icon="fingerprint">
            Usar Biometria
          </Button>
        )}

        {(Platform.OS === 'web' || !config?.biometricEnabled) && config && (
          <>
            <TextInput
              label="Senha"
              mode="outlined"
              secureTextEntry
              value={password}
              onChangeText={(v) => { setPassword(v); setError(''); }}
              onSubmitEditing={handlePasswordLogin}
              style={styles.input}
            />
            <HelperText type="error" visible={!!error}>
              {error}
            </HelperText>
            <Button mode="contained" onPress={handlePasswordLogin} style={styles.button}>
              Entrar
            </Button>
          </>
        )}

        {Platform.OS !== 'web' && config?.biometricEnabled && (
          <>
            <TextInput
              label="Ou use a senha"
              mode="outlined"
              secureTextEntry
              value={password}
              onChangeText={(v) => { setPassword(v); setError(''); }}
              onSubmitEditing={handlePasswordLogin}
              style={[styles.input, { marginTop: 16 }]}
            />
            <HelperText type="error" visible={!!error}>
              {error}
            </HelperText>
            <Button mode="outlined" onPress={handlePasswordLogin}>
              Entrar com senha
            </Button>
          </>
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#fff',
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 32,
  },
  input: {
    marginBottom: 4,
  },
  button: {
    marginBottom: 12,
  },
});
