import nodemailer from 'nodemailer'

interface OrderItem {
  name: string
  quantity: number
  price: string
}

interface EmailParams {
  to: string
  customerName: string
  orderNumber: string
  orderDate: string
  total: string
  subtotal?: string
  discount?: string
  promoCode?: string
  shippingCost?: string
  deliveryAddress: string
  deliveryMethod?: 'pickup' | 'shipping'
  billingAddress?: string
  trackingUrl?: string
  items?: OrderItem[]
}

let transporter: nodemailer.Transporter | null = null

function getTransporter() {
  if (transporter) return transporter

  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT || '587')
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const from = process.env.SMTP_FROM || 'orders@idealprix.tn'

  if (!host || !user || !pass) {
    console.warn('SMTP credentials not configured. Email sending disabled.')
    return null
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  })

  return transporter
}

function generateEmailHtml(params: EmailParams): string {
  const { customerName, orderNumber, orderDate, total, subtotal, discount, promoCode, shippingCost, deliveryAddress, deliveryMethod, billingAddress, trackingUrl = '#', items = [] } = params
  const brandName = process.env.BRAND_NAME || 'Ideal Prix'
  const supportPhone = process.env.SUPPORT_PHONE || ''
  const supportEmail = process.env.SUPPORT_EMAIL || ''

  // Use billing address for pickup, shipping address otherwise
  const displayAddress = deliveryMethod === 'pickup' && billingAddress ? billingAddress : deliveryAddress

  const itemsHtml = items.map(item => `
    <tr style="border-bottom: 1px solid #f2e8e8;">
      <td style="padding: 15px 10px;">
        <div style="font-weight: bold; font-size: 16px; color: #111; margin-bottom: 5px;">${item.name}</div>
        <div style="font-size: 14px; color: #777;">Quantité : ${item.quantity}</div>
      </td>
      <td style="padding: 15px 10px; text-align: right; font-weight: bold; font-size: 20px; color: #111;">${item.price}</td>
    </tr>
  `).join('')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Commande confirmée - ${brandName}</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #FFFAFA; padding: 40px 20px;">
  <div style="max-width: 720px; margin: 0 auto; background-color: white; border-radius: 24px; overflow: hidden; border: 1px solid #f1eaea;">
    
<div style="background-color: #D4302A; padding: 40px 40px 30px; text-align: center;">
      <div style="margin-bottom: 30px;">
        <div style="display: inline-block; background-color: white; padding: 8px 16px; border-radius: 8px;">
          <span style="font-weight: bold; font-size: 24px; color: #D4302A; letter-spacing: 1px;">IDEAL PRIX</span>
        </div>
      </div>
      
      <h1 style="color: white; font-size: 36px; font-weight: bold; margin: 0 0 15px;">Paiement confirmé</h1>
      <p style="color: rgba(255,255,255,0.9); font-size: 18px; margin: 0;">
        Merci pour votre commande, <span style="font-weight: bold;">${customerName}</span>. Votre paiement a été validé avec succès.
      </p>
    </div>

    <div style="padding: 40px;">
      <div style="margin-bottom: 30px; border: 1px solid #efe4e4; border-radius: 20px; padding: 25px; background-color: white;">
        <h2 style="font-size: 24px; font-weight: bold; margin: 0 0 20px; color: #121212;">Détails de la commande</h2>
        
<table style="width: 100%; border-collapse: collapse;">
           <tbody>
             <tr style="border-bottom: 1px solid #f4eeee;">
               <td style="padding: 15px 10px; color: #666; font-size: 16px;">Numéro de commande</td>
               <td style="padding: 15px 10px; text-align: right; font-size: 18px; font-weight: bold; color: #D4302A;">${orderNumber}</td>
             </tr>
             <tr style="border-bottom: 1px solid #f4eeee;">
               <td style="padding: 15px 10px; color: #666; font-size: 16px;">Date</td>
               <td style="padding: 15px 10px; text-align: right; font-size: 16px; color: #111;">${orderDate}</td>
             </tr>
<tr style="border-bottom: 1px solid #f4eeee;">
                <td style="padding: 15px 10px; color: #666; font-size: 16px;">${deliveryMethod === 'pickup' ? 'Retrait' : 'Livraison'}</td>
                <td style="padding: 15px 10px; text-align: right; font-size: 16px; color: #111;">${displayAddress}</td>
              </tr>
              ${subtotal ? `
              <tr style="border-bottom: 1px solid #f4eeee;">
                <td style="padding: 15px 10px; color: #666; font-size: 16px;">Sous-total</td>
                <td style="padding: 15px 10px; text-align: right; font-size: 16px; color: #111;">${subtotal}</td>
              </tr>
              ` : ''}
              ${discount && promoCode ? `
              <tr style="border-bottom: 1px solid #f4eeee;">
                <td style="padding: 15px 10px; color: #666; font-size: 16px;">Remise (${promoCode})</td>
                <td style="padding: 15px 10px; text-align: right; font-size: 16px; color: #d4302a;">-${discount}</td>
              </tr>
              ` : ''}
              ${shippingCost ? `
              <tr style="border-bottom: 1px solid #f4eeee;">
                <td style="padding: 15px 10px; color: #666; font-size: 16px;">Frais de livraison</td>
                <td style="padding: 15px 10px; text-align: right; font-size: 16px; color: #111;">${shippingCost}</td>
              </tr>
              ` : ''}
              <tr style="background-color: #fffafa;">
                <td style="padding: 20px 10px; font-size: 18px; font-weight: bold; color: #222;">Total payé</td>
                <td style="padding: 20px 10px; text-align: right; font-size: 32px; font-weight: bold; color: #D4302A;">${total}</td>
              </tr>
           </tbody>
         </table>
      </div>

      ${items.length > 0 ? `
      <div style="margin-bottom: 30px; border: 1px solid #efe4e4; border-radius: 20px; padding: 25px; background-color: white;">
        <h2 style="font-size: 24px; font-weight: bold; margin: 0 0 20px; color: #121212;">Articles commandés</h2>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
      </div>
      ` : ''}

      <div style="text-align: center; margin-bottom: 30px;">
        <a href="${trackingUrl}" style="display: inline-block; background-color: #D4302A; color: white; padding: 20px 40px; border-radius: 50px; text-decoration: none; font-size: 18px; font-weight: bold;">Suivre ma commande</a>
      </div>

      <div style="border-top: 1px solid #ece3e3; padding-top: 30px; text-align: center;">
        <h3 style="font-size: 32px; font-weight: bold; margin: 0 0 15px; color: #111;">${brandName}</h3>
        <p style="font-size: 14px; color: #777; margin: 0 0 20px;">Produits du quotidien, cosmétiques et entretien livrés rapidement partout en Tunisie.</p>
        <p style="font-size: 12px; color: #aaa;">
          © 2026 ${brandName}. Tous droits réservés.
          ${supportPhone ? ` | Tél : ${supportPhone}` : ''}
          ${supportEmail ? ` | Email : ${supportEmail}` : ''}
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `
}

export async function sendOrderConfirmationEmail(params: EmailParams): Promise<boolean> {
  const transporter = getTransporter()
  if (!transporter) {
    console.warn('Skipping email - SMTP not configured')
    return false
  }

  const { to } = params
  const html = generateEmailHtml(params)
  const from = process.env.SMTP_FROM || 'orders@idealprix.tn'

  try {
    await transporter.sendMail({
      from,
      to,
      subject: `Commande confirmée - ${params.orderNumber}`,
      html,
    })
    console.log(`Order confirmation email sent to ${to}`)
    return true
  } catch (error) {
    console.error('Failed to send email:', error)
    return false
  }
}