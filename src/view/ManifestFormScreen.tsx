// ... (todos os imports permanecem iguais)

import { zodResolver } from '@hookform/resolvers/zod';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import React, { useState, useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FlatList, Modal, ScrollView, StyleSheet, View } from 'react-native';
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

const STORAGE_KEY = '@manifest_products';
/// ... (todos os imports permanecem iguais)

type ManifestForm = {
  productName: string;
  lote: string;
  unit: string;
  type: 'entrada' | 'saida';
  date: string;
  validade: string;
  responsible: string;
  observations?: string;
};

const schema = z.object({
  productName: z.string().min(1, 'Nome do produto é obrigatório'),
  lote: z.string().min(1, 'Lote obrigatório'),
  unit: z.string().min(1, 'Unidade obrigatória'),
  type: z.enum(['entrada', 'saida'], {
    required_error: 'Tipo obrigatório',
  }),
  date: z.string().min(1, 'Data obrigatória'),
  validade: z.string().min(1, 'Validade obrigatória'),
  responsible: z.string().min(1, 'Responsável obrigatório'),
  observations: z.string().optional(),
});

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

export default function ManifestFormScreen() {
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

  const [products, setProducts] = useState<ManifestForm[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const onAddOrUpdateProduct = (data: ManifestForm) => {
    if (editingIndex !== null) {
      const updated = [...products];
      updated[editingIndex] = data;
      setProducts(updated);
      setEditingIndex(null);
    } else {
      setProducts([...products, data]);
    }

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

  const onEditProduct = (index: number) => {
    const product = products[index];
    reset(product);
    setEditingIndex(index);
    setModalVisible(false);
  };

  const onDeleteProduct = (index: number) => {
    const updated = [...products];
    updated.splice(index, 1);
    setProducts(updated);
  };

  const onSubmitGeneratePDF = async () => {
    if (products.length === 0) {
      alert('Adicione ao menos um produto para gerar o PDF');
      return;
    }

    try {
      const htmlRows = products
        .map(
          (p, index) => `
            <h3>Produto ${index + 1}</h3>
            <p><strong>Produto:</strong> ${p.productName}</p>
            <p><strong>Lote:</strong> ${p.lote}</p>
            <p><strong>Unidade:</strong> ${p.unit}</p>
            <p><strong>Tipo:</strong> ${p.type}</p>
            <p><strong>Data:</strong> ${p.date}</p>
            <p><strong>Validade:</strong> ${p.validade}</p>
            <p><strong>Responsável:</strong> ${p.responsible}</p>
            <p><strong>Observações:</strong> ${p.observations || 'Nenhuma'}</p>
            <hr />
          `
        )
        .join('');

      const htmlContent = `
        <html>
          <body style="font-family: Arial; padding: 24px;">
            <h1>Manifesto de Produtos</h1>
            ${htmlRows}
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

  const saveProductsToStorage = async (data: ManifestForm[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Erro ao salvar os produtos:', error);
    }
  };

  const loadProductsFromStorage = async () => {
    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedData) {
        setProducts(JSON.parse(storedData));
      }
    } catch (error) {
      console.error('Erro ao carregar os produtos:', error);
    }
  };

  useEffect(() => {
    loadProductsFromStorage();
  }, []);

  useEffect(() => {
    saveProductsToStorage(products);
  }, [products]);

  return (
    <Provider>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text variant="titleLarge" style={{ marginBottom: 20, marginTop: 60 }}>
          {editingIndex !== null ? 'Editar Produto' : 'Novo Manifesto'}
        </Text>

        {/* Campos do formulário */}
        {[
          { name: 'productName', label: 'Nome do Produto' },
          { name: 'lote', label: 'Lote' },
          { name: 'unit', label: 'Unidade' },
          { name: 'responsible', label: 'Responsável' },
          { name: 'date', label: 'Data de hoje' },
          { name: 'validade', label: 'Validade' },
        ].map(({ name, label }) => (
          <React.Fragment key={name}>
            <Controller
              control={control}
              name={name as keyof ManifestForm}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label={label}
                  mode="outlined"
                  value={value}
                  onChangeText={onChange}
                  error={!!errors[name as keyof ManifestForm]}
                />
              )}
            />
            <HelperText type="error" visible={!!errors[name as keyof ManifestForm]}>
              {errors[name as keyof ManifestForm]?.message?.toString()}
            </HelperText>
          </React.Fragment>
        ))}

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

        {/* Observações */}
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
              numberOfLines={4}
            />
          )}
        />

        {/* Botões */}
        <Button
          mode="contained"
          style={{ marginTop: 20 }}
          onPress={handleSubmit(onAddOrUpdateProduct)}>
          {editingIndex !== null ? 'Atualizar Produto' : 'Adicionar Produto'}
        </Button>

        <Button mode="outlined" onPress={() => setModalVisible(true)} style={{ marginTop: 12 }}>
          Ver Produtos Adicionados ({products.length})
        </Button>

        <Button mode="contained" style={{ marginTop: 20 }} onPress={onSubmitGeneratePDF}>
          Gerar PDF
        </Button>
      </ScrollView>

      {/* Modal */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          transparent
          animationType="slide">
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <Text style={{ marginBottom: 10, fontSize: 18, fontWeight: 'bold' }}>
                Produtos adicionados
              </Text>
              <FlatList
                data={products}
                keyExtractor={(_: ManifestForm, i: number) => i.toString()}
                renderItem={({ item, index }) => (
                  <View style={styles.productItem}>
                    <Text style={{ flex: 1 }}>
                      {index + 1}. Pt: {item.productName} Un: {item.unit}
                    </Text>
                    <Button onPress={() => onEditProduct(index)}>✏️</Button>
                    <Button onPress={() => onDeleteProduct(index)} textColor="red">
                      🗑️
                    </Button>
                  </View>
                )}
              />
              <Button
                onPress={async () => {
                  await AsyncStorage.removeItem(STORAGE_KEY);
                  setProducts([]);
                }}>
                Limpar Produtos Salvos
              </Button>

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
