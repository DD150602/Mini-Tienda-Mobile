import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/theme";
import { useAuth } from "../context/AuthContext";

export function LoginScreen() {
  const { login } = useAuth();
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!correo.trim() || !contrasena) {
      setError("Ingresa tu correo y contraseña.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await login(correo.trim(), contrasena);
    } catch (e: any) {
      setError(e?.message || "No se pudo iniciar sesión.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={s.wrap}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={s.brandIcon}>
          <Ionicons name="storefront" size={34} color="#fff" />
        </View>
        <Text style={s.brand}>VARIEDADES DAKOTA</Text>
        <Text style={s.title}>Bienvenido</Text>
        <Text style={s.subtitle}>
          Inicia sesión para administrar tu tienda.
        </Text>
        <View style={s.card}>
          <Text style={s.label}>Correo electrónico</Text>
          <TextInput
            value={correo}
            onChangeText={setCorreo}
            placeholder="tu@correo.com"
            placeholderTextColor="#9298A3"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            style={s.input}
            returnKeyType="next"
          />
          <Text style={[s.label, { marginTop: 18 }]}>Contraseña</Text>
          <TextInput
            value={contrasena}
            onChangeText={setContrasena}
            placeholder="Ingresa tu contraseña"
            placeholderTextColor="#9298A3"
            secureTextEntry
            autoComplete="password"
            style={s.input}
            onSubmitEditing={submit}
          />
          {error ? <Text style={s.error}>{error}</Text> : null}
          <Pressable
            onPress={submit}
            disabled={busy}
            style={({ pressed }) => [
              s.button,
              pressed && { opacity: 0.85 },
              busy && { opacity: 0.65 },
            ]}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.buttonText}>Iniciar sesión</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  wrap: { flex: 1, justifyContent: "center", padding: 24 },
  brandIcon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 18,
  },
  brand: {
    color: COLORS.primaryDark,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.4,
    textAlign: "center",
  },
  title: {
    color: COLORS.text,
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 30,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 28,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
  },
  label: {
    color: COLORS.text,
    fontWeight: "700",
    fontSize: 13,
    marginBottom: 8,
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    color: COLORS.text,
    fontSize: 15,
  },
  error: { color: COLORS.red, marginTop: 14, fontSize: 13 },
  button: {
    height: 50,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
  },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});
