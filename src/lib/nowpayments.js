const API_KEY = import.meta.env.VITE_NOWPAYMENTS_API_KEY
const WALLET_ADDRESS = import.meta.env.VITE_USDT_WALLET
const BASE_URL = 'https://api.nowpayments.io/v1'

function toDisplayAmount(amount) {
  const numeric = Number(amount || 0)
  return Number.isFinite(numeric) ? numeric.toFixed(2) : '0.00'
}

export async function createCryptoPayment({
  amount,
  orderId,
  orderDescription,
}) {
  if (!API_KEY) {
    return {
      paymentId: `CRYPTO-${orderId}`,
      payAddress: WALLET_ADDRESS,
      payAmount: toDisplayAmount(amount),
      payCurrency: 'usdttrc20',
      expirationEstimate: null,
      fallback: true,
    }
  }

  try {
    const response = await fetch(
      BASE_URL + '/payment',
      {
        method: 'POST',
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pay_currency: 'usdttrc20',
          price_amount: toDisplayAmount(amount),
          price_currency: 'usd',
          order_id: orderId,
          order_description: orderDescription,
        }),
      }
    )

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
  } catch (error) {
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
  try {
    const response = await fetch(
      BASE_URL + '/payment/' + paymentId,
      {
        headers: { 'x-api-key': API_KEY },
      }
    )
    const data = await response.json()
    return data.payment_status
  } catch (error) {
    return null
  }
}
