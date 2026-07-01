import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { useRouter } from 'expo-router';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    // Dummy auth check for now — swap this with a real API call later
    if (email === 'admin@qryio.com' && password === 'admin123') {
      setError('');
      router.replace('/dashboard');
    } else {
      setError('Invalid email or password');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text variant='headlineMedium' style={styles.title}>
        Qryio CRM
      </Text>
      <Text variant='bodyMedium' style={styles.subtitle}>
        Sign in to continue
      </Text>

      <TextInput
        label='Email'
        mode='outlined'
        value={email}
        onChangeText={setEmail}
        autoCapitalize='none'
        keyboardType='email-address'
        style={styles.input}
      />

      <TextInput
        label='Password'
        mode='outlined'
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
        right={
          <TextInput.Icon
            icon={showPassword ? 'eye-off' : 'eye'}
            onPress={() => setShowPassword(!showPassword)}
          />
        }
        style={styles.input}
      />

      <HelperText type='error' visible={!!error}>
        {error}
      </HelperText>

      <Button mode='contained' onPress={handleLogin} style={styles.button}>
        Login
      </Button>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { textAlign: 'center', marginBottom: 4, fontWeight: 'bold' },
  subtitle: { textAlign: 'center', marginBottom: 32, opacity: 0.6 },
  input: { marginBottom: 8 },
  button: { marginTop: 16, paddingVertical: 4 },
});
