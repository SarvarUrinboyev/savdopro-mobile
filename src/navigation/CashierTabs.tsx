import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ScanScreen from '../screens/cashier/ScanScreen';
import CartScreen from '../screens/cashier/CartScreen';
import SalesScreen from '../screens/cashier/SalesScreen';
import ShiftScreen from '../screens/cashier/ShiftScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { useColors } from '../theme/brand';

const Tab = createBottomTabNavigator();

export default function CashierTabs() {
  const colors = useColors();
  return (
    <Tab.Navigator
      initialRouteName="Skan"
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.text },
      }}
    >
      <Tab.Screen name="Skan" component={ScanScreen} />
      <Tab.Screen name="Savatcha" component={CartScreen} />
      <Tab.Screen name="Sotuvlar" component={SalesScreen} />
      <Tab.Screen name="Smena" component={ShiftScreen} />
      <Tab.Screen name="Sozlamalar" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
