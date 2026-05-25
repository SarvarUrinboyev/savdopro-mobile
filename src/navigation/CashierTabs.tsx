// Cashier bottom tabs — Skan, Savatcha (with badge), Sotuvlar, Smena, Sozlamalar.

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import ScanScreen from '../screens/cashier/ScanScreen';
import CartScreen from '../screens/cashier/CartScreen';
import SalesScreen from '../screens/cashier/SalesScreen';
import ShiftScreen from '../screens/cashier/ShiftScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { useColors } from '../theme/brand';
import { useCart } from '../context/CartContext';

const Tab = createBottomTabNavigator();

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(active: IoniconsName, inactive: IoniconsName) {
  return ({
    color,
    size,
    focused,
  }: {
    color: string;
    size: number;
    focused: boolean;
  }) => <Ionicons name={focused ? active : inactive} size={size} color={color} />;
}

export default function CashierTabs() {
  const colors = useColors();
  const { itemCount } = useCart();

  return (
    <Tab.Navigator
      initialRouteName="Skan"
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.text },
        headerShadowVisible: false,
      }}
    >
      <Tab.Screen
        name="Skan"
        component={ScanScreen}
        options={{
          title: 'Skan',
          tabBarIcon: tabIcon('scan', 'scan-outline'),
        }}
      />
      <Tab.Screen
        name="Savatcha"
        component={CartScreen}
        options={{
          title: 'Savatcha',
          tabBarIcon: tabIcon('cart', 'cart-outline'),
          tabBarBadge: itemCount > 0 ? itemCount : undefined,
        }}
      />
      <Tab.Screen
        name="Sotuvlar"
        component={SalesScreen}
        options={{
          title: 'Sotuvlar',
          tabBarIcon: tabIcon('cash', 'cash-outline'),
        }}
      />
      <Tab.Screen
        name="Smena"
        component={ShiftScreen}
        options={{
          title: 'Smena',
          tabBarIcon: tabIcon('timer', 'timer-outline'),
        }}
      />
      <Tab.Screen
        name="Sozlamalar"
        component={SettingsScreen}
        options={{
          title: 'Sozlamalar',
          tabBarIcon: tabIcon('settings', 'settings-outline'),
        }}
      />
    </Tab.Navigator>
  );
}
