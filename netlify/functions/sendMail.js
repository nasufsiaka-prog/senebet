const nodemailer = require('nodemailer');

exports.handler = async (event, context) => {
  // N'accepter que les requêtes POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { email, otpCode } = JSON.parse(event.body);

  // Configuration de Gmail avec le mot de passe d'application
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_EMAIL, // Ton adresse gmail
      pass: process.env.GMAIL_APP_PASSWORD // Le mot de passe à 16 lettres généré
    }
  });

  const mailOptions = {
    from: `SENEBET Casino <${process.env.GMAIL_EMAIL}>`,
    to: email,
    subject: `Votre code SENEBET : ${otpCode}`,
    html: `
      <div style="background-color: #0f172a; color: white; padding: 40px; font-family: sans-serif; border-radius: 20px; max-width: 500px; margin: auto;">
          <h1 style="color: #10b981; text-align: center;">BIENVENUE SUR SENEBET</h1>
          <p style="text-align: center; font-size: 16px;">Voici votre code de sécurité pour accéder à votre compte :</p>
          <div style="background: #1e293b; padding: 20px; text-align: center; border-radius: 10px; margin: 30px 0;">
              <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #fbbf24;">${otpCode}</span>
          </div>
          <p style="font-size: 12px; color: #64748b; text-align: center;">Ce code est valide pendant 10 minutes. Ne le partagez avec personne.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Email envoyé avec succès' }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
