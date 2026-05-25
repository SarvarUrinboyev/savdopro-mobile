// Bottom tab bar for ACCOUNT_OWNER / SUPER_ADMIN.
// 5 tabs: Dashboard, Warehouse, Payments, Customers, Menu.
// "Menu" opens MenuScreen which lists all remaining sections.

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import DashboardScreen  from '../screens/owner/DashboardScreen';
import WarehouseScreen  from '../screens/owner/WarehouseScreen';
import PaymentsScreen   from '../screens/owner/PaymentsScreen';
import CustomersScreen  from '../screens/owner/CustomersScreen';
import MenuScreen       from '../screens/owner/MenuScreen';
import { useColors } from '../theme/brand';

const Tab = createBottomTabNavigator();

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(active: IoniconsName, inactive: IoniconsName) {
  return ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
    <Ionicons name={focused ? active : inactive} size={size} color={color} />
  );
}

export default function OwnerTabs() {
  const colors = useColors();
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor:   colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle:  { backgroundColor: colors.surface, borderTopColor: colors.border },
        headerStyle:  { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.text, fontSize: 17 },
      }}
    >
      <Tab.Screen
        name="Bosh sahifa"
        component={DashboardScreen}
        options={{ tabBarIcon: tabIcon('home', 'home-outline') }}
      />
      <Tab.Screen
        name="Ombor"
        component={WarehouseScreen}
        options={{ tabBarIcon: tabIcon('archive', 'archive-outline') }}
      />
      <Tab.Screen
        name="To'lov"
        component={PaymentsScreen}
        options={{ tabBarIcon: tabIcon('cash', 'cash-outline') }}
      />
      <Tab.Screen
        name="Mijozlar"
        component={CustomersScreen}
        options={{ tabBarIcon: tabIcon('people', 'people-outline') }}
      />
      <Tab.Screen
        name="Menyu"
        component={MenuScreen}
        options={{ tabBarIcon: tabIcon('menu', 'menu-outline'), title: 'Ko\'proq' }}
      />
    </Tab.Navigator>
  );
}
