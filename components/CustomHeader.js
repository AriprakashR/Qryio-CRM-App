import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CustomHeader({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity
        onPress={() => navigation.toggleDrawer()}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons name='menu' size={26} color='#1C252E' />
      </TouchableOpacity>

      <View style={styles.right}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Super Admin</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>A</Text>
        </View>
      </View>
    </View>
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  right: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '600', color: '#4B5563' },
});
