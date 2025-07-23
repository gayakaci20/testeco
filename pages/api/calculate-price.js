import { calculateFullPackagePrice, calculatePackagePrice } from '../../lib/priceCalculator';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { pickupAddress, deliveryAddress, weight, dimensions, distance } = req.body;

    // Validation des paramètres requis
    if (!pickupAddress || !deliveryAddress) {
      return res.status(400).json({ 
        error: 'Les adresses de départ et d\'arrivée sont requises' 
      });
    }

    let priceCalculation;

    // Si la distance est déjà fournie, utiliser le calcul direct
    if (distance && typeof distance === 'number') {
      priceCalculation = calculatePackagePrice({
        distance,
        weight: weight ? parseFloat(weight) : undefined,
        dimensions
      });
    } else {
      // Sinon, calculer la distance automatiquement
      priceCalculation = await calculateFullPackagePrice({
        pickupAddress,
        deliveryAddress,
        weight: weight ? parseFloat(weight) : undefined,
        dimensions
      });
    }

    return res.status(200).json({
      success: true,
      ...priceCalculation
    });

  } catch (error) {
    console.error('Erreur lors du calcul du prix:', error);
    return res.status(500).json({ 
      error: 'Erreur interne du serveur',
      details: error.message 
    });
  }
} 