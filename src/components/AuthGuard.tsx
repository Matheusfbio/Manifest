import * as LocalAuthentication from 'expo-local-authentication';
import React, { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';

import { simpleHash, useAuthStore } from '../store/auth';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, config, loaded, loadConfig, authenticate } = useAuthStore();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    if (!loaded || isAuthenticated) return;
    if (Platform.OS !== 'web' && config?.biometricEnabled) {
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
      if (result.success) authenticate();
    } finally {
      setChecking(false);
    }
  };

  const handlePasswordLogin = () => {
    if (!config) {
      setError('Nenhuma senha configurada. Configure nas Configurações.');
      return;
    }
    if (simpleHash(password) === config.passwordHash) {
      authenticate();
    } else {
      setError('Senha incorreta');
    }
  };

  if (!loaded) return null;

  if (!config) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text variant="titleLarge" style={{ marginBottom: 8 }}>
          Bem-vindo!
        </Text>
        <Text variant="bodyMedium" style={{ textAlign: 'center', marginBottom: 24, color: '#666' }}>
          Configure seu perfil e senha nas Configurações para proteger o app.
        </Text>
        <Button mode="contained" onPress={authenticate}>
          Entrar sem senha
        </Button>
      </View>
    );
  }

  if (isAuthenticated) return <>{children}</>;

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 32 }}>
      <Text variant="titleLarge" style={{ marginBottom: 4 }}>
        Olá, {config.userName}
      </Text>
      <Text variant="bodyMedium" style={{ marginBottom: 24, color: '#666' }}>
        Autentique-se para continuar
      </Text>

      {Platform.OS !== 'web' && config.biometricEnabled && (
        <Button
          mode="contained"
          onPress={triggerBiometric}
          loading={checking}
          style={{ marginBottom: 16 }}>
          Usar Biometria
        </Button>
      )}

      <TextInput
        label="Senha"
        mode="outlined"
        secureTextEntry
        value={password}
        onChangeText={(v) => {
          setPassword(v);
          setError('');
        }}
        onSubmitEditing={handlePasswordLogin}
      />
      <HelperText type="error" visible={!!error}>
        {error}
      </HelperText>
      <Button mode="outlined" onPress={handlePasswordLogin} style={{ marginTop: 8 }}>
        Entrar com senha
      </Button>
    </View>
  );
}
