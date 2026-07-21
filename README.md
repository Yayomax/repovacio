# ⬛ White Label Shop — Ecommerce premium en blanco y negro

Ecommerce **white-label** completo y listo para cualquier rubro: catálogo con
categorías definidas por el admin, variantes con stock por combinación,
Mercado Pago + transferencia bancaria, emails automáticos y un panel de
administración pensado para el trabajo diario.

> 🧬 ¿Solo necesitas login + gestión de usuarios para otro proyecto? La base
> sin ecommerce vive en la rama [`plantilla-gestion-usuarios`](../../tree/plantilla-gestion-usuarios).

## 🚀 Arrancar en 30 segundos

```bash
docker compose up --build
```

Abre <http://localhost:3000>. Se crea la base, se aplica el esquema y se
siembra el administrador:

| Email | Contraseña |
|---|---|
| `soyadmin@admin.com` | `0987654321` |

Entra con ese usuario → **Panel admin** → carga tu primer producto. Las
claves de pago y el SMTP se cargan después desde **Admin → Configuración**
(guía completa en [`PASOS-EXTERNOS.md`](./PASOS-EXTERNOS.md)).

## ✨ Qué incluye

### Tienda (clientes)
- 🏪 Portada con destacados y categorías, catálogo con búsqueda y filtros.
- 🧩 Página de producto con galería, selector de variantes (talle, color, lo
  que definas) y stock en vivo por combinación.
- 🛒 Carrito con drawer animado + página completa, persistente en el navegador.
- 💳 Checkout con **Mercado Pago** (Checkout Pro) y **transferencia bancaria**
  con instrucciones paso a paso, código de pedido y botón de email pre-armado.
- 🚚 Opciones de envío definidas por el admin (la logística la coordinas tú).
- 📦 Página de seguimiento del pedido + “Mis pedidos” para cada cliente.
- 🔐 Registro abierto, login con email/contraseña y Google (opcional).

### Panel de administración
- 📊 **Inicio**: ventas confirmadas, transferencias por validar, stock bajo,
  últimos pedidos.
- 🧾 **Pedidos** (tarea diaria): filtros por estado, detalle completo,
  **validar pagos por transferencia**, marcar entregado, cancelar con
  reposición automática de stock.
- 📦 **Productos** (tarea diaria): editor todo-en-uno con subida de imágenes
  (guardadas en la base de datos, no URLs externas) que acepta cualquier
  formato típico —
  JPG/JPEG, PNG, **HEIC/HEIF del iPhone**, WebP, AVIF, GIF, TIFF, BMP — y las
  **convierte automáticamente a WebP optimizado** (rotación EXIF corregida,
  máx. 1600px), categorías creadas al vuelo, opciones (hasta 3:
  talle/color/lo que sea) y matriz de stock + precio + SKU por combinación.
- 👥 **Usuarios**: roles y gestión de cuentas (heredado de la plantilla).
- ⚙ **Configuración** (una sola vez, separada por clasificaciones):
  General · Pagos (MP + transferencia) · Envíos · Emails (SMTP) · Catálogo.

### Automático
- ✉ Emails de confirmación de pedido, instrucciones de transferencia,
  confirmación de pago y aviso al admin (SMTP configurable; sin SMTP se
  registran en logs).
- 🔔 Webhook de Mercado Pago + verificación del pago al volver del checkout
  (nunca se confía en el cliente: siempre se consulta la API de MP).
- 📉 Reserva de stock atómica al crear el pedido (sin sobreventa) y
  devolución al cancelar.

## 🧱 Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 |
| Autenticación | Auth.js v5 + adaptador Prisma (JWT) |
| Base de datos | PostgreSQL 16 + Prisma ORM |
| Pagos | Mercado Pago Checkout Pro (API REST) |
| Emails | Nodemailer (SMTP configurable desde el panel) |
| Estilos | Tailwind CSS + animaciones CSS (estándares de animations.dev) |
| Infraestructura | Docker + Docker Compose · deploy 1-click en Render (`render.yaml`) |

## 🗺️ Rutas principales

| Ruta | Descripción | Acceso |
|---|---|---|
| `/` | Portada de la tienda | Pública |
| `/catalogo` · `/producto/[slug]` | Catálogo y detalle | Pública |
| `/carrito` · `/checkout` | Compra (checkout requiere sesión) | Pública / Sesión |
| `/pedido/[código]` | Seguimiento + instrucciones de pago | Pública |
| `/mis-pedidos` · `/welcome` | Área del cliente | Sesión |
| `/admin/...` | Panel completo | Solo admin |
| `/api/webhooks/mercadopago` | Notificaciones de pago | MP |

## 📁 Estructura

```
├── docker-compose.yml            # app + PostgreSQL (volumen pgdata)
├── Dockerfile                    # build multi-stage
├── render.yaml                   # deploy 1-click en Render (app + Postgres)
├── docker/entrypoint.sh          # esquema + seed + arranque
├── prisma/schema.prisma          # User, Product, Variant, Order, UploadedImage...
├── PASOS-EXTERNOS.md             # 🔑 claves de MP, SMTP, Google, Render, producción
└── src/
    ├── app/(store)/              # tienda: portada, catálogo, producto, carrito,
    │                             # checkout, pedido/[code], mis-pedidos
    ├── app/admin/                # panel: dashboard, pedidos, productos,
    │                             # usuarios, configuracion (+ server actions)
    ├── app/api/                  # auth, registro, uploads, webhook MP, health
    ├── app/uploads/[...path]/    # sirve las imágenes desde la base de datos
    ├── components/store|admin/   # UI de tienda y panel
    └── lib/                      # prisma, config, dinero, mailer, MP, uploads...
```

## ⚙️ Configuración

Todo lo del negocio (marca, pagos, envíos, emails, categorías) se administra
**desde el panel**, sin tocar código. Las variables de entorno
([`.env.example`](./.env.example)) cubren infraestructura: base de datos,
`AUTH_SECRET`, Google OAuth y el admin sembrado.

## 💻 Desarrollo local (sin dockerizar la app)

```bash
docker compose up -d db      # solo la base (descomenta "ports" del servicio db)
npm install
cp .env.example .env
npm run db:push && npm run db:seed
npm run dev
```

## 🔒 Notas de seguridad

- Contraseñas con bcrypt; sesiones JWT firmadas; rutas protegidas por
  middleware **y** verificación en cada página/acción.
- Los precios y el stock siempre se validan en el servidor: el carrito del
  cliente nunca define cuánto se cobra.
- Los pagos de MP se verifican contra la API con tu Access Token (webhook y
  retorno). Las imágenes subidas se validan por tipo y tamaño, con nombres
  UUID y protección contra path traversal.
- Antes de salir a producción: checklist en [`PASOS-EXTERNOS.md`](./PASOS-EXTERNOS.md).
