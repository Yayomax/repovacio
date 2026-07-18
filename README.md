# ⬛ White Label — Portal de acceso premium

Base **white-label** de autenticación y gestión de usuarios, pensada para ser
el punto de partida de tus próximos proyectos. Diseño minimalista en blanco y
negro con animaciones, lista para ponerle tu marca.

## ✨ Qué incluye

- 🐳 **Docker Compose**: app + PostgreSQL con un solo comando.
- 🔐 **Autenticación completa** con [Auth.js](https://authjs.dev):
  - Email y contraseña (registro abierto a cualquier persona).
  - **Google OAuth** (se activa solo al configurar las credenciales).
  - Sesiones JWT seguras y middleware que protege las rutas.
- 👥 **Gestión de usuarios**: panel de administración con estadísticas,
  cambio de roles (admin/usuario) y eliminación de cuentas.
- 🌱 **Seed automático** del usuario administrador en cada arranque.
- 🎨 **Diseño premium blanco y negro**: fondo animado con orbes y rejilla,
  grano sutil, micro-interacciones y transiciones en toda la interfaz.
- 🏷️ **White label real**: cambia `APP_NAME` en el `.env` y toda la app se
  renombra sola.

## 🚀 Arrancar en 30 segundos

```bash
docker compose up --build
```

Abre <http://localhost:3000>. Eso es todo: se crea la base de datos, se
aplica el esquema y se siembra el usuario administrador.

### Credenciales del administrador (por defecto)

| Email | Contraseña |
|---|---|
| `soyadmin@admin.com` | `0987654321` |

Cualquier otra persona puede crear su cuenta desde **/register**.

> 🔑 **¿Login con Google?** Necesitas crear credenciales OAuth (10 min).
> Los pasos exactos están en [`PASOS-EXTERNOS.md`](./PASOS-EXTERNOS.md).

## 🗺️ Rutas

| Ruta | Descripción | Acceso |
|---|---|---|
| `/` | Landing con animaciones | Pública |
| `/login` | Iniciar sesión (email/contraseña + Google) | Pública |
| `/register` | Crear cuenta | Pública |
| `/welcome` | Bienvenida con datos de la cuenta, volver y salir | Con sesión |
| `/admin` | Gestión de usuarios (roles, eliminación, stats) | Solo admin |

## 🧱 Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 |
| Autenticación | Auth.js v5 (NextAuth) + adaptador Prisma |
| Base de datos | PostgreSQL 16 + Prisma ORM |
| Estilos | Tailwind CSS (animaciones CSS puras) |
| Infraestructura | Docker + Docker Compose |

## 📁 Estructura

```
├── docker-compose.yml        # Orquestación: app + PostgreSQL
├── Dockerfile                # Build multi-stage de la app
├── docker/entrypoint.sh      # Migra el esquema + seed + arranca Next
├── prisma/
│   ├── schema.prisma         # Modelos: User (con rol), Account, Session...
│   └── seed.js               # Crea/actualiza el usuario admin
├── src/
│   ├── auth.ts               # Auth.js: credenciales + Google + Prisma
│   ├── auth.config.ts        # Config edge-safe (middleware) + callbacks
│   ├── middleware.ts         # Protección de rutas
│   ├── app/                  # Páginas: /, /login, /register, /welcome, /admin
│   ├── components/           # UI reutilizable (formularios, tabla, fondo...)
│   └── lib/                  # Prisma client, validaciones (zod), marca
├── .env.example              # Todas las variables documentadas
└── PASOS-EXTERNOS.md         # Lo único que tienes que hacer tú fuera del repo
```

## ⚙️ Configuración

Todo funciona sin `.env` (hay valores por defecto para desarrollo). Para
personalizar:

```bash
cp .env.example .env
```

Variables principales: `APP_NAME` (tu marca), `ADMIN_EMAIL` /
`ADMIN_PASSWORD` (admin sembrado), `AUTH_SECRET` (firma de sesiones),
`AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` (login con Google). Ver
[`.env.example`](./.env.example) y [`PASOS-EXTERNOS.md`](./PASOS-EXTERNOS.md).

## 💻 Desarrollo local (sin dockerizar la app)

```bash
# 1. Levanta solo la base de datos (descomenta "ports" del servicio db)
docker compose up -d db

# 2. Instala dependencias y prepara la base
npm install
cp .env.example .env       # DATABASE_URL ya apunta a localhost:5432
npm run db:push
npm run db:seed

# 3. Modo desarrollo con hot-reload
npm run dev
```

Scripts útiles: `npm run db:studio` (explorador visual de la base),
`npm run build` / `npm start` (producción sin Docker).

## 🔒 Notas de seguridad

- Las contraseñas se guardan con **bcrypt** (12 rounds); nunca en texto plano.
- Un administrador **no puede** eliminarse ni quitarse el rol a sí mismo.
- Las rutas protegidas se validan en el middleware **y** en cada página/acción.
- Antes de exponer la app a internet, revisa el checklist de producción en
  [`PASOS-EXTERNOS.md`](./PASOS-EXTERNOS.md).
