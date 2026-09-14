import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, View } from 'react-native';
import { Button, HelperText, RadioButton, Text, TextInput } from 'react-native-paper';
import { z } from 'zod';

import { useManifestStore } from '@/src/store/manifest';

const schema = z.object({
  productName: z.string().min(1, 'Nome do produto é obrigatório'),
  lote: z.string().min(1, 'Lote obrigatório'),
  unit: z.string().min(1, 'Unidade obrigatória'),
  type: z.enum(['entrada', 'saida'], { required_error: 'Tipo obrigatório' }),
  date: z.string().min(1, 'Data obrigatória'),
  validade: z.string().min(1, 'Validade obrigatória'),
  responsible: z.string().min(1, 'Responsável obrigatório'),
  observations: z.string().optional(),
});

type ManifestForm = z.infer<typeof schema>;

const fields: { name: keyof ManifestForm; label: string }[] = [
  { name: 'productName', label: 'Nome do Produto' },
  { name: 'lote', label: 'Lote' },
  { name: 'unit', label: 'Unidade' },
  { name: 'responsible', label: 'Responsável' },
  { name: 'date', label: 'Data de hoje' },
  { name: 'validade', label: 'Validade (YYYY-MM-DD)' },
];

export default function HomeScreen() {
  const { add } = useManifestStore();
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ManifestForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      productName: '',
      lote: '',
      unit: '',
      type: 'entrada',
      date: new Date().toISOString().split('T')[0],
      validade: new Date().toISOString().split('T')[0],
      responsible: '',
      observations: '',
    },
  });

  const onSubmit = async (data: ManifestForm) => {
    await add(data);
    reset({
      productName: '',
      lote: '',
      unit: '',
      type: 'entrada',
      date: new Date().toISOString().split('T')[0],
      validade: new Date().toISOString().split('T')[0],
      responsible: '',
      observations: '',
    });
  };

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>
      <Text variant="titleLarge" style={{ marginTop: 56, marginBottom: 20 }}>
        Novo Manifesto
      </Text>

      {fields.map(({ name, label }) => (
        <React.Fragment key={name}>
          <Controller
            control={control}
            name={name}
            render={({ field: { onChange, value } }) => (
              <TextInput
                label={label}
                mode="outlined"
                value={value as string}
                onChangeText={onChange}
                error={!!errors[name]}
              />
            )}
          />
          <HelperText type="error" visible={!!errors[name]}>
            {errors[name]?.message}
          </HelperText>
        </React.Fragment>
      ))}

      <Text style={{ marginTop: 8, marginBottom: 4 }}>Tipo:</Text>
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
        name="observations"
        render={({ field: { onChange, value } }) => (
          <TextInput
            label="Observações"
            mode="outlined"
            value={value ?? ''}
            onChangeText={onChange}
            multiline
            numberOfLines={3}
          />
        )}
      />

      <Button mode="contained" style={{ marginTop: 20 }} onPress={handleSubmit(onSubmit)}>
        Adicionar Produto
      </Button>
    </ScrollView>
  );
}
