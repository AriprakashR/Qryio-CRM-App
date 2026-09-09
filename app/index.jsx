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
import AsyncStorage from '@react-native-async-storage/async-storage';

import { sendOtp, verifyOtp, getUserProfile } from '../api/authService';
import { setLoginTime } from '../api/axiosInstance';
import { useUser } from '../context/UserContext';

// ── Dev-only dummy logins (no backend needed) ──────────────────────
// Shapes mirror what UserContext.getUserRole() expects from a real profile.
const DUMMY_PROFILES = [
  {
    role: 'Super Admin',
    profile: {
      defaultUser: true,
      email: 'superadmin@dummy.com',
      userName: 'Super Admin',
    },
  },
  {
    role: 'Company Admin',
    profile: {
      userType: 'Company_User',
      email: 'companyadmin@dummy.com',
      userName: 'Company Admin',
      userGroup: { roles: [{ roleName: 'ROLE_Admin' }] },
    },
  },
  {
    role: 'Company User',
    profile: {
      userType: 'Company_User',
      email: 'companyuser@dummy.com',
      userName: 'Company User',
      userGroup: { roles: [{ roleName: 'ROLE_User' }] },
    },
  },
  {
    role: 'Client Admin',
    profile: {
      userType: 'Client_User',
      email: 'clientadmin@dummy.com',
      userName: 'Client Admin',
      userGroup: { roles: [{ roleName: 'ROLE_Client_Admin' }] },
      // Real profiles carry the user's own client — the Users screen
      // reads this directly instead of guessing which client to show.
      client: { clientId: 1, clientCode: 'ACME01', clientName: 'Acme Corp' },
    },
  },
  {
    role: 'Client User',
    profile: {
      userType: 'Client_User',
      email: 'clientuser@dummy.com',
      userName: 'Client User',
      userGroup: { roles: [{ roleName: 'ROLE_User' }] },
      client: { clientId: 1, clientCode: 'ACME01', clientName: 'Acme Corp' },
    },
  },
];

export default function Login() {
  const router = useRouter();
  const { setUser } = useUser();

  const [step, setStep] = useState('email');
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
    try {
      await sendOtp(email);
      setStep('otp');
    } catch (err) {
      const message =
        err.response?.data?.detail || 'Failed to send OTP. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [email]);

  // ── Step 2: Verify OTP ───────────────────────────────────────────
  const handleLogin = useCallback(async () => {
    if (!otp) {
      setError('Please enter the OTP sent to your email.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const verifyResponse = await verifyOtp(email, otp);
      const { token } = verifyResponse.data.data;

      const profileResponse = await getUserProfile(token);
      const profile = profileResponse.data.data;

      // Persist session — same order as web
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('qryio_user', JSON.stringify(profile));
      await setLoginTime();

      await setUser(profile);
      router.replace('/dashboard');
    } catch (err) {
      const message =
        err.response?.data?.detail || 'Login failed. Please try again.';
      setError(message);
      await AsyncStorage.multiRemove([
        'token',
        'qryio_user',
        'qryio_login_time',
      ]);
    } finally {
      setLoading(false);
    }
  }, [email, otp, setUser, router]);

  // ── Back ─────────────────────────────────────────────────────────
  const handleBack = useCallback(() => {
    setStep('email');
    setOtp('');
    setError('');
  }, []);

  // ── Dev-only: sign in with a dummy profile, no backend ────────────
  const handleDummyLogin = useCallback(
    async profile => {
      setLoading(true);
      setError('');
      try {
        await AsyncStorage.setItem('token', 'dummy-token');
        await AsyncStorage.setItem('qryio_user', JSON.stringify(profile));
        await setLoginTime();
        await setUser(profile);
        router.replace('/dashboard');
      } finally {
        setLoading(false);
      }
    },
    [setUser, router],
  );

  // ── UI (keep exactly as before) ──────────────────────────────────
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

        <View style={styles.cardWrapper}>
          <View style={styles.card}>
            <View style={styles.titleSection}>
              <Text style={styles.title}>Log in</Text>
              <Text style={styles.subtitle}>
                Welcome back! Log in to get started.
              </Text>
            </View>

            <Text style={styles.stepText}>
              {step === 'email'
                ? 'Step 1 of 2 — Enter your email'
                : 'Step 2 of 2 — Verify OTP'}
            </Text>

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
                      icon={() => (
                        <MaterialCommunityIcons
                          name={showOtp ? 'eye-off' : 'eye'}
                          size={22}
                          color='#637381'
                        />
                      )}
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

          {__DEV__ && (
            <View style={styles.devCard}>
              <Text style={styles.devTitle}>Dev quick login (no backend)</Text>
              <View style={styles.devRow}>
                {DUMMY_PROFILES.map(({ role, profile }) => (
                  <TouchableOpacity
                    key={role}
                    style={styles.devButton}
                    onPress={() => handleDummyLogin(profile)}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.devButtonText}>{role}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gradient: { flex: 1 },
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
  cardWrapper: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
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
  titleSection: { alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#1C252E', marginBottom: 6 },
  subtitle: {
    fontSize: 14,
    color: '#637381',
    textAlign: 'center',
    lineHeight: 20,
  },
  stepText: { fontSize: 12, color: '#919EAB', marginBottom: 18 },
  input: { backgroundColor: '#FFFFFF', marginBottom: 2 },
  inputOutline: { borderRadius: 8, borderColor: '#DDE1E6' },
  errorText: { fontSize: 12, color: '#FF4842', marginTop: 4, marginBottom: 6 },
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
  otpSentText: {
    fontSize: 13,
    color: '#637381',
    textAlign: 'center',
    marginBottom: 16,
  },
  emailBold: { fontWeight: '700', color: '#1C252E' },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 4,
    paddingVertical: 4,
  },
  backButtonText: { fontSize: 13, color: '#637381' },
  devCard: {
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDE1E6',
    borderStyle: 'dashed',
    padding: 14,
  },
  devTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#919EAB',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
    textAlign: 'center',
  },
  devRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  devButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1C252E',
  },
  devButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
});
