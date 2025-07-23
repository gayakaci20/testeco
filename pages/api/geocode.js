export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { address } = req.body;

    if (!address || typeof address !== 'string') {
      return res.status(400).json({ error: 'Address is required' });
    }

    console.log('🔍 Géocodage serveur pour:', address);

    // Appel au service Nominatim depuis le serveur (pas de CORS)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1&countrycodes=fr`,
      {
        headers: {
          'User-Agent': 'EcoFront-Server/1.0',
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data && data.length > 0) {
      const result = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        display_name: data[0].display_name,
        source: 'nominatim'
      };

      console.log('✅ Géocodage serveur réussi:', result);
      return res.status(200).json(result);
    } else {
      console.log('❌ Aucun résultat pour:', address);
      return res.status(404).json({ 
        error: 'Address not found',
        address: address
      });
    }

  } catch (error) {
    console.error('❌ Erreur géocodage serveur:', error);
    return res.status(500).json({ 
      error: 'Geocoding failed',
      details: error.message
    });
  }
} 