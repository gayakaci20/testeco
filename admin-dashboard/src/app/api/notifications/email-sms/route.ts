import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';



// Import the notification service from the main app
const notificationService = {
  async testEmailConfiguration() {
    try {
      // Test email configuration
      const hasEmailConfig = !!(
        process.env.SMTP_HOST &&
        process.env.SMTP_PORT &&
        process.env.SMTP_FROM &&
        (process.env.SMTP_PORT === '25' || // Port 25 ne nécessite pas d'auth
         (process.env.SMTP_USER && process.env.SMTP_PASS)) // Autres ports nécessitent auth
      );
      
      return {
        success: hasEmailConfig,
        error: hasEmailConfig ? null : 'Email configuration missing'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  async testSmsConfiguration() {
    try {
      // Test SMS configuration
      const hasSmsConfig = !!(
        process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_PHONE_NUMBER
      );
      
      return {
        success: hasSmsConfig,
        error: hasSmsConfig ? null : 'SMS configuration missing',
        accountName: hasSmsConfig ? 'Twilio Account' : undefined
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  getEmailTemplates() {
    return ['WELCOME', 'BOOKING_CONFIRMATION', 'DELIVERY_UPDATE', 'PAYMENT_CONFIRMATION', 'SECURITY_ALERT'];
  },

  getSmsTemplates() {
    return ['WELCOME', 'BOOKING_CONFIRMATION', 'DELIVERY_UPDATE', 'PAYMENT_CONFIRMATION', 'SECURITY_ALERT', 'VERIFICATION_CODE'];
  }
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'test':
        // Test configuration
        const emailTest = await notificationService.testEmailConfiguration();
        const smsTest = await notificationService.testSmsConfiguration();
        
        return NextResponse.json({
          email: emailTest,
          sms: smsTest,
          configured: {
            email: emailTest.success,
            sms: smsTest.success
          }
        });

      case 'templates':
        // Get available templates
        return NextResponse.json({
          email: notificationService.getEmailTemplates(),
          sms: notificationService.getSmsTemplates()
        });

      case 'stats':
        // Get notification stats (mock data for now)
        return NextResponse.json({
          totalSent: 1250,
          emailsSent: 800,
          smsSent: 450,
          failedDeliveries: 25,
          successRate: 98.0
        });

      case 'history':
        // Get notification history (mock data for now)
        const mockHistory = [
          {
            id: '1',
            type: 'email',
            templateType: 'WELCOME',
            recipient: 'user@example.com',
            status: 'sent',
            sentAt: new Date().toISOString(),
            messageId: 'msg_123456'
          },
          {
            id: '2',
            type: 'sms',
            templateType: 'BOOKING_CONFIRMATION',
            recipient: '+33123456789',
            status: 'sent',
            sentAt: new Date(Date.now() - 3600000).toISOString(),
            messageId: 'sms_789012'
          },
          {
            id: '3',
            type: 'email',
            templateType: 'DELIVERY_UPDATE',
            recipient: 'customer@test.com',
            status: 'failed',
            sentAt: new Date(Date.now() - 7200000).toISOString(),
            error: 'Invalid email address'
          }
        ];
        return NextResponse.json(mockHistory);

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in notifications API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, type, templateType, data, recipients } = body;

    switch (action) {
      case 'test_send':
        // Send test notification
        const testData = {
          customerName: data?.customerName || 'Test User',
          bookingId: data?.bookingId || 'TEST123',
          deliveryAddress: data?.deliveryAddress || '123 Test Street',
          amount: data?.amount || '25.00',
          ...data
        };

        // Mock sending logic
        const mockResult = {
          result: {} as any
        };

        if (type === 'email' || type === 'both') {
          mockResult.result.email = {
            success: true,
            messageId: 'test_email_' + Date.now()
          };
        }

        if (type === 'sms' || type === 'both') {
          mockResult.result.sms = {
            success: true,
            messageId: 'test_sms_' + Date.now()
          };
        }

        return NextResponse.json(mockResult);

      case 'bulk_send':
        // Send bulk notifications
        if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
          return NextResponse.json(
            { success: false, error: 'No recipients provided' },
            { status: 400 }
          );
        }

        const bulkData = {
          customerName: data?.customerName || 'Valued Customer',
          ...data
        };

        // Mock bulk sending logic
        const successCount = Math.floor(recipients.length * 0.95); // 95% success rate
        const failureCount = recipients.length - successCount;

        return NextResponse.json({
          success: true,
          message: `Bulk notifications sent`,
          stats: {
            total: recipients.length,
            successful: successCount,
            failed: failureCount,
            successRate: (successCount / recipients.length) * 100
          }
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in notifications POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 