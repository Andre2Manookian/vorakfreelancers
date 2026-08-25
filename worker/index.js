const jsonHeaders = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: jsonHeaders,
  })
}

async function parseJson(request) {
  try {
    return await request.json()
  } catch {
    return null
  }
}

function isValidEmail(value) {
  return typeof value === 'string' && value.includes('@') && value.length <= 320
}

async function handleEmail(request, env) {
  const body = await parseJson(request)
  if (!body || !Array.isArray(body.to) ||
      body.to.some((email) => !isValidEmail(email)) ||
      typeof body.subject !== 'string' || typeof body.html !== 'string') {
    return json({ message: 'Invalid email request' }, 400)
  }

  const recipients = body.to.length > 0 ? body.to : [env.ADMIN_EMAIL]
  if (!isValidEmail(recipients[0])) return json({ message: 'Email recipient is not configured' }, 500)

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'Vorak Freelance <hello@vorakfreelance.com>',
      to: recipients,
      subject: body.subject,
      html: body.html,
    }),
  })

  return new Response(await response.text(), {
    status: response.status,
    headers: jsonHeaders,
  })
}

async function handleCrypto(request, env) {
  const body = await parseJson(request)
  const amount = Number(body?.amount)
  if (!Number.isFinite(amount) || amount <= 0 ||
      typeof body?.orderId !== 'string' || typeof body?.orderDescription !== 'string') {
    return json({ message: 'Invalid payment request' }, 400)
  }

  const response = await fetch('https://api.nowpayments.io/v1/payment', {
    method: 'POST',
    headers: {
      'x-api-key': env.NOWPAYMENTS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pay_currency: 'usdttrc20',
      price_amount: amount.toFixed(2),
      price_currency: 'usd',
      order_id: body.orderId,
      order_description: body.orderDescription,
    }),
  })

  return new Response(await response.text(), {
    status: response.status,
    headers: jsonHeaders,
  })
}

async function handleCryptoStatus(paymentId, env) {
  const response = await fetch(
    `https://api.nowpayments.io/v1/payment/${encodeURIComponent(paymentId)}`,
    { headers: { 'x-api-key': env.NOWPAYMENTS_API_KEY } }
  )
  return new Response(await response.text(), {
    status: response.status,
    headers: jsonHeaders,
  })
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (request.method === 'POST' && url.pathname === '/api/email') {
      return handleEmail(request, env)
    }
    if (request.method === 'POST' && url.pathname === '/api/payments/crypto') {
      return handleCrypto(request, env)
    }
    if (request.method === 'GET' && url.pathname.startsWith('/api/payments/crypto/')) {
      return handleCryptoStatus(url.pathname.split('/').pop(), env)
    }
    if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      return env.ASSETS.fetch(request)
    }

    return fetch(request)
  },
}
