import jwt from 'jsonwebtoken';
import prisma, { ensureConnected } from '../../../lib/prisma';
import { EmailSMSNotificationService } from '../../../lib/email-sms-notifications';

export default async function handler(req, res) {
  try {
        // Ensure database connection before any queries
    await ensureConnected();

// Verify JWT token for protected routes
    if (req.method !== 'GET' || req.query.action !== 'test') {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies.token;
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
      const userId = decoded.userId;

      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      req.user = user;
    }

    switch (req.method) {
      case 'GET':
        return handleGet(req, res);
      case 'POST':
        return handlePost(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Error in email-sms API:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  } finally {
    await prisma.$disconnect();
  }
}

async function handleGet(req, res) {
  const { action } = req.query;

  switch (action) {
    case 'test':
      // Test email and SMS configuration
      const emailTest = await EmailSMSNotificationService.testEmailConfiguration();
      const smsTest = await EmailSMSNotificationService.testSMSConfiguration();
      
      return res.status(200).json({
        email: emailTest,
        sms: smsTest,
        configured: {
          email: !!process.env.SMTP_USER,
          sms: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
        }
      });

    case 'templates':
      // Return available templates
      return res.status(200).json({
        email: ['WELCOME', 'BOOKING_CONFIRMATION', 'DELIVERY_UPDATE', 'PAYMENT_CONFIRMATION', 'SECURITY_ALERT'],
        sms: ['BOOKING_CONFIRMATION', 'DELIVERY_UPDATE', 'PAYMENT_CONFIRMATION', 'SECURITY_ALERT', 'MATCH_FOUND', 'DELIVERY_COMPLETED']
      });

    default:
      return res.status(400).json({ error: 'Invalid action' });
  }
}

async function handlePost(req, res) {
  const { action, type, templateType, data, recipients } = req.body;

  switch (action) {
    case 'send_single':
      // Send single notification
      const user = req.user;
      
      if (type === 'email') {
        const result = await EmailSMSNotificationService.sendEmail(user.email, templateType, {
          firstName: user.firstName,
          ...data
        });
        return res.status(200).json({ result });
      } else if (type === 'sms') {
        if (!user.phone) {
          return res.status(400).json({ error: 'User phone number not available' });
        }
        const result = await EmailSMSNotificationService.sendSMS(user.phone, templateType, {
          firstName: user.firstName,
          ...data
        });
        return res.status(200).json({ result });
      } else if (type === 'both') {
        const result = await EmailSMSNotificationService.sendBothNotifications(
          user.email, 
          user.phone, 
          templateType, 
          {
            firstName: user.firstName,
            ...data
          }
        );
        return res.status(200).json({ result });
      } else {
        return res.status(400).json({ error: 'Invalid notification type' });
      }

    case 'send_by_preference':
      // Send notification based on user preferences
      const result = await EmailSMSNotificationService.sendNotificationByPreference(
        req.user, 
        templateType, 
        {
          firstName: req.user.firstName,
          ...data
        }
      );
      return res.status(200).json({ result });

    case 'send_bulk':
      // Send bulk notifications (admin only)
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      // Fetch recipients from database
      const users = await prisma.user.findMany({
        where: {
          id: { in: recipients }
        }
      });

      const results = await EmailSMSNotificationService.sendBulkNotifications(
        users, 
        templateType, 
        data
      );
      
      return res.status(200).json({ results });

    case 'send_to_user':
      // Send notification to specific user by ID
      const { userId, ...notificationData } = data;
      
      const targetUser = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!targetUser) {
        return res.status(404).json({ error: 'Target user not found' });
      }

      const userResult = await EmailSMSNotificationService.sendNotificationByPreference(
        targetUser, 
        templateType, 
        {
          firstName: targetUser.firstName,
          ...notificationData
        }
      );
      
      return res.status(200).json({ result: userResult });

    case 'test_send':
      // Test send to current user
      const testData = {
        firstName: req.user.firstName,
        customerName: req.user.firstName + ' ' + req.user.lastName,
        serviceName: 'Test Service',
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        address: '123 Test Street, Test City',
        price: '25.00',
        bookingId: 'test-booking-123',
        packageId: 'test-package-456',
        transactionId: 'test-txn-789',
        paymentId: 'test-payment-abc',
        amount: '25.00',
        paymentMethod: 'Credit Card',
        status: 'En cours de livraison',
        carrierName: 'Test Carrier',
        message: 'Votre colis est en route',
        activityType: 'Connexion suspecte',
        timestamp: new Date().toLocaleString(),
        ipAddress: '192.168.1.1',
        location: 'Paris, France'
      };

      let testResult;
      if (type === 'email') {
        testResult = await EmailSMSNotificationService.sendEmail(req.user.email, templateType, testData);
      } else if (type === 'sms') {
        if (!req.user.phone) {
          return res.status(400).json({ error: 'Phone number required for SMS test' });
        }
        testResult = await EmailSMSNotificationService.sendSMS(req.user.phone, templateType, testData);
      } else {
        testResult = await EmailSMSNotificationService.sendBothNotifications(
          req.user.email, 
          req.user.phone, 
          templateType, 
          testData
        );
      }

      return res.status(200).json({ result: testResult });

    default:
      return res.status(400).json({ error: 'Invalid action' });
  }
} 