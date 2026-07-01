import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';

export default function Dashboard() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text variant='headlineMedium'>Welcome 👋</Text>
      <Button
        mode='outlined'
        onPress={() => router.replace('/')}
        style={{ marginTop: 16 }}
      >
        Logout
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
