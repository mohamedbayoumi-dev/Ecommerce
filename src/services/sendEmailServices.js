

import nodemailer from 'nodemailer'

export async function sendEmailService({
  to,
  subject,
  message,
  attachments = []
} = {}) {

  const transporter = nodemailer.createTransport({
    host: 'localhost',
    port: 587,
    secure: false,
    service: 'gmail',
    auth: {
      user: 'mohamedelsayed10zm@gmail.com',
      pass: 'glus yfkt aqef qslx',
    }
  })

  const emailInfo = await transporter.sendMail({
    from: '"Fred Foo 👻" <mohamedelsayed10zm@gmail.com>',
    // cc:['',''],
    // bcc:['',''],
    to: to ? to : '',
    subject: subject ? subject : 'Hello',
    html: message ? message : '',
    attachments,
  })

  if (emailInfo.accepted.length) {
    return true
  }
  return false
  
}