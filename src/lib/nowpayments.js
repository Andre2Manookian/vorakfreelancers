const WALLET_ADDRESS = import.meta.env.VITE_USDT_WALLET

function toDisplayAmount(amount) {
  const numeric = Number(amount || 0)
  return Number.isFinite(numeric) ? numeric.toFixed(2) : '0.00'
}

export async function createCryptoPayment({
  amount,
  orderId,
  orderDescription,
}) {
  try {
    const response = await fetch('/api/payments/crypto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: toDisplayAmount(amount),
          orderId,
          orderDescription,
        }),
      })

    if (!response.ok) {
      throw new Error('NOWPayments unavailable')
    }

    const data = await response.json()
    return {
      paymentId: data.payment_id,
      payAddress: data.pay_address || WALLET_ADDRESS,
      payAmount: data.pay_amount || toDisplayAmount(amount),
      payCurrency: data.pay_currency || 'usdttrc20',
      expirationEstimate: data.expiration_estimate_date,
      fallback: false,
    }
  } catch {
    return {
      paymentId: `CRYPTO-${orderId}`,
      payAddress: WALLET_ADDRESS,
      payAmount: toDisplayAmount(amount),
      payCurrency: 'usdttrc20',
      expirationEstimate: null,
      fallback: true,
    }
  }
}

export async function checkPaymentStatus(paymentId) {
  if (!paymentId) return null
  try {
    const response = await fetch('/api/payments/crypto/' + encodeURIComponent(paymentId))
    const data = await response.json()
    return data.payment_status
  } catch {
    return null
  }
}
