import OneSignal from 'onesignal-node';

// Configuration OneSignal
const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY;

// Initialiser le client OneSignal
const client = new OneSignal.Client(ONESIGNAL_APP_ID, ONESIGNAL_API_KEY);

/**
 * Types de notifications disponibles
 */
export const NOTIFICATION_TYPES = {
  BOOKING_CONFIRMED: 'booking_confirmed',
  BOOKING_CANCELLED: 'booking_cancelled',
  BOOKING_COMPLETED: 'booking_completed',
  PAYMENT_RECEIVED: 'payment_received',
  PAYMENT_FAILED: 'payment_failed',
  SERVICE_REMINDER: 'service_reminder',
  NEW_MESSAGE: 'new_message',
  MATCH_FOUND: 'match_found',
  DELIVERY_UPDATE: 'delivery_update',
  STORAGE_REMINDER: 'storage_reminder',
  RATING_REQUEST: 'rating_request'
};

/**
 * Envoie une notification push à un utilisateur spécifique
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} notification - Données de la notification
 * @returns {Promise} Résultat de l'envoi
 */
export const sendPushNotification = async (userId, notification) => {
  try {
    if (!ONESIGNAL_APP_ID || !ONESIGNAL_API_KEY) {
      console.warn('OneSignal configuration missing, skipping push notification');
      return { success: false, error: 'Configuration missing' };
    }

    const { title, message, type, data = {} } = notification;

    const notificationPayload = {
      contents: { en: message },
      headings: { en: title },
      include_external_user_ids: [userId.toString()],
      data: {
        type,
        ...data
      },
      web_url: getNotificationUrl(type, data),
      ios_badgeType: 'Increase',
      ios_badgeCount: 1
    };

    const response = await client.createNotification(notificationPayload);
    
    console.log('Push notification sent successfully:', response.id);
    return { success: true, id: response.id };

  } catch (error) {
    console.error('Error sending push notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Envoie une notification push à plusieurs utilisateurs
 * @param {Array} userIds - IDs des utilisateurs
 * @param {Object} notification - Données de la notification
 * @returns {Promise} Résultat de l'envoi
 */
export const sendBulkPushNotification = async (userIds, notification) => {
  try {
    if (!ONESIGNAL_APP_ID || !ONESIGNAL_API_KEY) {
      console.warn('OneSignal configuration missing, skipping push notification');
      return { success: false, error: 'Configuration missing' };
    }

    const { title, message, type, data = {} } = notification;

    const notificationPayload = {
      contents: { en: message },
      headings: { en: title },
      include_external_user_ids: userIds.map(id => id.toString()),
      data: {
        type,
        ...data
      },
      web_url: getNotificationUrl(type, data),
      ios_badgeType: 'Increase',
      ios_badgeCount: 1
    };

    const response = await client.createNotification(notificationPayload);
    
    console.log('Bulk push notification sent successfully:', response.id);
    return { success: true, id: response.id };

  } catch (error) {
    console.error('Error sending bulk push notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Génère l'URL de redirection pour une notification
 * @param {string} type - Type de notification
 * @param {Object} data - Données additionnelles
 * @returns {string} URL de redirection
 */
const getNotificationUrl = (type, data) => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  switch (type) {
    case NOTIFICATION_TYPES.BOOKING_CONFIRMED:
    case NOTIFICATION_TYPES.BOOKING_CANCELLED:
    case NOTIFICATION_TYPES.BOOKING_COMPLETED:
      return `${baseUrl}/dashboard/customer?tab=bookings`;
    
    case NOTIFICATION_TYPES.PAYMENT_RECEIVED:
    case NOTIFICATION_TYPES.PAYMENT_FAILED:
      return `${baseUrl}/dashboard/customer?tab=payments`;
    
    case NOTIFICATION_TYPES.NEW_MESSAGE:
      return `${baseUrl}/messages`;
    
    case NOTIFICATION_TYPES.MATCH_FOUND:
      return `${baseUrl}/matches`;
    
    case NOTIFICATION_TYPES.DELIVERY_UPDATE:
      return `${baseUrl}/dashboard/provider?tab=deliveries`;
    
    case NOTIFICATION_TYPES.STORAGE_REMINDER:
      return `${baseUrl}/dashboard/customer?tab=storage`;
    
    case NOTIFICATION_TYPES.RATING_REQUEST:
      return data.bookingId ? `${baseUrl}/services/rate/${data.bookingId}` : `${baseUrl}/dashboard/customer`;
    
    default:
      return `${baseUrl}/dashboard/customer`;
  }
};

/**
 * Notifications prédéfinies pour différents événements
 */
export const NOTIFICATION_TEMPLATES = {
  [NOTIFICATION_TYPES.BOOKING_CONFIRMED]: (data) => ({
    title: '✅ Booking Confirmed',
    message: `Your booking for "${data.serviceName}" has been confirmed for ${new Date(data.scheduledAt).toLocaleDateString()}.`,
    type: NOTIFICATION_TYPES.BOOKING_CONFIRMED,
    data
  }),

  [NOTIFICATION_TYPES.BOOKING_CANCELLED]: (data) => ({
    title: '❌ Booking Cancelled',
    message: `Your booking for "${data.serviceName}" has been cancelled.`,
    type: NOTIFICATION_TYPES.BOOKING_CANCELLED,
    data
  }),

  [NOTIFICATION_TYPES.BOOKING_COMPLETED]: (data) => ({
    title: '🎉 Service Completed',
    message: `Your "${data.serviceName}" service has been completed. How was your experience?`,
    type: NOTIFICATION_TYPES.BOOKING_COMPLETED,
    data
  }),

  [NOTIFICATION_TYPES.PAYMENT_RECEIVED]: (data) => ({
    title: '💰 Payment Received',
    message: `Payment of €${data.amount} has been successfully processed.`,
    type: NOTIFICATION_TYPES.PAYMENT_RECEIVED,
    data
  }),

  [NOTIFICATION_TYPES.PAYMENT_FAILED]: (data) => ({
    title: '⚠️ Payment Failed',
    message: `Payment of €${data.amount} could not be processed. Please update your payment method.`,
    type: NOTIFICATION_TYPES.PAYMENT_FAILED,
    data
  }),

  [NOTIFICATION_TYPES.SERVICE_REMINDER]: (data) => ({
    title: '⏰ Service Reminder',
    message: `Your "${data.serviceName}" appointment is tomorrow at ${new Date(data.scheduledAt).toLocaleTimeString()}.`,
    type: NOTIFICATION_TYPES.SERVICE_REMINDER,
    data
  }),

  [NOTIFICATION_TYPES.NEW_MESSAGE]: (data) => ({
    title: '💬 New Message',
    message: `You have a new message from ${data.senderName}.`,
    type: NOTIFICATION_TYPES.NEW_MESSAGE,
    data
  }),

  [NOTIFICATION_TYPES.MATCH_FOUND]: (data) => ({
    title: '🎯 Match Found',
    message: `Great news! We found a match for your ${data.type === 'package' ? 'package' : 'ride'}.`,
    type: NOTIFICATION_TYPES.MATCH_FOUND,
    data
  }),

  [NOTIFICATION_TYPES.DELIVERY_UPDATE]: (data) => ({
    title: '🚚 Delivery Update',
    message: `Your package delivery status has been updated to: ${data.status}.`,
    type: NOTIFICATION_TYPES.DELIVERY_UPDATE,
    data
  }),

  [NOTIFICATION_TYPES.STORAGE_REMINDER]: (data) => ({
    title: '📦 Storage Reminder',
    message: `Your storage box rental expires in ${data.daysLeft} days.`,
    type: NOTIFICATION_TYPES.STORAGE_REMINDER,
    data
  }),

  [NOTIFICATION_TYPES.RATING_REQUEST]: (data) => ({
    title: '⭐ Rate Your Experience',
    message: `How was your experience with "${data.serviceName}"? Your feedback helps others.`,
    type: NOTIFICATION_TYPES.RATING_REQUEST,
    data
  })
};

/**
 * Envoie une notification en utilisant un template prédéfini
 * @param {string} userId - ID de l'utilisateur
 * @param {string} templateType - Type de template à utiliser
 * @param {Object} data - Données pour le template
 * @returns {Promise} Résultat de l'envoi
 */
export const sendTemplatedNotification = async (userId, templateType, data) => {
  const template = NOTIFICATION_TEMPLATES[templateType];
  
  if (!template) {
    throw new Error(`Notification template not found: ${templateType}`);
  }

  const notification = template(data);
  return await sendPushNotification(userId, notification);
};

/**
 * Envoie une notification à plusieurs utilisateurs en utilisant un template
 * @param {Array} userIds - IDs des utilisateurs
 * @param {string} templateType - Type de template à utiliser
 * @param {Object} data - Données pour le template
 * @returns {Promise} Résultat de l'envoi
 */
export const sendBulkTemplatedNotification = async (userIds, templateType, data) => {
  const template = NOTIFICATION_TEMPLATES[templateType];
  
  if (!template) {
    throw new Error(`Notification template not found: ${templateType}`);
  }

  const notification = template(data);
  return await sendBulkPushNotification(userIds, notification);
}; 