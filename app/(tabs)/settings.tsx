import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { Button, Divider, HelperText, Switch, Text, TextInput } from 'react-native-paper';

import { simpleHash, useAuthStore } from '@/src/store/auth';

export default function SettingsScreen() {
  const { config, loadConfig, saveConfig, logout } = useAuthStore();
  const router = useRouter();

  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadConfig();
    if (Platform.OS !== 'web') {
      LocalAuthentication.hasHardwareAsync().then((has) => {
        if (has) LocalAuthentication.isEnrolledAsync().then(setBiometricAvailable);
      });
    }
  }, []);

  useEffect(() => {
    if (config) {
      setUserName(config.userName);
      setBiometricEnabled(config.biometricEnabled);
    }
  }, [config]);

  const handleSave = async () => {
    setError('');
    setSuccess('');

    if (!userName.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    if (password || !config) {
      if (password.length < 4) {
        setError('Senha deve ter ao menos 4 caracteres');
        return;
      }
      if (password !== confirmPassword) {
        setError('As senhas não coincidem');
        return;
      }
    }

    await saveConfig({
      userName: userName.trim(),
      passwordHash: password ? simpleHash(password) : (config?.passwordHash ?? ''),
      biometricEnabled: biometricEnabled && biometricAvailable,
    });

    setPassword('');
    setConfirmPassword('');
    setSuccess('Configurações salvas com sucesso!');
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
      <Text variant="titleLarge" style={{ marginTop: 48, marginBottom: 20 }}>
        Configurações
      </Text>

      <Text variant="titleSmall" style={{ marginBottom: 8 }}>
        Identificação
      </Text>
      <TextInput
        label="Seu nome"
        mode="outlined"
        value={userName}
        onChangeText={setUserName}
        style={{ marginBottom: 16 }}
      />

      <Divider style={{ marginBottom: 16 }} />

      <Text variant="titleSmall" style={{ marginBottom: 8 }}>
        {config ? 'Alterar senha' : 'Criar senha'}
      </Text>
      <TextInput
        label="Nova senha"
        mode="outlined"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ marginBottom: 8 }}
      />
      <TextInput
        label="Confirmar senha"
        mode="outlined"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        style={{ marginBottom: 8 }}
      />

      {Platform.OS !== 'web' && biometricAvailable && (
        <>
          <Divider style={{ marginVertical: 16 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="titleSmall">Usar Biometria</Text>
            <Switch
              value={biometricEnabled}
              onValueChange={setBiometricEnabled}
            />
          </View>
          <Text variant="bodySmall" style={{ color: '#666', marginTop: 4 }}>
            Autentique-se com impressão digital ou Face ID
          </Text>
        </>
      )}

      {Platform.OS === 'web' && (
        <>
          <Divider style={{ marginVertical: 16 }} />
          <Text variant="bodySmall" style={{ color: '#666' }}>
            Na web, a autenticação é feita por senha.
          </Text>
        </>
      )}

      <HelperText type="error" visible={!!error}>
        {error}
      </HelperText>
      <HelperText type="info" visible={!!success}>
        {success}
      </HelperText>

      <Button mode="contained" onPress={handleSave} style={{ marginTop: 8 }}>
        Salvar configurações
      </Button>

      <Divider style={{ marginVertical: 24 }} />

      <Button mode="outlined" textColor="#F44336" onPress={() => { logout(); router.replace('/login'); }}>
        Sair / Bloquear app
      </Button>
    </ScrollView>
  );
}
