import { Drawer } from 'expo-router/drawer';
import CustomDrawerContent from '../../components/CustomDrawerContent';
import CustomHeader from '../../components/CustomHeader';

export default function AppLayout() {
  return (
    <Drawer
      drawerContent={props => <CustomDrawerContent {...props} />}
      screenOptions={({ navigation }) => ({
        header: () => <CustomHeader navigation={navigation} />,
        drawerStyle: { width: 260 },
        swipeEnabled: true,
      })}
    />
  );
}
