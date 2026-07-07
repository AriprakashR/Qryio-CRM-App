import { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUser, ROLE_LABELS, ROLE_COLORS } from '../context/UserContext';

export default function CustomHeader({ navigation }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, resolvedRole, logout } = useUser();

  const [popoverVisible, setPopoverVisible] = useState(false);
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);

  const roleLabel = ROLE_LABELS[resolvedRole] ?? resolvedRole ?? 'User';
  const roleColors = ROLE_COLORS[resolvedRole] ?? {
    bg: '#637381',
    text: '#FFFFFF',
  };

  const avatarLetter = user?.userName
    ? user.userName.charAt(0).toUpperCase()
    : user?.email
      ? user.email.charAt(0).toUpperCase()
      : 'U';

  const handleLogoutConfirm = useCallback(async () => {
    setLogoutDialogVisible(false);
    await logout();
    router.replace('/');
  }, [logout, router]);

  return (
    <>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        {/* Hamburger */}
        <TouchableOpacity
          onPress={() => navigation.toggleDrawer()}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name='menu' size={26} color='#1C252E' />
        </TouchableOpacity>

        {/* Right: badge + avatar */}
        <View style={styles.right}>
          {resolvedRole && (
            <View style={[styles.badge, { backgroundColor: roleColors.bg }]}>
              <Text style={[styles.badgeText, { color: roleColors.text }]}>
                {roleLabel}
              </Text>
            </View>
          )}
          <TouchableOpacity
            onPress={() => setPopoverVisible(true)}
            activeOpacity={0.8}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{avatarLetter}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Account Popover ── */}
      <Modal
        visible={popoverVisible}
        transparent
        animationType='fade'
        onRequestClose={() => setPopoverVisible(false)}
      >
        <Pressable
          style={styles.popoverOverlay}
          onPress={() => setPopoverVisible(false)}
        >
          <Pressable style={styles.popover} onPress={() => {}}>
            {/* User info */}
            <View style={styles.popoverUser}>
              <Text style={styles.popoverRole}>{resolvedRole ?? '—'}</Text>
              <Text style={styles.popoverEmail} numberOfLines={1}>
                {user?.email ?? '—'}
              </Text>
            </View>

            <Divider />

            {/* Logout button */}
            <TouchableOpacity
              style={styles.popoverLogout}
              onPress={() => {
                setPopoverVisible(false);
                setLogoutDialogVisible(true);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.popoverLogoutText}>Logout</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Logout Confirmation Dialog ── */}
      <Modal
        visible={logoutDialogVisible}
        transparent
        animationType='fade'
        onRequestClose={() => setLogoutDialogVisible(false)}
      >
        <View style={styles.dialogOverlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Confirm Logout</Text>

            <Text style={styles.dialogBody}>
              Are you sure you want to{' '}
              <Text style={{ fontWeight: '700' }}>log out</Text>? Any unsaved
              changes will be lost.
            </Text>

            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setLogoutDialogVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleLogoutConfirm}
                activeOpacity={0.85}
              >
                <Text style={styles.confirmText}>Yes, Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  right: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '600', color: '#4B5563' },

  // Popover
  popoverOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 50,
    paddingRight: 20,
  },
  popover: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: 210,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  popoverUser: { padding: 16 },
  popoverRole: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C252E',
    marginBottom: 3,
  },
  popoverEmail: { fontSize: 12, color: '#637381' },
  popoverLogout: { padding: 14, alignItems: 'center' },
  popoverLogoutText: { fontSize: 14, fontWeight: '600', color: '#D32F2F' },

  // Logout dialog
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    width: '85%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C252E',
    marginBottom: 12,
  },
  dialogBody: {
    fontSize: 14,
    color: '#637381',
    lineHeight: 22,
    marginBottom: 24,
  },
  dialogActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#DDE1E6',
    alignItems: 'center',
  },
  cancelText: { fontSize: 14, fontWeight: '600', color: '#1C252E' },
  confirmBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: '#D32F2F',
    alignItems: 'center',
  },
  confirmText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
});
