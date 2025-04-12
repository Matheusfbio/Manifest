import { zodResolver } from '@hookform/resolvers/zod';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { View, ScrollView } from 'react-native';
import { TextInput, Button, RadioButton, Text, HelperText, Provider } from 'react-native-paper';
import { z } from 'zod';

const schema = z.object({
  productName: z.string().min(1, 'Nome do produto é obrigatório'),
  lote: z.string().min(1, 'Lote obrigatório'),
  unit: z.string().min(1, 'Unidade obrigatória'),
  type: z.enum(['entrada', 'saida'], {
    required_error: 'Tipo obrigatório',
  }),
  date: z.string().min(1, 'Data obrigatória'),
  responsible: z.string().min(1, 'Responsável obrigatório'),
  observations: z.string().optional(),
});

type ManifestForm = z.infer<typeof schema>;

export default function ManifestFormScreen() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ManifestForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      productName: '',
      lote: '',
      unit: '',
      type: 'entrada',
      date: new Date().toISOString().split('T')[0],
      responsible: '',
      observations: '',
    },
  });

  const onSubmit = async (data: ManifestForm) => {
    try {
      const htmlContent = `
        <html>
          <body style="font-family: Arial; padding: 24px;">
            <h1>Manifesto de Produto</h1>
            <p><strong>Produto:</strong> ${data.productName}</p>
            <p><strong>Lote:</strong> ${data.lote}</p>
            <p><strong>Unidade:</strong> ${data.unit}</p>
            <p><strong>Tipo:</strong> ${data.type}</p>
            <p><strong>Data:</strong> ${data.date}</p>
            <p><strong>Responsável:</strong> ${data.responsible}</p>
            <p><strong>Observações:</strong> ${data.observations || 'Nenhuma'}</p>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        alert('Compartilhamento não disponível neste dispositivo');
      }
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF');
    }
  };

  return (
    <Provider>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text variant="titleLarge" style={{ marginBottom: 20 }}>
          Novo Manifesto
        </Text>

        {/* Nome do Produto */}
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

        {/* Lote */}
        <Controller
          control={control}
          name="lote"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Lote"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              error={!!errors.lote}
            />
          )}
        />
        <HelperText type="error" visible={!!errors.lote}>
          {errors.lote?.message}
        </HelperText>

        {/* Unidade */}
        <Controller
          control={control}
          name="unit"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Unidade"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              error={!!errors.unit}
            />
          )}
        />
        <HelperText type="error" visible={!!errors.unit}>
          {errors.unit?.message}
        </HelperText>

        {/* Tipo */}
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

        {/* Responsável */}
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

        {/* Data */}
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

        {/* Observações */}
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
          Gerar PDF
        </Button>
      </ScrollView>
    </Provider>
  );
}
