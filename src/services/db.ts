import { SQLiteDatabase } from 'expo-sqlite';

export type Manifesto = {
  id: number;
  date: string;
  type: 'entrada' | 'saida';
  productName: string;
  quantity: number;
  unit: string;
  responsible: string;
  observations?: string;
};

// const db = SQLite.openDatabase('manifestos.db');

export async function initDatabase(database: SQLiteDatabase) {
  await database.execAsync(
    `CREATE TABLE IF NOT EXISTS manifestos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT,
        type TEXT,
        productName TEXT,
        quantity REAL,
        unit TEXT,
        responsible TEXT,
        observations TEXT
      );`
  );
}

// export const insertManifest = (manifest: Omit<Manifesto, 'id'>, callback: () => void): void => {
//   const { date, type, productName, quantity, unit, responsible, observations } = manifest;
//   db.transaction((tx: any) => {
//     tx.executeSql(
//       `INSERT INTO manifestos (date, type, productName, quantity, unit, responsible, observations)
//        VALUES (?, ?, ?, ?, ?, ?, ?);`,
//       [date, type, productName, quantity, unit, responsible, observations || ''],
//       (_tx: any, _result: any) => {
//         callback();
//         return true;
//       },
//       (_tx: any, error: any) => {
//         console.error('Erro ao inserir manifesto:', error);
//         return true;
//       }
//     );
//   });
// };

// export const fetchManifestos = (callback: (results: Manifesto[]) => void): void => {
//   db.transaction((tx: any) => {
//     tx.executeSql('SELECT * FROM manifestos ORDER BY id DESC;', [], (_tx: any, result: any) => {
//       callback(result.rows._array as Manifesto[]);
//       return true;
//     });
//   });
// };
