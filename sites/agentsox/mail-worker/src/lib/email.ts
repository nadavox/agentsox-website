import type { ContactRequest } from '@agentsox/contracts';
import type { Env } from '../types';

const RESEND_EMAILS_URL = 'https://api.resend.com/emails';
const DEFAULT_CONTACT_EMAIL = 'nadav@agentsox.com';
const DEFAULT_FROM_NAME = 'AgentsOX Website';
const OX_BLACK = '#0A0A0F';
const OX_SURFACE = '#12121A';
const OX_SURFACE_2 = '#1A1A25';
const OX_TEXT = '#EEEEF0';
const OX_MUTED = '#A0A0B0';
const OX_DIM = '#6B6B80';
const OX_CYAN = '#22D3EE';
const OX_BLUE = '#3B82F6';
const OX_BORDER = '#2A2A3A';

interface ResendSendResponse {
  id?: string;
  message?: string;
  name?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function workflowFields(message = ''): Array<[string, string]> {
  const knownLabels = ['Problem', 'Business', 'Current tools', 'Details'];
  const fields: Array<[string, string]> = [];

  for (const line of message.split('\n')) {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) continue;

    const label = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (knownLabels.includes(label) && value) {
      fields.push([label, value]);
    }
  }

  return fields;
}

function emailDomain(email: string): string {
  return email.split('@')[1] || 'unknown';
}

function formatFrom(env: Env): string {
  const fromName = env.CONTACT_FROM_NAME || DEFAULT_FROM_NAME;
  const fromEmail = env.CONTACT_FROM_EMAIL || DEFAULT_CONTACT_EMAIL;
  return `${fromName} <${fromEmail}>`;
}

function encodeMailtoAddress(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '';
  return `${encodeURIComponent(local)}@${encodeURIComponent(domain)}`;
}

function buildText(payload: ContactRequest, requestId: string): string {
  const fields = workflowFields(payload.message);
  const workflowText = fields.length
    ? fields.map(([label, value]) => `${label}: ${value}`).join('\n')
    : payload.message;

  return [
    '[AgentsOX Website] New workflow inquiry',
    '',
    'Lead',
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    `Source: ${payload.source || 'website-contact'}`,
    '',
    'Workflow',
    workflowText,
    '',
    'Next action',
    `Reply directly to this email. Reply-To is set to ${payload.email}.`,
    '',
    `Request ID: ${requestId}`,
  ].join('\n');
}

function buildHtml(payload: ContactRequest, requestId: string): string {
  const fields = workflowFields(payload.message);
  const messageHtml = escapeHtml(payload.message || '').replace(/\n/g, '<br />');
  const source = payload.source || 'website-contact';
  const problem = fields.find(([label]) => label === 'Problem')?.[1];
  const replySubject = problem
    ? `Re: [AgentsOX Website] Workflow brief - ${problem}`
    : 'Re: [AgentsOX Website] Workflow brief';
  const replyMailto = `mailto:${encodeMailtoAddress(payload.email || '')}?subject=${encodeURIComponent(replySubject)}`;
  const replyHref = escapeHtml(replyMailto);
  const fieldRows = fields.length
    ? fields.map(([label, value]) => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid ${OX_BORDER}; color: ${OX_MUTED}; font-size: 11px; line-height: 18px; width: 140px; vertical-align: top; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 700;">${escapeHtml(label)}</td>
          <td style="padding: 12px 0; border-bottom: 1px solid ${OX_BORDER}; color: ${OX_TEXT}; font-size: 15px; line-height: 23px; vertical-align: top; font-weight: 500;">${escapeHtml(value)}</td>
        </tr>
      `).join('')
    : `
        <tr>
          <td style="padding: 12px 0; color: ${OX_TEXT}; font-size: 15px; line-height: 23px;">${messageHtml}</td>
        </tr>
      `;

  return `
    <div style="display:none; max-height:0; overflow:hidden; color:#ffffff; opacity:0;">
      New AgentsOX website lead from ${escapeHtml(payload.name || 'Unknown')} - reply directly to follow up.
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:${OX_BLACK}; margin:0; padding:26px 0;">
      <tr>
        <td align="center" style="padding:0 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:660px; background-color:${OX_SURFACE}; border:1px solid ${OX_BORDER}; border-radius:8px; overflow:hidden; font-family:Figtree, Arial, sans-serif;">
            <tr>
              <td style="padding:0; background:linear-gradient(90deg, ${OX_CYAN}, ${OX_BLUE}); height:3px; font-size:0; line-height:0;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:22px 24px 16px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                    <td style="width:42px; vertical-align:top;">
                      <div style="width:34px; height:34px; border-radius:8px; background-color:${OX_BLACK}; border:1px solid ${OX_BORDER}; color:${OX_CYAN}; font-size:14px; line-height:34px; text-align:center; font-weight:800; letter-spacing:0.5px;">OX</div>
                    </td>
                    <td style="vertical-align:top;">
                      <div style="font-family:'JetBrains Mono', ui-monospace, monospace; font-size:11px; letter-spacing:1.8px; text-transform:uppercase; color:${OX_CYAN}; font-weight:700;">AgentsOX Website Lead</div>
                      <h1 style="margin:6px 0 0; color:${OX_TEXT}; font-size:22px; line-height:30px; font-weight:800;">${escapeHtml(payload.name || 'New lead')} wants help with a workflow</h1>
                      <p style="margin:7px 0 0; color:${OX_MUTED}; font-size:14px; line-height:22px;">Captured by the site intake bot. The brief below is structured for quick follow-up.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            ${problem ? `
            <tr>
              <td style="padding:0 24px 16px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:${OX_SURFACE_2}; border:1px solid ${OX_BORDER}; border-radius:8px;">
                  <tr>
                    <td style="padding:13px 16px;">
                      <div style="font-family:'JetBrains Mono', ui-monospace, monospace; color:${OX_DIM}; font-size:11px; line-height:18px; text-transform:uppercase; letter-spacing:1.2px; font-weight:700;">Client is asking about</div>
                      <div style="margin-top:3px; color:${OX_TEXT}; font-size:17px; line-height:24px; font-weight:700;">${escapeHtml(problem)}</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            ` : ''}

            <tr>
              <td style="padding:0 24px 18px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:${OX_BLACK}; border:1px solid ${OX_BORDER}; border-radius:8px;">
                  <tr>
                    <td style="padding:13px 16px;">
                      <div style="font-family:'JetBrains Mono', ui-monospace, monospace; color:${OX_DIM}; font-size:11px; line-height:18px; text-transform:uppercase; letter-spacing:1.2px; font-weight:700;">Client</div>
                      <div style="margin-top:4px; color:${OX_TEXT}; font-size:16px; line-height:24px; font-weight:700;">${escapeHtml(payload.name || '')}</div>
                      <div style="margin-top:1px; font-size:14px; line-height:22px;">
                        <a href="${replyHref}" style="color:${OX_CYAN}; text-decoration:underline;">${escapeHtml(payload.email || '')}</a>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:0 24px 8px;">
                <h2 style="margin:0 0 8px; color:${OX_TEXT}; font-size:16px; line-height:24px; font-weight:800;">Workflow brief</h2>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  ${fieldRows}
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:18px 24px 22px;">
                <a href="${replyHref}" style="display:inline-block; background-color:${OX_BLUE}; color:${OX_TEXT}; text-decoration:none; font-size:14px; line-height:20px; font-weight:800; padding:11px 16px; border-radius:8px;">Reply to lead</a>
                <span style="display:inline-block; margin-left:10px; color:${OX_MUTED}; font-size:13px; line-height:20px;">Reply-To is set to ${escapeHtml(payload.email || '')}</span>
              </td>
            </tr>

            <tr>
              <td style="padding:13px 24px; background-color:${OX_BLACK}; border-top:1px solid ${OX_BORDER}; color:${OX_DIM}; font-size:12px; line-height:18px;">
                Source: ${escapeHtml(source)}<br />
                Request ID: ${escapeHtml(requestId)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

export async function sendContactEmail(
  env: Env,
  payload: ContactRequest,
  requestId: string,
): Promise<{ messageId?: string }> {
  if (!env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  const toEmail = env.CONTACT_TO_EMAIL || DEFAULT_CONTACT_EMAIL;
  const response = await fetch(RESEND_EMAILS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': requestId,
    },
    body: JSON.stringify({
      from: formatFrom(env),
      to: [toEmail],
      reply_to: payload.email,
      subject: `[AgentsOX Website] Inquiry from ${payload.name}`,
      headers: {
        'X-AgentsOX-Source': payload.source || 'website-contact',
        'X-AgentsOX-Request-ID': requestId,
      },
      text: buildText(payload, requestId),
      html: buildHtml(payload, requestId),
    }),
  });

  const data = (await response.json().catch(() => ({}))) as ResendSendResponse;

  if (!response.ok) {
    console.error('contact_email_resend_error', {
      requestId,
      status: response.status,
      errorName: data.name,
      errorMessage: data.message,
      replyToDomain: emailDomain(payload.email || ''),
    });
    throw new Error(data.message || 'Email delivery failed');
  }

  return { messageId: data.id };
}

export function logContactAttempt(
  event: 'received' | 'sent' | 'failed',
  request: Request,
  payload: ContactRequest,
  requestId: string,
  extra: Record<string, unknown> = {},
): void {
  console.log('contact_email_event', {
    event,
    requestId,
    origin: request.headers.get('Origin') || 'no-origin',
    replyToDomain: emailDomain(payload.email || ''),
    messageLength: payload.message?.length || 0,
    ...extra,
  });
}
