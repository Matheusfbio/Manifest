import { zodResolver } from '@hookform/resolvers/zod';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import React, { useState, useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, FlatList, Modal, ScrollView, StyleSheet, View } from 'react-native';
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

const categorizeProducts = (products: ManifestForm[]) => {
  return {
    gray: products.filter((p) => Number(p.unit) >= 35),
    green: products.filter((p) => Number(p.unit) >= 25 && Number(p.unit) < 35),
    yellow: products.filter((p) => Number(p.unit) >= 15 && Number(p.unit) < 25),
    red: products.filter((p) => Number(p.unit) < 15),
  };
};

const categorizeProductsByDate = (products: ManifestForm[]) => {
  const today = new Date();

  return {
    expired: products.filter((p) => new Date(p.validade) < today),
    nearExpiration: products.filter(
      (p) =>
        new Date(p.validade) >= today &&
        new Date(p.validade) <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) // Próximos 7 dias
    ),
    valid: products.filter((p) => new Date(p.validade) > new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)),
  };
};

const categorizeProductsWithDays = (products: ManifestForm[]) => {
  const today = new Date();

  return {
    gray: products
      .filter((p) => {
        const daysToExpire = Math.ceil((new Date(p.validade).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return Number(p.unit) >= 35 && daysToExpire > 0;
      })
      .map((p) => ({
        ...p,
        daysToExpire: Math.ceil((new Date(p.validade).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
      })),
    green: products
      .filter((p) => {
        const daysToExpire = Math.ceil((new Date(p.validade).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return Number(p.unit) >= 25 && Number(p.unit) < 35 && daysToExpire > 0;
      })
      .map((p) => ({
        ...p,
        daysToExpire: Math.ceil((new Date(p.validade).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
      })),
    yellow: products
      .filter((p) => {
        const daysToExpire = Math.ceil((new Date(p.validade).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return Number(p.unit) >= 15 && Number(p.unit) < 25 && daysToExpire > 0;
      })
      .map((p) => ({
        ...p,
        daysToExpire: Math.ceil((new Date(p.validade).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
      })),
    red: products
      .filter((p) => {
        const daysToExpire = Math.ceil((new Date(p.validade).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return Number(p.unit) < 15 || daysToExpire <= 0;
      })
      .map((p) => ({
        ...p,
        daysToExpire: Math.ceil((new Date(p.validade).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
      })),
  };
};

const categorizeProductsByExpiration = (products: ManifestForm[]) => {
  const today = new Date();

  return {
    gray: products
      .filter((p) => {
        const daysToExpire = Math.ceil((new Date(p.validade).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysToExpire > 35;
      })
      .map((p) => ({
        ...p,
        daysToExpire: Math.ceil((new Date(p.validade).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
      })),
    green: products
      .filter((p) => {
        const daysToExpire = Math.ceil((new Date(p.validade).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysToExpire > 25 && daysToExpire <= 35;
      })
      .map((p) => ({
        ...p,
        daysToExpire: Math.ceil((new Date(p.validade).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
      })),
    yellow: products
      .filter((p) => {
        const daysToExpire = Math.ceil((new Date(p.validade).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysToExpire > 15 && daysToExpire <= 25;
      })
      .map((p) => ({
        ...p,
        daysToExpire: Math.ceil((new Date(p.validade).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
      })),
    red: products
      .filter((p) => {
        const daysToExpire = Math.ceil((new Date(p.validade).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysToExpire <= 15;
      })
      .map((p) => ({
        ...p,
        daysToExpire: Math.ceil((new Date(p.validade).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
      })),
  };
};

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
      Alert.alert('Atenção', 'Adicione ao menos um produto para gerar o PDF');
      return;
    }

    try {
      const today = new Date();
      const htmlRows = products
        .map((p, index) => {
          const daysToExpire = Math.ceil((new Date(p.validade).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          const color =
            daysToExpire > 35
              ? '#A9A9A9' // Cinza
              : daysToExpire > 25
              ? '#4CAF50' // Verde
              : daysToExpire > 15
              ? '#FFEB3B' // Amarelo
              : '#F44336'; // Vermelho

          return `
            <tr style="color: ${color}">
              <td>${index + 1}</td>
              <td>${p.productName}</td>
              <td>${p.lote}</td>
              <td>${p.unit}</td>
              <td>${p.type}</td>
              <td>${p.date}</td>
              <td>${p.validade}</td>
              <td>${daysToExpire > 0 ? `${daysToExpire} dias` : 'Vencido'}</td>
              <td>${p.responsible}</td>
              <td>${p.observations || 'Nenhuma'}</td>
            </tr>
          `;
        })
        .join('');

      const htmlContent = `
        <html>
          <head>
            <style>
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
              }
              th, td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
              }
              th {
                background-color: #f4f4f4;
                font-weight: bold;
              }
              h1 {
                text-align: center;
                font-family: Arial, sans-serif;
              }
            </style>
          </head>
          <body>
            <h1>Manifesto de Produtos</h1>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Produto</th>
                  <th>Lote</th>
                  <th>Unidade</th>
                  <th>Tipo</th>
                  <th>Data</th>
                  <th>Validade</th>
                  <th>Dias para Vencer</th>
                  <th>Responsável</th>
                  <th>Observações</th>
                </tr>
              </thead>
              <tbody>
                ${htmlRows}
              </tbody>
            </table>
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
  
  const onSaveCsvFile = async () => {
    if (products.length === 0) {
      alert('Adicione ao menos um produto para gerar o CSV');
      return;
    }
  
    try {
      const today = new Date();
      const csvHeader = 'ID,Produto,Lote,Unidade,Tipo,Data,Validade,Dias para Vencer,Responsável,Observações\n';
      const csvRows = products
        .map((p, index) => {
          const daysToExpire = Math.ceil((new Date(p.validade).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
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
  
      const csvContent = csvHeader + csvRows;
  
      const fileUri = FileSystem.documentDirectory + 'manifesto_produtos.csv';
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
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
      <Text variant="titleLarge" style={{ marginLeft: 25, marginBottom: 20, marginTop: 40 }}>
        {editingIndex !== null ? 'Editar Produto' : 'Novo Manifesto'}
      </Text>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24 }}>

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
              multiline
              numberOfLines={4}
            />
          )}
        />

        <Button
          mode="contained"
          style={{ marginTop: 20 }}
          onPress={handleSubmit(onAddOrUpdateProduct)}>
          {editingIndex !== null ? 'Atualizar Produto' : 'Adicionar Produto'}
        </Button>

        <Button mode="outlined" onPress={() => setModalVisible(true)} style={{ marginTop: 12 }}>
          Ver Produtos Adicionados ({products.length})
        </Button>
        <View style={{  flexDirection: "row", justifyContent: 'center', gap: 52, padding: 10 }}>
          <Button mode="contained" style={{ marginBottom: 10 }} onPress={onSubmitGeneratePDF}>
            Gerar PDF
          </Button>

          <Button mode="contained" style={{ marginBottom: 10 }} onPress={onSaveCsvFile}>
            Gerar CSV
          </Button>
        </View>

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
                          ? '#A9A9A9' // Cinza
                          : category === 'green'
                          ? '#4CAF50' // Verde
                          : category === 'yellow'
                          ? '#FFEB3B' // Amarelo
                          : '#F44336', // Vermelho
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
                    <View key={index} style={styles.productItem}>
                      <Text style={{ flex: 1 }}>
                        {index + 1}. Pt: {item.productName} - Faltam {item.daysToExpire} dias para vencer
                      </Text>
                      <Button onPress={() => onEditProduct(index)}>✏️</Button>
                      <Button onPress={() => onDeleteProduct(index)} textColor="red">
                        🗑️
                      </Button>
                    </View>
                  ))}
                </View>
              ))}

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
