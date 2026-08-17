// Serverless function (Vercel) que recibe el formulario de contacto y lo envia
// por correo usando el SMTP de BanaHosting. Las credenciales viven en variables
// de entorno de Vercel, nunca en el repo:
//
//   SMTP_HOST   ej. mail.barmoredsecurity.com
//   SMTP_PORT   465 (SSL) o 587 (STARTTLS)
//   SMTP_USER   abraham.karam@barmoredsecurity.com
//   SMTP_PASS   la contrasena del buzon
//   CONTACT_TO  destino de los mensajes (por defecto SMTP_USER)

const nodemailer = require('nodemailer');

function esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  // Vercel parsea el JSON automaticamente, pero por si acaso lo cubrimos.
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  const name = (body.name || '').toString().trim();
  const phone = (body.phone || '').toString().trim();
  const email = (body.email || '').toString().trim();
  const message = (body.message || '').toString().trim();

  if (!name || !phone || !email || !message) {
    res.status(400).json({ ok: false, error: 'Faltan campos obligatorios' });
    return;
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    console.error('SMTP no configurado: faltan variables de entorno.');
    res.status(500).json({ ok: false, error: 'Servidor de correo no configurado' });
    return;
  }

  const port = Number(SMTP_PORT);
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465, // 465 = SSL directo; 587 = STARTTLS
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  // Destinatarios del formulario. Ambos reciben el mensaje como TO directo.
  // Se dejan fijos aqui a proposito para no depender de la variable
  // CONTACT_TO (que ya no se usa; puede borrarse de Vercel).
  const to = 'abraham.karam@barmoredsecurity.com, soporte@barmoredsecurity.com';

  try {
    await transporter.sendMail({
      from: `"Formulario web" <${SMTP_USER}>`,
      to,
      replyTo: email,
      subject: `Nuevo contacto web: ${name}`,
      text:
        `Nombre: ${name}\n` +
        `Telefono: ${phone}\n` +
        `Correo: ${email}\n\n` +
        `Mensaje:\n${message}\n`,
      html:
        `<h2>Nuevo mensaje desde barmoredsecurity.com</h2>` +
        `<p><strong>Nombre:</strong> ${esc(name)}</p>` +
        `<p><strong>Tel&eacute;fono:</strong> ${esc(phone)}</p>` +
        `<p><strong>Correo:</strong> ${esc(email)}</p>` +
        `<p><strong>Mensaje:</strong><br>${esc(message).replace(/\n/g, '<br>')}</p>`,
    });
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Fallo al enviar correo:', err && err.message);
    res.status(502).json({ ok: false, error: 'No se pudo enviar el mensaje' });
  }
};
