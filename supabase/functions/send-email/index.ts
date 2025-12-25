import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: "workspace_invitation" | "temperature_alert" | "efficiency_alert";
  to: string;
  data: Record<string, any>;
  language?: string;
}

// Translations for email templates
const translations: Record<string, Record<string, string>> = {
  "pt-BR": {
    // Invitation
    invitationSubject: "Convite para Workspace",
    invitationTitle: "Você foi convidado!",
    invitationBody: "Você foi convidado por {inviterName} para participar do workspace \"{workspaceName}\" no sistema de gerenciamento de climatização.",
    invitationRole: "Função atribuída: {role}",
    invitationCta: "Acesse o sistema para aceitar o convite",
    invitationExpiry: "Este convite expira em 7 dias.",
    // Temperature Alert
    tempAlertSubject: "⚠️ Alerta de Temperatura Crítica",
    tempAlertTitle: "Alerta de Temperatura",
    tempAlertBody: "Um equipamento no workspace \"{workspaceName}\" registrou uma temperatura fora dos limites configurados.",
    tempAlertEquipment: "Equipamento: {equipmentName}",
    tempAlertTemp: "Temperatura atual: {currentTemp}°C",
    tempAlertThreshold: "Limite: {minTemp}°C - {maxTemp}°C",
    // Efficiency Alert
    effAlertSubject: "⚠️ Alerta de Baixa Eficiência",
    effAlertTitle: "Alerta de Eficiência",
    effAlertBody: "Um equipamento no workspace \"{workspaceName}\" está operando com eficiência abaixo do limite configurado.",
    effAlertEquipment: "Equipamento: {equipmentName}",
    effAlertEfficiency: "Eficiência atual: {efficiency}%",
    effAlertThreshold: "Limite mínimo: {threshold}%",
    // Common
    footer: "Este é um email automático do sistema de climatização.",
    roleOwner: "Proprietário",
    roleAdmin: "Administrador",
    roleViewer: "Visualizador",
  },
  "en-US": {
    invitationSubject: "Workspace Invitation",
    invitationTitle: "You've been invited!",
    invitationBody: "You've been invited by {inviterName} to join the workspace \"{workspaceName}\" in the climate management system.",
    invitationRole: "Assigned role: {role}",
    invitationCta: "Access the system to accept the invitation",
    invitationExpiry: "This invitation expires in 7 days.",
    tempAlertSubject: "⚠️ Critical Temperature Alert",
    tempAlertTitle: "Temperature Alert",
    tempAlertBody: "An equipment in the workspace \"{workspaceName}\" has registered a temperature outside the configured limits.",
    tempAlertEquipment: "Equipment: {equipmentName}",
    tempAlertTemp: "Current temperature: {currentTemp}°C",
    tempAlertThreshold: "Threshold: {minTemp}°C - {maxTemp}°C",
    effAlertSubject: "⚠️ Low Efficiency Alert",
    effAlertTitle: "Efficiency Alert",
    effAlertBody: "An equipment in the workspace \"{workspaceName}\" is operating with efficiency below the configured threshold.",
    effAlertEquipment: "Equipment: {equipmentName}",
    effAlertEfficiency: "Current efficiency: {efficiency}%",
    effAlertThreshold: "Minimum threshold: {threshold}%",
    footer: "This is an automated email from the climate management system.",
    roleOwner: "Owner",
    roleAdmin: "Admin",
    roleViewer: "Viewer",
  },
  "es-ES": {
    invitationSubject: "Invitación al Workspace",
    invitationTitle: "¡Has sido invitado!",
    invitationBody: "Has sido invitado por {inviterName} para unirte al workspace \"{workspaceName}\" en el sistema de gestión de climatización.",
    invitationRole: "Rol asignado: {role}",
    invitationCta: "Accede al sistema para aceptar la invitación",
    invitationExpiry: "Esta invitación expira en 7 días.",
    tempAlertSubject: "⚠️ Alerta de Temperatura Crítica",
    tempAlertTitle: "Alerta de Temperatura",
    tempAlertBody: "Un equipo en el workspace \"{workspaceName}\" ha registrado una temperatura fuera de los límites configurados.",
    tempAlertEquipment: "Equipo: {equipmentName}",
    tempAlertTemp: "Temperatura actual: {currentTemp}°C",
    tempAlertThreshold: "Límite: {minTemp}°C - {maxTemp}°C",
    effAlertSubject: "⚠️ Alerta de Baja Eficiencia",
    effAlertTitle: "Alerta de Eficiencia",
    effAlertBody: "Un equipo en el workspace \"{workspaceName}\" está operando con una eficiencia por debajo del límite configurado.",
    effAlertEquipment: "Equipo: {equipmentName}",
    effAlertEfficiency: "Eficiencia actual: {efficiency}%",
    effAlertThreshold: "Límite mínimo: {threshold}%",
    footer: "Este es un correo automático del sistema de climatización.",
    roleOwner: "Propietario",
    roleAdmin: "Administrador",
    roleViewer: "Visor",
  },
  "de-DE": {
    invitationSubject: "Workspace-Einladung",
    invitationTitle: "Sie wurden eingeladen!",
    invitationBody: "Sie wurden von {inviterName} eingeladen, dem Workspace \"{workspaceName}\" im Klimamanagement-System beizutreten.",
    invitationRole: "Zugewiesene Rolle: {role}",
    invitationCta: "Greifen Sie auf das System zu, um die Einladung anzunehmen",
    invitationExpiry: "Diese Einladung läuft in 7 Tagen ab.",
    tempAlertSubject: "⚠️ Kritische Temperaturwarnung",
    tempAlertTitle: "Temperaturwarnung",
    tempAlertBody: "Ein Gerät im Workspace \"{workspaceName}\" hat eine Temperatur außerhalb der konfigurierten Grenzen registriert.",
    tempAlertEquipment: "Gerät: {equipmentName}",
    tempAlertTemp: "Aktuelle Temperatur: {currentTemp}°C",
    tempAlertThreshold: "Grenzwert: {minTemp}°C - {maxTemp}°C",
    effAlertSubject: "⚠️ Warnung bei niedriger Effizienz",
    effAlertTitle: "Effizienzwarnung",
    effAlertBody: "Ein Gerät im Workspace \"{workspaceName}\" arbeitet mit einer Effizienz unterhalb des konfigurierten Schwellenwerts.",
    effAlertEquipment: "Gerät: {equipmentName}",
    effAlertEfficiency: "Aktuelle Effizienz: {efficiency}%",
    effAlertThreshold: "Mindestschwelle: {threshold}%",
    footer: "Dies ist eine automatische E-Mail vom Klimamanagement-System.",
    roleOwner: "Eigentümer",
    roleAdmin: "Administrator",
    roleViewer: "Betrachter",
  },
};

function t(key: string, language: string, replacements?: Record<string, string>): string {
  const lang = translations[language] || translations["pt-BR"];
  let text = lang[key] || translations["pt-BR"][key] || key;
  
  if (replacements) {
    Object.entries(replacements).forEach(([k, v]) => {
      text = text.replace(new RegExp(`\\{${k}\\}`, "g"), v);
    });
  }
  
  return text;
}

function getRoleName(role: string, language: string): string {
  const roleMap: Record<string, string> = {
    owner: "roleOwner",
    admin: "roleAdmin",
    viewer: "roleViewer",
  };
  return t(roleMap[role] || "roleViewer", language);
}

function getBaseHtml(title: string, content: string, footer: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <tr>
          <td style="background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            ${content}
          </td>
        </tr>
        <tr>
          <td style="padding: 20px; text-align: center; color: #71717a; font-size: 12px;">
            ${footer}
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

function buildInvitationEmail(data: Record<string, any>, language: string, appUrl: string): { subject: string; html: string } {
  const subject = t("invitationSubject", language);
  const roleName = getRoleName(data.role, language);
  
  const content = `
    <h1 style="color: #18181b; margin: 0 0 20px 0; font-size: 24px;">${t("invitationTitle", language)}</h1>
    <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
      ${t("invitationBody", language, { inviterName: data.inviterName, workspaceName: data.workspaceName })}
    </p>
    <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
      <strong>${t("invitationRole", language, { role: roleName })}</strong>
    </p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${appUrl}/auth" 
         style="display: inline-block; background-color: #0ea5e9; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: 500; font-size: 16px;">
        ${t("invitationCta", language)}
      </a>
    </div>
    <p style="color: #71717a; font-size: 14px; margin: 24px 0 0 0; text-align: center;">
      ${t("invitationExpiry", language)}
    </p>
  `;
  
  return {
    subject,
    html: getBaseHtml(subject, content, t("footer", language)),
  };
}

function buildTemperatureAlertEmail(data: Record<string, any>, language: string): { subject: string; html: string } {
  const subject = t("tempAlertSubject", language);
  
  const content = `
    <h1 style="color: #dc2626; margin: 0 0 20px 0; font-size: 24px;">🌡️ ${t("tempAlertTitle", language)}</h1>
    <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
      ${t("tempAlertBody", language, { workspaceName: data.workspaceName })}
    </p>
    <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 16px 0; border-radius: 4px;">
      <p style="color: #3f3f46; margin: 0 0 8px 0;"><strong>${t("tempAlertEquipment", language, { equipmentName: data.equipmentName })}</strong></p>
      <p style="color: #dc2626; margin: 0 0 8px 0; font-size: 18px;"><strong>${t("tempAlertTemp", language, { currentTemp: data.currentTemp })}</strong></p>
      <p style="color: #71717a; margin: 0;">${t("tempAlertThreshold", language, { minTemp: data.minTemp, maxTemp: data.maxTemp })}</p>
    </div>
  `;
  
  return {
    subject,
    html: getBaseHtml(subject, content, t("footer", language)),
  };
}

function buildEfficiencyAlertEmail(data: Record<string, any>, language: string): { subject: string; html: string } {
  const subject = t("effAlertSubject", language);
  
  const content = `
    <h1 style="color: #f59e0b; margin: 0 0 20px 0; font-size: 24px;">⚡ ${t("effAlertTitle", language)}</h1>
    <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
      ${t("effAlertBody", language, { workspaceName: data.workspaceName })}
    </p>
    <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 16px 0; border-radius: 4px;">
      <p style="color: #3f3f46; margin: 0 0 8px 0;"><strong>${t("effAlertEquipment", language, { equipmentName: data.equipmentName })}</strong></p>
      <p style="color: #f59e0b; margin: 0 0 8px 0; font-size: 18px;"><strong>${t("effAlertEfficiency", language, { efficiency: data.efficiency })}</strong></p>
      <p style="color: #71717a; margin: 0;">${t("effAlertThreshold", language, { threshold: data.threshold })}</p>
    </div>
  `;
  
  return {
    subject,
    html: getBaseHtml(subject, content, t("footer", language)),
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, to, data, language = "pt-BR" }: EmailRequest = await req.json();
    
    console.log(`[send-email] Processing ${type} email to ${to}`);

    // Get app URL from environment or use default
    const appUrl = Deno.env.get("APP_URL") || "https://669358b0-dcac-4e4d-bbb7-8cf1a415b378.lovableproject.com";

    let emailContent: { subject: string; html: string };

    switch (type) {
      case "workspace_invitation":
        emailContent = buildInvitationEmail(data, language, appUrl);
        break;
      case "temperature_alert":
        emailContent = buildTemperatureAlertEmail(data, language);
        break;
      case "efficiency_alert":
        emailContent = buildEfficiencyAlertEmail(data, language);
        break;
      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    const emailResponse = await resend.emails.send({
      from: "Climate Management <onboarding@resend.dev>",
      to: [to],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log(`[send-email] Email sent successfully:`, emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("[send-email] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
