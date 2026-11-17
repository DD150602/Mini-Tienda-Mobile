import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, styles } from "../components/Screen";
import { COLORS } from "../constants/theme";
import { api, money, unwrapList } from "../services/api";
type Supplier = { nombre: string; empresa: string; telefono: string };
const empty: Supplier = { nombre: "", empresa: "", telefono: "" };
export function SuppliersScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [supplierOrders, setSupplierOrders] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<Supplier>(empty);
  const load = useCallback(async () => {
    setError("");
    try {
      const [list, stat] = await Promise.all([
        api<any>("/proveedores"),
        api<any>("/proveedores/estadisticas"),
      ]);
      const raw = unwrapList(list, "proveedores");
      const result = await Promise.all(
        raw.map(async (s) => {
          try {
            const p = await api<any>(`/proveedores/${s.id}/pedidos`);
            return { ...s, totalPedidos: p.totalPedidos ?? 0 };
          } catch {
            return { ...s, totalPedidos: 0 };
          }
        }),
      );
      setItems(result);
      setStats(stat);
    } catch (e: any) {
      setError(e.message || "No se pudieron cargar proveedores.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  const open = (s?: any) => {
    setEditing(s ?? null);
    setForm(
      s
        ? {
            nombre: s.nombre ?? "",
            empresa: s.empresa ?? "",
            telefono: s.telefono ?? "",
          }
        : empty,
    );
    setModal(true);
  };
  const openDetails = async (supplier: any) => {
    setSelectedSupplier(supplier);
    setSupplierOrders([]);
    setDetailError("");
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const response = await api<any>("/pedidos");
      const orders = unwrapList<any>(response, "pedidos").filter(
        (order) =>
          String(order.proveedor_id ?? order.provider_id ?? "") ===
            String(supplier.id) ||
          (order.nombre_proveedor || order.nombre) === supplier.nombre,
      );
      setSupplierOrders(orders);
    } catch (e: any) {
      setDetailError(e.message || "No se pudo cargar el historial.");
    } finally {
      setDetailLoading(false);
    }
  };
  const save = async () => {
    if (!form.nombre.trim() || !form.telefono.trim()) {
      Alert.alert("Campos requeridos", "Nombre y teléfono son obligatorios.");
      return;
    }
    try {
      await api(editing ? `/proveedores/${editing.id}` : "/proveedores", {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify(form),
      });
      setModal(false);
      await load();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };
  const remove = (s: any) =>
    Alert.alert("Eliminar proveedor", `¿Eliminar ${s.nombre}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await api(`/proveedores/${s.id}`, { method: "DELETE" });
            await load();
          } catch (e: any) {
            Alert.alert("Error", e.message);
          }
        },
      },
    ]);
  const field = (
    key: keyof Supplier,
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
        title="Proveedores"
        subtitle="Contactos y órdenes de compra."
        refreshing={loading}
        onRefresh={load}
      >
        <View style={{ flexDirection: "row", gap: 8, marginTop: 18 }}>
          {[
            ["Proveedores", stats.totalProveedores ?? items.length],
            ["Activos", stats.proveedoresActivos ?? 0],
            ["Pedidos", stats.pedidosMes ?? 0],
          ].map(([label, val]) => (
            <View
              key={String(label)}
              style={[styles.card, { flex: 1, padding: 11 }]}
            >
              <Text style={{ color: COLORS.muted, fontSize: 10 }}>{label}</Text>
              <Text
                style={{
                  color: COLORS.navy,
                  fontSize: 18,
                  fontWeight: "800",
                  marginTop: 3,
                }}
              >
                {val}
              </Text>
            </View>
          ))}
        </View>
        <Pressable
          onPress={() => open()}
          style={[
            styles.button,
            { marginTop: 15, flexDirection: "row", gap: 8 },
          ]}
        >
          <Ionicons name="add" size={19} color="white" />
          <Text style={styles.buttonText}>Nuevo proveedor</Text>
        </Pressable>
        <Text style={styles.section}>Lista de proveedores</Text>
        {loading ? <ActivityIndicator color={COLORS.primary} /> : null}
        {error ? <Text style={{ color: COLORS.red }}>{error}</Text> : null}
        {items.map((s) => (
          <View
            key={s.id}
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
                  backgroundColor: "#E5EEF9",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name="business-outline"
                  size={20}
                  color={COLORS.navy}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: COLORS.text,
                    fontWeight: "700",
                    fontSize: 14,
                  }}
                >
                  {s.nombre}
                </Text>
                <Text
                  style={{ color: COLORS.muted, fontSize: 11, marginTop: 3 }}
                >
                  {s.empresa || "Sin contacto"} · {s.telefono}
                </Text>
              </View>
              <Text
                style={{
                  color: COLORS.primary,
                  fontWeight: "700",
                  fontSize: 11,
                }}
              >
                {s.totalPedidos} ped.
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 18, marginTop: 12 }}>
              <Pressable onPress={() => openDetails(s)}>
                <Text
                  style={{
                    color: COLORS.navy,
                    fontSize: 11,
                    fontWeight: "700",
                  }}
                >
                  Ver detalle
                </Text>
              </Pressable>
              <Pressable onPress={() => open(s)}>
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
              <Pressable onPress={() => remove(s)}>
                <Text
                  style={{ color: COLORS.red, fontSize: 11, fontWeight: "700" }}
                >
                  Eliminar
                </Text>
              </Pressable>
            </View>
          </View>
        ))}
        {!loading && !items.length && !error ? (
          <Text style={{ color: COLORS.muted }}>
            No hay proveedores registrados.
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
              {editing ? "Editar proveedor" : "Nuevo proveedor"}
            </Text>
            <Pressable onPress={() => setModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </Pressable>
          </View>
          {field("nombre", "Nombre del proveedor")}
          {field("empresa", "Persona de contacto")}
          {field("telefono", "Teléfono", "phone-pad")}
          <Pressable onPress={save} style={styles.button}>
            <Text style={styles.buttonText}>
              {editing ? "Guardar cambios" : "Crear proveedor"}
            </Text>
          </Pressable>
        </View>
      </Modal>
      <Modal
        visible={detailOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDetailOpen(false)}
      >
        <ScrollView
          style={{ flex: 1, backgroundColor: COLORS.background }}
          contentContainerStyle={{ padding: 20, paddingTop: 28, paddingBottom: 36 }}
        >
          <View style={[styles.row, { marginBottom: 18 }]}>
            <Text style={{ fontSize: 22, fontWeight: "800", color: COLORS.text }}>
              Proveedor
            </Text>
            <Pressable onPress={() => setDetailOpen(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </Pressable>
          </View>
          {selectedSupplier ? (
            <>
              <View style={styles.card}>
                <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: "800" }}>
                  {selectedSupplier.nombre}
                </Text>
                <SupplierDetailRow label="Contacto" value={selectedSupplier.empresa || "Sin contacto"} />
                <SupplierDetailRow label="Teléfono" value={selectedSupplier.telefono || "—"} />
                <SupplierDetailRow label="Pedidos registrados" value={String(selectedSupplier.totalPedidos ?? 0)} />
                <SupplierDetailRow label="Estado" value={Number(selectedSupplier.totalPedidos) > 0 ? "Activo" : "Inactivo"} />
              </View>
              <Text style={styles.section}>Historial de pedidos</Text>
              {detailLoading ? <ActivityIndicator color={COLORS.primary} /> : null}
              {detailError ? <Text style={{ color: COLORS.red, marginBottom: 12 }}>{detailError}</Text> : null}
              {!detailLoading && !detailError && supplierOrders.length === 0 ? (
                <View style={styles.card}>
                  <Text style={{ color: COLORS.muted, fontSize: 13 }}>
                    Este proveedor aún no tiene pedidos.
                  </Text>
                </View>
              ) : null}
              {supplierOrders.map((order) => (
                <View key={order.id} style={[styles.card, { marginBottom: 10, padding: 14 }]}>
                  <View style={styles.row}>
                    <Text style={{ color: COLORS.primary, fontSize: 12, fontWeight: "800" }}>
                      Pedido #{order.id}
                    </Text>
                    <Text style={{ color: order.estado === "recibido" ? COLORS.primary : "#A36C16", fontSize: 11, fontWeight: "700" }}>
                      {order.estado}
                    </Text>
                  </View>
                  <View style={[styles.row, { marginTop: 8 }]}>
                    <Text style={{ color: COLORS.muted, fontSize: 11 }}>
                      {order.fecha ? new Date(order.fecha).toLocaleDateString("es-CO") : "Fecha sin dato"}
                    </Text>
                    <Text style={{ color: COLORS.text, fontSize: 13, fontWeight: "800" }}>
                      {money(order.total)}
                    </Text>
                  </View>
                </View>
              ))}
            </>
          ) : null}
        </ScrollView>
      </Modal>
    </>
  );
}

function SupplierDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 16, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
      <Text style={{ color: COLORS.muted, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: COLORS.text, fontSize: 12, fontWeight: "700", flexShrink: 1, textAlign: "right" }}>{value}</Text>
    </View>
  );
}
