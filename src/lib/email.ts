import { Resend } from "resend";

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  if (resendClient) return resendClient;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  resendClient = new Resend(key);
  return resendClient;
}

const FROM_EMAIL = "PuBlitec <onboarding@resend.dev>";

/**
 * Send an email notification. Returns silently if Resend is not configured.
 */
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.log("[email] Resend not configured, skipping:", subject);
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("[email] Send error:", error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[email] Exception:", err);
    return false;
  }
}

/* ── Pre-built email templates ── */

export function contactNotificationEmail(data: {
  nombre: string;
  email: string;
  entidad: string | null;
  mensaje: string;
}): { subject: string; html: string } {
  return {
    subject: `[PuBlitec] Nuevo mensaje de contacto: ${data.nombre}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Nuevo mensaje de contacto</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #374151;">Nombre</td>
            <td style="padding: 8px 0; color: #4b5563;">${data.nombre}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #374151;">Email</td>
            <td style="padding: 8px 0; color: #4b5563;">${data.email}</td>
          </tr>
          ${data.entidad ? `<tr>
            <td style="padding: 8px 0; font-weight: bold; color: #374151;">Entidad</td>
            <td style="padding: 8px 0; color: #4b5563;">${data.entidad}</td>
          </tr>` : ""}
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #374151; vertical-align: top;">Mensaje</td>
            <td style="padding: 8px 0; color: #4b5563;">${data.mensaje.replace(/\n/g, "<br>")}</td>
          </tr>
        </table>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;">
        <p style="font-size: 12px; color: #9ca3af;">PuBlitec — Formulario de contacto</p>
      </div>
    `,
  };
}

export function wizardCompleteEmail(data: {
  municipioNombre: string;
  convocatoriaNombre: string;
  progress: number;
}): { subject: string; html: string } {
  return {
    subject: `[PuBlitec] ${data.municipioNombre} completo el diligenciamiento — ${data.convocatoriaNombre}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Diligenciamiento completado</h2>
        <p style="color: #4b5563;">
          El municipio <strong>${data.municipioNombre}</strong> ha completado el
          diligenciamiento de la convocatoria <strong>${data.convocatoriaNombre}</strong>.
        </p>
        <div style="background: #eff6ff; border-radius: 8px; padding: 16px; text-align: center; margin: 16px 0;">
          <p style="font-size: 32px; font-weight: bold; color: #1e40af; margin: 0;">
            ${data.progress}%
          </p>
          <p style="font-size: 12px; color: #3b82f6; margin: 4px 0 0;">progreso</p>
        </div>
        <p style="color: #4b5563;">
          Puedes revisar el avance en la seccion de Monitoreo y ejecutar la evaluacion.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;">
        <p style="font-size: 12px; color: #9ca3af;">PuBlitec — Notificacion automatica</p>
      </div>
    `,
  };
}
