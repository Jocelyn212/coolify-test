export const prerender = false;

import nodemailer from 'nodemailer';

type AuditPayload = {
  email: string;
  source?: string;
  url?: string;
  analyzedAt?: string;
  avgMobile?: number | null;
  avgDesktop?: number | null;
  summary?: string[];
  mobile?: {
    scores?: { total?: number; performance?: number; accessibility?: number; seo?: number; bestPractices?: number };
    metrics?: { fcp?: string; lcp?: string; tbt?: string; cls?: string; si?: string; inp?: string; ttfb?: string };
    opportunities?: string[];
    issues?: string[];
    recommendations?: string[];
  };
  desktop?: {
    scores?: { total?: number; performance?: number; accessibility?: number; seo?: number; bestPractices?: number };
    metrics?: { fcp?: string; lcp?: string; tbt?: string; cls?: string; si?: string; inp?: string; ttfb?: string };
    opportunities?: string[];
    issues?: string[];
    recommendations?: string[];
  };
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function listToHtml(items: string[] | undefined, maxItems = 20) {
  const safeItems = (items || []).slice(0, maxItems);
  if (safeItems.length === 0) return '<li>Sin datos relevantes en esta seccion.</li>';
  return safeItems.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
}

function buildUserEmailHtml(payload: AuditPayload) {
  const url = escapeHtml(payload.url || 'No disponible');
  const analyzedAt = payload.analyzedAt
    ? new Date(payload.analyzedAt).toLocaleString('es-ES')
    : new Date().toLocaleString('es-ES');

  const mobile = payload.mobile || {};
  const desktop = payload.desktop || {};

  return `
  <div style="margin:0;padding:0;background-color:#0b1120;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0b1120;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="680" cellpadding="0" cellspacing="0" border="0" style="max-width:680px;width:100%;background-color:#0f172a;border:1px solid #1f2a44;border-radius:14px;overflow:hidden;">
            <tr>
              <td style="background:linear-gradient(135deg,#0f172a 0%,#1b2f3f 100%);padding:22px 24px;border-bottom:1px solid #1f2a44;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="vertical-align:middle;">
                      <img src="https://res.cloudinary.com/pruebaweb/image/upload/v1764994533/web%20JCtechStudio/logoJCTechStudio-3_kwsqey.png" alt="JCTechStudio" width="120" style="display:block;border:0;outline:none;text-decoration:none;height:auto;max-width:120px;" />
                    </td>
                    <td style="text-align:right;vertical-align:middle;">
                      <span style="display:inline-block;background-color:#8ddad2;color:#07343a;font-size:12px;font-weight:700;letter-spacing:0.4px;padding:6px 10px;border-radius:999px;">INFORME AUTOMATICO</span>
                    </td>
                  </tr>
                </table>
                <h1 style="margin:16px 0 6px;color:#e6f6f4;font-size:27px;line-height:1.2;">Tu informe de auditoria web ya esta listo</h1>
                <p style="margin:0;color:#9fb2c8;font-size:14px;line-height:1.5;">Analisis comparativo real de rendimiento en movil y desktop.</p>
              </td>
            </tr>

            <tr>
              <td style="padding:20px 24px;color:#dbe6f4;font-size:14px;line-height:1.6;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#111f35;border:1px solid #243656;border-radius:10px;margin-bottom:16px;">
                  <tr>
                    <td style="padding:12px 14px;">
                      <p style="margin:0 0 4px;"><strong style="color:#8ddad2;">URL analizada:</strong> <a href="${url}" style="color:#9fdfff;text-decoration:underline;">${url}</a></p>
                      <p style="margin:0;"><strong style="color:#8ddad2;">Fecha:</strong> <span style="color:#dbe6f4;">${escapeHtml(analyzedAt)}</span></p>
                    </td>
                  </tr>
                </table>

                <h2 style="margin:0 0 10px;color:#8ddad2;font-size:20px;">Comparativa principal</h2>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid #2a3b5e;background-color:#111a2d;margin-bottom:18px;">
                  <thead>
                    <tr>
                      <th style="text-align:left;padding:10px;border:1px solid #2a3b5e;background-color:#172544;color:#dce8f8;font-size:13px;">Metrica</th>
                      <th style="text-align:left;padding:10px;border:1px solid #2a3b5e;background-color:#172544;color:#dce8f8;font-size:13px;">Movil</th>
                      <th style="text-align:left;padding:10px;border:1px solid #2a3b5e;background-color:#172544;color:#dce8f8;font-size:13px;">Desktop</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td style="padding:10px;border:1px solid #2a3b5e;color:#dce8f8;">Total</td><td style="padding:10px;border:1px solid #2a3b5e;color:#dce8f8;">${mobile.scores?.total ?? 'N/D'}/100</td><td style="padding:10px;border:1px solid #2a3b5e;color:#dce8f8;">${desktop.scores?.total ?? 'N/D'}/100</td></tr>
                    <tr><td style="padding:10px;border:1px solid #2a3b5e;color:#dce8f8;">Rendimiento</td><td style="padding:10px;border:1px solid #2a3b5e;color:#dce8f8;">${mobile.scores?.performance ?? 'N/D'}/100</td><td style="padding:10px;border:1px solid #2a3b5e;color:#dce8f8;">${desktop.scores?.performance ?? 'N/D'}/100</td></tr>
                    <tr><td style="padding:10px;border:1px solid #2a3b5e;color:#dce8f8;">Accesibilidad</td><td style="padding:10px;border:1px solid #2a3b5e;color:#dce8f8;">${mobile.scores?.accessibility ?? 'N/D'}/100</td><td style="padding:10px;border:1px solid #2a3b5e;color:#dce8f8;">${desktop.scores?.accessibility ?? 'N/D'}/100</td></tr>
                    <tr><td style="padding:10px;border:1px solid #2a3b5e;color:#dce8f8;">SEO</td><td style="padding:10px;border:1px solid #2a3b5e;color:#dce8f8;">${mobile.scores?.seo ?? 'N/D'}/100</td><td style="padding:10px;border:1px solid #2a3b5e;color:#dce8f8;">${desktop.scores?.seo ?? 'N/D'}/100</td></tr>
                    <tr><td style="padding:10px;border:1px solid #2a3b5e;color:#dce8f8;">Best Practices</td><td style="padding:10px;border:1px solid #2a3b5e;color:#dce8f8;">${mobile.scores?.bestPractices ?? 'N/D'}/100</td><td style="padding:10px;border:1px solid #2a3b5e;color:#dce8f8;">${desktop.scores?.bestPractices ?? 'N/D'}/100</td></tr>
                  </tbody>
                </table>

                <h3 style="margin:0 0 8px;color:#8ddad2;font-size:17px;">Resumen ejecutivo</h3>
                <ul style="margin:0 0 16px 18px;padding:0;color:#dbe6f4;">
                  ${listToHtml(payload.summary)}
                </ul>

                <h3 style="margin:0 0 8px;color:#8ddad2;font-size:17px;">Oportunidades Movil</h3>
                <ul style="margin:0 0 16px 18px;padding:0;color:#dbe6f4;">${listToHtml(mobile.opportunities, 20)}</ul>

                <h3 style="margin:0 0 8px;color:#8ddad2;font-size:17px;">Oportunidades Desktop</h3>
                <ul style="margin:0 0 16px 18px;padding:0;color:#dbe6f4;">${listToHtml(desktop.opportunities, 20)}</ul>

                <h3 style="margin:0 0 8px;color:#8ddad2;font-size:17px;">Detalle tecnico Movil</h3>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid #2a3b5e;background-color:#111a2d;margin-bottom:16px;">
                  <tbody>
                    <tr><td style="padding:8px;border:1px solid #2a3b5e;color:#9fb2c8;width:36%;">FCP</td><td style="padding:8px;border:1px solid #2a3b5e;color:#dce8f8;">${escapeHtml(mobile.metrics?.fcp || 'N/D')}</td></tr>
                    <tr><td style="padding:8px;border:1px solid #2a3b5e;color:#9fb2c8;">LCP</td><td style="padding:8px;border:1px solid #2a3b5e;color:#dce8f8;">${escapeHtml(mobile.metrics?.lcp || 'N/D')}</td></tr>
                    <tr><td style="padding:8px;border:1px solid #2a3b5e;color:#9fb2c8;">TBT</td><td style="padding:8px;border:1px solid #2a3b5e;color:#dce8f8;">${escapeHtml(mobile.metrics?.tbt || 'N/D')}</td></tr>
                    <tr><td style="padding:8px;border:1px solid #2a3b5e;color:#9fb2c8;">CLS</td><td style="padding:8px;border:1px solid #2a3b5e;color:#dce8f8;">${escapeHtml(mobile.metrics?.cls || 'N/D')}</td></tr>
                    <tr><td style="padding:8px;border:1px solid #2a3b5e;color:#9fb2c8;">Speed Index</td><td style="padding:8px;border:1px solid #2a3b5e;color:#dce8f8;">${escapeHtml(mobile.metrics?.si || 'N/D')}</td></tr>
                    <tr><td style="padding:8px;border:1px solid #2a3b5e;color:#9fb2c8;">INP</td><td style="padding:8px;border:1px solid #2a3b5e;color:#dce8f8;">${escapeHtml(mobile.metrics?.inp || 'N/D')}</td></tr>
                    <tr><td style="padding:8px;border:1px solid #2a3b5e;color:#9fb2c8;">TTFB</td><td style="padding:8px;border:1px solid #2a3b5e;color:#dce8f8;">${escapeHtml(mobile.metrics?.ttfb || 'N/D')}</td></tr>
                  </tbody>
                </table>

                <h3 style="margin:0 0 8px;color:#8ddad2;font-size:17px;">Detalle tecnico Desktop</h3>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid #2a3b5e;background-color:#111a2d;margin-bottom:16px;">
                  <tbody>
                    <tr><td style="padding:8px;border:1px solid #2a3b5e;color:#9fb2c8;width:36%;">FCP</td><td style="padding:8px;border:1px solid #2a3b5e;color:#dce8f8;">${escapeHtml(desktop.metrics?.fcp || 'N/D')}</td></tr>
                    <tr><td style="padding:8px;border:1px solid #2a3b5e;color:#9fb2c8;">LCP</td><td style="padding:8px;border:1px solid #2a3b5e;color:#dce8f8;">${escapeHtml(desktop.metrics?.lcp || 'N/D')}</td></tr>
                    <tr><td style="padding:8px;border:1px solid #2a3b5e;color:#9fb2c8;">TBT</td><td style="padding:8px;border:1px solid #2a3b5e;color:#dce8f8;">${escapeHtml(desktop.metrics?.tbt || 'N/D')}</td></tr>
                    <tr><td style="padding:8px;border:1px solid #2a3b5e;color:#9fb2c8;">CLS</td><td style="padding:8px;border:1px solid #2a3b5e;color:#dce8f8;">${escapeHtml(desktop.metrics?.cls || 'N/D')}</td></tr>
                    <tr><td style="padding:8px;border:1px solid #2a3b5e;color:#9fb2c8;">Speed Index</td><td style="padding:8px;border:1px solid #2a3b5e;color:#dce8f8;">${escapeHtml(desktop.metrics?.si || 'N/D')}</td></tr>
                    <tr><td style="padding:8px;border:1px solid #2a3b5e;color:#9fb2c8;">INP</td><td style="padding:8px;border:1px solid #2a3b5e;color:#dce8f8;">${escapeHtml(desktop.metrics?.inp || 'N/D')}</td></tr>
                    <tr><td style="padding:8px;border:1px solid #2a3b5e;color:#9fb2c8;">TTFB</td><td style="padding:8px;border:1px solid #2a3b5e;color:#dce8f8;">${escapeHtml(desktop.metrics?.ttfb || 'N/D')}</td></tr>
                  </tbody>
                </table>

                <h3 style="margin:0 0 8px;color:#8ddad2;font-size:17px;">Problemas detectados Movil</h3>
                <ul style="margin:0 0 16px 18px;padding:0;color:#dbe6f4;">${listToHtml(mobile.issues, 30)}</ul>

                <h3 style="margin:0 0 8px;color:#8ddad2;font-size:17px;">Problemas detectados Desktop</h3>
                <ul style="margin:0 0 16px 18px;padding:0;color:#dbe6f4;">${listToHtml(desktop.issues, 30)}</ul>

                <h3 style="margin:0 0 8px;color:#8ddad2;font-size:17px;">Recomendaciones Movil</h3>
                <ul style="margin:0 0 16px 18px;padding:0;color:#dbe6f4;">${listToHtml(mobile.recommendations, 30)}</ul>

                <h3 style="margin:0 0 8px;color:#8ddad2;font-size:17px;">Recomendaciones Desktop</h3>
                <ul style="margin:0 0 18px 18px;padding:0;color:#dbe6f4;">${listToHtml(desktop.recommendations, 30)}</ul>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0f1c33;border:1px solid #274069;border-radius:10px;">
                  <tr>
                    <td style="padding:14px;">
                      <p style="margin:0 0 10px;color:#dbe6f4;font-size:14px;">Si quieres, te preparo una propuesta personalizada para mejorar velocidad, SEO y conversion.</p>
                      <a href="https://www.jctechstudio.es/tipos-de-web" style="display:inline-block;background-color:#8ddad2;color:#07343a;text-decoration:none;font-weight:700;font-size:13px;padding:10px 14px;border-radius:8px;">Solicitar propuesta personalizada</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <p style="margin:12px 0 0;color:#7c8fa8;font-size:12px;text-align:center;">JCTechStudio · Informe automatizado del Auditor Web</p>
        </td>
      </tr>
    </table>
  </div>`;
}

function buildOwnerEmailHtml(payload: AuditPayload) {
  const email = escapeHtml(payload.email);
  const url = escapeHtml(payload.url || 'No disponible');
  const analyzedAt = payload.analyzedAt
    ? new Date(payload.analyzedAt).toLocaleString('es-ES')
    : new Date().toLocaleString('es-ES');
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;">
    <h2>Nuevo lead del Auditor Web</h2>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>URL:</strong> ${url}</p>
    <p><strong>Fecha auditoria:</strong> ${escapeHtml(analyzedAt)}</p>
    <p><strong>Promedio movil:</strong> ${payload.avgMobile ?? 'N/D'}/100</p>
    <p><strong>Promedio desktop:</strong> ${payload.avgDesktop ?? 'N/D'}/100</p>
    <p><strong>Fuente:</strong> ${escapeHtml(payload.source || 'auditor-web')}</p>
  </div>`;
}

function createSmtpTransport() {
  const host = import.meta.env.SMTP_HOST;
  const port = Number(import.meta.env.SMTP_PORT || 465);
  const secure = String(import.meta.env.SMTP_SECURE || 'true').toLowerCase() === 'true';
  const user = import.meta.env.SMTP_USER;
  const pass = import.meta.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error('Falta configurar SMTP_HOST, SMTP_USER o SMTP_PASS en variables de entorno.');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

export async function POST({ request }: { request: Request }) {
  try {
    const body = await request.json() as AuditPayload;
    const email = String(body?.email || '').trim().toLowerCase();

    if (!isValidEmail(email)) {
      return new Response(JSON.stringify({ error: 'Correo no valido.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ownerEmail = import.meta.env.CONTACT_EMAIL || import.meta.env.SMTP_USER;
    const fromEmail = import.meta.env.LEADS_FROM_EMAIL || import.meta.env.SMTP_USER;

    if (!ownerEmail || !fromEmail) {
      return new Response(JSON.stringify({ error: 'Falta configurar CONTACT_EMAIL o SMTP_USER en variables de entorno.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    body.email = email;

    const transporter = createSmtpTransport();

    await transporter.verify();

    await transporter.sendMail({
      from: fromEmail,
      to: email,
      subject: 'Tu informe de auditoria web - JCTechStudio',
      html: buildUserEmailHtml(body),
    });

    await transporter.sendMail({
      from: fromEmail,
      to: ownerEmail,
      subject: `Nuevo lead auditor: ${email}`,
      html: buildOwnerEmailHtml(body),
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo enviar el informe por correo.';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
