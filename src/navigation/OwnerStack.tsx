// Owner root navigator: native stack containing the bottom tabs plus
// every sub-screen that can be pushed on top of the tabs.
//
// Screens pushed from inside a tab automatically cover the tab bar — the
// standard React Navigation pattern for bottom-tab + sub-page flows.

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useColors } from '../theme/brand';
import OwnerTabs from './OwnerTabs';

// Sub-screens (full-page, pushed on top of tabs)
import OrdersScreen       from '../screens/owner/OrdersScreen';
import SuppliersScreen    from '../screens/owner/SuppliersScreen';
import SupplierDetailScreen from '../screens/owner/SupplierDetailScreen';
import CustomerDetailScreen from '../screens/owner/CustomerDetailScreen';
import DebtScreen         from '../screens/owner/DebtScreen';
import ExpensesScreen     from '../screens/owner/ExpensesScreen';
import HomeExpensesScreen from '../screens/owner/HomeExpensesScreen';
import TransfersScreen    from '../screens/owner/TransfersScreen';
import ManagementScreen   from '../screens/owner/ManagementScreen';
import ShopsScreen        from '../screens/owner/ShopsScreen';
import ShiftHistoryScreen from '../screens/owner/ShiftHistoryScreen';
import ReportsScreen      from '../screens/owner/ReportsScreen';
import CalculatorScreen   from '../screens/owner/CalculatorScreen';
import AdminScreen        from '../screens/owner/AdminScreen';
import SettingsScreen     from '../screens/SettingsScreen';
import ProductEditorScreen from '../screens/owner/ProductEditorScreen';
import WarehouseMovementsScreen from '../screens/owner/WarehouseMovementsScreen';

export type OwnerStackParamList = {
  Tabs:               undefined;
  Orders:             undefined;
  Suppliers:          undefined;
  SupplierDetail:     { id: number };
  CustomerDetail:     { id: number };
  ProductEditor:      { id?: number };
  WarehouseMovements: { id: number; name: string };
  Debt:               undefined;
  Expenses:           undefined;
  HomeExpenses:       undefined;
  Transfers:          undefined;
  Management:         undefined;
  Shops:              undefined;
  ShiftHistory:       undefined;
  Reports:            undefined;
  Calculator:         undefined;
  Admin:              undefined;
  Settings:           undefined;
};

const Stack = createNativeStackNavigator<OwnerStackParamList>();

export default function OwnerStack() {
  const colors = useColors();

  const screenOpts = {
    headerStyle: { backgroundColor: colors.surface },
    headerTitleStyle: { color: colors.text, fontSize: 17, fontWeight: '600' as const },
    headerTintColor: colors.primary,
    contentStyle: { backgroundColor: colors.background },
  };

  return (
    <Stack.Navigator screenOptions={screenOpts}>
      <Stack.Screen name="Tabs"               component={OwnerTabs}               options={{ headerShown: false }} />
      <Stack.Screen name="Orders"             component={OrdersScreen}            options={{ title: 'Buyurtmalar' }} />
      <Stack.Screen name="Suppliers"          component={SuppliersScreen}         options={{ title: 'Yetkazib beruvchilar' }} />
      <Stack.Screen name="SupplierDetail"     component={SupplierDetailScreen}    options={{ title: 'Yetkazib beruvchi' }} />
      <Stack.Screen name="CustomerDetail"     component={CustomerDetailScreen}    options={{ title: 'Mijoz' }} />
      <Stack.Screen name="ProductEditor"      component={ProductEditorScreen}     options={{ title: 'Mahsulot' }} />
      <Stack.Screen name="WarehouseMovements" component={WarehouseMovementsScreen} options={{ title: 'Harakatlar tarixi' }} />
      <Stack.Screen name="Debt"               component={DebtScreen}              options={{ title: 'Qarz' }} />
      <Stack.Screen name="Expenses"           component={ExpensesScreen}          options={{ title: 'Xarajatlar' }} />
      <Stack.Screen name="HomeExpenses"       component={HomeExpensesScreen}      options={{ title: "Do'kon xarajatlari" }} />
      <Stack.Screen name="Transfers"          component={TransfersScreen}         options={{ title: 'Tovar transferi' }} />
      <Stack.Screen name="Management"         component={ManagementScreen}        options={{ title: 'Menejment' }} />
      <Stack.Screen name="Shops"              component={ShopsScreen}             options={{ title: "Do'konlar" }} />
      <Stack.Screen name="ShiftHistory"       component={ShiftHistoryScreen}      options={{ title: 'Smena tarixi' }} />
      <Stack.Screen name="Reports"            component={ReportsScreen}           options={{ title: 'Hisobot' }} />
      <Stack.Screen name="Calculator"         component={CalculatorScreen}        options={{ title: 'Kalkulyator' }} />
      <Stack.Screen name="Admin"              component={AdminScreen}             options={{ title: 'Admin panel' }} />
      <Stack.Screen name="Settings"           component={SettingsScreen}          options={{ title: 'Sozlamalar' }} />
    </Stack.Navigator>
  );
}
