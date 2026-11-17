# Mini Tienda Mobile

Aplicación móvil para el panel administrativo de Mini-Tienda, construida con Expo, React Native y TypeScript. Consume la API del backend existente. La autenticación se incorporará en una etapa posterior.

## Requisitos

- Node.js compatible con Expo SDK 58.
- pnpm.
- Expo Go en el teléfono, o emulador Android.
- Backend Mini-Tienda iniciado y accesible desde el dispositivo.

## Preparar API

Crea `.env` en la raíz del proyecto y configura URL del backend:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.20:4000/api
```

Reemplaza `192.168.1.20` con la dirección IPv4 local del computador que corre backend. Teléfono y computador deben estar en la misma red.

Direcciones usuales:

- Teléfono físico con Expo Go: `http://<IP-LAN-DEL-COMPUTADOR>:4000/api`.
- Emulador Android: `http://10.0.2.2:4000/api`.
- Simulador iOS: `http://localhost:4000/api`.

No uses `localhost` para teléfono físico: apunta al mismo teléfono. No subas `.env` al repositorio.

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

El backend debe escuchar en puerto `4000` y el Firewall de Windows debe permitir conexiones entrantes en red privada. Prueba primero la URL base desde el navegador del teléfono.

## Funcionalidad actual

- Inicio: indicadores del negocio.
- Pedidos: historial, detalle, crear pedido y marcar como recibido.
- Productos: listado, búsqueda y edición de información.
- Clientes: listado, búsqueda, creación, edición, eliminación y gestión de saldos (cobrar/fiar).
- Proveedores: listado, estadísticas, creación, edición y eliminación.

Datos y operaciones vienen de la API; no se incluyen datos demo de respaldo. El módulo de ventas no está implementado en la app ni tiene flujo funcional en el frontend web actual. La subida de imágenes y autenticación móvil quedan pendientes.

## Estructura

```text
App.tsx                 Navegación inferior y tema
app/
  components/           Componentes compartidos
  constants/            Colores y tema visual
  screens/              Pantallas por módulo
  services/api.ts       Cliente HTTP y formateo común
```

## Comandos

```bash
pnpm start       # Servidor Expo
pnpm android     # Abrir en emulador Android
pnpm typecheck   # Revisar tipos TypeScript
```
