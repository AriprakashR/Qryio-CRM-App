import { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { TextInput, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Login() {
  const router = useRouter();
  const [step, setStep] = useState('email'); // 'email' | 'otp'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Step 1: Send OTP ─────────────────────────────────────────────
  const handleSendOtp = useCallback(async () => {
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 1000)); // Simulate API
    setLoading(false);
    setStep('otp');
  }, [email]);

  // ── Step 2: Verify OTP ───────────────────────────────────────────
  const handleLogin = useCallback(async () => {
    if (!otp) {
      setError('Please enter the OTP sent to your email.');
      return;
    }
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 1000)); // Simulate API
    if (otp === '123456') {
      setLoading(false);
      router.replace('/dashboard');
    } else {
      setLoading(false);
      setError('Invalid OTP. Use 123456 for testing.');
    }
  }, [otp, router]);

  // ── Back to email ────────────────────────────────────────────────
  const handleBack = useCallback(() => {
    setStep('email');
    setOtp('');
    setError('');
  }, []);

  return (
    <LinearGradient
      colors={['#D9E3EE', '#F5F5F5', '#EDD9CE']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Image
            source={require('../assets/logo2.jpg')}
            style={styles.logo}
            resizeMode='contain'
          />
          <TouchableOpacity>
            <Text style={styles.helpText}>Need help?</Text>
          </TouchableOpacity>
        </View>

        {/* ── Card ── */}
        <View style={styles.cardWrapper}>
          <View style={styles.card}>
            {/* Title block */}
            <View style={styles.titleSection}>
              <Text style={styles.title}>Log in</Text>
              <Text style={styles.subtitle}>
                Welcome back! Log in to get started.
              </Text>
            </View>

            {/* Step indicator */}
            <Text style={styles.stepText}>
              {step === 'email'
                ? 'Step 1 of 2 — Enter your email'
                : 'Step 2 of 2 — Verify OTP'}
            </Text>

            {/* ── Email Step ── */}
            {step === 'email' && (
              <>
                <TextInput
                  label='Email address'
                  mode='outlined'
                  value={email}
                  onChangeText={text => {
                    setEmail(text);
                    setError('');
                  }}
                  placeholder='Enter your work email'
                  autoCapitalize='none'
                  keyboardType='email-address'
                  style={styles.input}
                  outlineStyle={styles.inputOutline}
                  error={!!error}
                  disabled={loading}
                />
                {!!error && <Text style={styles.errorText}>{error}</Text>}

                <TouchableOpacity
                  style={[styles.darkButton, loading && styles.buttonDisabled]}
                  onPress={handleSendOtp}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color='#fff' size='small' />
                  ) : (
                    <View style={styles.buttonRow}>
                      <Text style={styles.darkButtonText}>Send OTP</Text>
                      <MaterialCommunityIcons
                        name='chevron-right'
                        size={20}
                        color='#fff'
                      />
                    </View>
                  )}
                </TouchableOpacity>
              </>
            )}

            {/* ── OTP Step ── */}
            {step === 'otp' && (
              <>
                <Text style={styles.otpSentText}>
                  OTP sent to <Text style={styles.emailBold}>{email}</Text>
                </Text>

                <TextInput
                  label='One-Time Password'
                  mode='outlined'
                  value={otp}
                  onChangeText={text => {
                    setOtp(text);
                    setError('');
                  }}
                  placeholder='Enter 6-digit OTP'
                  secureTextEntry={!showOtp}
                  maxLength={6}
                  keyboardType='number-pad'
                  style={styles.input}
                  outlineStyle={styles.inputOutline}
                  error={!!error}
                  disabled={loading}
                  right={
                    <TextInput.Icon
                      icon={showOtp ? 'eye-off' : 'eye'}
                      onPress={() => setShowOtp(v => !v)}
                    />
                  }
                />
                {!!error && <Text style={styles.errorText}>{error}</Text>}

                <TouchableOpacity
                  style={[styles.darkButton, loading && styles.buttonDisabled]}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color='#fff' size='small' />
                  ) : (
                    <Text style={styles.darkButtonText}>Login</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backButton}
                  onPress={handleBack}
                  disabled={loading}
                >
                  <MaterialCommunityIcons
                    name='chevron-down'
                    size={16}
                    color='#637381'
                  />
                  <Text style={styles.backButtonText}>
                    Use a different email
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gradient: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 58 : 48,
    paddingBottom: 8,
  },
  logo: { width: 55, height: 55 },
  helpText: { fontSize: 14, color: '#1C252E', fontWeight: '500' },

  // Card
  cardWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },

  // Title
  titleSection: { alignItems: 'center', marginBottom: 16 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C252E',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#637381',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Step text
  stepText: {
    fontSize: 12,
    color: '#919EAB',
    marginBottom: 18,
  },

  // Input
  input: { backgroundColor: '#FFFFFF', marginBottom: 2 },
  inputOutline: { borderRadius: 8, borderColor: '#DDE1E6' },
  errorText: {
    fontSize: 12,
    color: '#FF4842',
    marginTop: 4,
    marginBottom: 6,
  },

  // Dark button
  darkButton: {
    backgroundColor: '#1C252E',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  darkButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },

  // OTP step extras
  otpSentText: {
    fontSize: 13,
    color: '#637381',
    textAlign: 'center',
    marginBottom: 16,
  },
  emailBold: { fontWeight: '700', color: '#1C252E' },

  // Back button
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 4,
    paddingVertical: 4,
  },
  backButtonText: { fontSize: 13, color: '#637381' },
});
