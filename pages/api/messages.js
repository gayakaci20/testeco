import prisma, { ensureConnected } from '../../lib/prisma';

export default async function handler(req, res) {
  const { method } = req;

  try {
    // S'assurer que Prisma est connecté avant toute opération
    await ensureConnected();
    
    switch (method) {
      case 'GET':
        return handleGet(req, res);
      case 'POST':
        return handlePost(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Messages API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGet(req, res) {
  try {
    const { conversationWith } = req.query;
    const userId = req.headers['x-user-id']; // Placeholder - implement proper auth
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!conversationWith) {
      return res.status(400).json({ error: 'conversationWith parameter is required' });
    }

    // Ensure Prisma is connected before querying
    await ensureConnected();

    // Fetch messages between the two users
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          {
            senderId: userId,
            receiverId: conversationWith
          },
          {
            senderId: conversationWith,
            receiverId: userId
          }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    
    // Handle specific Prisma connection errors
    if (error.code === 'GenericFailure' && error.message.includes('not yet connected')) {
      return res.status(503).json({ error: 'Database connection error. Please try again.' });
    }
    
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
}

async function handlePost(req, res) {
  try {
    const { receiverId, content } = req.body;
    const userId = req.headers['x-user-id']; // Placeholder - implement proper auth
    
    console.log('📤 Message API POST request:', {
      userId,
      receiverId,
      content: content ? content.substring(0, 50) + '...' : null,
      hasContent: !!content
    });
    
    if (!userId) {
      console.error('❌ No userId in headers');
      return res.status(401).json({ error: 'Unauthorized - No user ID provided' });
    }

    if (!receiverId || !content) {
      console.error('❌ Missing required fields:', { receiverId: !!receiverId, content: !!content });
      return res.status(400).json({ error: 'receiverId and content are required' });
    }

    // Ensure Prisma is connected before querying
    await ensureConnected();

    // Verify that both users exist
    const [sender, receiver] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.user.findUnique({ where: { id: receiverId } })
    ]);

    if (!sender) {
      console.error('❌ Sender not found:', userId);
      return res.status(404).json({ error: 'Sender not found' });
    }

    if (!receiver) {
      console.error('❌ Receiver not found:', receiverId);
      return res.status(404).json({ error: 'Receiver not found' });
    }

    console.log('✅ Users verified:', {
      sender: `${sender.firstName} ${sender.lastName}`,
      receiver: `${receiver.firstName} ${receiver.lastName}`
    });

    // Create the message
    const message = await prisma.message.create({
      data: {
        senderId: userId,
        receiverId: receiverId,
        content: content.trim(),
        isRead: false
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    console.log('✅ Message created successfully:', {
      id: message.id,
      from: `${message.sender.firstName} ${message.sender.lastName}`,
      to: `${message.receiver.firstName} ${message.receiver.lastName}`
    });

    // Create a notification with automatic email for the receiver
    try {
      const { createNotificationWithEmail } = await import('../../lib/notification-helper.js');
      
      await createNotificationWithEmail({
        userId: receiverId,
        type: 'NEW_MESSAGE',
        title: 'Nouveau message',
        message: `Nouveau message de ${message.sender.firstName} ${message.sender.lastName}`,
        isRead: false,
        relatedEntityId: message.id,
        data: {
          senderName: `${message.sender.firstName} ${message.sender.lastName}`,
          messagePreview: content.trim().substring(0, 100) + (content.trim().length > 100 ? '...' : ''),
          senderId: userId
        }
      });
      console.log('✅ Notification with email created for receiver');
    } catch (notificationError) {
      console.error('❌ Error creating notification with email:', notificationError);
      // Don't fail the message creation if notification fails
    }

    return res.status(201).json(message);
  } catch (error) {
    console.error('❌ Error sending message:', error);
    
    // Handle specific Prisma connection errors
    if (error.code === 'GenericFailure' && error.message.includes('not yet connected')) {
      return res.status(503).json({ 
        error: 'Database connection error. Please try again.',
        details: 'Prisma engine not connected' 
      });
    }
    
    return res.status(500).json({ 
      error: 'Failed to send message', 
      details: error.message 
    });
  }
} 