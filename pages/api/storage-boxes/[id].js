import prisma, { ensureConnected } from '../../../lib/prisma';

export default async function handler(req, res) {
      // Ensure database connection before any queries
    await ensureConnected();

if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Storage box ID is required' });
    }

    // Get storage box details with owner
    const storageBox = await prisma.storageBox.findUnique({
      where: { id: id },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true
          }
        }
      }
    });

    if (!storageBox) {
      return res.status(404).json({ error: 'Storage box not found' });
    }

    // Check if box is available
    const isAvailable = !storageBox.isOccupied && storageBox.isActive;

    // Use real owner info - if no owner found, there's a data issue
    if (!storageBox.owner) {
      return res.status(404).json({ error: 'Storage box owner not found' });
    }

    const owner = {
      id: storageBox.owner.id,
      firstName: storageBox.owner.firstName || 'Propriétaire',
      lastName: storageBox.owner.lastName || 'Inconnu',
      email: storageBox.owner.email,
      phone: storageBox.owner.phoneNumber
    };

    // Format response
    const formattedStorageBox = {
      id: storageBox.id,
      code: storageBox.code,
      title: `Boîte ${storageBox.code}`,
      location: storageBox.location,
      size: storageBox.size,
      pricePerDay: storageBox.pricePerDay,
      description: `Boîte de stockage ${storageBox.size.toLowerCase()} située à ${storageBox.location}`,
      available: isAvailable,
      isActive: storageBox.isActive,
      isOccupied: storageBox.isOccupied,
      owner: owner,
      activeRentals: [],
      features: [
        'Accès 24h/24',
        'Surveillance vidéo',
        'Alarme anti-intrusion',
        'Contrôle d\'accès par badge',
        'Environnement sec et propre'
      ],
      createdAt: storageBox.createdAt,
      updatedAt: storageBox.updatedAt
    };

    res.status(200).json(formattedStorageBox);

  } catch (error) {
    console.error('Error fetching storage box:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
} 