import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/owner/DashboardScreen';
import ReportsScreen from '../screens/owner/ReportsScreen';
import ShopsScreen from '../screens/owner/ShopsScreen';
import CustomersScreen from '../screens/owner/CustomersScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { useColors } from '../theme/brand';

const Tab = createBottomTabNavigator();

export default function OwnerTabs() {
  const colors = useColors();
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.text },
      }}
    >
      <Tab.Screen name="Bosh sahifa" component={DashboardScreen} />
      <Tab.Screen name="Hisobotlar" component={ReportsScreen} />
      <Tab.Screen name="Do'konlar" component={ShopsScreen} />
      <Tab.Screen name="Mijozlar" component={CustomersScreen} />
      <Tab.Screen name="Sozlamalar" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
