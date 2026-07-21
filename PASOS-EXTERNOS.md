# 🔑 Pasos externos — lo que tienes que conseguir tú

Todo lo demás ya está hecho. Este archivo lista **únicamente** las cosas que
requieren una acción tuya fuera de este repositorio (crear secretos, dar de
alta credenciales en otros sistemas, etc.).

> **TL;DR:** la app funciona sin nada de esto (`docker compose up --build` y
> listo). Estos pasos activan: **(1)** cobros con Mercado Pago, **(2)** datos
> de transferencia, **(3)** emails automáticos, **(4)** login con Google y
> **(5)** producción segura.
>
> 👉 Los puntos 1, 2 y 3 **no tocan archivos**: las claves se cargan desde el
> panel en **Admin → Configuración**, quedan en tu base de datos y se activan
> al instante.

---

## 1. Mercado Pago — las dos claves para cobrar (15 minutos)

Para procesar pagos, Mercado Pago te da **dos credenciales** que este sistema
necesita:

| Credencial | Para qué la usa la tienda |
|---|---|
| **Public Key** | Identifica tu cuenta en el checkout |
| **Access Token** | Crea las preferencias de pago y verifica los pagos contra la API (secreta) |

### 1.1 Crear la aplicación

1. Entra a <https://www.mercadopago.com.ar/developers> (o el dominio de tu
   país) e inicia sesión con **la cuenta que va a recibir el dinero**.
2. Arriba a la derecha → **“Tus integraciones”** → **“Crear aplicación”**.
3. Completa:
   - Nombre: el de tu tienda (ej. `Mi Tienda Online`).
   - ¿Qué producto vas a integrar?: **CheckoutPro** (pagos online).
   - Modelo de integración: tienda online / carrito propio.
4. Acepta y crea. Ya tienes tu aplicación.

### 1.2 Copiar las credenciales

1. Dentro de la aplicación, menú lateral → **“Credenciales de producción”**.
2. Puede pedirte completar datos del negocio (actividad, sitio). Complétalos.
3. Copia:
   - **Public Key** → empieza con `APP_USR-...`
   - **Access Token** → empieza con `APP_USR-...` (este es secreto: no lo
     compartas ni lo subas a Git).

> 💡 Para **probar sin dinero real**: usa las **“Credenciales de prueba”** de
> la misma pantalla, y paga con las tarjetas de prueba que lista la
> documentación de MP. Cuando todo funcione, cámbialas por las de producción.

### 1.3 Cargarlas en la tienda

1. Inicia sesión como admin → **Admin → Configuración → Pagos**.
2. Pega la Public Key y el Access Token → **Guardar cambios**.
3. Listo: la opción “Mercado Pago” aparece automáticamente en el checkout.

### 1.4 Webhook (solo cuando tengas dominio con HTTPS)

En local, la tienda verifica el pago cuando el cliente vuelve del checkout.
En producción, además, MP notifica por webhook — la app ya expone
`/api/webhooks/mercadopago` y lo registra sola en cada preferencia cuando
`AUTH_URL` es `https://...`. No tienes que configurar nada en el panel de MP,
aunque también puedes agregarlo manualmente en *Tus integraciones → Webhooks*:

```
https://tudominio.com/api/webhooks/mercadopago
```

---

## 2. Transferencia bancaria — tus datos (2 minutos)

No hay claves externas: solo carga tus datos en
**Admin → Configuración → Pagos → Transferencia bancaria**:

- **Alias** y/o **CBU/CVU** y titular de la cuenta.
- **Email para comprobantes**: la casilla donde quieres recibir los
  comprobantes. El sistema le indica al cliente que envíe ahí el comprobante
  junto con su **código de pedido** (ej. `WL-4F7K2Q`), con un botón de email
  pre-armado.

Cuando llegue un comprobante: **Admin → Pedidos → (pedido) → “Validar pago
recibido”**. El cliente recibe la confirmación por email automáticamente.

---

## 3. Emails automáticos — SMTP (10 minutos)

La tienda envía: confirmación de pedido, instrucciones de transferencia,
confirmación de pago y aviso de nuevos pedidos para ti. Para eso necesita una
cuenta SMTP. Configúrala en **Admin → Configuración → Emails**.

> Sin SMTP la tienda funciona igual: los emails se escriben en los logs del
> contenedor (`docker compose logs app`).

### Opción A — Gmail (rápida para empezar)

1. Activa la **verificación en 2 pasos** en tu cuenta de Google.
2. Ve a <https://myaccount.google.com/apppasswords> → crea una
   **contraseña de aplicación** (16 caracteres).
3. En la tienda:
   - Servidor: `smtp.gmail.com` · Puerto: `587`
   - Usuario: `tu@gmail.com` · Contraseña: la de aplicación
   - Remitente: `"Mi Tienda" <tu@gmail.com>`

### Opción B — Servicio transaccional (recomendada en producción)

[Resend](https://resend.com), [Brevo](https://www.brevo.com) o
[Mailgun](https://www.mailgun.com) tienen plan gratuito: crea la cuenta,
verifica tu dominio y usa el SMTP que te dan (en Resend: host
`smtp.resend.com`, puerto `465`, usuario `resend`, contraseña = API key).

---

## 4. `AUTH_SECRET` propio (2 minutos) — recomendado

Auth.js firma las sesiones con este secreto. Genera el tuyo:

```bash
openssl rand -base64 32
```

Ponlo en tu `.env` (`cp .env.example .env` si no existe) como `AUTH_SECRET`.
⚠️ En producción es **obligatorio** no usar el valor por defecto.

---

## 5. Google OAuth — login con Google (10 minutos, opcional)

Sin esto la app funciona igual (el botón de Google no se muestra).

1. <https://console.cloud.google.com/> → nuevo proyecto.
2. **APIs y servicios → Pantalla de consentimiento** → tipo **Externo** →
   completa nombre y emails → guarda. Si queda en modo “Prueba”, agrega tus
   emails en **Test users**.
3. **APIs y servicios → Credenciales → + Crear credenciales → ID de cliente
   OAuth** → **Aplicación web**:
   - Orígenes: `http://localhost:3000`
   - URI de redirección: `http://localhost:3000/api/auth/callback/google`
4. Copia el ID y el secreto a tu `.env`:

```env
AUTH_GOOGLE_ID=xxxxxxxx.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=GOCSPX-xxxxxxxx
```

5. `docker compose up -d --build` para aplicar.

---

## 6. Cambiar la contraseña del admin — antes de exponer la app

| Campo | Valor por defecto |
|---|---|
| Email | `soyadmin@admin.com` |
| Contraseña | `0987654321` |

En tu `.env`:

```env
ADMIN_EMAIL=soyadmin@admin.com
ADMIN_PASSWORD=una-contraseña-fuerte
```

y reinicia (`docker compose up -d`). El seed sincroniza el admin en cada
arranque.

---

## 7. Checklist para producción

- [ ] `AUTH_SECRET` propio (paso 4).
- [ ] `AUTH_URL=https://tudominio.com` en el `.env` del servidor (activa
      también el webhook automático de MP).
- [ ] Credenciales de **producción** de Mercado Pago (no las de prueba).
- [ ] SMTP configurado con un remitente de tu dominio (paso 3, opción B).
- [ ] En Google Cloud (si usas login con Google): agregar
      `https://tudominio.com` y su URI de callback; publicar la app.
- [ ] `POSTGRES_PASSWORD` fuerte y puerto 5432 sin exponer.
- [ ] `ADMIN_PASSWORD` fuerte (paso 6).
- [ ] HTTPS con Caddy, Nginx + certbot, Traefik o el proxy de tu hosting.
- [ ] Backup de la base de datos (las imágenes también viven ahí, así que
      con respaldar PostgreSQL está todo).

---

## 8. Deploy en Render (para probar en la nube, gratis)

El repo ya incluye [`render.yaml`](./render.yaml): Render crea la app
(Docker) y el PostgreSQL solos.

1. Entra a <https://dashboard.render.com> → **New → Blueprint**.
2. Conecta este repositorio de GitHub y elige la rama.
3. **Apply**: se crean `repovacio-app` y `repovacio-db`. El primer build
   tarda varios minutos (compila la imagen Docker completa).
4. Listo: tu tienda queda en `https://repovacio-app.onrender.com` (el
   nombre exacto lo muestra Render). No hay que configurar nada más:
   - `AUTH_SECRET` se genera solo.
   - `AUTH_URL` se toma automáticamente de la URL pública de Render.
   - Las imágenes se guardan en la base de datos (el free tier no tiene
     disco persistente, y así no se pierden en cada deploy).
5. Si activas Google OAuth o Mercado Pago, usa esa URL de Render en los
   callbacks (`https://TU-APP.onrender.com/api/auth/callback/google`) —
   el webhook de MP se registra solo al ser https.

**Limitaciones del free tier (para tener en cuenta):**
- La app se duerme tras ~15 min sin visitas; el primer request luego
  tarda ~1 minuto en despertarla.
- El PostgreSQL gratuito **expira a los 30 días** (Render avisa por
  email; podés crear otro o pasar a un plan pago para producción).
- 512 MB de RAM: suficiente para probar, justo para fotos gigantes.

---

## 9. Nada más

Catálogo, categorías, variantes, stock, imágenes, pedidos y validación de
transferencias funcionan 100 % dentro de la app, sin servicios externos.
