import React from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";

export function Screen({
  title,
  subtitle,
  children,
  refreshing,
  onRefresh,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const { logout } = useAuth();
  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={Boolean(refreshing)}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          ) : undefined
        }
      >
        <View style={s.top}>
          <View>
            <Text style={s.brand}>VARIEDADES DAKOTA</Text>
            <Text style={s.caption}>Sistema de gestión</Text>
          </View>
          <Pressable onPress={() => void logout()} style={s.avatar} accessibilityLabel="Cerrar sesión">
            <Ionicons name="log-out-outline" size={20} color={COLORS.primaryDark} />
          </Pressable>
        </View>
        <Text style={s.title}>{title}</Text>
        <Text style={s.subtitle}>{subtitle}</Text>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
export const styles = StyleSheet.create({
  section: {
    marginTop: 24,
    marginBottom: 12,
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "700",
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 17,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderRadius: 13,
    paddingHorizontal: 13,
    color: COLORS.text,
    fontSize: 14,
  },
  button: {
    minHeight: 46,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  buttonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: 20, paddingBottom: 28 },
  top: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  caption: { color: COLORS.muted, fontSize: 11, marginTop: 3 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: COLORS.greenSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: COLORS.primary, fontWeight: "800" },
  title: {
    color: COLORS.text,
    fontSize: 27,
    fontWeight: "800",
    marginTop: 18,
    letterSpacing: -0.5,
  },
  subtitle: { color: COLORS.muted, fontSize: 13, marginTop: 5 },
});
