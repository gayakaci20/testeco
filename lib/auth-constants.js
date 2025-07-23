/**
 * Constantes centralisées pour l'authentification
 * Utilisées par toutes les fonctions d'authentification dans l'application
 */

// Clé secrète pour signer les tokens JWT - à mettre dans les variables d'environnement en production
export const JWT_SECRET = process.env.JWT_SECRET || 'development_secret_key';

// Durée de validité du token
export const JWT_EXPIRES_IN = '7d';

// Durée de validité du cookie en secondes (7 jours)
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; 