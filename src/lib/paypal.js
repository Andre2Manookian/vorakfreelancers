const CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID
const PAYPAL_EMAIL = import.meta.env.VITE_PAYPAL_EMAIL

let sdkLoaded = false
let sdkLoading = null

export function loadPayPalSDK() {
  if (sdkLoaded && window.paypal) return Promise.resolve(window.paypal)
  if (sdkLoading) return sdkLoading

  sdkLoading = new Promise((resolve, reject) => {
    if (window.paypal) {
      sdkLoaded = true
      resolve(window.paypal)
      return
    }

    const script = document.createElement('script')
    script.src = `https://www.paypal.com/sdk/js?client-id=${CLIENT_ID}&currency=USD&components=buttons&enable-funding=card`
    script.async = true
    script.onload = () => {
      sdkLoaded = true
      resolve(window.paypal)
    }
    script.onerror = () => reject(new Error('Failed to load PayPal SDK'))
    document.body.appendChild(script)
  })

  return sdkLoading
}

export function renderPayPalButton({
  container,
  amount,
  contractId,
  onApprove,
  onError,
}) {
  return loadPayPalSDK().then((paypal) => {
    if (!container) return null

    container.innerHTML = ''

    return paypal.Buttons({
      style: {
        color: 'gold',
        shape: 'rect',
        label: 'pay',
        height: 45,
      },
      createOrder: (_data, actions) => {
        return actions.order.create({
          purchase_units: [{
            amount: {
              value: Number(amount).toFixed(2),
              currency_code: 'USD',
            },
            description: `Vorak Contract ${contractId}`,
            custom_id: contractId,
          }],
        })
      },
      onApprove: async (data, actions) => {
        const details = await actions.order.capture()
        if (onApprove) await onApprove(data.orderID, details)
      },
      onError: (err) => {
        if (onError) onError(err)
      },
    }).render(container)
  })
}

export function getPaymentInstructions(amount, contractId) {
  return {
    amount: Number(amount).toFixed(2),
    paypalEmail: PAYPAL_EMAIL,
    reference: `CONTRACT-${contractId}`,
    instructions: `Send exactly $${Number(amount).toFixed(2)} to PayPal: ${PAYPAL_EMAIL}. Reference: CONTRACT-${contractId}`,
  }
}

export { CLIENT_ID, PAYPAL_EMAIL }
