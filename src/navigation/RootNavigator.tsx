// Top-level navigator. Three states:
//   1. Loading session  → splash spinner
//   2. No user          → LoginScreen
//   3. Authenticated    → role-based tab set (owner vs cashier)
//
// Splitting by role here means the wrong tab set physically can't
// render — a SHOP_USER never sees the OWNER routes, so we don't have
// to repeat role checks inside individual screens.

import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../auth/AuthContext';
import { useColors } from '../theme/brand';
import LoginScreen from '../screens/LoginScreen';
import OwnerTabs from './OwnerTabs';
import CashierTabs from './CashierTabs';

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
        <CashierTabs />
      ) : (
        // ACCOUNT_OWNER + SUPER_ADMIN both land on the owner tabs.
        <OwnerTabs />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
