import { readLogs, cleanOldLogs, createApiLogger } from '../../lib/logger.ts';
import { verifyToken } from '../../lib/auth';
import prisma, { ensureConnected } from '../../lib/prisma';
import fs from 'fs';
import path from 'path';

// Fonction pour supprimer tous les fichiers de logs
function deleteAllLogs() {
  const LOG_DIR = path.join(process.cwd(), 'logs');
  let logger;
  
  try {
    logger = createApiLogger('LOGS_DELETE');
  } catch (error) {
    console.error('Erreur lors de la création du logger:', error);
  }
  try {
    if (!fs.existsSync(LOG_DIR)) {
      const result = { success: true, message: 'Aucun répertoire de logs trouvé', deletedCount: 0 };
      if (logger) logger.info('Aucun répertoire de logs trouvé');
      return result;
    }
    const files = fs.readdirSync(LOG_DIR);
    let deletedCount = 0;
    
    files.forEach(file => {
      const filePath = path.join(LOG_DIR, file);
      try {
        if (fs.statSync(filePath).isFile() && file.endsWith('.log')) {
          fs.unlinkSync(filePath);
          deletedCount++;
          if (logger) logger.info(`Fichier de log supprimé: ${file}`);
        }
      } catch (error) {
        console.error(`Erreur lors de la suppression du fichier ${file}:`, error);
        if (logger) logger.error(`Erreur lors de la suppression du fichier ${file}`, { error: error.message });
      }
    });
    
    const result = { 
      success: true, 
      message: `${deletedCount} fichier(s) de logs supprimé(s)`,
      deletedCount 
    };
    
    if (logger) logger.info(`Suppression terminée: ${deletedCount} fichiers`);
    return result;
  } catch (error) {
    console.error('Erreur lors de la suppression des logs:', error);
    if (logger) logger.error('Erreur lors de la suppression des logs', { error: error.message });
    return { 
      success: false, 
      message: `Erreur lors de la suppression: ${error.message}`,
      deletedCount: 0
    };
  }
}
// Fonction pour collecter les logs réels depuis différentes sources
async function collectRealLogs(level, limit) {
  let logger;
  
  try {
    logger = createApiLogger('LOGS_API');
  } catch (error) {
    console.error('Erreur lors de la création du logger:', error);
  }
  const realLogs = [];
  
  try {
    // 1. Logs depuis les fichiers (logs existants) - avec fallback
    try {
      const fileLogs = readLogs(level, Math.floor(limit * 0.3));
      if (Array.isArray(fileLogs)) {
        realLogs.push(...fileLogs);
      }
    } catch (error) {
      console.error('Erreur lors de la lecture des logs de fichier:', error);
    }
    // 2. Logs depuis la base de données - avec gestion d'erreur robuste
    if (level === 'info' || level === 'debug') {
      try {
        const recentUsers = await prisma.user.findMany({
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            name: true,
            email: true,
            userType: true,
            createdAt: true,
            updatedAt: true,
          }
        });
        
        if (Array.isArray(recentUsers)) {
          recentUsers.forEach(user => {
            try {
              realLogs.push({
                timestamp: user.updatedAt || user.createdAt,
                level: 'info',
                message: `Activité utilisateur: ${user.name || user.email}`,
                userId: user.id,
                meta: {
                  type: 'user_activity',
                  userType: user.userType,
                  email: user.email,
                  lastActivity: user.updatedAt
                }
              });
            } catch (error) {
              console.error('Erreur lors de la création du log utilisateur:', error);
            }
          });
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des logs utilisateurs:', error);
        if (logger) logger.error('Erreur lors de la récupération des logs utilisateurs', { error: error.message });
      }
    }
    // 3. Logs depuis les packages récents - avec gestion d'erreur
    if (level === 'info' || level === 'debug') {
      try {
        const recentPackages = await prisma.package.findMany({
          orderBy: { createdAt: 'desc' },
          take: 15,
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            userId: true,
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        });
        
        if (Array.isArray(recentPackages)) {
          recentPackages.forEach(pkg => {
            try {
              realLogs.push({
                timestamp: pkg.updatedAt || pkg.createdAt,
                level: 'info',
                message: `Package ${pkg.status?.toLowerCase() || 'unknown'}: ${pkg.title || 'Untitled'}`,
                userId: pkg.userId,
                meta: {
                  type: 'package_activity',
                  packageId: pkg.id,
                  status: pkg.status,
                  userName: pkg.user?.name,
                  userEmail: pkg.user?.email
                }
              });
            } catch (error) {
              console.error('Erreur lors de la création du log package:', error);
            }
          });
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des logs packages:', error);
        if (logger) logger.error('Erreur lors de la récupération des logs packages', { error: error.message });
      }
    }
    // 4. Logs depuis les matches récents - avec gestion d'erreur
    if (level === 'info' || level === 'debug') {
      try {
        const recentMatches = await prisma.match.findMany({
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            senderId: true,
            carrierId: true,
            package: {
              select: {
                title: true
              }
            }
          }
        });
        
        if (Array.isArray(recentMatches)) {
          recentMatches.forEach(match => {
            try {
              realLogs.push({
                timestamp: match.updatedAt || match.createdAt,
                level: 'info',
                message: `Match ${match.status?.toLowerCase() || 'unknown'}: ${match.package?.title || 'Package'}`,
                userId: match.senderId,
                meta: {
                  type: 'match_activity',
                  matchId: match.id,
                  status: match.status,
                  senderId: match.senderId,
                  carrierId: match.carrierId
                }
              });
            } catch (error) {
              console.error('Erreur lors de la création du log match:', error);
            }
          });
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des logs matches:', error);
        if (logger) logger.error('Erreur lors de la récupération des logs matches', { error: error.message });
      }
    }
    // 5. Logs d'erreur depuis les paiements - avec gestion d'erreur
    if (level === 'error' || level === 'warn') {
      try {
        const recentPayments = await prisma.payment.findMany({
          where: {
            OR: [
              { status: 'FAILED' },
              { status: 'CANCELLED' },
              { status: 'REFUNDED' }
            ]
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            status: true,
            amount: true,
            createdAt: true,
            userId: true,
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        });
        
        if (Array.isArray(recentPayments)) {
          recentPayments.forEach(payment => {
            try {
              const logLevel = payment.status === 'FAILED' ? 'error' : 'warn';
              realLogs.push({
                timestamp: payment.createdAt,
                level: logLevel,
                message: `Paiement ${payment.status?.toLowerCase() || 'unknown'}: ${payment.amount || 0}€`,
                userId: payment.userId,
                meta: {
                  type: 'payment_issue',
                  paymentId: payment.id,
                  status: payment.status,
                  amount: payment.amount,
                  userName: payment.user?.name,
                  userEmail: payment.user?.email
                }
              });
            } catch (error) {
              console.error('Erreur lors de la création du log paiement:', error);
            }
          });
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des logs paiements:', error);
        if (logger) logger.error('Erreur lors de la récupération des logs paiements', { error: error.message });
      }
    }
    // 6. Logs depuis les services récents - avec gestion d'erreur
    if (level === 'info' || level === 'debug') {
      try {
        const recentServices = await prisma.service.findMany({
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            providerId: true,
            provider: {
              select: {
                name: true,
                email: true
              }
            }
          }
        });
        
        if (Array.isArray(recentServices)) {
          recentServices.forEach(service => {
            try {
              realLogs.push({
                timestamp: service.updatedAt || service.createdAt,
                level: 'info',
                message: `Service ${service.status?.toLowerCase() || 'créé'}: ${service.title || 'Untitled'}`,
                userId: service.providerId,
                meta: {
                  type: 'service_activity',
                  serviceId: service.id,
                  status: service.status,
                  providerName: service.provider?.name,
                  providerEmail: service.provider?.email
                }
              });
            } catch (error) {
              console.error('Erreur lors de la création du log service:', error);
            }
          });
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des logs services:', error);
        if (logger) logger.error('Erreur lors de la récupération des logs services', { error: error.message });
      }
    }
    // Trier tous les logs par timestamp (plus récent en premier)
    try {
      realLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      console.error('Erreur lors du tri des logs:', error);
    }
    // Limiter au nombre demandé
    const limitedLogs = realLogs.slice(0, limit);
    
    if (logger) logger.info(`Logs collectés: ${limitedLogs.length} entrées`);
    return limitedLogs;
    
  } catch (error) {
    console.error('Erreur lors de la collecte des logs réels:', error);
    if (logger) logger.error('Erreur lors de la collecte des logs réels', { error: error.message });
    
    // Fallback vers les logs de fichier
    try {
      return readLogs(level, limit) || [];
    } catch (fallbackError) {
      console.error('Erreur lors du fallback vers les logs de fichier:', fallbackError);
      return [];
    }
  }
}
export default async function handler(req, res) {
  try {
    // Ensure database connection is established
    await ensureConnected();
    let logger;
  
  try {
    logger = createApiLogger('LOGS_API');
  } catch (error) {
    console.error('Erreur lors de la création du logger:', error);
  }
  try {
    // Vérifier l'authentification (optionnel)
    const token = req.cookies.auth_token;
    if (token) {
      try {
        const decoded = await verifyToken(token);
        if (!decoded) {
          return res.status(401).json({ 
            success: false,
            message: 'Token invalide' 
          });
        }
      } catch (error) {
        return res.status(401).json({ 
          success: false,
          message: 'Erreur d\'authentification' 
        });
      }
    }
    // Gérer les différentes méthodes HTTP
    if (req.method === 'GET') {
      const { level = 'info', limit = '100', clean = 'false', delete: deleteParam = 'false' } = req.query;
      
      // Supprimer tous les logs si demandé
      if (deleteParam === 'true') {
        const deleteResult = deleteAllLogs();
        if (logger) logger.info('Suppression des logs demandée', deleteResult);
        return res.status(200).json({
          success: deleteResult.success,
          message: deleteResult.message,
          deletedCount: deleteResult.deletedCount || 0
        });
      }
      // Nettoyer les anciens logs si demandé
      if (clean === 'true') {
        try {
          cleanOldLogs(30);
        } catch (error) {
          console.error('Erreur lors du nettoyage des logs:', error);
        }
      }
      // Collecter les logs réels depuis différentes sources
      const logs = await collectRealLogs(level, parseInt(limit));
      
      if (logger) logger.info(`Logs collectés: ${logs.length} entrées pour le niveau ${level}`);
      
      return res.status(200).json({
        success: true,
        level,
        count: logs.length,
        logs: logs || [],
        sources: ['files', 'database', 'user_activity', 'packages', 'matches', 'payments', 'services']
      });
    }
    else if (req.method === 'DELETE') {
      // Supprimer tous les logs
      const deleteResult = deleteAllLogs();
      if (logger) logger.info('Suppression des logs via DELETE', deleteResult);
      
      return res.status(200).json({
        success: deleteResult.success,
        message: deleteResult.message,
        deletedCount: deleteResult.deletedCount || 0
      });
    }
    else {
      return res.status(405).json({ 
        success: false,
        message: 'Method not allowed' 
      });
    }
  } catch (error) {
    console.error('Erreur lors de la gestion des logs:', error);
    if (logger) logger.error('Erreur lors de la gestion des logs', { error: error.message });
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Erreur inconnue',
      message: 'Erreur interne du serveur'
    });
  }
}
