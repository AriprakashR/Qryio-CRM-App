import { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useUser } from '../context/UserContext';
import { useIdleLogout } from '../hooks/useIdleLogout';

const IDLE_MS = 4 * 60 * 1000;
const WARN_MS = 60 * 1000;

export function SessionGuard({ children }) {
  const router = useRouter();
  const { logout } = useUser();

  const [idleWarnVisible, setIdleWarnVisible] = useState(false);
  const [countdown, setCountdown] = useState(WARN_MS / 1000);
  const countdownRef = useRef(null);

  const stopCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setCountdown(WARN_MS / 1000);
  }, []);

  const startCountdown = useCallback(() => {
    setCountdown(WARN_MS / 1000);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const doLogout = useCallback(async () => {
    setIdleWarnVisible(false);
    stopCountdown();
    await logout();
    router.replace('/');
  }, [logout, router, stopCountdown]);

  const handleWarn = useCallback(() => {
    setIdleWarnVisible(true);
    startCountdown();
  }, [startCountdown]);

  const handleReset = useCallback(() => {
    setIdleWarnVisible(false);
    stopCountdown();
  }, [stopCountdown]);

  const { resetActivity, cancelIdleWatch } = useIdleLogout({
    idleMs: IDLE_MS,
    warnMs: WARN_MS,
    onWarn: handleWarn,
    onReset: handleReset,
    onLogout: doLogout,
  });

  useEffect(() => {
    return () => {
      cancelIdleWatch();
      stopCountdown();
    };
  }, [cancelIdleWatch, stopCountdown]);

  const isUrgent = countdown <= 15;
  const progressPct = (countdown / (WARN_MS / 1000)) * 100;
  const mm = String(Math.floor(countdown / 60)).padStart(2, '0');
  const ss = String(countdown % 60).padStart(2, '0');

  return (
    <View
      style={{ flex: 1 }}
      onStartShouldSetResponderCapture={() => {
        resetActivity();
        return false;
      }}
    >
      {children}

      {/* ── Idle Warning — uses Modal so it always covers full screen ── */}
      <Modal
        visible={idleWarnVisible}
        transparent
        animationType='fade'
        statusBarTranslucent // covers status bar on Android
        onRequestClose={handleReset}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dialog}>
            {/* Progress bar */}
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progressPct}%`,
                    backgroundColor: isUrgent ? '#D32F2F' : '#ED6C02',
                  },
                ]}
              />
            </View>

            <View style={styles.dialogContent}>
              <Text style={styles.dialogTitle}>Session Expiring Soon</Text>

              {/* Alert box */}
              <View
                style={[
                  styles.alertBox,
                  {
                    borderColor: isUrgent ? '#D32F2F' : '#ED6C02',
                    backgroundColor: isUrgent ? '#FFF5F5' : '#FFF8F0',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.alertText,
                    { color: isUrgent ? '#D32F2F' : '#ED6C02' },
                  ]}
                >
                  Your session has been inactive for a while.
                </Text>
              </View>

              <Text style={styles.subText}>
                You will be automatically logged out in:
              </Text>

              {/* Countdown */}
              <Text
                style={[
                  styles.countdown,
                  { color: isUrgent ? '#D32F2F' : '#ED6C02' },
                ]}
              >
                {mm}:{ss}
              </Text>

              <Text style={styles.hint}>Tap anywhere to stay logged in.</Text>

              {/* Buttons */}
              <View style={styles.dialogActions}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.logoutNowBtn]}
                  onPress={doLogout}
                  activeOpacity={0.85}
                >
                  <Text style={styles.logoutNowText}>Logout Now</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.stayBtn]}
                  onPress={handleReset}
                  activeOpacity={0.85}
                >
                  <Text style={styles.stayText}>Stay Logged In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // Full-screen dim overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', // ← centres vertically
    alignItems: 'center', // ← centres horizontally
    paddingHorizontal: 24,
  },

  dialog: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },

  // Progress bar
  progressTrack: { height: 4, backgroundColor: '#F0F2F5', width: '100%' },
  progressFill: { height: 4 },

  dialogContent: { padding: 24 },

  dialogTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C252E',
    marginBottom: 14,
  },

  alertBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  alertText: { fontSize: 13, fontWeight: '500', lineHeight: 20 },

  subText: {
    fontSize: 13,
    color: '#637381',
    textAlign: 'center',
    marginBottom: 6,
  },

  countdown: {
    fontSize: 52,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 4,
    marginVertical: 8,
  },

  hint: {
    fontSize: 12,
    color: '#919EAB',
    textAlign: 'center',
    marginBottom: 24,
  },

  dialogActions: { flexDirection: 'row', gap: 10 },

  actionBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutNowBtn: { borderWidth: 1.5, borderColor: '#D32F2F' },
  logoutNowText: { color: '#D32F2F', fontSize: 14, fontWeight: '600' },
  stayBtn: { backgroundColor: '#1C252E' },
  stayText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
});
