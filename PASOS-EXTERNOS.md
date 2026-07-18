# 🔑 Pasos externos — lo que tienes que conseguir tú

Todo lo demás ya está hecho. Este archivo lista **únicamente** las cosas que
requieren una acción tuya fuera de este repositorio (crear secretos, dar de
alta credenciales en otros sistemas, etc.).

> **TL;DR:** la app funciona sin hacer nada de esto (`docker compose up --build`
> y listo). Solo necesitas estos pasos para: **(1)** habilitar el botón
> "Continuar con Google" y **(2)** dejarla lista para producción.

---

## 1. Generar tu `AUTH_SECRET` (2 minutos) — recomendado

Auth.js firma las sesiones (JWT) con este secreto. En desarrollo hay un valor
por defecto, pero genera el tuyo:

```bash
openssl rand -base64 32
```

(Si no tienes `openssl`, también sirve: `npx auth secret` o cualquier cadena
aleatoria larga.)

Luego crea tu `.env` (si aún no existe) y pégalo:

```bash
cp .env.example .env
# edita .env y reemplaza AUTH_SECRET con el valor generado
```

⚠️ En producción es **obligatorio**: nunca uses el valor por defecto.

---

## 2. Credenciales de Google OAuth (10 minutos) — para el login con Google

Sin estas credenciales la app funciona igual, solo que **el botón de Google no
se muestra**. Para habilitarlo:

### 2.1 Crear el proyecto en Google Cloud

1. Entra a <https://console.cloud.google.com/> con tu cuenta de Google.
2. Arriba a la izquierda: selector de proyectos → **"Nuevo proyecto"**.
3. Ponle un nombre (ej. `mi-portal`) → **Crear** → selecciónalo.

### 2.2 Configurar la pantalla de consentimiento

1. Menú ☰ → **APIs y servicios → Pantalla de consentimiento de OAuth**
   (Google lo llama ahora "Google Auth Platform / Branding").
2. Tipo de usuario: **Externo** → **Crear**.
3. Completa lo mínimo:
   - Nombre de la app: el que quieras (ej. `White Label`).
   - Email de asistencia: tu email.
   - Datos de contacto del desarrollador: tu email.
4. Guarda. No necesitas agregar scopes extra (email y perfil vienen por defecto).
5. Si la app queda en modo **"Prueba" (Testing)**: agrega en **Test users** los
   emails de Google con los que vas a probar (por ejemplo el tuyo,
   `yayomolina2004@gmail.com`). Solo esos podrán loguearse hasta que publiques
   la app ("Publish app" → producción).

### 2.3 Crear el cliente OAuth

1. Menú ☰ → **APIs y servicios → Credenciales**.
2. **+ Crear credenciales → ID de cliente de OAuth**.
3. Tipo de aplicación: **Aplicación web**.
4. Nombre: el que quieras.
5. **Orígenes de JavaScript autorizados**:
   ```
   http://localhost:3000
   ```
6. **URIs de redireccionamiento autorizados** (este es el importante):
   ```
   http://localhost:3000/api/auth/callback/google
   ```
7. **Crear** → Google te muestra el **ID de cliente** y el **Secreto de cliente**.
   Cópialos ahora (el secreto se puede volver a ver en la lista de credenciales).

### 2.4 Ponerlos en el proyecto

En tu `.env` (junto al `docker-compose.yml`):

```env
AUTH_GOOGLE_ID=xxxxxxxxxxxx.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=GOCSPX-xxxxxxxxxxxxxxxx
```

Reinicia los contenedores para que tomen los valores:

```bash
docker compose up -d --build
```

Listo: el botón **"Continuar con Google"** aparece solo en login y registro.

---

## 3. Cambiar la contraseña del admin — antes de exponer la app

El usuario administrador se crea automáticamente en cada arranque:

| Campo | Valor por defecto |
|---|---|
| Email | `soyadmin@admin.com` |
| Contraseña | `0987654321` |

Para cambiarla, edita en tu `.env`:

```env
ADMIN_EMAIL=soyadmin@admin.com
ADMIN_PASSWORD=una-contraseña-fuerte
```

y reinicia (`docker compose up -d`). El seed sincroniza la contraseña del
admin con ese valor en cada arranque.

---

## 4. Checklist para producción (cuando llegue el día)

- [ ] `AUTH_SECRET` propio y secreto (paso 1).
- [ ] `AUTH_URL=https://tudominio.com` en el `.env` del servidor.
- [ ] En Google Cloud, agregar el dominio real:
  - Origen: `https://tudominio.com`
  - Redirect: `https://tudominio.com/api/auth/callback/google`
  - Publicar la app (salir del modo "Prueba").
- [ ] `POSTGRES_PASSWORD` fuerte (y no exponer el puerto 5432 públicamente).
- [ ] `ADMIN_PASSWORD` fuerte (paso 3).
- [ ] Servir detrás de HTTPS (Caddy, Nginx + certbot, Traefik o el proxy de tu hosting).

---

## 5. Nada más

No se necesita ningún otro secreto ni servicio externo: la base de datos, las
migraciones, el seed del admin y el registro de usuarios son 100 % locales y
automáticos.
