// src/screens/ManifestFormScreen.tsx
import { yupResolver } from '@hookform/resolvers/yup';
import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { View, ScrollView } from 'react-native';
import {
  TextInput,
  Button,
  RadioButton,
  Text,
  HelperText,
  Menu,
  Provider,
} from 'react-native-paper';
import * as yup from 'yup';

import { initDatabase } from '@/src/services/db';

const schema = yup.object({
  productName: yup.string().required('Nome do produto é obrigatório'),
  quantity: yup.number().positive().required('Quantidade obrigatória'),
  unit: yup.string().required('Unidade obrigatória'),
  type: yup.string().oneOf(['entrada', 'saida']).required('Tipo obrigatório'),
  date: yup.string().required('Data obrigatória'),
  responsible: yup.string().required('Responsável obrigatório'),
  observations: yup.string().optional(),
});

export default function ManifestFormScreen() {
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      productName: '',
      quantity: 0,
      unit: '',
      type: 'entrada',
      date: new Date().toISOString().split('T')[0],
      responsible: '',
      observations: '',
    },
  });

  const [unitMenuVisible, setUnitMenuVisible] = useState(false);

  useEffect(() => {
    initDatabase();
  }, []);

  const onSubmit = (data: any) => {
    insertManifest(data, () => {
      alert('Manifesto salvo com sucesso!');
    });
  };

  return (
    <Provider>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text variant="titleLarge" style={{ marginBottom: 20 }}>
          Novo Manifesto
        </Text>

        <Controller
          control={control}
          name="productName"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Nome do Produto"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              error={!!errors.productName}
            />
          )}
        />
        <HelperText type="error" visible={!!errors.productName}>
          {errors.productName?.message}
        </HelperText>

        <Controller
          control={control}
          name="quantity"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Quantidade"
              mode="outlined"
              keyboardType="numeric"
              value={value?.toString()}
              onChangeText={onChange}
              error={!!errors.quantity}
            />
          )}
        />
        <HelperText type="error" visible={!!errors.quantity}>
          {errors.quantity?.message}
        </HelperText>

        <Menu
          visible={unitMenuVisible}
          onDismiss={() => setUnitMenuVisible(false)}
          anchor={
            <Controller
              control={control}
              name="unit"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Unidade"
                  mode="outlined"
                  value={value}
                  onFocus={() => setUnitMenuVisible(true)}
                  right={<TextInput.Icon icon="menu-down" />}
                  editable={false}
                  error={!!errors.unit}
                />
              )}
            />
          }>
          {['kg', 'un', 'l'].map((u) => (
            <Menu.Item
              key={u}
              onPress={() => {
                setValue('unit', u);
                setUnitMenuVisible(false);
              }}
              title={u.toUpperCase()}
            />
          ))}
        </Menu>
        <HelperText type="error" visible={!!errors.unit}>
          {errors.unit?.message}
        </HelperText>

        <Text style={{ marginTop: 10, marginBottom: 5 }}>Tipo:</Text>
        <Controller
          control={control}
          name="type"
          render={({ field: { onChange, value } }) => (
            <RadioButton.Group onValueChange={onChange} value={value}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <RadioButton value="entrada" />
                <Text>Entrada</Text>
                <RadioButton value="saida" />
                <Text>Saída</Text>
              </View>
            </RadioButton.Group>
          )}
        />
        <HelperText type="error" visible={!!errors.type}>
          {errors.type?.message}
        </HelperText>

        <Controller
          control={control}
          name="responsible"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Responsável"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              error={!!errors.responsible}
            />
          )}
        />
        <HelperText type="error" visible={!!errors.responsible}>
          {errors.responsible?.message}
        </HelperText>

        <Controller
          control={control}
          name="date"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Data"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              error={!!errors.date}
            />
          )}
        />
        <HelperText type="error" visible={!!errors.date}>
          {errors.date?.message}
        </HelperText>

        <Controller
          control={control}
          name="observations"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Observações"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              multiline
              numberOfLines={4}
            />
          )}
        />

        <Button mode="contained" style={{ marginTop: 20 }} onPress={handleSubmit(onSubmit)}>
          Gerar Manifesto
        </Button>
      </ScrollView>
    </Provider>
  );
}
function insertManifest(data: any, arg1: () => void) {
  throw new Error('Function not implemented.');
}
