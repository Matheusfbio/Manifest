import { View } from 'react-native';

import ManifestFormScreen from '@/src/view/ManifestFormScreen';
import '../global.css';

export default function Home() {
  return (
    <View style={{ flex: 1, justifyContent: 'center' }}>
      <ManifestFormScreen />
      {/* <View className="rounded-lg bg-green-500 p-4">
        <Text>Welcome to the home page!</Text>
      </View> */}
    </View>
  );
}
