const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY
const FROM_EMAIL = 'Vorak Freelance <vorakfreelance@gmail.com>'
const PLATFORM_URL = import.meta.env.VITE_PLATFORM_URL || 'https://vorakfreelance.com'

function emailWrapper(content) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#0A0A09;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A09;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#161614;border-radius:12px;border:1px solid #1f1f1e;overflow:hidden;">
        <tr><td style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid #1f1f1e;">
          <span style="color:#0F6E56;font-weight:700;font-size:18px;letter-spacing:3px;">VORAK FREELANCE</span>
        </td></tr>
        <tr><td style="padding:32px 40px;color:#FFFFFF;font-size:16px;line-height:1.6;">
          ${content}
        </td></tr>
        <tr><td style="padding:24px 40px;border-top:1px solid #1f1f1e;text-align:center;color:#555550;font-size:13px;line-height:1.8;">
          Founded by Andre Manookian<br>
          <a href="${PLATFORM_URL}" style="color:#0F6E56;text-decoration:none;">vorakfreelance.com</a> · @vorakfreelancers
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function buttonHtml(text, href) {
  return `<p style="margin:28px 0 0;"><a href="${href}" style="display:inline-block;background:#0F6E56;color:#FFFFFF;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;">${text}</a></p>`
}

export async function sendEmail({ to, subject, html }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html: emailWrapper(html),
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to send email')
  }

  return response.json()
}

export async function sendWelcomeEmail({ email, name, role }) {
  const roleLabel = role === 'employer' ? 'Employer' : 'Talent'
  const html = `
      <h2 style="color:#FFFFFF;margin:0 0 16px;">Welcome, ${name}!</h2>
      <p style="color:#A8A69E;">Thank you for joining Vorak Freelance — the marketplace built for Armenia and the Caucasus.</p>
      <p style="color:#A8A69E;">You signed up as an <strong style="color:#0F6E56;">${roleLabel}</strong>.</p>
      <p style="color:#A8A69E;">Next steps:</p>
      <ul style="color:#A8A69E;padding-left:20px;">
        <li>Complete your profile in onboarding</li>
        <li>${role === 'employer' ? 'Post your first job or browse talent' : 'Create services and browse jobs'}</li>
        <li>Get verified for the trusted badge</li>
      </ul>
      ${buttonHtml('Complete Profile', `${PLATFORM_URL}/onboarding`)}
      <p style="color:#555550;margin-top:24px;font-size:14px;">Follow us: <a href="https://www.instagram.com/vorakfreelancers/" style="color:#0F6E56;">Instagram</a> · <a href="https://www.tiktok.com/@vorak.freelancers" style="color:#0F6E56;">TikTok</a></p>
    `

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'Vorak Freelance <hello@vorakfreelance.com>',
      to: [email],
      subject: 'Welcome to Vorak Freelance',
      html: emailWrapper(html),
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to send welcome email')
  }

  return response.json()
}

export async function sendAdminAlert({ subject, html }) {
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL
  return sendEmail({ to: adminEmail, subject, html })
}

export { buttonHtml, emailWrapper, FROM_EMAIL, PLATFORM_URL }
