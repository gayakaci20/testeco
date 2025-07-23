import * as jose from 'jose';
import Cookies from 'js-cookie';
import { JWT_SECRET, JWT_EXPIRES_IN, COOKIE_MAX_AGE } from './auth-constants.js';

/**
 * Génère un token JWT pour un utilisateur
 * @param {Object} user - L'objet utilisateur (sans le mot de passe)
 * @returns {String} Le token JWT généré
 */
export const generateToken = async (user) => {
  // Ne jamais inclure le mot de passe dans le token
  const { password, ...userWithoutPassword } = user;
  
  // Utiliser jose pour générer le token
  try {
    const encoder = new TextEncoder();
    const secretKey = encoder.encode(JWT_SECRET);

    // Simplify token payload to only include essential fields
    const tokenPayload = {
      id: userWithoutPassword.id,
      email: userWithoutPassword.email,
      role: userWithoutPassword.role,
      firstName: userWithoutPassword.firstName,
      lastName: userWithoutPassword.lastName,
      userType: userWithoutPassword.userType,
      iat: Math.floor(Date.now() / 1000), // Issued at
    };

    const jwt = await new jose.SignJWT(tokenPayload)
      .setProtectedHeader({ alg: 'HS256' }) // Algorithme de signature
      .setIssuedAt() // Date d'émission
      .setExpirationTime(JWT_EXPIRES_IN) // Date d'expiration
      .sign(secretKey); // Signer avec la clé secrète

    return jwt;
  } catch (error) {
    console.error('Erreur lors de la génération du token:', error);
    throw new Error('Could not generate token'); // Propager l'erreur
  }
};

/**
 * Vérifie un token JWT
 * @param {String} token - Le token JWT à vérifier
 * @returns {Object|null} Les données utilisateur décodées ou null si invalide
 */
export const verifyToken = async (token) => {
  if (!token) {
    return null;
  }
  
  // Check if token looks like a JWT (should have 3 parts separated by dots)
  if (typeof token !== 'string' || token.split('.').length !== 3) {
    return null;
  }
  
  try {
    const encoder = new TextEncoder();
    const secretKey = encoder.encode(JWT_SECRET);
    
    const { payload } = await jose.jwtVerify(token, secretKey);
    
    // Ensure the payload has the required fields
    if (!payload.id || !payload.email) {
      return null;
    }
    
    return payload;
  } catch (error) {
    return null;
  }
};

/**
 * Stocke le token JWT dans un cookie
 * @param {String} token - Le token JWT à stocker
 */
export const setAuthCookie = (token) => {
  // Stocker dans un cookie httpOnly en production
  Cookies.set('auth_token', token, { 
    expires: COOKIE_MAX_AGE / (60 * 60 * 24), // Convertir en jours
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
};

/**
 * Récupère le token JWT depuis les cookies
 * @returns {String|null} Le token JWT ou null
 */
export const getAuthCookie = () => {
  return Cookies.get('auth_token') || null;
};

/**
 * Supprime tous les cookies d'authentification
 */
export const removeAuthCookie = () => {
  // Supprimer tous les cookies d'authentification possibles
  Cookies.remove('auth_token', { path: '/' });
  Cookies.remove('token', { path: '/' });
  Cookies.remove('session-id', { path: '/' });
  Cookies.remove('auth-token', { path: '/' });
};

/**
 * Récupère les données utilisateur depuis le token JWT stocké dans les cookies
 * @returns {Object|null} Les données utilisateur ou null
 */
export const getUserFromCookie = () => {
  const token = getAuthCookie();
  if (!token) return null;
  
  return verifyToken(token);
};