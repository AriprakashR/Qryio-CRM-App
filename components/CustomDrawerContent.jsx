import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Text } from 'react-native-paper';
import { ScrollView } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';

// ── Nav config — mirrors web nav-config-dashboard.js exactly ─────────
const ALL_NAV_ITEMS = [
  {
    label: 'Dashboard',
    icon: 'view-dashboard-outline',
    route: '/dashboard',
    allowedRoles: ['COMPANY_ADMIN', 'CLIENT_ADMIN'],
  },
  {
    label: 'Employee',
    icon: 'account-outline',
    route: '/employee',
    allowedRoles: ['COMPANY_ADMIN'],
  },
  {
    label: 'Clients',
    icon: 'account-group-outline',
    route: '/clients',
    allowedRoles: ['COMPANY_ADMIN'],
  },
  {
    label: 'Users',
    icon: 'account-multiple-outline',
    route: '/users',
    allowedRoles: ['CLIENT_ADMIN'],
  },
  {
    label: 'Projects',
    icon: 'folder-outline',
    route: '/projects',
    allowedRoles: ['COMPANY_ADMIN', 'CLIENT_ADMIN'],
  },
  {
    label: 'Tickets',
    icon: 'ticket-outline',
    route: '/tickets',
    allowedRoles: null, // null = all roles can see it
  },
];

// ── Same logic as web getNavDataForRole() ─────────────────────────────
function getNavItemsForRole(role) {
  if (!role) return [];
  // SUPER_ADMIN sees everything (defaultUser)
  if (role === 'SUPER_ADMIN') return ALL_NAV_ITEMS;
  return ALL_NAV_ITEMS.filter(
    item => item.allowedRoles === null || item.allowedRoles.includes(role),
  );
}

export default function CustomDrawerContent(props) {
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedRole } = useUser();

  const navItems = getNavItemsForRole(resolvedRole);

  const handleNavPress = route => {
    props.navigation.closeDrawer();
    setTimeout(() => router.push(route), 150);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoSection}>
          <Image
            source={require('../assets/icon.png')}
            style={styles.logo}
            resizeMode='contain'
          />
        </View>

        <View style={styles.divider} />

        {/* Role label */}
        {resolvedRole && (
          <View style={styles.roleSection}>
            <Text style={styles.roleText}>
              {resolvedRole.replace('_', ' ')}
            </Text>
          </View>
        )}

        {/* Nav Items — filtered by role */}
        <View style={styles.navSection}>
          {navItems.map(item => {
            const isActive =
              pathname === item.route ||
              (item.route !== '/' && pathname.startsWith(item.route));

            return (
              <TouchableOpacity
                key={item.label}
                style={[styles.navItem, isActive && styles.navItemActive]}
                onPress={() => handleNavPress(item.route)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={item.icon}
                  size={22}
                  color={isActive ? '#1677FF' : '#637381'}
                  style={styles.navIcon}
                />
                <Text
                  style={[styles.navLabel, isActive && styles.navLabelActive]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.divider} />
        <View style={styles.footerContent}>
          <Text style={styles.footerTitle}>Qryio Support</Text>
          <Text style={styles.footerSub}>Internal Product Support</Text>
          <Text style={styles.footerSub}>Ticketing System</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  logoSection: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  logo: { width: 48, height: 48 },
  divider: { height: 1, backgroundColor: '#F0F2F5', marginHorizontal: 16 },

  roleSection: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 2 },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#919EAB',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  navSection: { paddingTop: 8, paddingHorizontal: 12 },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 2,
  },
  navItemActive: { backgroundColor: '#EBF3FF' },
  navIcon: { marginRight: 12 },
  navLabel: { fontSize: 14, color: '#637381', fontWeight: '400' },
  navLabelActive: { color: '#1677FF', fontWeight: '600' },

  footer: { paddingBottom: 28 },
  footerContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    alignItems: 'center',
  },
  footerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1677FF',
    marginBottom: 4,
  },
  footerSub: {
    fontSize: 11,
    color: '#919EAB',
    lineHeight: 17,
    textAlign: 'center',
  },
});
