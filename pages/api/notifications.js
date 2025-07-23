import prisma, { ensureConnected } from '../../lib/prisma';

export default async function handler(req, res) {
  const { method } = req;

  try {
    // Ensure database connection is established
    await ensureConnected();
    
    switch (method) {
      case 'GET':
        return handleGet(req, res);
      case 'PUT':
        return handlePut(req, res);
      case 'DELETE':
        return handleDelete(req, res);
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Notifications API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGet(req, res) {
  try {
    const { unreadOnly, type } = req.query;
    
    // Get user from auth token
    const { verifyToken } = await import('../../lib/auth');
    const token = req.cookies.auth_token;
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized - No token' });
    }
    
    const decodedToken = await verifyToken(token);
    if (!decodedToken) {
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }
    
    const userId = decodedToken.id;
    
    if (!userId) {
      console.error('No userId found in decoded token:', decodedToken);
      return res.status(401).json({ error: 'Unauthorized - No user ID in token' });
    }

    // Ensure database connection before queries
    await ensureConnected();

    const where = {
      userId: userId,
      ...(unreadOnly === 'true' && { isRead: false }),
      ...(type && type !== 'all' && { type })
    };

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limit to 50 notifications
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId: userId,
        isRead: false
      }
    });

    return res.status(200).json({
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
}

async function handlePut(req, res) {
  try {
    const { id, isRead } = req.body;
    
    // Get user from auth token
    const { verifyToken } = await import('../../lib/auth');
    const token = req.cookies.auth_token;
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized - No token' });
    }
    
    const decodedToken = await verifyToken(token);
    if (!decodedToken) {
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }
    
    const userId = decodedToken.id;
    
    if (!userId) {
      console.error('No userId found in decoded token:', decodedToken);
      return res.status(401).json({ error: 'Unauthorized - No user ID in token' });
    }

    if (!id) {
      return res.status(400).json({ error: 'Notification ID is required' });
    }

    // Ensure database connection before queries
    await ensureConnected();

    const notification = await prisma.notification.update({
      where: {
        id: id,
        userId: userId // Ensure user can only update their own notifications
      },
      data: {
        isRead: isRead
      }
    });

    return res.status(200).json(notification);
  } catch (error) {
    console.error('Error updating notification:', error);
    return res.status(500).json({ error: 'Failed to update notification' });
  }
}

async function handleDelete(req, res) {
  try {
    const { id } = req.query;
    
    // Get user from auth token
    const { verifyToken } = await import('../../lib/auth');
    const token = req.cookies.auth_token;
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized - No token' });
    }
    
    const decodedToken = await verifyToken(token);
    if (!decodedToken) {
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }
    
    const userId = decodedToken.id;
    
    if (!userId) {
      console.error('No userId found in decoded token:', decodedToken);
      return res.status(401).json({ error: 'Unauthorized - No user ID in token' });
    }

    if (!id) {
      return res.status(400).json({ error: 'Notification ID is required' });
    }

    // Ensure database connection before queries
    await ensureConnected();

    await prisma.notification.delete({
      where: {
        id: id,
        userId: userId // Ensure user can only delete their own notifications
      }
    });

    return res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return res.status(500).json({ error: 'Failed to delete notification' });
  }
} 