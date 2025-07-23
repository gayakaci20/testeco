import { PrismaClient } from '@prisma/client';
import { EmailSMSNotificationService } from './email-sms-notifications.js';

const prisma = new PrismaClient();

/**
 * Crée une notification et envoie automatiquement un email correspondant
 * @param {Object} notificationData - Données de la notification à créer
 * @param {string} notificationData.userId - ID de l'utilisateur destinataire
 * @param {string} notificationData.type - Type de notification
 * @param {string} notificationData.title - Titre de la notification
 * @param {string} notificationData.message - Message de la notification
 * @param {string} [notificationData.relatedEntityId] - ID de l'entité liée (optionnel)
 * @param {Object} [notificationData.data] - Données additionnelles (optionnel)
 * @param {boolean} [notificationData.isRead] - Statut de lecture (défaut: false)
 * @returns {Promise<Object>} La notification créée
 */
export async function createNotificationWithEmail(notificationData) {
  try {
    // Créer la notification en base de données
    const notification = await prisma.notification.create({
      data: {
        userId: notificationData.userId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        relatedEntityId: notificationData.relatedEntityId || null,
        data: notificationData.data ? JSON.stringify(notificationData.data) : null,
        isRead: notificationData.isRead || false
      }
    });

    console.log(`✅ Notification créée: ${notification.type} pour utilisateur ${notification.userId}`);

    // Récupérer les données de l'utilisateur pour l'email
    try {
      const user = await prisma.user.findUnique({
        where: { id: notificationData.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          notificationPreferences: true
        }
      });

      if (user && user.email) {
        // Vérifier les préférences de notification de l'utilisateur
        const preferences = user.notificationPreferences || {};
        const emailEnabled = preferences.email !== false; // Par défaut, email activé

        if (emailEnabled) {
          // Envoyer l'email en arrière-plan (ne pas bloquer la réponse)
          setImmediate(async () => {
            try {
              // Préparer les données de notification pour l'email
              const notificationForEmail = {
                type: notification.type,
                title: notification.title,
                message: notification.message,
                relatedEntityId: notification.relatedEntityId,
                data: notificationData.data || {} // Utiliser les données originales non stringifiées
              };

              await EmailSMSNotificationService.sendNotificationEmail(notificationForEmail, user);
            } catch (emailError) {
              console.error('❌ Erreur envoi email pour notification:', emailError);
              // Ne pas faire échouer la création de notification si l'email échoue
            }
          });
        } else {
          console.log(`📧 Email désactivé pour utilisateur ${user.id}, notification ${notification.type} non envoyée`);
        }
      } else {
        console.warn(`⚠️ Utilisateur ${notificationData.userId} non trouvé ou sans email, notification ${notification.type} non envoyée par email`);
      }
    } catch (userError) {
      console.error('❌ Erreur récupération utilisateur pour email:', userError);
      // Ne pas faire échouer la création de notification si la récupération utilisateur échoue
    }

    return notification;

  } catch (error) {
    console.error('❌ Erreur création notification:', error);
    throw error;
  }
}

/**
 * Crée plusieurs notifications et envoie automatiquement les emails correspondants
 * @param {Array<Object>} notificationsData - Tableau des notifications à créer
 * @returns {Promise<Array<Object>>} Les notifications créées
 */
export async function createMultipleNotificationsWithEmail(notificationsData) {
  try {
    const createdNotifications = [];
    
    // Créer les notifications une par une pour pouvoir gérer les emails individuellement
    for (const notificationData of notificationsData) {
      try {
        const notification = await createNotificationWithEmail(notificationData);
        createdNotifications.push(notification);
      } catch (error) {
        console.error(`❌ Erreur création notification pour utilisateur ${notificationData.userId}:`, error);
        // Continuer avec les autres notifications même si une échoue
      }
    }

    console.log(`✅ ${createdNotifications.length}/${notificationsData.length} notifications créées avec succès`);
    return createdNotifications;

  } catch (error) {
    console.error('❌ Erreur création multiple notifications:', error);
    throw error;
  }
}

/**
 * Utilitaire pour créer des notifications avec données enrichies
 * @param {string} userId - ID de l'utilisateur
 * @param {string} type - Type de notification
 * @param {string} title - Titre
 * @param {string} message - Message
 * @param {Object} options - Options additionnelles
 * @returns {Promise<Object>} La notification créée
 */
export async function createEnrichedNotification(userId, type, title, message, options = {}) {
  const notificationData = {
    userId,
    type,
    title,
    message,
    relatedEntityId: options.relatedEntityId,
    data: options.data,
    isRead: options.isRead || false
  };

  return await createNotificationWithEmail(notificationData);
}

/**
 * Types de notifications disponibles (pour référence)
 */
export const NOTIFICATION_TYPES = {
  // Messages
  NEW_MESSAGE: 'NEW_MESSAGE',
  
  // Transport & Colis
  MATCH_UPDATE: 'MATCH_UPDATE',
  MATCH_ACCEPTED: 'MATCH_ACCEPTED',
  MATCH_PROPOSED: 'MATCH_PROPOSED',
  PACKAGE_UPDATE: 'PACKAGE_UPDATE',
  DELIVERY_ACCEPTED: 'DELIVERY_ACCEPTED',
  DELIVERY_STARTED: 'DELIVERY_STARTED',
  DELIVERY_COMPLETED: 'DELIVERY_COMPLETED',
  DELIVERY_CANCELLED: 'DELIVERY_CANCELLED',
  PACKAGE_DELIVERED: 'PACKAGE_DELIVERED',
  TRANSPORT_REQUEST: 'TRANSPORT_REQUEST',
  
  // Trajets & Courses
  RIDE_REQUEST: 'RIDE_REQUEST',
  RIDE_UPDATE: 'RIDE_UPDATE',
  RIDE_ACCEPTED: 'RIDE_ACCEPTED',
  RIDE_REJECTED: 'RIDE_REJECTED',
  
  // Services & Réservations
  BOOKING_REQUEST: 'BOOKING_REQUEST',
  BOOKING_CONFIRMED: 'BOOKING_CONFIRMED',
  BOOKING_UPDATE: 'BOOKING_UPDATE',
  
  // Stockage
  STORAGE_RENTAL: 'STORAGE_RENTAL',
  RENTAL_CONFIRMED: 'RENTAL_CONFIRMED',
  
  // Paiements
  PAYMENT_SUCCESS: 'PAYMENT_SUCCESS',
  PAYMENT_REQUIRED: 'PAYMENT_REQUIRED',
  PAYMENT_UPDATE: 'PAYMENT_UPDATE',
  
  // Relais
  NEW_RELAY_PROPOSAL: 'NEW_RELAY_PROPOSAL',
  RELAY_CONFIRMED: 'RELAY_CONFIRMED',
  
  // Général
  GENERAL: 'GENERAL'
};

export default { 
  createNotificationWithEmail, 
  createMultipleNotificationsWithEmail, 
  createEnrichedNotification,
  NOTIFICATION_TYPES 
}; 