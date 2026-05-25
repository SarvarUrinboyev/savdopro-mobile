// Top-level navigator.
//   No user   → LoginScreen
//   SHOP_USER → CashierStack (bottom tabs + shift sub-screens)
//   Owner     → OwnerStack   (bottom tabs + all feature screens)

import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../auth/AuthContext';
import { useColors } from '../theme/brand';
import LoginScreen from '../screens/LoginScreen';
import OwnerStack from './OwnerStack';
import CashierStack from './CashierStack';

export default function RootNavigator() {
  const { user, loading } = useAuth();
  const colors = useColors();

  if (loading) {
    return (
      <View style={[styles.splash, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!user ? (
        <LoginScreen />
      ) : user.role === 'SHOP_USER' ? (
        <CashierStack />
      ) : (
        <OwnerStack />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
