import { StatusBar } from 'expo-status-bar';

import './global.css';
import Home from '@/app/index';

export default function App() {
  return (
    <>
      <StatusBar style="auto" />
      <Home />
    </>
  );
}

// import * as Print from 'expo-print';
// import * as Sharing from 'expo-sharing';
// import React from 'react';
// import { Button, View } from 'react-native';

// export default function App() {
//   const generateAndSharePDF = async () => {
//     const htmlContent = `
//       <html>
//         <body>
//           <h1>Exemplo de PDF</h1>
//           <p>Este é um exemplo de conteúdo em PDF.</p>
//         </body>
//       </html>
//     `;

//     try {
//       const { uri } = await Print.printToFileAsync({ html: htmlContent });
//       await Sharing.shareAsync(uri);
//     } catch (error) {
//       console.error('Erro ao gerar ou compartilhar o PDF:', error);
//     }
//   };

//   return (
//     <View className="mt-10 flex items-center justify-center">
//       <Button title="Gerar e Compartilhar PDF" onPress={generateAndSharePDF} />
//     </View>
//   );
// }
