import React, { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  Alert,
  LayoutAnimation,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Screen, styles } from "../components/Screen";
import { BouncePressable } from "../components/BouncePressable";
import { LoadingIndicator } from "../components/LoadingIndicator";
import { COLORS } from "../constants/theme";
import { api, money, unwrapList } from "../services/api";

type SaleProduct = {
  id: number;
  nombre: string;
  precio: number | string;
  stock: number | string;
  imagen_url?: string;
  codigo_barras?: string;
  codigoBarras?: string;
  barcode?: string;
  ean?: string;
  upc?: string;
};
type CartItem = {
  producto_id: number;
  nombre: string;
  precio_unitario: number;
  cantidad: number;
  stock: number;
};
const PAYMENT_METHODS = [
  { id: 1, nombre: "Efectivo" },
  { id: 2, nombre: "Nequi" },
  { id: 3, nombre: "Bancolombia" },
  { id: 4, nombre: "Crédito Cliente" },
];

export function SalesScreen() {
  const [sales, setSales] = useState<any[]>([]);
  const [products, setProducts] = useState<SaleProduct[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saleOpen, setSaleOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [saleDetailsLoading, setSaleDetailsLoading] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [clientId, setClientId] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [creditBalance, setCreditBalance] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [barcodeAssignOpen, setBarcodeAssignOpen] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [scannedCode, setScannedCode] = useState("");
  const [manualBarcode, setManualBarcode] = useState("");
  const [scanHandled, setScanHandled] = useState(false);
  const [barcodeAssignments, setBarcodeAssignments] = useState<
    Record<string, number>
  >({});
  const [assignmentSearch, setAssignmentSearch] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const [salesResponse, statsResponse, productsResponse, clientsResponse] =
        await Promise.all([
          api<any>("/ventas"),
          api<any>("/ventas/estadisticas"),
          api<any>("/products"),
          api<any>("/clientes"),
        ]);
      setSales(unwrapList(salesResponse, "ventas"));
      setStats(
        statsResponse?.estadisticas ?? statsResponse?.data ?? statsResponse,
      );
      setProducts(unwrapList<SaleProduct>(productsResponse, "products"));
      setClients(unwrapList(clientsResponse, "clientes"));
    } catch (e: any) {
      setError(e?.message || "No se pudieron cargar las ventas.");
    } finally {
      setLoading(false);
    }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const total = useMemo(
    () =>
      cart.reduce((sum, item) => sum + item.precio_unitario * item.cantidad, 0),
    [cart],
  );
  const creditMethod = paymentId === "4";
  const availableProducts = products.filter(
    (product) =>
      Number(product.stock) > 0 &&
      `${product.nombre}`.toLowerCase().includes(productSearch.toLowerCase()),
  );
  const paymentTotals: Record<string, number> = {};
  for (const item of stats?.metodosPago ?? [])
    paymentTotals[String(item.metodo_pago).toLowerCase()] =
      Number(item.total) || 0;
  const todaySales = Number(stats?.ventasHoy) || 0;
  const transferSales =
    (paymentTotals.nequi ?? 0) + (paymentTotals.bancolombia ?? 0);
  const summary = [
    [
      "Ventas hoy",
      money(todaySales),
      `${Number(stats?.transaccionesHoy) || 0} transacciones`,
    ],
    [
      "Efectivo",
      money(paymentTotals.efectivo),
      `${todaySales ? Math.round(((paymentTotals.efectivo || 0) / todaySales) * 100) : 0}% del total`,
    ],
    [
      "Transferencias",
      money(transferSales),
      `${todaySales ? Math.round((transferSales / todaySales) * 100) : 0}% del total`,
    ],
    ["Crédito pendiente", money(stats?.creditosPendientes), "Por cobrar"],
  ];

  const openSale = () => {
    setCart([]);
    setClientId("");
    setPaymentId("");
    setCreditBalance("");
    setProductSearch("");
    setSaleOpen(true);
  };
  const addProduct = (product: SaleProduct) => {
    if (Number(product.stock) <= 0) {
      Alert.alert(
        "Sin inventario",
        `${product.nombre} no tiene unidades disponibles.`,
      );
      return;
    }
    const found = cart.find((item) => item.producto_id === product.id);
    if (found && found.cantidad >= Number(product.stock)) {
      Alert.alert(
        "Stock insuficiente",
        `Solo hay ${product.stock} unidades de ${product.nombre}.`,
      );
      return;
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCart((current) =>
      found
        ? current.map((item) =>
            item.producto_id === product.id
              ? { ...item, cantidad: item.cantidad + 1 }
              : item,
          )
        : [
            ...current,
            {
              producto_id: product.id,
              nombre: product.nombre,
              precio_unitario: Number(product.precio),
              cantidad: 1,
              stock: Number(product.stock),
            },
          ],
    );
  };
  const openBarcodeScanner = async () => {
    setManualBarcode("");
    setScanHandled(false);
    if (!cameraPermission?.granted) {
      const permission = await requestCameraPermission();
      if (!permission.granted) {
        Alert.alert(
          "Permiso de cámara",
          "Permite usar la cámara para escanear productos.",
        );
        return;
      }
    }
    setScannerOpen(true);
  };
  const processBarcode = (rawCode: string) => {
    const code = rawCode.trim();
    if (!code) return;
    setScannedCode(code);
    setScannerOpen(false);
    const productId = barcodeAssignments[code];
    const product =
      products.find((item) =>
        [
          item.codigo_barras,
          item.codigoBarras,
          item.barcode,
          item.ean,
          item.upc,
        ].some((value) => value && String(value) === code),
      ) ?? products.find((item) => item.id === productId);
    if (product) {
      addProduct(product);
      return;
    }
    setAssignmentSearch("");
    setBarcodeAssignOpen(true);
  };
  const assignBarcodeToProduct = (product: SaleProduct) => {
    setBarcodeAssignments((current) => ({
      ...current,
      [scannedCode]: product.id,
    }));
    addProduct(product);
    setBarcodeAssignOpen(false);
  };
  const adjustQuantity = (productId: number, delta: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCart((current) =>
      current.flatMap((item) => {
        if (item.producto_id !== productId) return [item];
        const quantity = item.cantidad + delta;
        return quantity <= 0
          ? []
          : quantity > item.stock
            ? [item]
            : [{ ...item, cantidad: quantity }];
      }),
    );
  };

  const saveSale = async () => {
    if (!paymentId) {
      Alert.alert(
        "Método de pago requerido",
        "Selecciona cómo se recibió el pago.",
      );
      return;
    }
    if (!cart.length) {
      Alert.alert("Venta vacía", "Agrega al menos un producto.");
      return;
    }
    const remaining = creditMethod ? Number(creditBalance || total) : 0;
    if (creditMethod && !clientId) {
      Alert.alert(
        "Selecciona un cliente",
        "Las ventas a crédito deben asociarse a un cliente.",
      );
      return;
    }
    if (remaining < 0 || remaining > total) {
      Alert.alert(
        "Saldo inválido",
        "El saldo pendiente debe estar entre cero y el total de la venta.",
      );
      return;
    }
    setSaving(true);
    try {
      await api("/ventas", {
        method: "POST",
        body: JSON.stringify({
          cliente_id: clientId || null,
          total,
          saldo_restante: remaining,
          metodo_pago_id: Number(paymentId),
          productos: cart.map(({ producto_id, cantidad, precio_unitario }) => ({
            producto_id,
            cantidad,
            precio_unitario,
          })),
        }),
      });
      setSaleOpen(false);
      await load();
      Alert.alert(
        "Venta registrada",
        "La venta quedó guardada y el inventario fue actualizado.",
      );
    } catch (e: any) {
      Alert.alert(
        "No se pudo registrar la venta",
        e?.message || "Error al guardar la venta.",
      );
    } finally {
      setSaving(false);
    }
  };

  const openDetails = async (sale: any) => {
    setSelectedSale(sale);
    setDetailOpen(true);
    setSaleDetailsLoading(true);
    try {
      const response = await api<any>(`/ventas/${sale.id}`);
      setSelectedSale(response?.venta ?? response?.data?.venta ?? response);
    } catch (e: any) {
      setDetailOpen(false);
      Alert.alert(
        "No se pudieron cargar los detalles",
        e?.message || "Error de conexión.",
      );
    } finally {
      setSaleDetailsLoading(false);
    }
  };

  return (
    <>
      <Screen
        title="Ventas"
        subtitle="Registra ventas y consulta el historial."
        refreshing={loading}
        onRefresh={load}
      >
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 9,
            marginTop: 18,
          }}
        >
          {summary.map(([label, value, caption]) => (
            <View
              key={label}
              style={[styles.card, { width: "47%", flexGrow: 1, padding: 13 }]}
            >
              <Text style={{ color: COLORS.muted, fontSize: 11 }}>{label}</Text>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={{
                  color: COLORS.navy,
                  fontSize: 18,
                  fontWeight: "800",
                  marginTop: 5,
                }}
              >
                {value}
              </Text>
              <Text style={{ color: COLORS.muted, fontSize: 10, marginTop: 3 }}>
                {caption}
              </Text>
            </View>
          ))}
        </View>
        <BouncePressable
          onPress={openSale}
          style={[
            styles.button,
            { marginTop: 16, flexDirection: "row", gap: 8 },
          ]}
        >
          <Ionicons name="cart-outline" size={19} color="#fff" />
          <Text style={styles.buttonText}>Nueva venta</Text>
        </BouncePressable>
        <Text style={styles.section}>Historial de ventas</Text>
        {loading ? <LoadingIndicator color={COLORS.primary} /> : null}
        {error ? (
          <Text style={{ color: COLORS.red, marginBottom: 12 }}>{error}</Text>
        ) : null}
        {sales.map((sale) => {
          const paid = Number(sale.saldo_restante) === 0;
          return (
            <Pressable
              key={sale.id}
              onPress={() => openDetails(sale)}
              style={[styles.card, { marginBottom: 10, padding: 14 }]}
            >
              <View style={styles.row}>
                <Text
                  style={{
                    color: COLORS.primary,
                    fontWeight: "800",
                    fontSize: 13,
                  }}
                >
                  Venta #{sale.id}
                </Text>
                <Text
                  style={{
                    color: paid ? COLORS.primary : "#A36C16",
                    fontSize: 11,
                    fontWeight: "700",
                  }}
                >
                  {paid ? "Pagada" : "Pendiente"}
                </Text>
              </View>
              <View style={[styles.row, { marginTop: 8 }]}>
                <Text
                  style={{
                    color: COLORS.text,
                    fontSize: 13,
                    fontWeight: "700",
                  }}
                >
                  {sale.cliente_nombre || "Venta sin cliente"}
                </Text>
                <Text
                  style={{
                    color: COLORS.text,
                    fontSize: 14,
                    fontWeight: "800",
                  }}
                >
                  {money(sale.total)}
                </Text>
              </View>
              <View style={[styles.row, { marginTop: 5 }]}>
                <Text style={{ color: COLORS.muted, fontSize: 11 }}>
                  {sale.metodo_pago_nombre || "Método de pago"}
                </Text>
                <Text style={{ color: COLORS.muted, fontSize: 11 }}>
                  {sale.fecha
                    ? new Date(sale.fecha).toLocaleString("es-CO")
                    : "—"}
                </Text>
              </View>
            </Pressable>
          );
        })}
        {!loading && !sales.length && !error ? (
          <Text style={{ color: COLORS.muted }}>
            No hay ventas registradas.
          </Text>
        ) : null}
      </Screen>

      <Modal
        visible={saleOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSaleOpen(false)}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          style={{ flex: 1, backgroundColor: COLORS.background }}
          contentContainerStyle={{
            padding: 20,
            paddingTop: 28,
            paddingBottom: 36,
          }}
        >
          <View style={[styles.row, { marginBottom: 18 }]}>
            <Text
              style={{ color: COLORS.text, fontSize: 22, fontWeight: "800" }}
            >
              Nueva venta
            </Text>
            <Pressable onPress={() => setSaleOpen(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </Pressable>
          </View>
          <Text style={styles.section}>Cliente (opcional)</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 12 }}
          >
            <Choice
              label="Sin cliente"
              selected={!clientId}
              onPress={() => setClientId("")}
            />
            {clients.map((client) => (
              <Choice
                key={client.id}
                label={client.nombre}
                selected={clientId === String(client.id)}
                onPress={() => setClientId(String(client.id))}
              />
            ))}
          </ScrollView>
          <Text style={styles.section}>Método de pago</Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 12,
            }}
          >
            {PAYMENT_METHODS.map((method) => (
              <Choice
                key={method.id}
                label={method.nombre}
                selected={paymentId === String(method.id)}
                onPress={() => {
                  setPaymentId(String(method.id));
                  setCreditBalance("");
                }}
              />
            ))}
          </View>
          {creditMethod ? (
            <View style={{ marginBottom: 12 }}>
              <Text
                style={{ color: COLORS.muted, fontSize: 12, marginBottom: 6 }}
              >
                Saldo pendiente de crédito
              </Text>
              <TextInput
                value={creditBalance}
                onChangeText={setCreditBalance}
                keyboardType="decimal-pad"
                placeholder={`Máximo ${money(total)}`}
                placeholderTextColor={COLORS.muted}
                style={styles.input}
              />
            </View>
          ) : null}
          <Text style={styles.section}>Agregar productos</Text>
          <Pressable
            onPress={openBarcodeScanner}
            style={[
              styles.card,
              {
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: 11,
                marginBottom: 10,
                borderColor: COLORS.primary,
              },
            ]}
          >
            <Ionicons name="barcode-outline" size={20} color={COLORS.primary} />
            <Text
              style={{ color: COLORS.primary, fontWeight: "800", fontSize: 12 }}
            >
              Escanear código de barras
            </Text>
          </Pressable>
          {scannedCode ? (
            <Text
              style={{ color: COLORS.muted, fontSize: 10, marginBottom: 8 }}
            >
              Último código: {scannedCode} · asociación temporal en este
              dispositivo
            </Text>
          ) : null}
          <View
            style={[
              styles.card,
              {
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                padding: 10,
                marginBottom: 10,
              },
            ]}
          >
            <Ionicons name="search-outline" size={18} color={COLORS.muted} />
            <TextInput
              value={productSearch}
              onChangeText={setProductSearch}
              placeholder="Buscar producto"
              placeholderTextColor={COLORS.muted}
              style={{ flex: 1, color: COLORS.text }}
            />
          </View>
          <View style={{ maxHeight: 210 }}>
            <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
              {availableProducts.map((product) => (
                <BouncePressable
                  key={product.id}
                  onPress={() => addProduct(product)}
                  style={[
                    styles.card,
                    {
                      marginBottom: 7,
                      padding: 11,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: COLORS.text,
                        fontSize: 12,
                        fontWeight: "700",
                      }}
                    >
                      {product.nombre}
                    </Text>
                    <Text
                      style={{
                        color: COLORS.muted,
                        fontSize: 11,
                        marginTop: 3,
                      }}
                    >
                      {money(product.precio)} · Stock {product.stock}
                    </Text>
                  </View>
                  <Ionicons
                    name="add-circle"
                    size={24}
                    color={COLORS.primary}
                  />
                </BouncePressable>
              ))}
              {!availableProducts.length ? (
                <Text style={{ color: COLORS.muted, padding: 8 }}>
                  No hay productos disponibles para agregar.
                </Text>
              ) : null}
            </ScrollView>
          </View>
          <Text style={styles.section}>
            Productos de la venta ({cart.length})
          </Text>
          {cart.map((item) => (
            <View
              key={item.producto_id}
              style={[styles.card, { marginBottom: 8, padding: 12 }]}
            >
              <View style={styles.row}>
                <Text
                  style={{
                    flex: 1,
                    color: COLORS.text,
                    fontWeight: "700",
                    fontSize: 12,
                  }}
                >
                  {item.nombre}
                </Text>
                <Text
                  style={{
                    color: COLORS.navy,
                    fontWeight: "800",
                    fontSize: 12,
                  }}
                >
                  {money(item.precio_unitario * item.cantidad)}
                </Text>
              </View>
              <View style={[styles.row, { marginTop: 9 }]}>
                <Text style={{ color: COLORS.muted, fontSize: 11 }}>
                  {money(item.precio_unitario)} c/u · stock {item.stock}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 14,
                  }}
                >
                  <Pressable
                    onPress={() => adjustQuantity(item.producto_id, -1)}
                  >
                    <Ionicons
                      name="remove-circle-outline"
                      size={23}
                      color={COLORS.primary}
                    />
                  </Pressable>
                  <Text style={{ color: COLORS.text, fontWeight: "800" }}>
                    {item.cantidad}
                  </Text>
                  <Pressable
                    onPress={() => adjustQuantity(item.producto_id, 1)}
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={23}
                      color={COLORS.primary}
                    />
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
          <View style={[styles.card, { marginTop: 8, padding: 15 }]}>
            <View style={styles.row}>
              <Text
                style={{ color: COLORS.text, fontSize: 16, fontWeight: "800" }}
              >
                Total
              </Text>
              <Text
                style={{ color: COLORS.navy, fontSize: 20, fontWeight: "900" }}
              >
                {money(total)}
              </Text>
            </View>
            {creditMethod ? (
              <View style={[styles.row, { marginTop: 8 }]}>
                <Text style={{ color: COLORS.muted, fontSize: 12 }}>
                  Saldo del cliente
                </Text>
                <Text style={{ color: COLORS.red, fontWeight: "700" }}>
                  {money(creditBalance || total)}
                </Text>
              </View>
            ) : null}
          </View>
          <BouncePressable
            onPress={saveSale}
            disabled={saving}
            style={[
              styles.button,
              { marginTop: 14, opacity: saving ? 0.6 : 1 },
            ]}
          >
            <Text style={styles.buttonText}>
              {saving ? "Registrando venta…" : "Registrar venta"}
            </Text>
          </BouncePressable>
        </ScrollView>
      </Modal>

      <Modal
        visible={scannerOpen}
        animationType="slide"
        onRequestClose={() => setScannerOpen(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "#101828",
            paddingTop: 48,
            paddingHorizontal: 18,
            paddingBottom: 24,
          }}
        >
          <View style={[styles.row, { marginBottom: 16 }]}>
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "800" }}>
              Escanear producto
            </Text>
            <Pressable onPress={() => setScannerOpen(false)}>
              <Ionicons name="close" size={26} color="#fff" />
            </Pressable>
          </View>
          {cameraPermission?.granted ? (
            <View style={{ height: 330, overflow: "hidden", borderRadius: 18 }}>
              <CameraView
                style={{ flex: 1 }}
                active={scannerOpen}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: [
                    "ean13",
                    "ean8",
                    "upc_a",
                    "upc_e",
                    "code128",
                    "code39",
                    "qr",
                  ],
                }}
                onBarcodeScanned={
                  scanHandled
                    ? undefined
                    : ({ data }) => {
                        setScanHandled(true);
                        processBarcode(data);
                      }
                }
              />
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  left: "8%",
                  right: "8%",
                  top: "34%",
                  height: 100,
                  borderWidth: 2,
                  borderColor: COLORS.sky,
                  borderRadius: 12,
                }}
              />
            </View>
          ) : (
            <View
              style={{
                height: 220,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{ color: "#fff", textAlign: "center", marginBottom: 14 }}
              >
                Se necesita permiso de cámara.
              </Text>
              <Pressable onPress={openBarcodeScanner} style={styles.button}>
                <Text style={styles.buttonText}>Permitir cámara</Text>
              </Pressable>
            </View>
          )}
          <Text
            style={{
              color: "#fff",
              fontWeight: "700",
              marginTop: 18,
              marginBottom: 8,
            }}
          >
            Probar con código manual
          </Text>
          <TextInput
            value={manualBarcode}
            onChangeText={setManualBarcode}
            placeholder="Código de barras"
            placeholderTextColor="#AAB2C0"
            keyboardType="number-pad"
            style={[styles.input, { backgroundColor: "#fff" }]}
          />
          <Pressable
            onPress={() => processBarcode(manualBarcode)}
            style={[styles.button, { marginTop: 10 }]}
          >
            <Text style={styles.buttonText}>Buscar / asociar producto</Text>
          </Pressable>
          <Text
            style={{
              color: "#B8C0CC",
              fontSize: 11,
              marginTop: 12,
              textAlign: "center",
            }}
          >
            Si el código no está vinculado, podrás elegir el producto para esta
            prueba.
          </Text>
        </View>
      </Modal>

      <Modal
        visible={barcodeAssignOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setBarcodeAssignOpen(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: COLORS.background,
            padding: 20,
            paddingTop: 28,
          }}
        >
          <View style={[styles.row, { marginBottom: 8 }]}>
            <Text
              style={{
                color: COLORS.text,
                fontSize: 21,
                fontWeight: "800",
                flex: 1,
              }}
            >
              Vincular código
            </Text>
            <Pressable onPress={() => setBarcodeAssignOpen(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </Pressable>
          </View>
          <Text style={{ color: COLORS.muted, fontSize: 12, marginBottom: 14 }}>
            Código {scannedCode} no tiene producto asociado. Selecciona el
            producto correspondiente; la relación solo se guarda en memoria
            local.
          </Text>
          <View
            style={[
              styles.card,
              {
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                padding: 10,
                marginBottom: 12,
              },
            ]}
          >
            <Ionicons name="search-outline" size={18} color={COLORS.muted} />
            <TextInput
              value={assignmentSearch}
              onChangeText={setAssignmentSearch}
              placeholder="Buscar producto"
              placeholderTextColor={COLORS.muted}
              style={{ flex: 1, color: COLORS.text }}
            />
          </View>
          <ScrollView keyboardShouldPersistTaps="handled">
            {products
              .filter(
                (product) =>
                  Number(product.stock) > 0 &&
                  product.nombre
                    .toLowerCase()
                    .includes(assignmentSearch.toLowerCase()),
              )
              .map((product) => (
                <Pressable
                  key={product.id}
                  onPress={() => assignBarcodeToProduct(product)}
                  style={[
                    styles.card,
                    {
                      marginBottom: 8,
                      padding: 13,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: COLORS.text,
                        fontSize: 13,
                        fontWeight: "700",
                      }}
                    >
                      {product.nombre}
                    </Text>
                    <Text
                      style={{
                        color: COLORS.muted,
                        fontSize: 11,
                        marginTop: 4,
                      }}
                    >
                      {money(product.precio)} · Stock {product.stock}
                    </Text>
                  </View>
                  <Ionicons
                    name="link-outline"
                    size={20}
                    color={COLORS.primary}
                  />
                </Pressable>
              ))}
          </ScrollView>
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
          contentContainerStyle={{
            padding: 20,
            paddingTop: 28,
            paddingBottom: 36,
          }}
        >
          <View style={[styles.row, { marginBottom: 18 }]}>
            <Text
              style={{ color: COLORS.text, fontSize: 22, fontWeight: "800" }}
            >
              Detalle de venta
            </Text>
            <Pressable onPress={() => setDetailOpen(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </Pressable>
          </View>
          {saleDetailsLoading ? (
            <LoadingIndicator color={COLORS.primary} />
          ) : selectedSale ? (
            <>
              <View style={styles.card}>
                <SaleRow label="Venta" value={`#${selectedSale.id}`} />
                <SaleRow
                  label="Fecha"
                  value={
                    selectedSale.fecha
                      ? new Date(selectedSale.fecha).toLocaleString("es-CO")
                      : "—"
                  }
                />
                <SaleRow
                  label="Cliente"
                  value={selectedSale.cliente_nombre || "Sin cliente"}
                />
                <SaleRow
                  label="Teléfono"
                  value={selectedSale.cliente_telefono || "—"}
                />
                <SaleRow
                  label="Método de pago"
                  value={selectedSale.metodo_pago_nombre || "—"}
                />
                <SaleRow
                  label="Estado"
                  value={
                    Number(selectedSale.saldo_restante) > 0
                      ? "Pendiente"
                      : "Pagada"
                  }
                />
              </View>
              <Text style={styles.section}>Productos</Text>
              {(selectedSale.productos ?? []).map((item: any) => (
                <View
                  key={item.id ?? item.producto_id}
                  style={[styles.card, { marginBottom: 8, padding: 13 }]}
                >
                  <View style={styles.row}>
                    <Text
                      style={{ color: COLORS.text, fontWeight: "700", flex: 1 }}
                    >
                      {item.producto_nombre}
                    </Text>
                    <Text style={{ color: COLORS.text, fontWeight: "800" }}>
                      {money(
                        Number(item.precio_unitario) * Number(item.cantidad),
                      )}
                    </Text>
                  </View>
                  <Text
                    style={{ color: COLORS.muted, fontSize: 11, marginTop: 5 }}
                  >
                    {item.cantidad} × {money(item.precio_unitario)}
                  </Text>
                </View>
              ))}
              <View style={[styles.card, { marginTop: 8 }]}>
                <SaleRow label="Total" value={money(selectedSale.total)} />
                <SaleRow
                  label="Saldo pendiente"
                  value={money(selectedSale.saldo_restante)}
                />
              </View>
            </>
          ) : null}
        </ScrollView>
      </Modal>
    </>
  );
}

function Choice({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: selected ? COLORS.primary : "#E5EEF9",
        paddingHorizontal: 12,
        paddingVertical: 9,
        borderRadius: 12,
        marginRight: 7,
        marginBottom: 6,
      }}
    >
      <Text
        style={{
          color: selected ? "#fff" : COLORS.navy,
          fontSize: 11,
          fontWeight: "700",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
function SaleRow({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 14,
        paddingVertical: 9,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
      }}
    >
      <Text style={{ color: COLORS.muted, fontSize: 12 }}>{label}</Text>
      <Text
        style={{
          color: COLORS.text,
          fontSize: 12,
          fontWeight: "700",
          textAlign: "right",
          flexShrink: 1,
        }}
      >
        {value}
      </Text>
    </View>
  );
}
