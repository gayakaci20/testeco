import { calculateFullRidePrice, calculateRidePrice } from '../../lib/priceCalculator';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { origin, destination, vehicleType, distance } = req.body;

    // Validation des paramètres requis
    if (!origin || !destination) {
      return res.status(400).json({ 
        error: 'Les adresses d\'origine et de destination sont requises' 
      });
    }

    let priceCalculation;

    // Si la distance est déjà fournie, utiliser le calcul direct
    if (distance && typeof distance === 'number') {
      priceCalculation = calculateRidePrice({
        distance,
        vehicleType: vehicleType || 'Berline'
      });
    } else {
      // Sinon, calculer la distance automatiquement
      priceCalculation = await calculateFullRidePrice({
        origin,
        destination,
        vehicleType: vehicleType || 'Berline'
      });
    }

    return res.status(200).json({
      success: true,
      ...priceCalculation
    });

  } catch (error) {
    console.error('Erreur lors du calcul du prix du trajet:', error);
    return res.status(500).json({ 
      error: 'Erreur interne du serveur',
      details: error.message 
    });
  }
} 