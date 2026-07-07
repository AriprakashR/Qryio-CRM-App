import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Text } from 'react-native-paper';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { usePathname, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: 'view-dashboard-outline', route: '/dashboard' },
  { label: 'Employee', icon: 'account-outline', route: '/employee' },
  { label: 'Clients', icon: 'account-group-outline', route: '/clients' },
  { label: 'Projects', icon: 'chart-bar', route: '/projects' },
  { label: 'Tickets', icon: 'ticket-outline', route: '/tickets' },
];

export default function CustomDrawerContent(props) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.container}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/* Logo */}
        <View style={styles.logoSection}>
          <Image
            source={require('../assets/logo2.jpg')}
            style={styles.logo}
            resizeMode='contain'
          />
        </View>

        <View style={styles.divider} />

        {/* Nav Items */}
        <View style={styles.navSection}>
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.route;
            return (
              <TouchableOpacity
                key={item.label}
                style={[styles.navItem, isActive && styles.navItemActive]}
                onPress={() => router.push(item.route)}
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
      </DrawerContentScrollView>

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

  // Logo
  logoSection: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  logo: { width: 58, height: 58 },

  // Divider
  divider: { height: 1, backgroundColor: '#F0F2F5', marginHorizontal: 16 },

  // Nav
  navSection: { paddingTop: 12, paddingHorizontal: 12 },
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

  // Footer
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
