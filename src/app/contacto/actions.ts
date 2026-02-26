"use server";

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { sendEmail, contactNotificationEmail } from "@/lib/email";

const contactSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Correo electronico invalido"),
  entidad: z.string().optional(),
  mensaje: z.string().min(10, "El mensaje debe tener al menos 10 caracteres"),
});

export async function submitContact(
  _prevState: { success?: boolean; error?: string } | null,
  formData: FormData,
): Promise<{ success?: boolean; error?: string }> {
  const raw = {
    nombre: formData.get("nombre") as string,
    email: formData.get("email") as string,
    entidad: formData.get("entidad") as string,
    mensaje: formData.get("mensaje") as string,
  };

  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error("Missing Supabase env vars for contact form");
    return { error: "Error de configuracion del servidor. Intenta mas tarde." };
  }

  const supabase = createClient(url, serviceKey);

  const { error } = await supabase.from("contact_messages").insert({
    nombre: parsed.data.nombre,
    email: parsed.data.email,
    entidad: parsed.data.entidad || null,
    mensaje: parsed.data.mensaje,
  });

  if (error) {
    console.error("Contact insert error:", error.message);
    return { error: "No se pudo enviar el mensaje. Intenta mas tarde." };
  }

  // Fire-and-forget email notification to admin
  const adminEmail = process.env.CONTACT_NOTIFY_EMAIL;
  if (adminEmail) {
    const { subject, html } = contactNotificationEmail({
      nombre: parsed.data.nombre,
      email: parsed.data.email,
      entidad: parsed.data.entidad || null,
      mensaje: parsed.data.mensaje,
    });
    sendEmail({ to: adminEmail, subject, html }).catch(() => {});
  }

  return { success: true };
}
