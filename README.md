# Mini Tienda Mobile

Aplicación móvil para el panel administrativo de Mini-Tienda, construida con Expo, React Native y TypeScript. Incluye un modo demo local para presentar y probar la app sin conexión a un servidor.

## Requisitos

- Node.js compatible con Expo SDK 58.
- pnpm.
- Expo Go en el teléfono, o emulador Android.
- Para el modo demo no hace falta backend.

## Modo demo sin servidor

Demo mode está activado por defecto. La app inicia con un usuario de demostración y datos ficticios de productos, ventas, pedidos, clientes y proveedores. Las operaciones de crear, editar, eliminar, cobrar y recibir pedido se simulan localmente durante la ejecución.

Los cambios del modo demo viven en memoria y se restablecen al cerrar o recargar la app. El modo demo no envía peticiones a la API.

Para compilar el APK en modo demo, no necesitas configurar `.env`. Opcionalmente, copia `.env.example` a `.env`.

## Conectar un backend

Solo para usar la API, configura `.env`:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.20:4000/api
EXPO_PUBLIC_DEMO_MODE=false
```

Reemplaza `192.168.1.20` con la dirección IPv4 local del computador que corre backend. Teléfono y computador deben estar en la misma red.

Direcciones usuales:

- Teléfono físico con Expo Go: `http://<IP-LAN-DEL-COMPUTADOR>:4000/api`.
- Emulador Android: `http://10.0.2.2:4000/api`.
- Simulador iOS: `http://localhost:4000/api`.

No uses `localhost` para teléfono físico: apunta al mismo teléfono. No subas `.env` al repositorio.

El backend debe escuchar en puerto `4000` y el Firewall de Windows debe permitir conexiones entrantes en red privada.

## Instalar y ejecutar

Desde esta carpeta:

```bash
pnpm install
pnpm start
```

Escanea el QR que muestra Expo con Expo Go. Para limpiar caché y recargar variables `.env`:

```bash
pnpm start -- --clear
```

También puedes iniciar directamente el emulador Android:

```bash
pnpm android
```

Al cambiar variables `.env`, reinicia Expo con `pnpm start -- --clear`.

## Funcionalidad actual

- Inicio: indicadores del negocio.
- Ventas: carrito, stock, métodos de pago, crédito, resumen, historial y detalle.
- Pedidos: historial, detalle, crear pedido, escáner local y marcar como recibido.
- Productos: listado, búsqueda, edición de información, selector de categoría e imagen desde galería.
- Clientes: listado, búsqueda, creación, edición, eliminación y gestión de saldos (cobrar/fiar).
- Proveedores: listado, estadísticas, búsqueda, creación, edición y eliminación.

En modo demo los cambios son temporales y se reinician al recargar. Para que queden guardados entre sesiones o dispositivos, conecta la API configurando `EXPO_PUBLIC_DEMO_MODE=false`.

## Estructura

```text
App.tsx                 Navegación inferior y tema
app/
  components/           Componentes compartidos
  constants/            Colores y tema visual
  screens/              Pantallas por módulo
  services/api.ts       Selección entre demo local y API
  services/mockApi.ts   Datos y operaciones simuladas en memoria
```

## Comandos

```bash
pnpm start       # Servidor Expo
pnpm android     # Abrir en emulador Android
pnpm typecheck   # Revisar tipos TypeScript
```
