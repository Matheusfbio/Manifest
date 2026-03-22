import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Platform, View } from 'react-native';
import { Button, Chip, Divider, IconButton, Text } from 'react-native-paper';

import { ManifestProduct, useManifestStore } from '@/src/store/manifest';

type Filter = 'recent' | 'validade' | 'dias';

const CATEGORY_COLORS: Record<string, string> = {
  gray: '#9E9E9E',
  green: '#4CAF50',
  yellow: '#FFC107',
  red: '#F44336',
};

function getDaysToExpire(validade: string) {
  return Math.ceil((new Date(validade).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function getColor(days: number): string {
  if (days > 35) return 'gray';
  if (days > 25) return 'green';
  if (days > 15) return 'yellow';
  return 'red';
}

function ProductCard({
  item,
  onDelete,
}: {
  item: ManifestProduct;
  onDelete: (id: string) => void;
}) {
  const days = getDaysToExpire(item.validade);
  const colorKey = getColor(days);
  const color = CATEGORY_COLORS[colorKey];

  return (
    <View
      style={{
        borderLeftWidth: 4,
        borderLeftColor: color,
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
        elevation: 1,
      }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="titleSmall" style={{ flex: 1 }}>
          {item.productName}
        </Text>
        <IconButton icon="delete" iconColor="#F44336" size={18} onPress={() => onDelete(item.id)} />
      </View>
      <Text variant="bodySmall" style={{ color: '#666' }}>
        Lote: {item.lote} · {item.type === 'entrada' ? 'Entrada' : 'Saída'} · {item.unit} un
      </Text>
      <Text variant="bodySmall" style={{ color: '#666' }}>
        Validade: {item.validade}
      </Text>
      <Text variant="bodySmall" style={{ color, fontWeight: 'bold' }}>
        {days > 0 ? `${days} dias para vencer` : 'Vencido'}
      </Text>
    </View>
  );
}

export default function ProductsScreen() {
  const { products, load, remove, clear } = useManifestStore();
  const [filter, setFilter] = useState<Filter>('recent');

  useEffect(() => {
    load();
  }, []);

  const sorted = useMemo(() => {
    const list = [...products];
    if (filter === 'recent') return list.sort((a, b) => b.createdAt - a.createdAt);
    if (filter === 'validade') return list.sort((a, b) => a.validade.localeCompare(b.validade));
    if (filter === 'dias')
      return list.sort((a, b) => getDaysToExpire(a.validade) - getDaysToExpire(b.validade));
    return list;
  }, [products, filter]);

  const confirmDelete = (id: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Remover este produto?')) remove(id);
    } else {
      Alert.alert('Remover', 'Deseja remover este produto?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: () => remove(id) },
      ]);
    }
  };

  const confirmClear = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Limpar todos os produtos?')) clear();
    } else {
      Alert.alert('Limpar', 'Deseja remover todos os produtos?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Limpar', style: 'destructive', onPress: clear },
      ]);
    }
  };

  const generatePDF = async () => {
    if (products.length === 0) return Alert.alert('Atenção', 'Nenhum produto cadastrado.');
    const rows = products
      .map((p, i) => {
        const days = getDaysToExpire(p.validade);
        const color = CATEGORY_COLORS[getColor(days)];
        return `<tr style="color:${color}">
          <td>${i + 1}</td><td>${p.productName}</td><td>${p.lote}</td>
          <td>${p.unit}</td><td>${p.type}</td><td>${p.date}</td>
          <td>${p.validade}</td><td>${days > 0 ? `${days} dias` : 'Vencido'}</td>
          <td>${p.responsible}</td><td>${p.observations || '-'}</td>
        </tr>`;
      })
      .join('');
    const html = `<html><head><style>
      table{width:100%;border-collapse:collapse}
      th,td{border:1px solid #ddd;padding:6px;font-size:12px}
      th{background:#f4f4f4}h1{text-align:center}
    </style></head><body>
      <h1>Manifesto de Produtos</h1>
      <table><thead><tr>
        <th>#</th><th>Produto</th><th>Lote</th><th>Un</th><th>Tipo</th>
        <th>Data</th><th>Validade</th><th>Dias</th><th>Responsável</th><th>Obs</th>
      </tr></thead><tbody>${rows}</tbody></table>
    </body></html>`;
    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri);
  };

  const generateCSV = async () => {
    if (products.length === 0) return Alert.alert('Atenção', 'Nenhum produto cadastrado.');
    const header = 'Produto,Lote,Unidade,Tipo,Data,Validade,Dias,Responsável,Observações\n';
    const rows = products
      .map((p) => {
        const days = getDaysToExpire(p.validade);
        return [
          p.productName, p.lote, p.unit, p.type, p.date, p.validade,
          days > 0 ? `${days} dias` : 'Vencido', p.responsible, p.observations || '',
        ]
          .map((f) => `"${f}"`)
          .join(',');
      })
      .join('\n');
    const uri = FileSystem.documentDirectory + 'manifesto.csv';
    await FileSystem.writeAsStringAsync(uri, header + rows, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri);
  };

  return (
    <View style={{ flex: 1, paddingHorizontal: 16 }}>
        <Text variant="titleLarge" style={{ marginTop: 56, marginBottom: 12 }}>
          Produtos ({products.length})
        </Text>

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          {([
            { key: 'recent', label: 'Últimos adicionados' },
            { key: 'validade', label: 'Data de vencimento' },
            { key: 'dias', label: 'Dias restantes' },
          ] as { key: Filter; label: string }[]).map(({ key, label }) => (
            <Chip
              key={key}
              selected={filter === key}
              onPress={() => setFilter(key)}
              style={{ marginBottom: 4 }}>
              {label}
            </Chip>
          ))}
        </View>

        <Divider style={{ marginBottom: 12 }} />

        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ProductCard item={item} onDelete={confirmDelete} />}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', color: '#999', marginTop: 40 }}>
              Nenhum produto cadastrado
            </Text>
          }
          contentContainerStyle={{ paddingBottom: 16 }}
        />

        <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 12 }}>
          <Button mode="contained" onPress={generatePDF} style={{ flex: 1 }}>
            PDF
          </Button>
          <Button mode="contained" onPress={generateCSV} style={{ flex: 1 }}>
            CSV
          </Button>
          <Button mode="outlined" onPress={confirmClear} textColor="#F44336" style={{ flex: 1 }}>
            Limpar
          </Button>
        </View>
    </View>
  );
}
