import { View } from 'react-native';

import ManifestFormScreen from '@/src/view/ManifestFormScreen';

export default function Home() {
  return (
    <View className="flex-1 items-center justify-center">
      <ManifestFormScreen />
      {/* <View className="rounded-lg bg-green-500 p-4">
        <Text>Welcome to the home page!</Text>
      </View> */}
    </View>
  );
}
