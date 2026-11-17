import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, styles } from "../components/Screen";
import { COLORS } from "../constants/theme";
import { api, money, unwrapList } from "../services/api";

type ClientForm = {
  nombre: string;
  telefono: string;
  correo: string;
  direccion: string;
};
const empty: ClientForm = {
  nombre: "",
  telefono: "",
  correo: "",
  direccion: "",
};
export function ClientsScreen() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<ClientForm>(empty);
  const [amount, setAmount] = useState("");
  const [saldoClient, setSaldoClient] = useState<any>(null);
  const load = useCallback(async () => {
    setError("");
    try {
      const data = await api<any>("/clientes");
      setClients(unwrapList(data, "clientes"));
    } catch (e: any) {
      setError(e.message || "No se pudieron cargar clientes.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  const filtered = useMemo(
    () =>
      clients.filter((c) =>
        `${c.nombre} ${c.correo} ${c.telefono} ${c.direccion}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [clients, search],
  );
  const save = async () => {
    if (!form.nombre.trim() || !form.telefono.trim()) {
      Alert.alert("Campos requeridos", "Nombre y teléfono son obligatorios.");
      return;
    }
    try {
      await api(editing ? `/clientes/${editing.id}` : "/clientes", {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify({ ...form, saldo: editing?.saldo ?? 0 }),
      });
      setModal(false);
      await load();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };
  const open = (client?: any) => {
    setEditing(client ?? null);
    setForm(
      client
        ? {
            nombre: client.nombre ?? "",
            telefono: client.telefono ?? "",
            correo: client.correo ?? "",
            direccion: client.direccion ?? "",
          }
        : empty,
    );
    setModal(true);
  };
  const remove = (c: any) =>
    Alert.alert("Eliminar cliente", `¿Eliminar a ${c.nombre}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await api(`/clientes/${c.id}`, { method: "DELETE" });
            await load();
          } catch (e: any) {
            Alert.alert("Error", e.message);
          }
        },
      },
    ]);
  const saldo = (type: "cobrar" | "fiar") => {
    if (!saldoClient) return;
    const n = Number(amount);
    if (!n || n < 1) {
      Alert.alert("Monto inválido", "Ingresa un valor mayor a cero.");
      return;
    }
    const current = Number(saldoClient.saldo) || 0;
    const next = type === "cobrar" ? Math.max(0, current - n) : current + n;
    Alert.alert(
      type === "cobrar" ? "Confirmar cobro" : "Confirmar fiado",
      `${money(n)} · nuevo saldo ${money(next)}`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            try {
              await api(`/clientes/${saldoClient.id}`, {
                method: "PUT",
                body: JSON.stringify({ ...saldoClient, saldo: next }),
              });
              setSaldoClient(null);
              setAmount("");
              await load();
            } catch (e: any) {
              Alert.alert("Error", e.message);
            }
          },
        },
      ],
    );
  };
  const field = (
    key: keyof ClientForm,
    label: string,
    keyboardType: any = "default",
  ) => (
    <TextInput
      value={form[key]}
      onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
      placeholder={label}
      placeholderTextColor={COLORS.muted}
      keyboardType={keyboardType}
      style={[styles.input, { marginBottom: 10 }]}
    />
  );
  return (
    <>
      <Screen
        title="Clientes"
        subtitle="Directorio, contacto y saldos."
        refreshing={loading}
        onRefresh={load}
      >
        <View
          style={[
            styles.card,
            {
              marginTop: 18,
              flexDirection: "row",
              alignItems: "center",
              gap: 9,
              padding: 11,
            },
          ]}
        >
          <Ionicons name="search-outline" size={18} color={COLORS.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar cliente"
            placeholderTextColor={COLORS.muted}
            style={{ flex: 1, color: COLORS.text, paddingVertical: 3 }}
          />
        </View>
        <View style={[styles.row, { marginTop: 16 }]}>
          <Text style={styles.section}>Clientes ({filtered.length})</Text>
          <Pressable
            onPress={() => open()}
            style={{
              backgroundColor: COLORS.primary,
              borderRadius: 11,
              padding: 9,
            }}
          >
            <Ionicons name="person-add-outline" size={18} color="white" />
          </Pressable>
        </View>
        {loading ? <ActivityIndicator color={COLORS.primary} /> : null}
        {error ? (
          <Text style={{ color: COLORS.red, marginBottom: 12 }}>{error}</Text>
        ) : null}
        {filtered.map((c, i) => (
          <View
            key={c.id}
            style={[styles.card, { marginBottom: 10, padding: 14 }]}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 11 }}
            >
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 14,
                  backgroundColor: i % 2 ? COLORS.sky : "#E5EEF9",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: COLORS.navy, fontWeight: "800" }}>
                  {String(c.nombre || "?")
                    .split(" ")
                    .slice(0, 2)
                    .map((x: string) => x[0])
                    .join("")
                    .toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: COLORS.text,
                    fontSize: 14,
                    fontWeight: "700",
                  }}
                >
                  {c.nombre}
                </Text>
                <Text
                  style={{ color: COLORS.muted, fontSize: 11, marginTop: 3 }}
                >
                  {c.telefono}
                  {c.correo ? ` · ${c.correo}` : ""}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ color: COLORS.muted, fontSize: 10 }}>Saldo</Text>
                <Text
                  style={{
                    color: Number(c.saldo) > 0 ? COLORS.red : COLORS.primary,
                    fontWeight: "800",
                    fontSize: 12,
                    marginTop: 2,
                  }}
                >
                  {money(c.saldo)}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
              <Pressable
                onPress={() => {
                  setSaldoClient(c);
                  setAmount("");
                }}
                style={{
                  backgroundColor: "#E5EEF9",
                  padding: 8,
                  borderRadius: 9,
                }}
              >
                <Text
                  style={{
                    color: COLORS.navy,
                    fontSize: 11,
                    fontWeight: "700",
                  }}
                >
                  Cobrar / fiar
                </Text>
              </Pressable>
              <Pressable onPress={() => open(c)} style={{ padding: 8 }}>
                <Text
                  style={{
                    color: COLORS.primary,
                    fontSize: 11,
                    fontWeight: "700",
                  }}
                >
                  Editar
                </Text>
              </Pressable>
              <Pressable onPress={() => remove(c)} style={{ padding: 8 }}>
                <Text
                  style={{ color: COLORS.red, fontSize: 11, fontWeight: "700" }}
                >
                  Eliminar
                </Text>
              </Pressable>
            </View>
          </View>
        ))}
        {!loading && !filtered.length && !error ? (
          <Text style={{ color: COLORS.muted }}>
            Sin clientes para mostrar.
          </Text>
        ) : null}
      </Screen>
      <Modal
        visible={modal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: COLORS.background,
            padding: 20,
            paddingTop: 28,
          }}
        >
          <View style={[styles.row, { marginBottom: 18 }]}>
            <Text
              style={{ fontSize: 22, fontWeight: "800", color: COLORS.text }}
            >
              {editing ? "Editar cliente" : "Nuevo cliente"}
            </Text>
            <Pressable onPress={() => setModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </Pressable>
          </View>
          {field("nombre", "Nombre completo")}
          {field("telefono", "Teléfono", "phone-pad")}
          {field("correo", "Correo electrónico", "email-address")}
          {field("direccion", "Dirección")}
          <Pressable onPress={save} style={styles.button}>
            <Text style={styles.buttonText}>
              {editing ? "Guardar cambios" : "Crear cliente"}
            </Text>
          </Pressable>
        </View>
      </Modal>
      <Modal
        visible={Boolean(saldoClient)}
        transparent
        animationType="fade"
        onRequestClose={() => setSaldoClient(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "#0007",
            justifyContent: "center",
            padding: 22,
          }}
        >
          <View style={[styles.card, { padding: 20 }]}>
            <View style={[styles.row, { marginBottom: 14 }]}>
              <Text
                style={{ fontSize: 18, fontWeight: "800", color: COLORS.text }}
              >
                Saldo de {saldoClient?.nombre}
              </Text>
              <Pressable onPress={() => setSaldoClient(null)}>
                <Ionicons name="close" size={22} color={COLORS.text} />
              </Pressable>
            </View>
            <Text style={{ color: COLORS.muted, marginBottom: 12 }}>
              Saldo actual: {money(saldoClient?.saldo)}
            </Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="Monto"
              keyboardType="decimal-pad"
              placeholderTextColor={COLORS.muted}
              style={[styles.input, { marginBottom: 14 }]}
            />
            <View style={{ flexDirection: "row", gap: 9 }}>
              <Pressable
                onPress={() => saldo("cobrar")}
                style={[styles.button, { flex: 1 }]}
              >
                <Text style={styles.buttonText}>Cobrar</Text>
              </Pressable>
              <Pressable
                onPress={() => saldo("fiar")}
                style={[
                  styles.button,
                  { flex: 1, backgroundColor: COLORS.navy },
                ]}
              >
                <Text style={styles.buttonText}>Fiar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
