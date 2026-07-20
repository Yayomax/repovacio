import nodemailer from "nodemailer";
import type { StoreConfig } from "@prisma/client";
import { smtpConfigured } from "@/lib/store-config";

type MailInput = {
  to: string;
  subject: string;
  html: string;
};

/**
 * Envía un email con la configuración SMTP cargada por el admin.
 * Si el SMTP no está configurado (o falla), NO rompe el flujo:
 * deja el contenido en el log del servidor y devuelve false.
 */
export async function sendMail(
  config: StoreConfig,
  { to, subject, html }: MailInput
): Promise<boolean> {
  if (!smtpConfigured(config)) {
    console.log(
      `📧 [EMAIL NO ENVIADO — SMTP sin configurar] Para: ${to} | Asunto: ${subject}`
    );
    return false;
  }

  try {
    const port = config.smtpPort ?? 587;
    const transporter = nodemailer.createTransport({
      host: config.smtpHost!,
      port,
      secure: port === 465,
      auth:
        config.smtpUser && config.smtpPass
          ? { user: config.smtpUser, pass: config.smtpPass }
          : undefined,
    });

    await transporter.sendMail({
      from: config.emailFrom!,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error(`📧 Error enviando email a ${to} (${subject}):`, error);
    return false;
  }
}
