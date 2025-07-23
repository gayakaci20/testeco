import prisma, { ensureConnected } from '../../lib/prisma';

export default async function handler(req, res) {
  const { method } = req;

  try {
    // S'assurer que Prisma est connecté avant toute opération
    await ensureConnected();
    
    switch (method) {
      case 'GET':
        return handleGet(req, res);
      case 'PUT':
        return handlePut(req, res);
      default:
        res.setHeader('Allow', ['GET', 'PUT']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Conversations API error:', error);
    
    // Handle specific Prisma connection errors
    if (error.code === 'GenericFailure' && error.message.includes('not yet connected')) {
      return res.status(503).json({ 
        error: 'Database connection error. Please try again.',
        details: 'Prisma engine not connected' 
      });
    }
    
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

async function handleGet(req, res) {
  try {
    // Get user from session/auth (implement proper auth)
    const userId = req.headers['x-user-id']; // Placeholder
    
    console.log('🔍 Conversations API - userId:', userId);
    
    if (!userId) {
      console.error('❌ No userId provided in headers');
      return res.status(401).json({ error: 'Unauthorized - No user ID provided' });
    }

    // Get user info to determine role
    console.log('🔍 Fetching user info for ID:', userId);
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true, 
        userType: true 
      }
    });

    if (!currentUser) {
      console.error('❌ User not found with ID:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ Current user found:', {
      id: currentUser.id,
      name: `${currentUser.firstName} ${currentUser.lastName}`,
      role: currentUser.role,
      userType: currentUser.userType
    });

    // Find all conversations where the user is either sender or receiver
    console.log('🔍 Fetching messages for user:', userId);
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            userType: true
          }
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            userType: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('✅ Messages found:', messages.length);

    // Group messages by conversation partners
    const conversationsMap = new Map();

    messages.forEach(message => {
      const partnerId = message.senderId === userId ? message.receiverId : message.senderId;
      const partner = message.senderId === userId ? message.receiver : message.sender;

      if (!conversationsMap.has(partnerId)) {
        conversationsMap.set(partnerId, {
          partner,
          lastMessage: message,
          unreadCount: 0,
          messages: [],
          hasMessages: true
        });
      }

      const conversation = conversationsMap.get(partnerId);
      
      // Update last message if this one is more recent
      if (new Date(message.createdAt) > new Date(conversation.lastMessage.createdAt)) {
        conversation.lastMessage = message;
      }

      // Count unread messages (messages sent by partner that haven't been read)
      if (message.senderId === partnerId && !message.isRead) {
        conversation.unreadCount++;
      }

      conversation.messages.push(message);
    });

    console.log('✅ Conversations from messages:', conversationsMap.size);

    // Get matched users based on role
    let matchedUsers = [];
    
    console.log('🔍 Fetching matches for user role:', currentUser.role || currentUser.userType);
    
    if (currentUser?.role === 'CUSTOMER' || currentUser?.userType === 'CUSTOMER') {
      // For customers, get carriers they have matches with
      const matches = await prisma.match.findMany({
        where: {
          package: {
            userId: userId
          },
          status: {
            in: ['PENDING', 'ACCEPTED_BY_CARRIER', 'ACCEPTED_BY_SENDER', 'CONFIRMED', 'IN_PROGRESS']
          }
        },
        include: {
          ride: {
            select: {
              userId: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  role: true,
                  userType: true
                }
              }
            }
          },
          package: {
            select: {
              description: true
            }
          }
        }
      });

      console.log('✅ Customer matches found:', matches.length);

      matchedUsers = matches.map(match => ({
        id: match.ride.user.id,
        firstName: match.ride.user.firstName,
        lastName: match.ride.user.lastName,
        email: match.ride.user.email,
        role: match.ride.user.role,
        userType: match.ride.user.userType,
        matchContext: `Match pour: ${match.package.description}`
      }));

      // Also get service providers they have confirmed bookings with
      const bookings = await prisma.booking.findMany({
        where: {
          customerId: userId,
          status: {
            in: ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED']
          }
        },
        include: {
          provider: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
              userType: true
            }
          },
          service: {
            select: {
              name: true
            }
          }
        }
      });

      console.log('✅ Customer bookings found:', bookings.length);

      const providerUsers = bookings.map(booking => ({
        id: booking.provider.id,
        firstName: booking.provider.firstName,
        lastName: booking.provider.lastName,
        email: booking.provider.email,
        role: booking.provider.role,
        userType: booking.provider.userType,
        matchContext: `Service: ${booking.service.name}`
      }));

      // Combine carriers and providers, removing duplicates
      const allMatchedUsers = [...matchedUsers, ...providerUsers];
      const uniqueMatchedUsers = allMatchedUsers.filter((user, index, self) =>
        index === self.findIndex(u => u.id === user.id)
      );
      matchedUsers = uniqueMatchedUsers;
    } else if (currentUser?.role === 'CARRIER' || currentUser?.userType === 'CARRIER') {
      // For carriers, get customers they have matches with
      const matches = await prisma.match.findMany({
        where: {
          ride: {
            userId: userId  // The carrier is the user who created the ride
          },
          status: {
            in: ['PENDING', 'ACCEPTED_BY_CARRIER', 'ACCEPTED_BY_SENDER', 'CONFIRMED', 'IN_PROGRESS']
          }
        },
        include: {
          package: {
            select: {
              description: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  role: true,
                  userType: true
                }
              }
            }
          },
          ride: {
            select: {
              userId: true
            }
          }
        }
      });

      console.log('✅ Carrier matches found:', matches.length);

      matchedUsers = matches.map(match => ({
        id: match.package.user.id,
        firstName: match.package.user.firstName,
        lastName: match.package.user.lastName,
        email: match.package.user.email,
        role: match.package.user.role,
        userType: match.package.user.userType,
        matchContext: `Match pour: ${match.package.description}`
      }));
    } else if (currentUser?.role === 'MERCHANT') {
      // For merchants, allow messaging with all users (customers, carriers, other merchants)
      console.log('🔍 Fetching all users for merchant messaging');
      
      const allUsers = await prisma.user.findMany({
        where: {
          AND: [
            { id: { not: userId } }, // Exclude current user
            { isVerified: true }, // Only verified users
            {
              OR: [
                { role: 'CUSTOMER' },
                { role: 'CARRIER' },
                { role: 'MERCHANT' },
                { role: 'PROVIDER' },
                { role: 'SERVICE_PROVIDER' }
              ]
            }
          ]
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          userType: true
        },
        take: 100 // Limit to avoid too many results
      });

      console.log('✅ Available users for merchant found:', allUsers.length);

      matchedUsers = allUsers.map(user => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        userType: user.userType,
        matchContext: `Contact disponible (${user.role})`
      }));
    } else if (currentUser?.role === 'SERVICE_PROVIDER' || currentUser?.role === 'PROVIDER') {
      // For service providers, get customers they have confirmed bookings with
      console.log('🔍 Fetching bookings for service provider');
      
      const bookings = await prisma.booking.findMany({
        where: {
          providerId: userId,
          status: {
            in: ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED']
          }
        },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
              userType: true
            }
          },
          service: {
            select: {
              name: true
            }
          }
        }
      });

      console.log('✅ Provider bookings found:', bookings.length);

      matchedUsers = bookings.map(booking => ({
        id: booking.customer.id,
        firstName: booking.customer.firstName,
        lastName: booking.customer.lastName,
        email: booking.customer.email,
        role: booking.customer.role,
        userType: booking.customer.userType,
        matchContext: `Réservation: ${booking.service.name}`
      }));

      // Remove duplicates based on customer ID
      const uniqueMatchedUsers = matchedUsers.filter((user, index, self) =>
        index === self.findIndex(u => u.id === user.id)
      );
      matchedUsers = uniqueMatchedUsers;
    }

    console.log('✅ Matched users found:', matchedUsers.length);

    // Add matched users who don't have conversations yet
    matchedUsers.forEach(matchedUser => {
      if (!conversationsMap.has(matchedUser.id)) {
        conversationsMap.set(matchedUser.id, {
          partner: {
            id: matchedUser.id,
            firstName: matchedUser.firstName,
            lastName: matchedUser.lastName,
            email: matchedUser.email,
            role: matchedUser.role,
            userType: matchedUser.userType
          },
          lastMessage: null,
          unreadCount: 0,
          messages: [],
          hasMessages: false,
          matchContext: matchedUser.matchContext
        });
      }
    });

    // Convert map to array and sort
    const conversations = Array.from(conversationsMap.values()).sort((a, b) => {
      // Sort by: 1) has messages first, 2) then by last message date, 3) then by partner name
      if (a.hasMessages && !b.hasMessages) return -1;
      if (!a.hasMessages && b.hasMessages) return 1;
      
      if (a.lastMessage && b.lastMessage) {
        return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
      }
      
      if (a.lastMessage && !b.lastMessage) return -1;
      if (!a.lastMessage && b.lastMessage) return 1;
      
      return `${a.partner.firstName} ${a.partner.lastName}`.localeCompare(`${b.partner.firstName} ${b.partner.lastName}`);
    });

    console.log('✅ Final conversations count:', conversations.length);
    console.log('✅ Conversations response prepared successfully');

    return res.status(200).json(conversations);
  } catch (error) {
    console.error('❌ Error fetching conversations:', error);
    console.error('❌ Error stack:', error.stack);
    return res.status(500).json({ 
      error: 'Failed to fetch conversations', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

async function handlePut(req, res) {
  try {
    const { partnerId } = req.body;
    const userId = req.headers['x-user-id']; // Placeholder
    
    console.log('🔍 Mark as read - userId:', userId, 'partnerId:', partnerId);
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!partnerId) {
      return res.status(400).json({ error: 'Partner ID is required' });
    }

    // Mark all messages from partner as read
    const updateResult = await prisma.message.updateMany({
      where: {
        senderId: partnerId,
        receiverId: userId,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    console.log('✅ Messages marked as read:', updateResult.count);

    return res.status(200).json({ message: 'Conversation marked as read', updatedCount: updateResult.count });
  } catch (error) {
    console.error('❌ Error marking conversation as read:', error);
    return res.status(500).json({ error: 'Failed to mark conversation as read', details: error.message });
  }
} 