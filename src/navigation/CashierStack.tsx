// Cashier (SHOP_USER) navigator.
// CartProvider wraps everything so ScanScreen and CartScreen share cart state.

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useColors } from '../theme/brand';
import { CartProvider } from '../context/CartContext';
import CashierTabs from './CashierTabs';

export type CashierStackParamList = {
  Tabs: undefined;
};

const Stack = createNativeStackNavigator<CashierStackParamList>();

export default function CashierStack() {
  const colors = useColors();
  return (
    <CartProvider>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="Tabs" component={CashierTabs} />
      </Stack.Navigator>
    </CartProvider>
  );
}
