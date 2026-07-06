import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import ErrorBoundary from '../components/ErrorBoundary';

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <PaperProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </PaperProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
