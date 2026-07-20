"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  updateEmails,
  updateGeneral,
  updatePagos,
} from "@/app/admin/configuracion/actions";
import { Spinner } from "@/components/Spinner";

const inputLabel = "text-xs font-medium uppercase tracking-widest text-neutral-400";

function useSave() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function save(action: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success("Configuración guardada.");
        router.refresh();
      } else {
        toast.error(result.error ?? "No se pudo guardar.");
      }
    });
  }
  return { pending, save };
}

function SaveButton({ pending }: { pending: boolean }) {
  return (
    <button type="submit" disabled={pending} className="btn-solid">
      {pending ? <Spinner /> : null}
      {pending ? "Guardando..." : "Guardar cambios"}
    </button>
  );
}

// ── General ──────────────────────────────────────────────────

export function ConfigGeneralForm({
  initial,
}: {
  initial: { storeName: string; tagline: string; currency: string };
}) {
  const { pending, save } = useSave();

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        save(() =>
          updateGeneral({
            storeName: String(data.get("storeName") ?? ""),
            tagline: String(data.get("tagline") ?? ""),
            currency: String(data.get("currency") ?? "ARS"),
          })
        );
      }}
    >
      <div className="space-y-1.5">
        <label htmlFor="storeName" className={inputLabel}>
          Nombre de la tienda
        </label>
        <input
          id="storeName"
          name="storeName"
          required
          defaultValue={initial.storeName}
          className="field"
          placeholder="Tu marca"
        />
        <p className="text-xs text-neutral-500">
          Se usa en toda la tienda, los emails y el panel (white label real).
        </p>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="tagline" className={inputLabel}>
          Eslogan <span className="normal-case text-neutral-600">(opcional)</span>
        </label>
        <input
          id="tagline"
          name="tagline"
          defaultValue={initial.tagline}
          className="field"
          placeholder="Ej: Diseño local, envíos a todo el país"
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="currency" className={inputLabel}>
          Moneda (código ISO)
        </label>
        <input
          id="currency"
          name="currency"
          defaultValue={initial.currency}
          maxLength={3}
          className="field w-32 uppercase"
          placeholder="ARS"
        />
        <p className="text-xs text-neutral-500">
          Debe coincidir con la moneda de tu cuenta de Mercado Pago (ARS en
          Argentina).
        </p>
      </div>
      <SaveButton pending={pending} />
    </form>
  );
}

// ── Pagos ────────────────────────────────────────────────────

export function ConfigPagosForm({
  initial,
}: {
  initial: {
    mpPublicKey: string;
    mpAccessToken: string;
    transferAlias: string;
    transferCbu: string;
    transferHolder: string;
    transferEmail: string;
    transferNotes: string;
  };
}) {
  const { pending, save } = useSave();

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        save(() =>
          updatePagos({
            mpPublicKey: String(data.get("mpPublicKey") ?? ""),
            mpAccessToken: String(data.get("mpAccessToken") ?? ""),
            transferAlias: String(data.get("transferAlias") ?? ""),
            transferCbu: String(data.get("transferCbu") ?? ""),
            transferHolder: String(data.get("transferHolder") ?? ""),
            transferEmail: String(data.get("transferEmail") ?? ""),
            transferNotes: String(data.get("transferNotes") ?? ""),
          })
        );
      }}
    >
      <div>
        <h3 className="font-semibold">Mercado Pago</h3>
        <p className="mt-1 text-xs leading-relaxed text-neutral-500">
          Con las dos credenciales cargadas, el checkout con Mercado Pago se
          activa solo. La guía completa para conseguirlas está en{" "}
          <strong className="text-neutral-300">PASOS-EXTERNOS.md</strong> (raíz
          del proyecto).
        </p>
        <details className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-neutral-300">
          <summary className="cursor-pointer font-medium text-white">
            📖 Resumen: ¿de dónde saco las claves?
          </summary>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-neutral-400">
            <li>
              Entra a{" "}
              <span className="text-neutral-200">mercadopago.com.ar/developers</span>{" "}
              → “Tus integraciones”.
            </li>
            <li>Crea una aplicación (tipo “Pagos online”, CheckoutPro).</li>
            <li>
              En “Credenciales de producción” copia la{" "}
              <strong className="text-white">Public Key</strong> y el{" "}
              <strong className="text-white">Access Token</strong>.
            </li>
            <li>Pégalos acá y guarda. Listo.</li>
          </ol>
        </details>
        <div className="mt-4 grid gap-4">
          <div className="space-y-1.5">
            <label htmlFor="mpPublicKey" className={inputLabel}>
              Public Key
            </label>
            <input
              id="mpPublicKey"
              name="mpPublicKey"
              defaultValue={initial.mpPublicKey}
              className="field font-mono text-xs"
              placeholder="APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="mpAccessToken" className={inputLabel}>
              Access Token
            </label>
            <input
              id="mpAccessToken"
              name="mpAccessToken"
              type="password"
              defaultValue={initial.mpAccessToken}
              className="field font-mono text-xs"
              placeholder="APP_USR-0000000000000000-000000-..."
              autoComplete="off"
            />
            <p className="text-xs text-neutral-500">
              Se guarda en tu base de datos y nunca se muestra en la tienda.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 pt-6">
        <h3 className="font-semibold">Transferencia bancaria</h3>
        <p className="mt-1 text-xs leading-relaxed text-neutral-500">
          El cliente ve estos datos al elegir “Transferencia”, paga y envía el
          comprobante con su código de pedido al email que definas. Después lo
          validás en la pestaña Pedidos.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="transferAlias" className={inputLabel}>
              Alias
            </label>
            <input
              id="transferAlias"
              name="transferAlias"
              defaultValue={initial.transferAlias}
              className="field"
              placeholder="mi.tienda.mp"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="transferCbu" className={inputLabel}>
              CBU / CVU
            </label>
            <input
              id="transferCbu"
              name="transferCbu"
              defaultValue={initial.transferCbu}
              className="field"
              placeholder="0000000000000000000000"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="transferHolder" className={inputLabel}>
              Titular de la cuenta
            </label>
            <input
              id="transferHolder"
              name="transferHolder"
              defaultValue={initial.transferHolder}
              className="field"
              placeholder="Nombre Apellido"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="transferEmail" className={inputLabel}>
              Email para comprobantes
            </label>
            <input
              id="transferEmail"
              name="transferEmail"
              type="email"
              defaultValue={initial.transferEmail}
              className="field"
              placeholder="pagos@mitienda.com"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="transferNotes" className={inputLabel}>
              Nota adicional{" "}
              <span className="normal-case text-neutral-600">(opcional)</span>
            </label>
            <textarea
              id="transferNotes"
              name="transferNotes"
              rows={2}
              defaultValue={initial.transferNotes}
              className="field resize-none"
              placeholder="Ej: los pagos se acreditan en el día hábil siguiente."
            />
          </div>
        </div>
      </div>

      <SaveButton pending={pending} />
    </form>
  );
}

// ── Emails ───────────────────────────────────────────────────

export function ConfigEmailsForm({
  initial,
}: {
  initial: {
    smtpHost: string;
    smtpPort: string;
    smtpUser: string;
    smtpPass: string;
    emailFrom: string;
    adminNotifyEmail: string;
  };
}) {
  const { pending, save } = useSave();

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        save(() =>
          updateEmails({
            smtpHost: String(data.get("smtpHost") ?? ""),
            smtpPort: String(data.get("smtpPort") ?? ""),
            smtpUser: String(data.get("smtpUser") ?? ""),
            smtpPass: String(data.get("smtpPass") ?? ""),
            emailFrom: String(data.get("emailFrom") ?? ""),
            adminNotifyEmail: String(data.get("adminNotifyEmail") ?? ""),
          })
        );
      }}
    >
      <p className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs leading-relaxed text-neutral-400">
        Con SMTP configurado, la tienda envía automáticamente: confirmación de
        pedido, instrucciones de transferencia y confirmación de pago. Sin
        configurar, la tienda funciona igual (los emails se registran en los
        logs). La guía con ejemplos (Gmail, Resend, Brevo) está en{" "}
        <strong className="text-neutral-300">PASOS-EXTERNOS.md</strong>.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="smtpHost" className={inputLabel}>
            Servidor SMTP
          </label>
          <input
            id="smtpHost"
            name="smtpHost"
            defaultValue={initial.smtpHost}
            className="field"
            placeholder="smtp.gmail.com"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="smtpPort" className={inputLabel}>
            Puerto
          </label>
          <input
            id="smtpPort"
            name="smtpPort"
            defaultValue={initial.smtpPort}
            className="field"
            placeholder="587"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="smtpUser" className={inputLabel}>
            Usuario
          </label>
          <input
            id="smtpUser"
            name="smtpUser"
            defaultValue={initial.smtpUser}
            className="field"
            placeholder="tu@gmail.com"
            autoComplete="off"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="smtpPass" className={inputLabel}>
            Contraseña
          </label>
          <input
            id="smtpPass"
            name="smtpPass"
            type="password"
            defaultValue={initial.smtpPass}
            className="field"
            placeholder="Contraseña de aplicación"
            autoComplete="off"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="emailFrom" className={inputLabel}>
            Remitente (From)
          </label>
          <input
            id="emailFrom"
            name="emailFrom"
            defaultValue={initial.emailFrom}
            className="field"
            placeholder='"Mi Tienda" <hola@mitienda.com>'
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="adminNotifyEmail" className={inputLabel}>
            Avisos de nuevos pedidos a
          </label>
          <input
            id="adminNotifyEmail"
            name="adminNotifyEmail"
            type="email"
            defaultValue={initial.adminNotifyEmail}
            className="field"
            placeholder="tu@email.com"
          />
        </div>
      </div>
      <SaveButton pending={pending} />
    </form>
  );
}
