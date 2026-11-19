type MockProduct = {
  id: number; nombre: string; descripcion: string; categoria_id: number;
  nombre_categoria: string; precio: number; stock: number; imagen_url: string | null;
};
type MockClient = { id: number; nombre: string; telefono: string; correo: string; direccion: string; saldo: number };
type MockSupplier = { id: number; nombre: string; empresa: string; telefono: string };
type MockSale = { id: number; fecha: string; cliente_id: number | null; cliente_nombre: string | null; total: number; saldo_restante: number; metodo_pago_id: number; metodo_pago_nombre: string; productos: any[] };

const date = (daysAgo = 0) => {
  const value = new Date();
  value.setDate(value.getDate() - daysAgo);
  return value.toISOString().slice(0, 19).replace("T", " ");
};

const categories = [
  { categoria_id: 1, nombre_categoria: "Paquetes", descripcion_categoria: "Snacks y productos empacados" },
  { categoria_id: 2, nombre_categoria: "Gaseosas", descripcion_categoria: "Bebidas gaseosas" },
  { categoria_id: 3, nombre_categoria: "Aseo", descripcion_categoria: "Productos para el hogar" },
  { categoria_id: 4, nombre_categoria: "Lácteos", descripcion_categoria: "Leche y derivados" },
];
const products: MockProduct[] = [
  { id: 1, nombre: "Papas Margarita Natural", descripcion: "Paquete personal", categoria_id: 1, nombre_categoria: "Paquetes", precio: 2200, stock: 24, imagen_url: null },
  { id: 2, nombre: "Gaseosa Colombiana 1.5L", descripcion: "Botella no retornable", categoria_id: 2, nombre_categoria: "Gaseosas", precio: 6500, stock: 15, imagen_url: null },
  { id: 3, nombre: "Arroz Diana 1kg", descripcion: "Arroz blanco", categoria_id: 1, nombre_categoria: "Paquetes", precio: 4800, stock: 18, imagen_url: null },
  { id: 4, nombre: "Detergente Fab 500g", descripcion: "Detergente en polvo", categoria_id: 3, nombre_categoria: "Aseo", precio: 7200, stock: 4, imagen_url: null },
  { id: 5, nombre: "Leche Entera 1L", descripcion: "Bolsa", categoria_id: 4, nombre_categoria: "Lácteos", precio: 3900, stock: 12, imagen_url: null },
  { id: 6, nombre: "Galletas Festival", descripcion: "Paquete de galletas", categoria_id: 1, nombre_categoria: "Paquetes", precio: 1800, stock: 0, imagen_url: null },
];
const clients: MockClient[] = [
  { id: 1, nombre: "Laura Gómez", telefono: "3001234567", correo: "laura@example.com", direccion: "Barrio Centro", saldo: 12500 },
  { id: 2, nombre: "Andrés Pérez", telefono: "3107654321", correo: "andres@example.com", direccion: "La Esperanza", saldo: 0 },
  { id: 3, nombre: "María Rodríguez", telefono: "3152223344", correo: "maria@example.com", direccion: "San José", saldo: 8300 },
];
const suppliers: MockSupplier[] = [
  { id: 1, nombre: "Distribuciones El Sol", empresa: "Camilo Torres", telefono: "6015551234" },
  { id: 2, nombre: "Bebidas del Valle", empresa: "Diana Ríos", telefono: "3004445566" },
];
const paymentMethods = ["", "Efectivo", "Nequi", "Bancolombia", "Crédito Cliente"];
let authenticated = true;
let nextProductId = 7;
let nextClientId = 4;
let nextSupplierId = 3;
let nextOrderId = 3;
let nextSaleId = 3;

const orders: any[] = [
  { id: 1, proveedor_id: 1, nombre_proveedor: suppliers[0].nombre, fecha: date(2), total: 84000, estado: "pendiente", nombre_producto: "Papas Margarita Natural", descripcion: "Paquete personal", nombre_categoria: "Paquetes", precio: 2100, stock: 40, imagen_url: null },
  { id: 2, proveedor_id: 2, nombre_proveedor: suppliers[1].nombre, fecha: date(0), total: 78000, estado: "recibido", nombre_producto: "Gaseosa Colombiana 1.5L", descripcion: "Botella no retornable", nombre_categoria: "Gaseosas", precio: 5200, stock: 15, imagen_url: null },
];
const sales: MockSale[] = [
  { id: 1, fecha: date(0), cliente_id: 2, cliente_nombre: clients[1].nombre, total: 11000, saldo_restante: 0, metodo_pago_id: 1, metodo_pago_nombre: "Efectivo", productos: [{ id: 1, producto_id: 1, producto_nombre: products[0].nombre, cantidad: 2, precio_unitario: 2200 }, { id: 2, producto_id: 3, producto_nombre: products[2].nombre, cantidad: 1, precio_unitario: 6600 }] },
  { id: 2, fecha: date(1), cliente_id: 1, cliente_nombre: clients[0].nombre, total: 13000, saldo_restante: 5000, metodo_pago_id: 4, metodo_pago_nombre: "Crédito Cliente", productos: [{ id: 3, producto_id: 2, producto_nombre: products[1].nombre, cantidad: 2, precio_unitario: 6500 }] },
];

function readBody(options: RequestInit) {
  if (typeof options.body === "string") {
    try { return JSON.parse(options.body); } catch { return {}; }
  }
  if (typeof FormData !== "undefined" && options.body instanceof FormData) {
    const result: Record<string, any> = {};
    options.body.forEach((value, key) => { if (typeof value === "string") result[key] = value; });
    return result;
  }
  return {};
}
function statsDashboard() {
  const monthSales = sales.reduce((total, sale) => total + sale.total, 0);
  const debt = clients.filter((client) => client.saldo > 0).length;
  const pendingOrders = orders.filter((order) => order.estado !== "recibido").length;
  const lowStock = products.filter((product) => product.stock <= 5).length;
  return { ventas: { valor: monthSales, variacion: 8 }, clientes_con_deuda: { valor: debt, variacion: 0 }, pedidos_pendientes: { valor: pendingOrders, variacion: 0 }, productos_bajo_stock: { valor: lowStock, variacion: 0 } };
}
function salesStats() {
  const today = new Date().toISOString().slice(0, 10);
  const todaySales = sales.filter((sale) => sale.fecha.slice(0, 10) === today);
  const methods = ["Efectivo", "Nequi", "Bancolombia", "Crédito Cliente"].map((name, index) => ({ metodo_pago: name, total: todaySales.filter((sale) => sale.metodo_pago_id === index + 1).reduce((sum, sale) => sum + sale.total, 0) }));
  return { ventasHoy: todaySales.reduce((sum, sale) => sum + sale.total, 0), transaccionesHoy: todaySales.length, metodosPago: methods, creditosPendientes: sales.reduce((sum, sale) => sum + sale.saldo_restante, 0) };
}
function productStats() {
  return { total_productos: products.length, bajo_stock: products.filter((item) => item.stock <= 5).length, agotados: products.filter((item) => item.stock === 0).length, valor_inventario: products.reduce((sum, item) => sum + item.stock * item.precio, 0) };
}
function orderStats() {
  const today = new Date().toISOString().slice(0, 10);
  const thisMonth = new Date().toISOString().slice(0, 7);
  return { pedidos_pendientes: orders.filter((order) => order.estado !== "recibido").length, entregados_hoy: orders.filter((order) => order.estado === "recibido" && order.fecha.slice(0, 10) === today).length, total_mes: orders.filter((order) => order.fecha.slice(0, 7) === thisMonth).reduce((sum, order) => sum + Number(order.total), 0) };
}

export async function mockApi(path: string, options: RequestInit = {}): Promise<any> {
  const method = (options.method || "GET").toUpperCase();
  const body = readBody(options);
  const route = path.split("?")[0].replace(/\/$/, "") || "/";
  let match: RegExpMatchArray | null;

  if (route === "/users/me") return authenticated ? { succes: true, user: { id: 1, nombre_completo: "Admin Demo", correo: "demo@minitienda.local" } } : Promise.reject(new Error("No autorizado"));
  if (route === "/users/login" && method === "POST") {
    if (!body.correo || !body.contrasena) throw new Error("Ingresa correo y contraseña para continuar.");
    authenticated = true;
    return { succes: true, user: { id: 1, nombre_completo: "Admin Demo", correo: body.correo } };
  }
  if (route === "/users/logout" && method === "POST") { authenticated = false; return { succes: true }; }

  if (route === "/products/stats-dash") return { stats: statsDashboard() };
  if (route === "/products/stats") return { stats: productStats() };
  if (route === "/products" && method === "GET") return { products: products.map((product) => ({ ...product })) };
  if ((match = route.match(/^\/products\/(\d+)$/))) {
    const id = Number(match[1]);
    const product = products.find((item) => item.id === id);
    if (!product) throw new Error("Producto no encontrado.");
    if (method === "GET") return { product: { ...product } };
    if (method === "PUT") { Object.assign(product, body, { categoria_id: Number(body.categoria_id), precio: Number(body.precio), stock: Number(body.stock) }); product.nombre_categoria = categories.find((item) => item.categoria_id === product.categoria_id)?.nombre_categoria || product.nombre_categoria; return { updatedProduct: { ...product } }; }
  }
  if ((match = route.match(/^\/products\/image\/(\d+)$/)) && method === "PUT") {
    const product = products.find((item) => item.id === Number(match![1]));
    if (!product) throw new Error("Producto no encontrado.");
    return { updatedProduct: { ...product } };
  }
  if (route === "/categories") return { categories: categories.map((item) => ({ ...item })) };

  if (route === "/clientes" && method === "GET") return { clientes: clients.map((client) => ({ ...client })) };
  if (route === "/clientes" && method === "POST") { const client = { id: nextClientId++, ...body, saldo: Number(body.saldo) || 0 }; clients.push(client); return { cliente: { ...client } }; }
  if ((match = route.match(/^\/clientes\/(\d+)$/))) {
    const index = clients.findIndex((client) => client.id === Number(match![1]));
    if (index < 0) throw new Error("Cliente no encontrado.");
    if (method === "PUT") { clients[index] = { ...clients[index], ...body, saldo: Number(body.saldo) || 0 }; return { cliente: { ...clients[index] } }; }
    if (method === "DELETE") { clients.splice(index, 1); return { msg: "Cliente eliminado" }; }
  }

  if (route === "/proveedores" && method === "GET") return { proveedores: suppliers.map((item) => ({ ...item })) };
  if (route === "/proveedores/estadisticas") {
    const month = new Date().toISOString().slice(0, 7);
    return {
      totalProveedores: suppliers.length,
      proveedoresActivos: new Set(orders.map((order) => order.proveedor_id)).size,
      totalPedidos: orders.length,
      pedidosMes: orders.filter((order) => order.fecha.slice(0, 7) === month).length,
    };
  }
  if ((match = route.match(/^\/proveedores\/(\d+)\/pedidos$/))) return { totalPedidos: orders.filter((order) => order.proveedor_id === Number(match![1])).length };
  if (route === "/proveedores" && method === "POST") { const supplier = { id: nextSupplierId++, ...body }; suppliers.push(supplier); return { proveedor: { ...supplier } }; }
  if ((match = route.match(/^\/proveedores\/(\d+)$/))) {
    const index = suppliers.findIndex((supplier) => supplier.id === Number(match![1]));
    if (index < 0) throw new Error("Proveedor no encontrado.");
    if (method === "PUT") { suppliers[index] = { ...suppliers[index], ...body }; return { proveedor: { ...suppliers[index] } }; }
    if (method === "DELETE") { suppliers.splice(index, 1); return { msg: "Proveedor eliminado" }; }
  }

  if (route === "/pedidos" && method === "GET") return { pedidos: orders.map((item) => ({ ...item })) };
  if (route === "/pedidos/stats") return { stats: orderStats() };
  if (route === "/pedidos" && method === "POST") {
    const category = categories.find((item) => item.categoria_id === Number(body.categoria_id));
    const supplier = suppliers.find((item) => item.id === Number(body.proveedor_id));
    if (!supplier || !body.nombre || !category) throw new Error("Completa proveedor, producto y categoría.");
    const product: MockProduct = { id: nextProductId++, nombre: body.nombre, descripcion: body.descripcion || "", categoria_id: category.categoria_id, nombre_categoria: category.nombre_categoria, precio: Number(body.precio) || 0, stock: Number(body.stock) || 0, imagen_url: null };
    products.push(product);
    const order = { id: nextOrderId++, proveedor_id: supplier.id, nombre_proveedor: supplier.nombre, fecha: date(), total: Number(body.total) || product.precio * product.stock, estado: "pendiente", nombre_producto: product.nombre, descripcion: product.descripcion, nombre_categoria: product.nombre_categoria, precio: product.precio, stock: product.stock, imagen_url: null };
    orders.unshift(order);
    return { success: true, newPedido: { ...order } };
  }
  if ((match = route.match(/^\/pedidos\/(\d+)$/))) { const order = orders.find((item) => item.id === Number(match![1])); if (!order) throw new Error("Pedido no encontrado."); return { pedido: { ...order } }; }
  if ((match = route.match(/^\/pedidos\/(\d+)\/status$/)) && method === "PUT") { const order = orders.find((item) => item.id === Number(match![1])); if (!order) throw new Error("Pedido no encontrado."); order.estado = body.estado; return { success: true }; }

  if (route === "/ventas" && method === "GET") return { ventas: sales.map(({ productos: _products, ...sale }) => ({ ...sale })) };
  if (route === "/ventas/estadisticas") return salesStats();
  if (route === "/ventas" && method === "POST") {
    const items = Array.isArray(body.productos) ? body.productos : [];
    if (!items.length) throw new Error("Agrega al menos un producto.");
    for (const item of items) { const product = products.find((entry) => entry.id === Number(item.producto_id)); if (!product || product.stock < Number(item.cantidad)) throw new Error(`Stock insuficiente para ${product?.nombre || "un producto"}.`); }
    const client = clients.find((item) => item.id === Number(body.cliente_id));
    const sale: MockSale = { id: nextSaleId++, fecha: date(), cliente_id: client?.id ?? null, cliente_nombre: client?.nombre ?? null, total: Number(body.total) || 0, saldo_restante: Number(body.saldo_restante) || 0, metodo_pago_id: Number(body.metodo_pago_id), metodo_pago_nombre: paymentMethods[Number(body.metodo_pago_id)] || "Efectivo", productos: [] };
    sale.productos = items.map((item: any, index: number) => { const product = products.find((entry) => entry.id === Number(item.producto_id))!; product.stock -= Number(item.cantidad); return { id: index + 1, producto_id: product.id, producto_nombre: product.nombre, cantidad: Number(item.cantidad), precio_unitario: Number(item.precio_unitario) }; });
    if (client && sale.saldo_restante > 0) client.saldo += sale.saldo_restante;
    sales.unshift(sale);
    return { msg: "Venta de demostración registrada", venta: { ...sale } };
  }
  if ((match = route.match(/^\/ventas\/(\d+)$/))) { const sale = sales.find((item) => item.id === Number(match![1])); if (!sale) throw new Error("Venta no encontrada."); return { venta: { ...sale, productos: sale.productos.map((item) => ({ ...item })) } }; }

  throw new Error(`Ruta no implementada en modo demo: ${method} ${route}`);
}
