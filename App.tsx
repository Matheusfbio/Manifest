import { StatusBar } from 'expo-status-bar';

import Home from '@/app/index';

import './global.css';

export default function App() {
  return (
    <>
      <StatusBar style="auto" />
      <Home />
    </>
  );
}
