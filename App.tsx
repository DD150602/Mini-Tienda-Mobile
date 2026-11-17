import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View } from 'react-native';
import { COLORS } from './app/constants/theme';
import { AuthProvider, useAuth } from './app/context/AuthContext';
import { LoginScreen } from './app/screens/LoginScreen';
import { DashboardScreen } from './app/screens/DashboardScreen';
import { OrdersScreen } from './app/screens/OrdersScreen';
import { ProductsScreen } from './app/screens/ProductsScreen';
import { ClientsScreen } from './app/screens/ClientsScreen';
import { SuppliersScreen } from './app/screens/SuppliersScreen';
import { SalesScreen } from './app/screens/SalesScreen';

const Tabs = createBottomTabNavigator();
const appTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.primary,
    background: COLORS.background,
    card: COLORS.surface,
    text: COLORS.text,
    border: COLORS.border,
    notification: COLORS.primary,
  },
};
const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
  Inicio: 'grid-outline', Ventas: 'cart-outline', Pedidos: 'receipt-outline', Productos: 'cube-outline', Clientes: 'people-outline', Proveedores: 'business-outline',
};

export default function App() {
  return <SafeAreaProvider><AuthProvider><AppContent /></AuthProvider></SafeAreaProvider>;
}

function AppContent() {
  const { user, loading } = useAuth();
  if (loading) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background }}><ActivityIndicator color={COLORS.primary} size="large" /></View>;
  if (!user) return <LoginScreen />;
  return <NavigationContainer theme={appTheme}>
    <StatusBar style="dark" />
    <Tabs.Navigator screenOptions={({ route }) => ({ headerShown: false, tabBarActiveTintColor: COLORS.primary, tabBarInactiveTintColor: COLORS.muted, tabBarStyle: { height: 64, paddingTop: 8, paddingBottom: 8, borderTopColor: COLORS.border, backgroundColor: COLORS.surface }, tabBarLabelStyle: { fontSize: 10, fontWeight: '600' }, tabBarIcon: ({ color, size }) => <Ionicons name={icons[route.name]} size={size} color={color} /> })}>
      <Tabs.Screen name="Inicio" component={DashboardScreen} />
      <Tabs.Screen name="Ventas" component={SalesScreen} />
      <Tabs.Screen name="Pedidos" component={OrdersScreen} />
      <Tabs.Screen name="Productos" component={ProductsScreen} />
      <Tabs.Screen name="Clientes" component={ClientsScreen} />
      <Tabs.Screen name="Proveedores" component={SuppliersScreen} />
    </Tabs.Navigator>
  </NavigationContainer>;
}
