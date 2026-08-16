import twilio from "twilio";

type SendWhatsAppParams = {
  to: string;
  message: string;
};

type SendWhatsAppTemplateParams = {
  to: string;
  contentSid: string;
  variables?: Record<string, string>;
};

function formatWhatsAppNumber(phone: string) {
  const cleanPhone = phone.trim();

  if (cleanPhone.startsWith("whatsapp:+")) {
    return cleanPhone;
  }

  if (cleanPhone.startsWith("+")) {
    return `whatsapp:${cleanPhone}`;
  }

  if (cleanPhone.startsWith("0")) {
    return `whatsapp:+260${cleanPhone.slice(1)}`;
  }

  if (cleanPhone.startsWith("260")) {
    return `whatsapp:+${cleanPhone}`;
  }

  if (cleanPhone.startsWith("92")) {
    return `whatsapp:+${cleanPhone}`;
  }

  return `whatsapp:${cleanPhone}`;
}

function getTwilioConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid) {
    throw new Error("TWILIO_ACCOUNT_SID is missing.");
  }

  if (!authToken) {
    throw new Error("TWILIO_AUTH_TOKEN is missing.");
  }

  if (!from) {
    throw new Error("TWILIO_WHATSAPP_FROM is missing.");
  }

  return {
    accountSid,
    authToken,
    from: formatWhatsAppNumber(from),
  };
}

/*
 * Free-form WhatsApp sender.
 *
 * Keep this for development/testing and for messages sent
 * during an active WhatsApp customer-service session.
 */
export async function sendWhatsAppMessage({
  to,
  message,
}: SendWhatsAppParams) {
  const { accountSid, authToken, from } = getTwilioConfig();

  const client = twilio(accountSid, authToken);

  const result = await client.messages.create({
    from,
    to: formatWhatsAppNumber(to),
    body: message,
  });

  return {
    sid: result.sid,
    status: result.status,
    to: result.to,
    from: result.from,
  };
}

/*
 * Approved WhatsApp Content Template sender.
 *
 * Example:
 *
 * {
 *   "1": "1000.00",
 *   "2": "200.00",
 *   "3": "TXN123456",
 * }
 */
export async function sendWhatsAppTemplateMessage({
  to,
  contentSid,
  variables = {},
}: SendWhatsAppTemplateParams) {
  const { accountSid, authToken, from } = getTwilioConfig();

  const cleanContentSid = contentSid.trim();

  if (!cleanContentSid) {
    throw new Error("WhatsApp Content SID is missing.");
  }

  if (!cleanContentSid.startsWith("HX")) {
    throw new Error(
      "WhatsApp Content SID must be a valid Twilio HX Content SID."
    );
  }

  const client = twilio(accountSid, authToken);

  const hasVariables = Object.keys(variables).length > 0;

  const result = await client.messages.create({
    from,
    to: formatWhatsAppNumber(to),
    contentSid: cleanContentSid,
    ...(hasVariables
      ? {
          contentVariables: JSON.stringify(variables),
        }
      : {}),
  });

  return {
    sid: result.sid,
    status: result.status,
    to: result.to,
    from: result.from,
  };
}