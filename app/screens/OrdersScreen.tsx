import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { File } from "expo-file-system";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Screen, styles } from "../components/Screen";
import { COLORS } from "../constants/theme";
import { api, money, unwrapList } from "../services/api";
import { findLocalBarcodeProduct, saveLocalBarcodeProduct } from "../services/mockBarcodeCatalog";

export function OrdersScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [creating, setCreating] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [barcode, setBarcode] = useState("");
  const [scanHandled, setScanHandled] = useState(false);
  const [localProductFound, setLocalProductFound] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState({
    proveedor_id: "",
    nombre: "",
    descripcion: "",
    categoria_id: "",
    precio: "",
    stock: "",
  });
  const load = useCallback(async () => {
    setError("");
    try {
      const [o, s] = await Promise.all([
        api<any>("/pedidos"),
        api<any>("/pedidos/stats"),
      ]);
      setOrders(unwrapList(o, "pedidos"));
      setStats(s?.stats ?? s?.data?.stats ?? {});
    } catch (e: any) {
      setError(e.message || "No se pudieron cargar pedidos.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  const openCreate = async () => {
    try {
      const [s, c] = await Promise.all([
        api<any>("/proveedores"),
        api<any>("/categories"),
      ]);
      setSuppliers(unwrapList(s, "proveedores"));
      setCategories(unwrapList(c, "categories"));
      setImage(null);
      setBarcode("");
      setLocalProductFound(false);
      setForm({
        proveedor_id: "",
        nombre: "",
        descripcion: "",
        categoria_id: "",
        precio: "",
        stock: "",
      });
      setFormOpen(true);
    } catch (e: any) {
      Alert.alert("No se pudo abrir formulario", e.message);
    }
  };
  const resolveLocalBarcode = (rawCode: string) => {
    const code = rawCode.trim();
    if (!code) return;
    setBarcode(code);
    const product = findLocalBarcodeProduct(code);
    if (!product) {
      setLocalProductFound(false);
      setScannerOpen(false);
      Alert.alert("Código nuevo", "No está en el catálogo local de prueba. Completa los datos y guárdalo localmente para volver a probar el escaneo.");
      return;
    }
    setLocalProductFound(true);
    setForm((current) => ({
      ...current,
      nombre: product.nombre,
      descripcion: product.descripcion,
      categoria_id: product.categoria_id || current.categoria_id || String(categories[0]?.categoria_id ?? ""),
      precio: product.precio,
      stock: current.stock || "1",
    }));
    setScannerOpen(false);
  };
  const openBarcodeScanner = async () => {
    setScanHandled(false);
    if (!cameraPermission?.granted) {
      const permission = await requestCameraPermission();
      if (!permission.granted) {
        Alert.alert("Permiso de cámara", "Permite el acceso a la cámara para escanear códigos de barras.");
        return;
      }
    }
    setScannerOpen(true);
  };
  const registerLocalBarcode = () => {
    if (!barcode || !form.nombre.trim() || !form.precio || !form.categoria_id) {
      Alert.alert("Faltan datos", "Escanea un código nuevo y completa nombre, categoría y precio para guardarlo en el catálogo local.");
      return;
    }
    saveLocalBarcodeProduct({ barcode, nombre: form.nombre.trim(), descripcion: form.descripcion.trim(), precio: form.precio, categoria_id: form.categoria_id });
    setLocalProductFound(true);
    Alert.alert("Guardado local", "El código quedó disponible en este dispositivo mientras la app siga abierta. No se envió al backend.");
  };
  const openDetails = async (id: number) => {
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const response = await api<any>(`/pedidos/${id}`);
      setSelectedOrder(response?.pedido ?? response?.data?.pedido ?? response);
    } catch (e: any) {
      setDetailOpen(false);
      Alert.alert("No se pudieron cargar los detalles", e.message);
    } finally {
      setDetailLoading(false);
    }
  };
  const chooseImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled) setImage(result.assets[0]);
    } catch (e: any) {
      Alert.alert("No se pudo abrir la galería", e.message);
    }
  };
  const receive = (id: number) =>
    Alert.alert("Marcar como recibido", "¿Confirmas que llegó este pedido?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Recibir",
        onPress: async () => {
          try {
            await api(`/pedidos/${id}/status`, {
              method: "PUT",
              body: JSON.stringify({ estado: "recibido" }),
            });
            await load();
          } catch (e: any) {
            Alert.alert("Error", e.message);
          }
        },
      },
    ]);
  const create = async () => {
    if (
      !form.proveedor_id ||
      !form.nombre ||
      !form.descripcion ||
      !form.categoria_id ||
      !form.precio ||
      !form.stock
    ) {
      Alert.alert(
        "Faltan datos",
        "Completa proveedor, producto, descripción, categoría, precio y cantidad.",
      );
      return;
    }
    setCreating(true);
    try {
      const body = new FormData();
      Object.entries(form).forEach(([k, v]) => body.append(k, v));
      body.append("total", String(Number(form.precio) * Number(form.stock)));
      if (image) body.append("image", new File(image.uri));
      await api("/pedidos", { method: "POST", body });
      setFormOpen(false);
      setImage(null);
      setForm({
        proveedor_id: "",
        nombre: "",
        descripcion: "",
        categoria_id: "",
        precio: "",
        stock: "",
      });
      await load();
    } catch (e: any) {
      Alert.alert("No se pudo crear pedido", e.message);
    } finally {
      setCreating(false);
    }
  };
  const selectValue = (
    label: string,
    items: any[],
    value: string,
    onPick: (v: string) => void,
    keyField: string,
    labelField: string,
  ) => (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: COLORS.muted, fontSize: 12, marginBottom: 6 }}>
        {label}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
        {items.map((x) => (
          <Pressable
            key={x[keyField]}
            onPress={() => onPick(String(x[keyField]))}
            style={{
              paddingHorizontal: 11,
              paddingVertical: 8,
              borderRadius: 12,
              backgroundColor:
                value === String(x[keyField]) ? COLORS.primary : "#E5EEF9",
            }}
          >
            <Text
              style={{
                color: value === String(x[keyField]) ? "white" : COLORS.navy,
                fontSize: 11,
              }}
            >
              {x[labelField]}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
  const field = (
    key: keyof typeof form,
    placeholder: string,
    keyboardType: any = "default",
    multiline = false,
  ) => (
    <TextInput
      key={key}
      value={form[key]}
      onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
      placeholder={placeholder}
      placeholderTextColor={COLORS.muted}
      keyboardType={keyboardType}
      multiline={multiline}
      style={[
        styles.input,
        { marginBottom: 10 },
        multiline
          ? { height: 75, textAlignVertical: "top", paddingTop: 12 }
          : {},
      ]}
    />
  );
  return (
    <>
      <Screen
        title="Pedidos"
        subtitle="Órdenes de compra a proveedores."
        refreshing={loading}
        onRefresh={load}
      >
        <View style={{ flexDirection: "row", gap: 9, marginTop: 20 }}>
          <View style={[styles.card, { flex: 1, padding: 12 }]}>
            <Text style={{ color: COLORS.muted, fontSize: 11 }}>
              Pendientes
            </Text>
            <Text
              style={{
                color: COLORS.text,
                fontWeight: "800",
                fontSize: 20,
                marginTop: 4,
              }}
            >
              {stats.pedidos_pendientes ??
                orders.filter((o) => o.estado === "pendiente").length}
            </Text>
          </View>
          <View style={[styles.card, { flex: 1, padding: 12 }]}>
            <Text style={{ color: COLORS.muted, fontSize: 11 }}>
              Entregados hoy
            </Text>
            <Text
              style={{
                color: COLORS.primary,
                fontWeight: "800",
                fontSize: 20,
                marginTop: 4,
              }}
            >
              {stats.entregados_hoy ?? 0}
            </Text>
          </View>
          <View style={[styles.card, { flex: 1, padding: 12 }]}>
            <Text style={{ color: COLORS.muted, fontSize: 11 }}>Total del mes</Text>
            <Text adjustsFontSizeToFit numberOfLines={1} style={{ color: COLORS.navy, fontWeight: "800", fontSize: 18, marginTop: 4 }}>{money(stats.total_mes)}</Text>
          </View>
        </View>
        <Pressable
          onPress={openCreate}
          style={[
            styles.button,
            { marginTop: 16, flexDirection: "row", gap: 8 },
          ]}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.buttonText}>Nuevo pedido</Text>
        </Pressable>
        <Text style={styles.section}>Historial de pedidos</Text>
        {loading ? <ActivityIndicator color={COLORS.primary} /> : null}
        {error ? (
          <Text style={{ color: COLORS.red, marginBottom: 12 }}>{error}</Text>
        ) : null}
        {orders.map((order) => (
          <View
            key={order.id}
            style={[styles.card, { marginBottom: 10, padding: 15 }]}
          >
            <Pressable onPress={() => openDetails(order.id)}>
            <View style={styles.row}>
              <Text
                style={{
                  color: COLORS.primary,
                  fontSize: 12,
                  fontWeight: "800",
                }}
              >
                Pedido #{order.id}
              </Text>
              <Text
                style={{
                  color:
                    order.estado === "recibido" ? COLORS.primary : "#A36C16",
                  fontSize: 11,
                  fontWeight: "700",
                }}
              >
                {order.estado}
              </Text>
            </View>
            <Text
              style={{
                color: COLORS.text,
                fontSize: 14,
                fontWeight: "700",
                marginTop: 9,
              }}
            >
              {order.nombre_proveedor || order.nombre || "Proveedor"}
            </Text>
            <View style={[styles.row, { marginTop: 6 }]}>
              <Text style={{ color: COLORS.muted, fontSize: 11 }}>
                {order.fecha
                  ? new Date(order.fecha).toLocaleDateString("es-CO")
                  : "—"}
              </Text>
              <Text
                style={{ color: COLORS.text, fontWeight: "800", fontSize: 13 }}
              >
                {money(order.total)}
              </Text>
            </View>
            </Pressable>
            {order.estado !== "recibido" ? (
              <Pressable
                onPress={() => receive(order.id)}
                style={{
                  alignSelf: "flex-end",
                  marginTop: 10,
                  paddingVertical: 7,
                  paddingHorizontal: 12,
                  backgroundColor: "#E5EEF9",
                  borderRadius: 10,
                }}
              >
                <Text
                  style={{
                    color: COLORS.navy,
                    fontWeight: "700",
                    fontSize: 11,
                  }}
                >
                  Marcar recibido
                </Text>
              </Pressable>
            ) : null}
          </View>
        ))}
        {!loading && !orders.length && !error ? (
          <Text style={{ color: COLORS.muted }}>
            No hay pedidos registrados.
          </Text>
        ) : null}
      </Screen>
      <Modal
        visible={formOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setFormOpen(false)}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          style={{
            flex: 1,
            backgroundColor: COLORS.background,
          }}
          contentContainerStyle={{ padding: 20, paddingTop: 28, paddingBottom: 36 }}
        >
          <View style={[styles.row, { marginBottom: 18 }]}>
            <Text
              style={{ fontSize: 22, fontWeight: "800", color: COLORS.text }}
            >
              Nuevo pedido
            </Text>
            <Pressable onPress={() => setFormOpen(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </Pressable>
          </View>
          <Text style={{ color: COLORS.muted, fontSize: 12, marginBottom: 6 }}>
            Proveedor
          </Text>
          {selectValue(
            "Proveedor",
            suppliers,
            form.proveedor_id,
            (v) => setForm((f) => ({ ...f, proveedor_id: v })),
            "id",
            "nombre",
          )}
          <Pressable onPress={openBarcodeScanner} style={[styles.card, { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, padding: 12, marginBottom: 12, borderColor: COLORS.primary }]}>
            <Ionicons name="barcode-outline" size={21} color={COLORS.primary} />
            <Text style={{ color: COLORS.primary, fontWeight: "800" }}>Escanear código de barras</Text>
          </Pressable>
          {barcode ? <View style={{ backgroundColor: localProductFound ? "#E5EEF9" : "#FFF6E5", borderRadius: 12, padding: 11, marginBottom: 12 }}>
            <Text style={{ color: COLORS.text, fontSize: 12 }}>Código leído: {barcode}</Text>
            <Text style={{ color: localProductFound ? COLORS.primary : "#946200", fontSize: 11, marginTop: 4 }}>{localProductFound ? "Producto cargado desde catálogo local de prueba" : "Código nuevo: completa los datos para registrarlo localmente"}</Text>
          </View> : null}
          <Text style={{ color: COLORS.muted, fontSize: 11, marginBottom: 10 }}>Escáner y catálogo son locales. “Crear pedido” conserva el envío actual al servidor.</Text>
          {field("nombre", "Nombre del producto")}
          {field("descripcion", "Descripción", "default", true)}
          {selectValue(
            "Categoría",
            categories,
            form.categoria_id,
            (v) => setForm((f) => ({ ...f, categoria_id: v })),
            "categoria_id",
            "nombre_categoria",
          )}
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1 }}>
              {field("precio", "Precio", "decimal-pad")}
            </View>
            <View style={{ flex: 1 }}>
              {field("stock", "Cantidad", "number-pad")}
            </View>
          </View>
          {barcode && !localProductFound ? <Pressable onPress={registerLocalBarcode} style={[styles.card, { alignItems: "center", padding: 12, marginBottom: 14, borderColor: COLORS.primary }]}><Text style={{ color: COLORS.primary, fontWeight: "700" }}>Guardar código en catálogo local</Text></Pressable> : null}
          <Text style={{ color: COLORS.muted, fontSize: 12, marginBottom: 8 }}>Imagen del producto (opcional)</Text>
          {image ? <Image source={{ uri: image.uri }} resizeMode="cover" style={{ height: 170, borderRadius: 16, marginBottom: 10 }} /> : null}
          <View style={{ flexDirection: "row", gap: 9, marginBottom: 14 }}>
            <Pressable onPress={chooseImage} style={[styles.card, { flex: 1, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 7, padding: 12, borderColor: COLORS.primary }]}>
              <Ionicons name="image-outline" size={18} color={COLORS.primary} />
              <Text style={{ color: COLORS.primary, fontWeight: "700", fontSize: 12 }}>{image ? "Cambiar foto" : "Elegir foto"}</Text>
            </Pressable>
            {image ? <Pressable onPress={() => setImage(null)} style={[styles.card, { alignItems: "center", justifyContent: "center", padding: 12 }]}><Text style={{ color: COLORS.red, fontWeight: "700", fontSize: 12 }}>Quitar</Text></Pressable> : null}
          </View>
          <Pressable onPress={create} disabled={creating} style={[styles.button, { opacity: creating ? 0.6 : 1 }]}>
            <Text style={styles.buttonText}>{creating ? "Creando pedido…" : "Crear pedido"}</Text>
          </Pressable>
        </ScrollView>
      </Modal>
      <Modal visible={scannerOpen} animationType="slide" onRequestClose={() => setScannerOpen(false)}>
        <View style={{ flex: 1, backgroundColor: "#101828", paddingTop: 48, paddingHorizontal: 18, paddingBottom: 24 }}>
          <View style={[styles.row, { marginBottom: 16 }]}>
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "800" }}>Escanear código</Text>
            <Pressable onPress={() => setScannerOpen(false)}><Ionicons name="close" size={26} color="#fff" /></Pressable>
          </View>
          {cameraPermission?.granted ? <View style={{ height: 320, overflow: "hidden", borderRadius: 18 }}>
            <CameraView
              style={{ flex: 1 }}
              active={scannerOpen}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128", "code39", "qr"] }}
              onBarcodeScanned={scanHandled ? undefined : ({ data }) => { setScanHandled(true); resolveLocalBarcode(data); }}
            />
            <View pointerEvents="none" style={{ position: "absolute", left: "9%", right: "9%", top: "34%", height: 100, borderWidth: 2, borderColor: COLORS.sky, borderRadius: 12 }} />
          </View> : <View style={{ height: 220, alignItems: "center", justifyContent: "center" }}><Text style={{ color: "#fff", textAlign: "center", marginBottom: 14 }}>Se necesita permiso para usar la cámara.</Text><Pressable onPress={openBarcodeScanner} style={styles.button}><Text style={styles.buttonText}>Permitir cámara</Text></Pressable></View>}
          <Text style={{ color: "#fff", fontWeight: "700", marginTop: 18, marginBottom: 8 }}>Prueba también escribiendo un código</Text>
          <TextInput value={barcode} onChangeText={setBarcode} placeholder="Ej. 2001234567894" placeholderTextColor="#AAB2C0" keyboardType="number-pad" style={[styles.input, { backgroundColor: "#fff" }]} />
          <Pressable onPress={() => resolveLocalBarcode(barcode)} style={[styles.button, { marginTop: 10 }]}><Text style={styles.buttonText}>Buscar en catálogo local</Text></Pressable>
          <Text style={{ color: "#B8C0CC", fontSize: 11, marginTop: 12, textAlign: "center" }}>Códigos de demostración: 2001234567894 · 2000000000015</Text>
        </View>
      </Modal>
      <Modal visible={detailOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setDetailOpen(false)}>
        <ScrollView style={{ flex: 1, backgroundColor: COLORS.background }} contentContainerStyle={{ padding: 20, paddingTop: 28, paddingBottom: 36 }}>
          <View style={[styles.row, { marginBottom: 18 }]}><Text style={{ fontSize: 22, fontWeight: "800", color: COLORS.text }}>Detalle del pedido</Text><Pressable onPress={() => setDetailOpen(false)}><Ionicons name="close" size={24} color={COLORS.text} /></Pressable></View>
          {detailLoading ? <ActivityIndicator color={COLORS.primary} /> : selectedOrder ? <>
            <View style={styles.card}>
              <View style={styles.row}><Text style={{ color: COLORS.primary, fontWeight: "800" }}>Pedido #{selectedOrder.id}</Text><Text style={{ color: selectedOrder.estado === "recibido" ? COLORS.primary : "#A36C16", fontWeight: "700", fontSize: 12 }}>{selectedOrder.estado}</Text></View>
              <DetailRow label="Proveedor" value={selectedOrder.nombre_proveedor || selectedOrder.nombre || "—"} />
              <DetailRow label="Fecha" value={selectedOrder.fecha ? new Date(selectedOrder.fecha).toLocaleString("es-CO") : "—"} />
            </View>
            <Text style={styles.section}>Producto</Text>
            {selectedOrder.imagen_url ? <Image source={{ uri: selectedOrder.imagen_url }} resizeMode="cover" style={{ height: 190, borderRadius: 18, marginBottom: 12 }} /> : null}
            <View style={styles.card}>
              <DetailRow label="Nombre" value={selectedOrder.nombre_producto || selectedOrder.nombre || "—"} />
              {selectedOrder.descripcion ? <DetailRow label="Descripción" value={selectedOrder.descripcion} /> : null}
              {selectedOrder.nombre_categoria ? <DetailRow label="Categoría" value={selectedOrder.nombre_categoria} /> : null}
              <DetailRow label="Precio unitario" value={money(selectedOrder.precio)} />
              <DetailRow label="Cantidad" value={`${selectedOrder.stock ?? 0} unidades`} />
              <DetailRow label="Subtotal" value={money((Number(selectedOrder.precio) || 0) * (Number(selectedOrder.stock) || 0))} />
              <View style={[styles.row, { borderTopWidth: 1, borderTopColor: COLORS.border, marginTop: 8, paddingTop: 13 }]}><Text style={{ color: COLORS.text, fontWeight: "800" }}>Total pedido</Text><Text style={{ color: COLORS.navy, fontWeight: "900", fontSize: 17 }}>{money(selectedOrder.total)}</Text></View>
            </View>
          </> : null}
        </ScrollView>
      </Modal>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 16, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: COLORS.border }}><Text style={{ color: COLORS.muted, fontSize: 12 }}>{label}</Text><Text style={{ color: COLORS.text, fontSize: 12, fontWeight: "700", flexShrink: 1, textAlign: "right" }}>{value}</Text></View>;
}
