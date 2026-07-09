import { Drawer } from 'expo-router/drawer';
import CustomDrawerContent from '../../components/CustomDrawerContent';
import CustomHeader from '../../components/CustomHeader';
import { SessionGuard } from '../../components/SessionGuard';

export default function AppLayout() {
  return (
    <SessionGuard>
      <Drawer
        drawerContent={props => <CustomDrawerContent {...props} />}
        screenOptions={({ navigation }) => ({
          header: () => <CustomHeader navigation={navigation} />,
          drawerStyle: { width: 260 },
          swipeEnabled: true,
          overlayColor: 'rgba(0,0,0,0.45)',
        })}
      />
    </SessionGuard>
  );
}
