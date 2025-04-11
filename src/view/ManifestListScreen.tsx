// src/screens/ManifestListScreen.tsx
import React, { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { Card, Text } from 'react-native-paper';

import { fetchManifestos, Manifesto } from '../services/db';

export default function ManifestListScreen() {
  const [manifestos, setManifestos] = useState<Manifesto[]>([]);

  useEffect(() => {
    fetchManifestos(setManifestos);
  }, []);

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text variant="titleLarge">Manifestos Salvos</Text>
      {manifestos.map((m) => (
        <Card key={m.id} style={{ marginVertical: 10 }}>
          <Card.Title
            title={m.productName}
            subtitle={`Tipo: ${m.type} • ${m.quantity} ${m.unit}`}
          />
          <Card.Content>
            <Text>Responsável: {m.responsible}</Text>
            <Text>Data: {m.date}</Text>
            {m.observations ? <Text>Obs: {m.observations}</Text> : null}
          </Card.Content>
        </Card>
      ))}
    </ScrollView>
  );
}
