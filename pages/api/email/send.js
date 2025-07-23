import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, subject, text, html } = req.body;

    // Validation des données
    if (!to || !subject || (!text && !html)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Paramètres manquants: to, subject et text/html sont requis' 
      });
    }

    // Configuration Gmail SMTP
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true pour 465, false pour 587
      auth: {
        user: process.env.SMTP_USER || process.env.GMAIL_USER,
        pass: process.env.SMTP_PASS || process.env.GMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000,
    });

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.GMAIL_USER || 'noreply@ecodeli.pro',
      to: to,
      subject: subject,
      text: text,
      html: html
    };

    // Test de la connexion avant l'envoi
    try {
      await transporter.verify();
      console.log('✅ Connexion Gmail SMTP réussie');
    } catch (verifyError) {
      console.warn('⚠️ Avertissement lors de la vérification Gmail:', verifyError.message);
      // Continue quand même, parfois verify() échoue mais sendMail() fonctionne
    }

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email envoyé avec succès via Gmail:', {
      messageId: info.messageId,
      to: to,
      subject: subject
    });

    return res.status(200).json({ 
      success: true, 
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected
    });

  } catch (error) {
    console.error('❌ Erreur envoi email Gmail:', error);
    
    // Messages d'erreur plus spécifiques selon le type d'erreur
    let errorMessage = error.message;
    if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Impossible de se connecter au serveur Gmail. Vérifiez votre connexion internet.';
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'Serveur Gmail non trouvé. Vérifiez votre connexion internet.';
    } else if (error.responseCode === 535) {
      errorMessage = 'Authentification Gmail échouée. Vérifiez votre mot de passe d\'application.';
    } else if (error.responseCode === 550) {
      errorMessage = 'Adresse email rejetée par Gmail.';
    }

    return res.status(500).json({ 
      success: false, 
      error: errorMessage,
      code: error.code,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 