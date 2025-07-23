/**
 * Système de tarification EcoDeli - Version 2.0
 * Calcule le prix d'un colis basé sur la distance, le poids et l'optimisation logistique
 * ET le prix d'un trajet de covoiturage basé sur la distance
 */

// Configuration de tarification réaliste
const PRICING_CONFIG = {
  // Coût de base fixe (manipulation, gestion, assurance)
  BASE_HANDLING_COST: 5,
  
  // Prix par kilomètre (carburant, usure véhicule, temps conducteur)
  PRICE_PER_KM: 0.4,
  
  // Prix par kilogramme (effort de manutention)
  PRICE_PER_KG: 1.2,
  
  // Prix minimum garanti
  MINIMUM_PRICE: 8,
  
  // Facteurs d'ajustement selon la densité du colis
  DENSITY_FACTORS: {
    // Colis très dense (plus de 0.5 kg/dm³) - optimise l'espace
    VERY_DENSE: { threshold: 0.5, multiplier: 0.9, label: 'Très dense' },
    // Colis dense (0.2-0.5 kg/dm³) - normal
    DENSE: { threshold: 0.2, multiplier: 1.0, label: 'Dense' },
    // Colis léger (0.1-0.2 kg/dm³) - légère surcharge
    LIGHT: { threshold: 0.1, multiplier: 1.15, label: 'Léger' },
    // Colis très léger (moins de 0.1 kg/dm³) - occupe beaucoup d'espace
    VERY_LIGHT: { threshold: 0, multiplier: 1.3, label: 'Très léger' }
  },
  
  // Ajustements par tranches de distance (économies d'échelle)
  DISTANCE_BRACKETS: [
    { min: 0, max: 10, multiplier: 1.0, label: 'Livraison très locale' },   // Livraison dans la ville
    { min: 10, max: 50, multiplier: 1.1, label: 'Livraison locale' },       // Plus cher proportionnellement
    { min: 50, max: 150, multiplier: 1.0, label: 'Livraison régionale' },   // Prix normal
    { min: 150, max: 300, multiplier: 0.95, label: 'Livraison nationale' }, // Légère économie
    { min: 300, max: 500, multiplier: 0.9, label: 'Longue distance' },      // Économie d'échelle
    { min: 500, max: Infinity, multiplier: 0.85, label: 'Très longue distance' } // Meilleure économie
  ],
  
  // Ajustements par tranches de poids (économies d'échelle)
  WEIGHT_BRACKETS: [
    { min: 0, max: 2, multiplier: 1.1, label: 'Très léger' },     // Manipulation délicate
    { min: 2, max: 5, multiplier: 1.0, label: 'Léger' },         // Prix normal
    { min: 5, max: 15, multiplier: 0.95, label: 'Moyen' },       // Légère économie
    { min: 15, max: 30, multiplier: 0.9, label: 'Lourd' },       // Économie d'échelle
    { min: 30, max: Infinity, multiplier: 1.2, label: 'Très lourd' } // Manutention spéciale
  ],
  
  // Classification simplifiée des tailles (basée sur la logistique)
  SIZE_CATEGORIES: {
    COMPACT: { maxVolume: 8000, multiplier: 1.0, label: 'Compact' },        // Jusqu'à 20x20x20 cm
    STANDARD: { maxVolume: 50000, multiplier: 1.0, label: 'Standard' },     // Jusqu'à 40x30x40 cm
    LARGE: { maxVolume: 200000, multiplier: 1.1, label: 'Volumineux' },     // Jusqu'à 60x60x55 cm
    BULKY: { maxVolume: 500000, multiplier: 1.25, label: 'Encombrant' },    // Jusqu'à 80x80x78 cm
    OVERSIZED: { maxVolume: Infinity, multiplier: 1.5, label: 'Hors-norme' } // Plus grand
  }
};

// Configuration de tarification pour les trajets de covoiturage
const RIDE_PRICING_CONFIG = {
  // Coût de base pour covoiturage (frais de plateforme, assurance)
  BASE_RIDE_COST: 3,
  
  // Prix par kilomètre pour covoiturage (carburant, usure, temps)
  PRICE_PER_KM_RIDE: 0.15,
  
  // Prix minimum pour un trajet
  MINIMUM_RIDE_PRICE: 5,
  
  // Prix maximum raisonnable pour éviter les abus
  MAXIMUM_RIDE_PRICE: 100,
  
  // Ajustements par tranches de distance pour covoiturage
  RIDE_DISTANCE_BRACKETS: [
    { min: 0, max: 20, multiplier: 1.2, label: 'Trajet urbain' },          // Plus cher par km en ville
    { min: 20, max: 100, multiplier: 1.0, label: 'Trajet régional' },      // Prix normal
    { min: 100, max: 300, multiplier: 0.9, label: 'Longue distance' },     // Économie d'échelle
    { min: 300, max: 500, multiplier: 0.8, label: 'Très longue distance' }, // Meilleure économie
    { min: 500, max: Infinity, multiplier: 0.7, label: 'Inter-régional' }   // Prix très avantageux
  ],
  
  // Ajustements selon le type de véhicule
  VEHICLE_MULTIPLIERS: {
    'Moto': 0.6,        // Moins cher, moins de confort
    'Citadine': 0.8,    // Économique
    'Compact': 0.9,     // Petite voiture
    'Berline': 1.0,     // Standard
    'Monospace': 1.1,   // Plus d'espace, plus cher
    'SUV': 1.15,        // Confort supérieur
    'Camionnette': 1.2, // Utilitaire
    'Camion': 1.3       // Poids lourd
  }
};

// Base de données des distances (inchangée)
const CITY_DISTANCES = {
  'paris': {
    'lyon': 465,
    'marseille': 775,
    'toulouse': 680,
    'nice': 930,
    'nantes': 380,
    'strasbourg': 490,
    'montpellier': 750,
    'bordeaux': 580,
    'lille': 225,
    'rennes': 350,
    'reims': 145,
    'toulon': 835,
    'grenoble': 570,
    'dijon': 315,
    'angers': 295,
    'nîmes': 715,
    'villeurbanne': 465,
    'clermont-ferrand': 420,
    'aix-en-provence': 775,
    'brest': 590
  },
  'lyon': {
    'paris': 465,
    'marseille': 315,
    'toulouse': 540,
    'nice': 470,
    'nantes': 660,
    'strasbourg': 490,
    'montpellier': 300,
    'bordeaux': 560,
    'lille': 690,
    'rennes': 680,
    'reims': 490,
    'toulon': 390,
    'grenoble': 105,
    'dijon': 190,
    'angers': 580,
    'nîmes': 250,
    'villeurbanne': 10,
    'clermont-ferrand': 165,
    'aix-en-provence': 315,
    'brest': 850
  },
  'marseille': {
    'paris': 775,
    'lyon': 315,
    'toulouse': 405,
    'nice': 200,
    'nantes': 900,
    'strasbourg': 800,
    'montpellier': 170,
    'bordeaux': 650,
    'lille': 1000,
    'rennes': 950,
    'reims': 800,
    'toulon': 65,
    'grenoble': 280,
    'dijon': 530,
    'angers': 820,
    'nîmes': 120,
    'villeurbanne': 315,
    'clermont-ferrand': 430,
    'aix-en-provence': 30,
    'brest': 1150
  },
  'toulouse': {
    'paris': 680,
    'lyon': 540,
    'marseille': 405,
    'nice': 200,
    'nantes': 900,
    'strasbourg': 600,
    'montpellier': 200,
    'bordeaux': 400,
    'lille': 700,
    'rennes': 600,
    'reims': 500,
    'toulon': 100,
    'grenoble': 200,
    'dijon': 300,
    'angers': 400,
    'nîmes': 100,
    'villeurbanne': 200,
    'clermont-ferrand': 300,
    'aix-en-provence': 400,
    'brest': 500
  }
};

/**
 * Extrait le nom de la ville d'une adresse
 * @param {string} address - Adresse complète
 * @returns {string} Nom de la ville normalisé
 */
function extractCityName(address) {
  if (!address) return '';
  
  // Nettoyer l'adresse et extraire la ville
  const cleaned = address.toLowerCase()
    .replace(/[0-9]+/g, '') // Supprimer les numéros
    .replace(/rue|avenue|boulevard|place|chemin|impasse|allée|bis|ter/g, '') // Supprimer les types de voies
    .replace(/[,.-]/g, ' ') // Remplacer la ponctuation par des espaces
    .replace(/france/g, '') // Supprimer "France"
    .trim();
  
  // Chercher des correspondances avec les villes connues
  const words = cleaned.split(/\s+/).filter(word => word.length > 2);
  
  // D'abord, chercher une correspondance exacte
  for (const word of words) {
    if (CITY_DISTANCES[word]) {
      return word;
    }
  }
  
  // Ensuite, chercher des correspondances partielles
  for (const word of words) {
    for (const city of Object.keys(CITY_DISTANCES)) {
      if (city.includes(word) || word.includes(city)) {
        return city;
      }
    }
  }
  
  // Chercher des variantes communes
  const cityVariants = {
    'aix': 'aix-en-provence',
    'clermont': 'clermont-ferrand',
    'saint-etienne': 'saint-étienne'
  };
  
  for (const word of words) {
    if (cityVariants[word]) {
      return cityVariants[word];
    }
  }
  
  // Si aucune correspondance, retourner le mot le plus long (probablement la ville)
  const longestWord = words.reduce((longest, current) => 
    current.length > longest.length ? current : longest, '');
  
  return longestWord;
}

/**
 * Détermine la catégorie de taille d'un colis
 * @param {string} dimensions - Format "LxlxH" en cm
 * @returns {Object} Objet contenant la catégorie et ses propriétés
 */
export function calculatePackageCategory(dimensions) {
  if (!dimensions) {
    return {
      category: 'STANDARD',
      ...PRICING_CONFIG.SIZE_CATEGORIES.STANDARD
    };
  }
  
  try {
    const [length, width, height] = dimensions.split('x').map(d => parseFloat(d.trim()));
    
    if (isNaN(length) || isNaN(width) || isNaN(height)) {
      return {
        category: 'STANDARD',
        ...PRICING_CONFIG.SIZE_CATEGORIES.STANDARD
      };
    }
    
    const volume = length * width * height; // Volume en cm³
    
    // Déterminer la catégorie basée sur le volume
    for (const [category, config] of Object.entries(PRICING_CONFIG.SIZE_CATEGORIES)) {
      if (volume <= config.maxVolume) {
        return {
          category,
          volume,
          ...config
        };
      }
    }
    
    return {
      category: 'OVERSIZED',
      volume,
      ...PRICING_CONFIG.SIZE_CATEGORIES.OVERSIZED
    };
  } catch (error) {
    console.error('Erreur lors du calcul de la catégorie:', error);
    return {
      category: 'STANDARD',
      ...PRICING_CONFIG.SIZE_CATEGORIES.STANDARD
    };
  }
}

/**
 * Calcule la densité d'un colis et retourne le facteur d'ajustement
 * @param {number} weight - Poids en kg
 * @param {number} volume - Volume en cm³
 * @returns {Object} Facteur de densité et informations
 */
function calculateDensityFactor(weight, volume) {
  if (!weight || !volume || weight <= 0 || volume <= 0) {
    return {
      factor: 1.0,
      category: 'DENSE',
      density: 0,
      label: 'Dense'
    };
  }
  
  // Convertir le volume en dm³ (1000 cm³ = 1 dm³)
  const volumeDm3 = volume / 1000;
  const density = weight / volumeDm3; // kg/dm³
  
  // Déterminer le facteur basé sur la densité
  for (const [category, config] of Object.entries(PRICING_CONFIG.DENSITY_FACTORS)) {
    if (density >= config.threshold) {
      return {
        factor: config.multiplier,
        category,
        density: Math.round(density * 1000) / 1000,
        label: config.label
      };
    }
  }
  
  // Par défaut (très léger)
  return {
    factor: PRICING_CONFIG.DENSITY_FACTORS.VERY_LIGHT.multiplier,
    category: 'VERY_LIGHT',
    density: Math.round(density * 1000) / 1000,
    label: PRICING_CONFIG.DENSITY_FACTORS.VERY_LIGHT.label
  };
}

/**
 * Trouve le multiplicateur pour une tranche donnée
 * @param {number} value - Valeur à évaluer
 * @param {Array} brackets - Tranches avec min, max, multiplier
 * @returns {Object} Informations sur la tranche
 */
function findBracketMultiplier(value, brackets) {
  for (const bracket of brackets) {
    if (value >= bracket.min && value < bracket.max) {
      return bracket;
    }
  }
  // Retourner la dernière tranche par défaut
  return brackets[brackets.length - 1];
}

/**
 * Calcule le prix d'un colis avec le nouveau système
 * @param {Object} params - Paramètres de calcul
 * @param {number} params.distance - Distance en kilomètres
 * @param {number} params.weight - Poids en kg
 * @param {string} params.dimensions - Dimensions au format "LxlxH" en cm
 * @returns {Object} Objet contenant le prix et les détails du calcul
 */
export function calculatePackagePrice({ distance, weight, dimensions }) {
  try {
    // Valeurs par défaut et validation
    const distanceKm = Math.max(distance || 1, 1);
    const weightKg = Math.max(weight || 0.5, 0.1);
    
    // Déterminer la catégorie de taille
    const sizeCategory = calculatePackageCategory(dimensions);
    
    // Calculs de base
    const baseHandlingCost = PRICING_CONFIG.BASE_HANDLING_COST;
    const distanceCost = distanceKm * PRICING_CONFIG.PRICE_PER_KM;
    const weightCost = weightKg * PRICING_CONFIG.PRICE_PER_KG;
    
    // Calcul des facteurs d'ajustement
    const distanceBracket = findBracketMultiplier(distanceKm, PRICING_CONFIG.DISTANCE_BRACKETS);
    const weightBracket = findBracketMultiplier(weightKg, PRICING_CONFIG.WEIGHT_BRACKETS);
    const densityInfo = calculateDensityFactor(weightKg, sizeCategory.volume);
    
    // Application des facteurs
    const adjustedDistanceCost = distanceCost * distanceBracket.multiplier;
    const adjustedWeightCost = weightCost * weightBracket.multiplier;
    
    // Prix avant ajustements finaux
    const basePrice = baseHandlingCost + adjustedDistanceCost + adjustedWeightCost;
    
    // Ajustements finaux
    const sizeAdjustedPrice = basePrice * sizeCategory.multiplier;
    const densityAdjustedPrice = sizeAdjustedPrice * densityInfo.factor;
    
    // Prix final (minimum garanti)
    const finalPrice = Math.max(densityAdjustedPrice, PRICING_CONFIG.MINIMUM_PRICE);
    
    return {
      price: Math.round(finalPrice * 100) / 100,
      details: {
        distance: distanceKm,
        weight: weightKg,
        dimensions,
        
        // Coûts de base
        baseHandlingCost: Math.round(baseHandlingCost * 100) / 100,
        distanceCost: Math.round(distanceCost * 100) / 100,
        weightCost: Math.round(weightCost * 100) / 100,
        
        // Catégories et facteurs
        sizeCategory: sizeCategory.category,
        sizeLabel: sizeCategory.label,
        sizeMultiplier: sizeCategory.multiplier,
        volume: sizeCategory.volume,
        
        distanceBracket: distanceBracket.label,
        distanceMultiplier: distanceBracket.multiplier,
        
        weightBracket: weightBracket.label,
        weightMultiplier: weightBracket.multiplier,
        
        densityCategory: densityInfo.label,
        densityFactor: densityInfo.factor,
        density: densityInfo.density,
        
        // Coûts ajustés
        adjustedDistanceCost: Math.round(adjustedDistanceCost * 100) / 100,
        adjustedWeightCost: Math.round(adjustedWeightCost * 100) / 100,
        basePrice: Math.round(basePrice * 100) / 100,
        sizeAdjustedPrice: Math.round(sizeAdjustedPrice * 100) / 100,
        densityAdjustedPrice: Math.round(densityAdjustedPrice * 100) / 100,
        
        minimumPrice: PRICING_CONFIG.MINIMUM_PRICE
      }
    };
  } catch (error) {
    console.error('Erreur lors du calcul du prix:', error);
    return {
      price: PRICING_CONFIG.MINIMUM_PRICE,
      details: {
        error: error.message
      }
    };
  }
}

/**
 * Calcule la distance entre deux adresses
 * @param {string} origin - Adresse de départ
 * @param {string} destination - Adresse d'arrivée
 * @returns {Promise<number>} Distance en kilomètres
 */
export async function calculateDistance(origin, destination) {
  try {
    // Extraire les noms de villes
    const originCity = extractCityName(origin);
    const destinationCity = extractCityName(destination);
    
    console.log(`Calculating distance from ${originCity} to ${destinationCity}`);
    
    // CAS SPÉCIAL: Même ville ou adresses très similaires
    if (originCity && destinationCity && originCity === destinationCity) {
      console.log(`Same city detected: ${originCity}`);
      return 8; // Distance moyenne intra-urbaine (5-15 km)
    }
    
    // Vérifier si les adresses sont très similaires (même arrondissement/ville)
    if (origin && destination) {
      const originNormalized = origin.toLowerCase().replace(/\s+/g, ' ').trim();
      const destinationNormalized = destination.toLowerCase().replace(/\s+/g, ' ').trim();
      
      if (originNormalized === destinationNormalized) {
        console.log('Identical addresses detected');
        return 2; // Livraison très locale
      }
      
      // Vérifier si c'est la même ville avec des codes postaux similaires
      const samePostalArea = extractPostalCode(originNormalized) === extractPostalCode(destinationNormalized);
      if (samePostalArea && extractPostalCode(originNormalized)) {
        console.log('Same postal area detected');
        return 5; // Livraison dans la même zone
      }
    }
    
    // Si on a les deux villes dans notre base de données
    if (originCity && destinationCity && CITY_DISTANCES[originCity] && CITY_DISTANCES[originCity][destinationCity]) {
      return CITY_DISTANCES[originCity][destinationCity];
    }
    
    // Si on a une ville dans notre base, essayer l'inverse
    if (originCity && destinationCity && CITY_DISTANCES[destinationCity] && CITY_DISTANCES[destinationCity][originCity]) {
      return CITY_DISTANCES[destinationCity][originCity];
    }
    
    // Si on ne trouve qu'une seule ville connue, estimer intelligemment
    if (originCity && CITY_DISTANCES[originCity]) {
      // Si la destination est inconnue, supposer une livraison régionale moyenne
      console.log(`Origin city ${originCity} found, destination unknown`);
      return 120; // Distance régionale moyenne
    }
    
    if (destinationCity && CITY_DISTANCES[destinationCity]) {
      // Si l'origine est inconnue, supposer une livraison régionale moyenne
      console.log(`Destination city ${destinationCity} found, origin unknown`);
      return 120; // Distance régionale moyenne
    }
    
    // Si aucune ville n'est reconnue, estimation conservatrice
    console.log('No cities recognized, using default distance');
    return 100; // Distance par défaut raisonnable (100 km)
    
  } catch (error) {
    console.error('Erreur lors du calcul de la distance:', error);
    return 100; // Distance par défaut en cas d'erreur
  }
}

/**
 * Extrait le code postal d'une adresse
 * @param {string} address - Adresse normalisée
 * @returns {string|null} Code postal ou null
 */
function extractPostalCode(address) {
  if (!address) return null;
  
  // Rechercher un code postal français (5 chiffres)
  const match = address.match(/\b\d{5}\b/);
  return match ? match[0] : null;
}

/**
 * Calcule le prix complet d'un colis avec distance automatique
 * @param {Object} params - Paramètres de calcul
 * @param {string} params.pickupAddress - Adresse de départ
 * @param {string} params.deliveryAddress - Adresse d'arrivée
 * @param {number} params.weight - Poids en kg
 * @param {string} params.dimensions - Dimensions au format "LxlxH" en cm
 * @returns {Promise<Object>} Objet contenant le prix et les détails
 */
export async function calculateFullPackagePrice({ pickupAddress, deliveryAddress, weight, dimensions }) {
  try {
    // Calculer la distance
    const distance = await calculateDistance(pickupAddress, deliveryAddress);
    
    // Calculer le prix
    const priceCalculation = calculatePackagePrice({ distance, weight, dimensions });
    
    return {
      ...priceCalculation,
      details: {
        ...priceCalculation.details,
        pickupAddress,
        deliveryAddress
      }
    };
  } catch (error) {
    console.error('Erreur lors du calcul complet du prix:', error);
    return {
      price: PRICING_CONFIG.MINIMUM_PRICE,
      details: {
        error: error.message
      }
    };
  }
}

// ========== FONCTIONS POUR LES TRAJETS DE COVOITURAGE ==========

/**
 * Calcule le prix d'un trajet de covoiturage basé sur la distance
 * @param {Object} params - Paramètres de calcul
 * @param {number} params.distance - Distance en kilomètres
 * @param {string} params.vehicleType - Type de véhicule
 * @returns {Object} Objet contenant le prix et les détails du calcul
 */
export function calculateRidePrice({ distance, vehicleType = 'Berline' }) {
  try {
    // Valeurs par défaut et validation
    const distanceKm = Math.max(distance || 1, 1);
    
    // Calculs de base
    const baseRideCost = RIDE_PRICING_CONFIG.BASE_RIDE_COST;
    const distanceCost = distanceKm * RIDE_PRICING_CONFIG.PRICE_PER_KM_RIDE;
    
    // Trouver la tranche de distance appropriée
    const distanceBracket = findBracketMultiplier(distanceKm, RIDE_PRICING_CONFIG.RIDE_DISTANCE_BRACKETS);
    
    // Appliquer le facteur de distance
    const adjustedDistanceCost = distanceCost * distanceBracket.multiplier;
    
    // Calcul du prix de base
    const basePrice = baseRideCost + adjustedDistanceCost;
    
    // Appliquer le multiplicateur du véhicule
    const vehicleMultiplier = RIDE_PRICING_CONFIG.VEHICLE_MULTIPLIERS[vehicleType] || 1.0;
    const vehicleAdjustedPrice = basePrice * vehicleMultiplier;
    
    // Appliquer les limites min/max
    const finalPrice = Math.min(
      Math.max(vehicleAdjustedPrice, RIDE_PRICING_CONFIG.MINIMUM_RIDE_PRICE),
      RIDE_PRICING_CONFIG.MAXIMUM_RIDE_PRICE
    );
    
    return {
      price: Math.round(finalPrice * 100) / 100,
      details: {
        distance: distanceKm,
        vehicleType,
        
        // Coûts de base
        baseRideCost: Math.round(baseRideCost * 100) / 100,
        distanceCost: Math.round(distanceCost * 100) / 100,
        
        // Facteurs d'ajustement
        distanceBracket: distanceBracket.label,
        distanceMultiplier: distanceBracket.multiplier,
        vehicleMultiplier,
        
        // Coûts ajustés
        adjustedDistanceCost: Math.round(adjustedDistanceCost * 100) / 100,
        basePrice: Math.round(basePrice * 100) / 100,
        vehicleAdjustedPrice: Math.round(vehicleAdjustedPrice * 100) / 100,
        
        // Limites
        minimumPrice: RIDE_PRICING_CONFIG.MINIMUM_RIDE_PRICE,
        maximumPrice: RIDE_PRICING_CONFIG.MAXIMUM_RIDE_PRICE
      }
    };
  } catch (error) {
    console.error('Erreur lors du calcul du prix du trajet:', error);
    return {
      price: RIDE_PRICING_CONFIG.MINIMUM_RIDE_PRICE,
      details: {
        error: error.message
      }
    };
  }
}

/**
 * Calcule le prix complet d'un trajet avec distance automatique
 * @param {Object} params - Paramètres de calcul
 * @param {string} params.origin - Adresse de départ
 * @param {string} params.destination - Adresse d'arrivée
 * @param {string} params.vehicleType - Type de véhicule
 * @returns {Promise<Object>} Objet contenant le prix et les détails
 */
export async function calculateFullRidePrice({ origin, destination, vehicleType = 'Berline' }) {
  try {
    // Calculer la distance
    const distance = await calculateDistance(origin, destination);
    
    // Calculer le prix
    const priceCalculation = calculateRidePrice({ distance, vehicleType });
    
    return {
      ...priceCalculation,
      details: {
        ...priceCalculation.details,
        origin,
        destination
      }
    };
  } catch (error) {
    console.error('Erreur lors du calcul complet du prix du trajet:', error);
    return {
      price: RIDE_PRICING_CONFIG.MINIMUM_RIDE_PRICE,
      details: {
        error: error.message
      }
    };
  }
}

// Maintenir la compatibilité avec l'ancienne fonction
export function calculatePackageSize(dimensions) {
  const category = calculatePackageCategory(dimensions);
  // Mapping vers les anciennes tailles pour compatibilité
  const sizeMapping = {
    'COMPACT': 'S',
    'STANDARD': 'M',
    'LARGE': 'L',
    'BULKY': 'XL',
    'OVERSIZED': 'XXL'
  };
  return sizeMapping[category.category] || 'M';
} 