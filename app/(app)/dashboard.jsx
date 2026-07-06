import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function Dashboard() {
  // rename function per file
  return (
    <View style={styles.container}>
      <Text variant='headlineMedium'>Dashboard</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
});
