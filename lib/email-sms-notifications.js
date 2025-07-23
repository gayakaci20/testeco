import nodemailer from 'nodemailer';

// Email configuration - Gmail SMTP
const emailTransporter = nodemailer.createTransport({
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
  debug: process.env.NODE_ENV === 'development', // Debug en développement
});

// SMS configuration (Twilio) - Lazy initialization
let twilioClient = null;

function getTwilioClient() {
  if (!twilioClient && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    try {
      const twilio = require('twilio');
      twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    } catch (error) {
      console.warn('Twilio configuration error:', error.message);
      twilioClient = null;
    }
  }
  return twilioClient;
}

// Email templates
const emailTemplates = {
  WELCOME: {
    subject: 'Bienvenue sur ecodeli! 🌱',
    html: (data) => {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || process.env.VERCEL_URL || '';
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background:#f9fafb; border-radius:8px; overflow:hidden;">
          <div style="background: linear-gradient(90deg,#38bdf8,#2563eb); padding: 30px 20px; text-align:center;">
            <h1 style="color:#ffffff; margin:0; font-size:24px;">Bienvenue sur ecodeli!</h1>
          </div>
          <div style="text-align:center; margin-top:-60px;">
          </div>
          <div style="padding: 30px; color:#1f2937;">
            <h2 style="margin-top:0;">Bonjour ${data.firstName}!</h2>
            <p>Nous sommes ravis de vous accueillir sur ecodeli, votre plateforme de livraison écologique.</p>
            <p>Votre compte a été créé avec succès. Vous pouvez maintenant :</p>
            <ul style="padding-left:18px;">
              <li>📦 Envoyer des colis</li>
              <li>🚚 Proposer des trajets</li>
              <li>🛍️ Réserver des services</li>
              <li>📱 Recevoir des notifications en temps réel</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${baseUrl}/dashboard" style="background:#38bdf8;color:white;padding:12px 24px;text-decoration:none;border-radius:6px; font-weight:bold;">Accéder à mon tableau de bord</a>
            </div>
            <p style="font-size:14px;color:#6b7280;">Si vous avez des questions, n'hésitez pas à nous contacter</p>
          </div>
        </div>`;
    }
  },

  BOOKING_CONFIRMATION: {
    subject: 'Confirmation de réservation - ecodeli',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4CAF50; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Réservation Confirmée ✅</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Bonjour ${data.customerName}!</h2>
          <p>Votre réservation a été confirmée avec succès.</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3>Détails de la réservation:</h3>
            <p><strong>Service:</strong> ${data.serviceName}</p>
            <p><strong>Date:</strong> ${data.date}</p>
            <p><strong>Heure:</strong> ${data.time}</p>
            <p><strong>Adresse:</strong> ${data.address}</p>
            <p><strong>Prix:</strong> €${data.price}</p>
          </div>
          <p>Le prestataire vous contactera bientôt pour finaliser les détails.</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/bookings/${data.bookingId}" 
               style="background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
              Voir ma réservation
            </a>
          </div>
        </div>
      </div>
    `
  },

  DELIVERY_UPDATE: {
    subject: 'Mise à jour de livraison - ecodeli',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #FF9800; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Mise à jour de livraison 📦</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Bonjour ${data.customerName}!</h2>
          <p>Nous avons une mise à jour concernant votre colis.</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3>Statut: ${data.status}</h3>
            <p><strong>Colis:</strong> #${data.packageId}</p>
            <p><strong>Transporteur:</strong> ${data.carrierName}</p>
            <p><strong>Message:</strong> ${data.message}</p>
            ${data.estimatedDelivery ? `<p><strong>Livraison estimée:</strong> ${data.estimatedDelivery}</p>` : ''}
          </div>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/packages/${data.packageId}" 
               style="background: #FF9800; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
              Suivre mon colis
            </a>
          </div>
        </div>
      </div>
    `
  },

  PAYMENT_CONFIRMATION: {
    subject: 'Confirmation de paiement - ecodeli',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2196F3; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Paiement Confirmé 💳</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Bonjour ${data.customerName}!</h2>
          <p>Votre paiement a été traité avec succès.</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3>Détails du paiement:</h3>
            <p><strong>Montant:</strong> €${data.amount}</p>
            <p><strong>Transaction ID:</strong> ${data.transactionId}</p>
            <p><strong>Date:</strong> ${data.date}</p>
            <p><strong>Méthode:</strong> ${data.paymentMethod}</p>
          </div>
          <p>Un reçu détaillé est disponible dans votre espace client.</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/payments/${data.paymentId}" 
               style="background: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
              Voir le reçu
            </a>
          </div>
        </div>
      </div>
    `
  },

  SECURITY_ALERT: {
    subject: '🔒 Alerte de sécurité - ecodeli',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f44336; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Alerte de Sécurité 🔒</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Bonjour ${data.firstName}!</h2>
          <p style="color: #d32f2f; font-weight: bold;">Une activité suspecte a été détectée sur votre compte.</p>
          <div style="background: #ffebee; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #f44336;">
            <h3>Détails de l'activité:</h3>
            <p><strong>Type:</strong> ${data.activityType}</p>
            <p><strong>Date/Heure:</strong> ${data.timestamp}</p>
            <p><strong>Adresse IP:</strong> ${data.ipAddress}</p>
            <p><strong>Localisation:</strong> ${data.location}</p>
          </div>
          <p>Si cette activité n'est pas de votre fait, veuillez:</p>
          <ol>
            <li>Changer votre mot de passe immédiatement</li>
            <li>Vérifier vos paramètres de sécurité</li>
            <li>Nous contacter si nécessaire</li>
          </ol>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/security" 
               style="background: #f44336; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
              Sécuriser mon compte
            </a>
          </div>
        </div>
      </div>
    `
  },

  EMAIL_VERIFICATION: {
    subject: 'Vérifiez votre compte - ecodeli',
    html: (data) => {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || process.env.VERCEL_URL || '';
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background:#f9fafb; border-radius:8px; overflow:hidden;">
          <div style="background: linear-gradient(90deg,#38bdf8,#2563eb); padding: 30px 20px; text-align:center;">
            <h1 style="color:#ffffff; margin:0; font-size:24px;">Confirmez votre adresse email ✅</h1>
          </div>
          <div style="text-align:center; margin-top:-60px;">
          </div>
          <div style="padding: 30px; color:#1f2937;">
            <h2 style="margin-top:0;">Bonjour ${data.firstName || 'utilisateur'} !</h2>
            <p>Merci de vous être inscrit sur ecodeli. Cliquez sur le bouton ci-dessous pour activer votre compte :</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.verificationUrl}" style="background:#38bdf8;color:white;padding:12px 24px;text-decoration:none;border-radius:6px; font-weight:bold;">Vérifier mon compte</a>
            </div>
            <p style="font-size:14px;color:#6b7280;">Si vous n'avez pas créé de compte, ignorez simplement cet email.</p>
          </div>
        </div>`;
    }
  },

  PASSWORD_RESET: {
    subject: 'Réinitialisation du mot de passe - ecodeli',
    html: (data) => {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || process.env.VERCEL_URL || '';
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background:#f9fafb; border-radius:8px; overflow:hidden;">
          <div style="background: linear-gradient(90deg,#38bdf8,#2563eb); padding: 30px 20px; text-align:center;">
            <h1 style="color:#ffffff; margin:0; font-size:24px;">Réinitialisation du mot de passe 🔑</h1>
          </div>
          <div style="text-align:center; margin-top:-60px;">
          </div>
          <div style="padding: 30px; color:#1f2937;">
            <h2 style="margin-top:0;">Bonjour ${data.firstName || 'utilisateur'} !</h2>
            <p>Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte ecodeli.</p>
            <p>Si vous êtes à l'origine de cette demande, cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.resetUrl}" style="background:#38bdf8;color:white;padding:12px 24px;text-decoration:none;border-radius:6px; font-weight:bold;">Choisir un nouveau mot de passe</a>
            </div>
            <p style="font-size:14px;color:#6b7280;">Si vous n'avez pas demandé de réinitialisation, ignorez simplement cet email.</p>
          </div>
        </div>`;
    }
  },

  // Templates pour les notifications système
  NEW_MESSAGE: {
    subject: '💬 Nouveau message - ecodeli',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #6366f1; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Nouveau message reçu 💬</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Bonjour ${data.firstName}!</h2>
          <p>Vous avez reçu un nouveau message de <strong>${data.senderName}</strong>.</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>De:</strong> ${data.senderName}</p>
            <p><strong>Aperçu:</strong> ${data.messagePreview}</p>
          </div>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/messages" 
               style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
              Lire le message
            </a>
          </div>
        </div>
      </div>
    `
  },

  MATCH_UPDATE: {
    subject: '📦 Nouvelle proposition de transport - ecodeli',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f59e0b; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Nouvelle proposition de transport 📦</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Bonjour ${data.firstName}!</h2>
          <p><strong>${data.carrierName}</strong> propose de transporter votre colis.</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Colis:</strong> ${data.packageDescription}</p>
            <p><strong>Transporteur:</strong> ${data.carrierName}</p>
            <p><strong>Prix proposé:</strong> €${data.price}</p>
            <p><strong>Trajet:</strong> ${data.route || 'Détails disponibles en ligne'}</p>
          </div>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/packages/${data.packageId}" 
               style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
              Voir la proposition
            </a>
          </div>
        </div>
      </div>
    `
  },

  RIDE_REQUEST: {
    subject: '🚗 Nouvelle demande de course - ecodeli',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #10b981; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Nouvelle demande de course 🚗</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Bonjour ${data.firstName}!</h2>
          <p><strong>${data.passengerName}</strong> souhaite réserver une place sur votre trajet.</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Passager:</strong> ${data.passengerName}</p>
            <p><strong>Trajet:</strong> ${data.route}</p>
            <p><strong>Date:</strong> ${data.date}</p>
            <p><strong>Message:</strong> ${data.message || 'Aucun message'}</p>
          </div>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/rides/${data.rideId}" 
               style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
              Voir la demande
            </a>
          </div>
        </div>
      </div>
    `
  },

  BOOKING_REQUEST: {
    subject: '📅 Nouvelle réservation de service - ecodeli',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #8b5cf6; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Nouvelle réservation 📅</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Bonjour ${data.firstName}!</h2>
          <p>Vous avez reçu une nouvelle demande de réservation pour votre service.</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Service:</strong> ${data.serviceName}</p>
            <p><strong>Client:</strong> ${data.customerName}</p>
            <p><strong>Date souhaitée:</strong> ${data.date}</p>
            <p><strong>Prix:</strong> €${data.price}</p>
            <p><strong>Notes:</strong> ${data.notes || 'Aucune note'}</p>
          </div>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/provider" 
               style="background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
              Gérer la réservation
            </a>
          </div>
        </div>
      </div>
    `
  },

  STORAGE_RENTAL: {
    subject: '📦 Nouvelle demande de location - ecodeli',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #ec4899; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Nouvelle demande de location 📦</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Bonjour ${data.firstName}!</h2>
          <p>Vous avez reçu une nouvelle demande de location pour votre boîte de stockage.</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Boîte:</strong> ${data.storageBoxName}</p>
            <p><strong>Locataire:</strong> ${data.customerName}</p>
            <p><strong>Durée:</strong> ${data.duration} jours</p>
            <p><strong>Prix/jour:</strong> €${data.dailyPrice}</p>
            <p><strong>Total:</strong> €${data.totalPrice}</p>
          </div>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/provider" 
               style="background: #ec4899; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
              Gérer la demande
            </a>
          </div>
        </div>
      </div>
    `
  },

  PAYMENT_SUCCESS: {
    subject: '💳 Paiement effectué - ecodeli',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #059669; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Paiement effectué 💳</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Bonjour ${data.firstName}!</h2>
          <p>Un paiement a été effectué avec succès.</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Montant:</strong> €${data.amount}</p>
            <p><strong>Service:</strong> ${data.description || 'Transaction'}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
            <p><strong>ID Transaction:</strong> ${data.transactionId}</p>
          </div>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/payments" 
               style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
              Voir mes paiements
            </a>
          </div>
        </div>
      </div>
    `
  },

  PAYMENT_REQUIRED: {
    subject: '💰 Paiement requis - ecodeli',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #dc2626; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Paiement requis 💰</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Bonjour ${data.firstName}!</h2>
          <p>Un paiement est requis pour finaliser votre transaction.</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Service:</strong> ${data.serviceName || 'Transaction'}</p>
            <p><strong>Montant:</strong> €${data.amount}</p>
            <p><strong>Échéance:</strong> ${data.deadline || 'Dans les plus brefs délais'}</p>
          </div>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/payments/process?id=${data.paymentId}" 
               style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
              Effectuer le paiement
            </a>
          </div>
        </div>
      </div>
    `
  },

  PACKAGE_UPDATE: {
    subject: '📦 Mise à jour de votre colis - ecodeli',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0ea5e9; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Mise à jour colis 📦</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Bonjour ${data.firstName}!</h2>
          <p>Nous avons une mise à jour concernant votre colis.</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Colis:</strong> ${data.packageDescription}</p>
            <p><strong>Statut:</strong> ${data.status}</p>
            <p><strong>Message:</strong> ${data.message}</p>
            ${data.location ? `<p><strong>Localisation:</strong> ${data.location}</p>` : ''}
          </div>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/packages/${data.packageId}" 
               style="background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
              Suivre mon colis
            </a>
          </div>
        </div>
      </div>
    `
  },

  RIDE_UPDATE: {
    subject: '🚗 Mise à jour de votre trajet - ecodeli',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #7c3aed; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Mise à jour trajet 🚗</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Bonjour ${data.firstName}!</h2>
          <p>Votre trajet a été mis à jour.</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Trajet:</strong> ${data.route}</p>
            <p><strong>Statut:</strong> ${data.status}</p>
            <p><strong>Message:</strong> ${data.message}</p>
          </div>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/rides/${data.rideId}" 
               style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
              Voir mon trajet
            </a>
          </div>
        </div>
      </div>
    `
  },

  GENERAL: {
    subject: '🔔 Notification - ecodeli',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #6b7280; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">${data.title || 'Notification'} 🔔</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Bonjour ${data.firstName}!</h2>
          <p>${data.message}</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
               style="background: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
               Accéder à mon compte
            </a>
          </div>
        </div>
      </div>
    `
  }
};

// SMS templates
const smsTemplates = {
  BOOKING_CONFIRMATION: (data) => 
    `ecodeli: Réservation confirmée! Service: ${data.serviceName}, Date: ${data.date} à ${data.time}. Détails: ${process.env.NEXT_PUBLIC_APP_URL}/bookings/${data.bookingId}`,
  
  DELIVERY_UPDATE: (data) => 
    `ecodeli: Mise à jour colis #${data.packageId}. Statut: ${data.status}. ${data.message} Suivi: ${process.env.NEXT_PUBLIC_APP_URL}/packages/${data.packageId}`,
  
  PAYMENT_CONFIRMATION: (data) => 
    `ecodeli: Paiement de €${data.amount} confirmé. Transaction: ${data.transactionId}. Reçu: ${process.env.NEXT_PUBLIC_APP_URL}/payments/${data.paymentId}`,
  
  SECURITY_ALERT: (data) => 
    `ecodeli ALERTE: Activité suspecte détectée sur votre compte (${data.activityType}). Sécurisez votre compte: ${process.env.NEXT_PUBLIC_APP_URL}/security`,
  
  MATCH_FOUND: (data) => 
    `ecodeli: Nouveau match trouvé! Transporteur disponible pour votre colis. Voir: ${process.env.NEXT_PUBLIC_APP_URL}/matches`,
  
  DELIVERY_COMPLETED: (data) => 
    `ecodeli: Votre colis #${data.packageId} a été livré avec succès! Merci d'avoir utilisé ecodeli.`
};

// Main notification service
export class EmailSMSNotificationService {
  
  // Send email notification
  static async sendEmail(to, templateType, data) {
    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('Email credentials not configured, skipping email notification');
        return { success: false, reason: 'Email not configured' };
      }

      const template = emailTemplates[templateType];
      if (!template) {
        throw new Error(`Email template ${templateType} not found`);
      }

      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@ecodeli.pro', // Utilise le domaine configuré dans Postfix
        to: to,
        subject: template.subject,
        html: template.html(data)
      };

      const result = await emailTransporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send SMS notification
  static async sendSMS(to, templateType, data) {
    try {
      const client = getTwilioClient();
      if (!client) {
        console.warn('Twilio not configured, skipping SMS notification');
        return { success: false, reason: 'SMS not configured' };
      }

      const template = smsTemplates[templateType];
      if (!template) {
        throw new Error(`SMS template ${templateType} not found`);
      }

      const message = await client.messages.create({
        body: template(data),
        from: process.env.TWILIO_PHONE_NUMBER,
        to: to
      });

      console.log('SMS sent successfully:', message.sid);
      
      return { success: true, messageId: message.sid };
    } catch (error) {
      console.error('Error sending SMS:', error);
      return { success: false, error: error.message };
    }
  }

  // Send both email and SMS (backup communication)
  static async sendBothNotifications(email, phone, templateType, data) {
    const results = {
      email: null,
      sms: null
    };

    // Send email
    if (email) {
      results.email = await this.sendEmail(email, templateType, data);
    }

    // Send SMS
    if (phone) {
      results.sms = await this.sendSMS(phone, templateType, data);
    }

    return results;
  }

  // Send notification based on user preferences
  static async sendNotificationByPreference(user, templateType, data) {
    const results = {
      email: null,
      sms: null,
      push: null
    };

    // Check user notification preferences
    const preferences = user.notificationPreferences || {};
    
    // Send email if enabled
    if (preferences.email !== false && user.email) {
      results.email = await this.sendEmail(user.email, templateType, data);
    }

    // Send SMS if enabled
    if (preferences.sms === true && user.phone) {
      results.sms = await this.sendSMS(user.phone, templateType, data);
    }

    // For critical notifications, send both regardless of preferences
    const criticalTypes = ['SECURITY_ALERT', 'PAYMENT_CONFIRMATION'];
    if (criticalTypes.includes(templateType)) {
      if (user.email && !results.email) {
        results.email = await this.sendEmail(user.email, templateType, data);
      }
      if (user.phone && !results.sms) {
        results.sms = await this.sendSMS(user.phone, templateType, data);
      }
    }

    return results;
  }

  // Fonction utilitaire pour envoyer un email automatique lors de la création d'une notification
  static async sendNotificationEmail(notification, userData) {
    try {
      // Mapping des types de notifications vers les templates d'emails
      const notificationToEmailTemplate = {
        'NEW_MESSAGE': 'NEW_MESSAGE',
        'MATCH_UPDATE': 'MATCH_UPDATE', 
        'RIDE_REQUEST': 'RIDE_REQUEST',
        'RIDE_UPDATE': 'RIDE_UPDATE',
        'BOOKING_REQUEST': 'BOOKING_REQUEST',
        'BOOKING_CONFIRMED': 'BOOKING_CONFIRMATION',
        'BOOKING_UPDATE': 'BOOKING_CONFIRMATION',
        'STORAGE_RENTAL': 'STORAGE_RENTAL',
        'RENTAL_CONFIRMED': 'BOOKING_CONFIRMATION',
        'PAYMENT_SUCCESS': 'PAYMENT_SUCCESS',
        'PAYMENT_REQUIRED': 'PAYMENT_REQUIRED',
        'PAYMENT_UPDATE': 'PAYMENT_SUCCESS',
        'PACKAGE_UPDATE': 'PACKAGE_UPDATE',
        'DELIVERY_ACCEPTED': 'DELIVERY_UPDATE',
        'DELIVERY_STARTED': 'DELIVERY_UPDATE',
        'DELIVERY_COMPLETED': 'DELIVERY_UPDATE',
        'DELIVERY_CANCELLED': 'DELIVERY_UPDATE',
        'TRANSPORT_REQUEST': 'PACKAGE_UPDATE',
        'MATCH_ACCEPTED': 'MATCH_UPDATE',
        'MATCH_PROPOSED': 'MATCH_UPDATE',
        'NEW_RELAY_PROPOSAL': 'PACKAGE_UPDATE',
        'RELAY_CONFIRMED': 'PACKAGE_UPDATE',
        'RIDE_ACCEPTED': 'RIDE_UPDATE',
        'RIDE_REJECTED': 'RIDE_UPDATE',
        'PACKAGE_DELIVERED': 'DELIVERY_UPDATE',
        'GENERAL': 'GENERAL'
      };

      // Obtenir le template d'email approprié
      const emailTemplateType = notificationToEmailTemplate[notification.type] || 'GENERAL';
      
      // Construire les données pour l'email
      const emailData = {
        firstName: userData.firstName || 'Utilisateur',
        title: notification.title,
        message: notification.message,
        ...notification.data,
        notificationType: notification.type
      };

      // Ajouter des données spécifiques selon le type
      switch (notification.type) {
        case 'NEW_MESSAGE':
          if (notification.data) {
            emailData.senderName = notification.data.senderName || 'Un utilisateur';
            emailData.messagePreview = notification.message || 'Nouveau message reçu';
          }
          break;
        
        case 'MATCH_UPDATE':
        case 'MATCH_PROPOSED':
          if (notification.data) {
            emailData.carrierName = notification.data.carrierName || 'Un transporteur';
            emailData.packageDescription = notification.data.packageDescription || 'Votre colis';
            emailData.price = notification.data.price || '0';
            emailData.packageId = notification.data.packageId || notification.relatedEntityId;
          }
          break;

        case 'RIDE_REQUEST':
        case 'RIDE_UPDATE':
          if (notification.data) {
            emailData.passengerName = notification.data.passengerName || 'Un passager';
            emailData.route = notification.data.route || 'Votre trajet';
            emailData.date = notification.data.date || new Date().toLocaleDateString('fr-FR');
            emailData.rideId = notification.data.rideId || notification.relatedEntityId;
            emailData.status = notification.data.status || 'Mise à jour';
          }
          break;

        case 'BOOKING_REQUEST':
        case 'BOOKING_CONFIRMED':
        case 'BOOKING_UPDATE':
          if (notification.data) {
            emailData.serviceName = notification.data.serviceName || 'Un service';
            emailData.customerName = notification.data.customerName || 'Un client';
            emailData.date = notification.data.date || new Date().toLocaleDateString('fr-FR');
            emailData.time = notification.data.time || 'À définir';
            emailData.price = notification.data.price || '0';
            emailData.notes = notification.data.notes;
            emailData.bookingId = notification.relatedEntityId;
          }
          break;

        case 'STORAGE_RENTAL':
        case 'RENTAL_CONFIRMED':
          if (notification.data) {
            emailData.storageBoxName = notification.data.storageBoxName || 'Boîte de stockage';
            emailData.customerName = notification.data.customerName || 'Un client';
            emailData.duration = notification.data.duration || '0';
            emailData.dailyPrice = notification.data.dailyPrice || '0';
            emailData.totalPrice = notification.data.totalPrice || '0';
          }
          break;

        case 'PAYMENT_SUCCESS':
        case 'PAYMENT_UPDATE':
          if (notification.data) {
            emailData.amount = notification.data.amount || '0';
            emailData.transactionId = notification.data.transactionId || 'N/A';
            emailData.description = notification.data.description || notification.message;
          }
          break;

        case 'PAYMENT_REQUIRED':
          if (notification.data) {
            emailData.amount = notification.data.amount || '0';
            emailData.serviceName = notification.data.serviceName || 'Service';
            emailData.deadline = notification.data.deadline;
            emailData.paymentId = notification.relatedEntityId;
          }
          break;

        case 'PACKAGE_UPDATE':
        case 'DELIVERY_ACCEPTED':
        case 'DELIVERY_STARTED':  
        case 'DELIVERY_COMPLETED':
        case 'DELIVERY_CANCELLED':
          if (notification.data) {
            emailData.packageDescription = notification.data.packageDescription || 'Votre colis';
            emailData.status = notification.data.status || notification.title;
            emailData.carrierName = notification.data.carrierName;
            emailData.location = notification.data.location;
            emailData.packageId = notification.data.packageId || notification.relatedEntityId;
          }
          break;
      }

      // Envoyer l'email
      const result = await this.sendEmail(userData.email, emailTemplateType, emailData);
      
      if (result.success) {
        console.log(`✅ Email de notification envoyé à ${userData.email} pour ${notification.type}`);
      } else {
        console.warn(`⚠️ Échec envoi email notification à ${userData.email}:`, result.error || result.reason);
      }

      return result;

    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi email notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Bulk notification sender
  static async sendBulkNotifications(recipients, templateType, data) {
    const results = [];
    
    for (const recipient of recipients) {
      const result = await this.sendNotificationByPreference(recipient, templateType, data);
      results.push({
        userId: recipient.id,
        email: recipient.email,
        phone: recipient.phone,
        results: result
      });
    }

    return results;
  }

  // Test email configuration
  static async testEmailConfiguration() {
    try {
      await emailTransporter.verify();
      console.log('Email configuration is valid');
      return { success: true };
    } catch (error) {
      console.error('Email configuration test failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Test SMS configuration
  static async testSMSConfiguration() {
    try {
      const client = getTwilioClient();
      if (!client) {
        return { success: false, error: 'Twilio not configured' };
      }

      // Test by fetching account info
      const account = await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
      console.log('SMS configuration is valid for account:', account.friendlyName);
      return { success: true, accountName: account.friendlyName };
    } catch (error) {
      console.error('SMS configuration test failed:', error);
      return { success: false, error: error.message };
    }
  }
}

export default EmailSMSNotificationService;