
import QRCode from 'qrcode'

export const generateQrcode = ({ data = '' } = {}) => {
  const qrCode = QRCode.toDataURL(JSON.stringify(data),
    { errorCorrectionLevel: 'H' }
  )
  return qrCode
}