import { zodResolver } from '@hookform/resolvers/zod';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import React, { useState, useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Modal, Pressable, StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import {
  TextInput,
  Button,
  HelperText,
  Portal,
  Provider,
  RadioButton,
  Text,
} from 'react-native-paper';
import { z } from 'zod';

import { useManifestStore, type ManifestProduct } from '../store/manifest';

const toDisplay = (iso: string) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

const toISO = (date: Date) => date.toISOString().split('T')[0];

type ManifestForm = Omit<ManifestProduct, 'id' | 'createdAt'>;

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

const defaultValues: ManifestForm = {
  productName: '',
  lote: '',
  unit: '',
  type: 'entrada',
  date: toISO(new Date()),
  validade: toISO(new Date()),
  responsible: '',
  observations: '',
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
});

const categorizeProductsByExpiration = (products: ManifestProduct[]) => {
  const today = new Date();
  const daysTo = (p: ManifestProduct) =>
    Math.ceil((new Date(p.validade).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return {
    gray: products.filter((p) => daysTo(p) > 35).map((p) => ({ ...p, daysToExpire: daysTo(p) })),
    green: products
      .filter((p) => daysTo(p) > 25 && daysTo(p) <= 35)
      .map((p) => ({ ...p, daysToExpire: daysTo(p) })),
    yellow: products
      .filter((p) => daysTo(p) > 15 && daysTo(p) <= 25)
      .map((p) => ({ ...p, daysToExpire: daysTo(p) })),
    red: products.filter((p) => daysTo(p) <= 15).map((p) => ({ ...p, daysToExpire: daysTo(p) })),
  };
};

export default function ManifestFormScreen() {
  const { products, loaded, load, add, update, remove, clear } = useManifestStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pickerField, setPickerField] = useState<'date' | 'validade' | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ManifestForm>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  useEffect(() => {
    load();
  }, []);

  const onAddOrUpdateProduct = async (data: ManifestForm) => {
    if (editingId !== null) {
      await update(editingId, data);
      setEditingId(null);
    } else {
      await add(data);
    }
    reset(defaultValues);
  };

  const onEditProduct = (product: ManifestProduct) => {
    const { id, createdAt, ...form } = product;
    reset(form);
    setEditingId(id);
    setModalVisible(false);
  };

  const onDeleteProduct = (id: string) => remove(id);

  const onSubmitGeneratePDF = async () => {
    if (!loaded || products.length === 0) {
      Alert.alert('Atenção', 'Adicione ao menos um produto para gerar o PDF');
      return;
    }
    try {
      const today = new Date();
      const htmlRows = products
        .map((p, index) => {
          const daysToExpire = Math.ceil(
            (new Date(p.validade).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );
          const color =
            daysToExpire > 35
              ? '#A9A9A9'
              : daysToExpire > 25
                ? '#4CAF50'
                : daysToExpire > 15
                  ? '#FFEB3B'
                  : '#F44336';
          return `
            <tr style="color: ${color}">
              <td>${index + 1}</td><td>${p.productName}</td><td>${p.lote}</td>
              <td>${p.unit}</td><td>${p.type}</td><td>${p.date}</td><td>${p.validade}</td>
              <td>${daysToExpire > 0 ? `${daysToExpire} dias` : 'Vencido'}</td>
              <td>${p.responsible}</td><td>${p.observations || 'Nenhuma'}</td>
            </tr>`;
        })
        .join('');

      const htmlContent = `
        <html><head><style>
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f4f4f4; font-weight: bold; }
          h1 { text-align: center; font-family: Arial, sans-serif; }
        </style></head>
        <body>
          <h1>Manifesto de Produtos</h1>
          <table>
            <thead><tr>
              <th>#</th><th>Produto</th><th>Lote</th><th>Unidade</th><th>Tipo</th>
              <th>Data</th><th>Validade</th><th>Dias para Vencer</th><th>Responsável</th><th>Observações</th>
            </tr></thead>
            <tbody>${htmlRows}</tbody>
          </table>
        </body></html>`;

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

  const onSaveCsvFile = async () => {
    if (!loaded || products.length === 0) {
      alert('Adicione ao menos um produto para gerar o CSV');
      return;
    }
    try {
      const today = new Date();
      const csvHeader =
        'ID,Produto,Lote,Unidade,Tipo,Data,Validade,Dias para Vencer,Responsável,Observações\n';
      const csvRows = products
        .map((p, index) => {
          const daysToExpire = Math.ceil(
            (new Date(p.validade).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );
          return [
            index + 1,
            p.productName,
            p.lote,
            p.unit,
            p.type,
            p.date,
            p.validade,
            daysToExpire > 0 ? `${daysToExpire} dias` : 'Vencido',
            p.responsible,
            p.observations ? p.observations.replace(/\n/g, ' ') : 'Nenhuma',
          ]
            .map((field) => `"${field}"`)
            .join(',');
        })
        .join('\n');

      const fileUri = FileSystem.documentDirectory + 'manifesto_produtos.csv';
      await FileSystem.writeAsStringAsync(fileUri, csvHeader + csvRows, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        alert('Arquivo CSV gerado em: ' + fileUri);
      }
    } catch (error) {
      console.error('Erro ao gerar CSV:', error);
      alert('Erro ao gerar CSV');
    }
  };

  return (
    <Provider>
      <Text variant="titleLarge" style={{ marginLeft: 25, marginBottom: 20, marginTop: 40 }}>
        {editingId !== null ? 'Editar Produto' : 'Novo Manifesto'}
      </Text>
      <KeyboardAwareScrollView
        contentContainerStyle={{ paddingHorizontal: 24 }}
        enableOnAndroid
        extraScrollHeight={120}
        keyboardShouldPersistTaps="handled">
        {(
          [
            { name: 'productName', label: 'Nome do Produto' },
            { name: 'lote', label: 'Lote' },
            { name: 'unit', label: 'Unidade' },
            { name: 'responsible', label: 'Responsável' },
          ] as const
        ).map(({ name, label }) => (
          <React.Fragment key={name}>
            <Controller
              control={control}
              name={name}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label={label}
                  mode="outlined"
                  value={value}
                  onChangeText={onChange}
                  onFocus={() => setFocusedField(name)}
                  onBlur={() => setFocusedField(null)}
                  activeOutlineColor="#6200ee"
                  outlineColor={focusedField === name ? '#6200ee' : '#ccc'}
                  error={!!errors[name]}
                />
              )}
            />
            <HelperText type="error" visible={!!errors[name]}>
              {errors[name]?.message}
            </HelperText>
          </React.Fragment>
        ))}

        {(['date', 'validade'] as const).map((fieldName) => (
          <Controller
            key={fieldName}
            control={control}
            name={fieldName}
            render={({ field: { onChange, value } }) => (
              <>
                <Pressable onPress={() => setPickerField(fieldName)}>
                  <TextInput
                    label={fieldName === 'date' ? 'Data de hoje' : 'Validade'}
                    mode="outlined"
                    value={toDisplay(value)}
                    editable={false}
                    pointerEvents="none"
                    activeOutlineColor="#6200ee"
                    outlineColor={pickerField === fieldName ? '#6200ee' : '#ccc'}
                    right={
                      <TextInput.Icon icon="calendar" onPress={() => setPickerField(fieldName)} />
                    }
                    error={!!errors[fieldName]}
                  />
                </Pressable>
                <HelperText type="error" visible={!!errors[fieldName]}>
                  {errors[fieldName]?.message}
                </HelperText>
                {pickerField === fieldName && (
                  <DateTimePicker
                    value={value ? new Date(value) : new Date()}
                    mode="date"
                    display="calendar"
                    onChange={(_, selected) => {
                      setPickerField(null);
                      if (selected) onChange(toISO(selected));
                    }}
                  />
                )}
              </>
            )}
          />
        ))}

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
          name="observations"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Observações"
              mode="outlined"
              value={value ?? ''}
              onChangeText={onChange}
              onFocus={() => setFocusedField('observations')}
              onBlur={() => setFocusedField(null)}
              activeOutlineColor="#6200ee"
              outlineColor={focusedField === 'observations' ? '#6200ee' : '#ccc'}
              multiline
              numberOfLines={4}
            />
          )}
        />

        <Button
          mode="contained"
          style={{ marginTop: 20 }}
          onPress={handleSubmit(onAddOrUpdateProduct)}>
          {editingId !== null ? 'Atualizar Produto' : 'Adicionar Produto'}
        </Button>

        <Button mode="outlined" onPress={() => setModalVisible(true)} style={{ marginTop: 12 }}>
          Ver Produtos Adicionados ({loaded ? products.length : '...'})
        </Button>

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 52, padding: 10 }}>
          <Button mode="contained" style={{ marginBottom: 10 }} onPress={onSubmitGeneratePDF}>
            Gerar PDF
          </Button>
          <Button mode="contained" style={{ marginBottom: 10 }} onPress={onSaveCsvFile}>
            Gerar CSV
          </Button>
        </View>
      </KeyboardAwareScrollView>

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          transparent
          animationType="slide">
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <Text style={{ marginBottom: 10, fontSize: 18, fontWeight: 'bold' }}>
                Produtos adicionados (por validade)
              </Text>

              {Object.entries(categorizeProductsByExpiration(products)).map(([category, items]) => (
                <View key={category} style={{ marginBottom: 20 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: 'bold',
                      color:
                        category === 'gray'
                          ? '#A9A9A9'
                          : category === 'green'
                            ? '#4CAF50'
                            : category === 'yellow'
                              ? '#FFEB3B'
                              : '#F44336',
                    }}>
                    {category === 'gray'
                      ? 'Cinza (35 dias ou mais)'
                      : category === 'green'
                        ? 'Verde (25 a 35 dias)'
                        : category === 'yellow'
                          ? 'Amarelo (15 a 25 dias)'
                          : 'Vermelho (15 dias ou menos)'}
                  </Text>
                  {items.map((item, index) => (
                    <View key={item.id} style={styles.productItem}>
                      <Text style={{ flex: 1 }}>
                        {index + 1}. {item.productName} - Faltam {item.daysToExpire} dias
                      </Text>
                      <Button onPress={() => onEditProduct(item)}>✏️</Button>
                      <Button onPress={() => onDeleteProduct(item.id)} textColor="red">
                        🗑️
                      </Button>
                    </View>
                  ))}
                </View>
              ))}

              <Button onPress={clear}>Limpar Produtos Salvos</Button>
              <Button onPress={() => setModalVisible(false)} style={{ marginTop: 10 }}>
                Fechar
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>
    </Provider>
  );
}
