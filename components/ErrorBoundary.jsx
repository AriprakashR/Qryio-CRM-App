import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.log('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong:</Text>
          <Text style={styles.error}>{this.state.error?.toString()}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: { fontSize: 16, fontWeight: '700', color: '#DC2626', marginBottom: 8 },
  error: { fontSize: 13, color: '#374151', lineHeight: 20 },
});
