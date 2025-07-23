import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import fs from 'fs';
import path from 'path';

// Types pour les niveaux de logs
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

// Interface pour les entrées de log
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  meta?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  requestId?: string;
}

// Configuration du logger
const LOG_DIR = path.join(process.cwd(), 'logs');
const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_LOG_FILES = 5;

// Créer le répertoire de logs s'il n'existe pas
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Utilitaires pour la gestion des fichiers de log
const getLogFileName = (level: LogLevel): string => {
  const date = format(new Date(), 'yyyy-MM-dd', { locale: fr });
  return `${level}-${date}.log`;
};

const getLogFilePath = (level: LogLevel): string => {
  return path.join(LOG_DIR, getLogFileName(level));
};

// Rotation des logs
const rotateLog = (filePath: string) => {
  if (!fs.existsSync(filePath)) return;
  
  const stats = fs.statSync(filePath);
  if (stats.size < MAX_LOG_SIZE) return;
  
  // Renommer les fichiers existants
  for (let i = MAX_LOG_FILES - 1; i >= 1; i--) {
    const oldPath = `${filePath}.${i}`;
    const newPath = `${filePath}.${i + 1}`;
    
    if (fs.existsSync(oldPath)) {
      if (i === MAX_LOG_FILES - 1) {
        fs.unlinkSync(oldPath);
      } else {
        fs.renameSync(oldPath, newPath);
      }
    }
  }
  
  // Renommer le fichier actuel
  fs.renameSync(filePath, `${filePath}.1`);
};

// Écrire dans le fichier de log
const writeToFile = (level: LogLevel, entry: LogEntry) => {
  const filePath = getLogFilePath(level);
  
  try {
    // Rotation si nécessaire
    rotateLog(filePath);
    
    // Formater l'entrée de log
    const logLine = JSON.stringify(entry) + '\n';
    
    // Écrire dans le fichier
    fs.appendFileSync(filePath, logLine, 'utf8');
  } catch (error) {
    console.error('Erreur lors de l\'écriture du log:', error);
  }
};

// Classe Logger principale
class Logger {
  private context?: string;
  private userId?: string;
  private sessionId?: string;
  private requestId?: string;

  constructor(context?: string) {
    this.context = context;
  }

  setContext(context: string) {
    this.context = context;
    return this;
  }

  setUserId(userId: string) {
    this.userId = userId;
    return this;
  }

  setSessionId(sessionId: string) {
    this.sessionId = sessionId;
    return this;
  }

  setRequestId(requestId: string) {
    this.requestId = requestId;
    return this;
  }

  private log(level: LogLevel, message: string, meta?: Record<string, any>) {
    const timestamp = new Date().toISOString();
    
    const entry: LogEntry = {
      timestamp,
      level,
      message: this.context ? `[${this.context}] ${message}` : message,
      meta,
      userId: this.userId,
      sessionId: this.sessionId,
      requestId: this.requestId
    };

    // Écrire dans le fichier
    writeToFile(level, entry);
    
    // Écrire dans la console pour le développement
    if (process.env.NODE_ENV === 'development') {
      const consoleMessage = `[${timestamp}] ${level.toUpperCase()}: ${entry.message}`;
      
      switch (level) {
        case 'error':
          console.error(consoleMessage, meta);
          break;
        case 'warn':
          console.warn(consoleMessage, meta);
          break;
        case 'debug':
          console.debug(consoleMessage, meta);
          break;
        default:
          console.log(consoleMessage, meta);
      }
    }
  }

  info(message: string, meta?: Record<string, any>) {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: Record<string, any>) {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: Record<string, any>) {
    this.log('error', message, meta);
  }

  debug(message: string, meta?: Record<string, any>) {
    this.log('debug', message, meta);
  }

  // Méthodes spécifiques pour les événements courants
  apiRequest(method: string, url: string, statusCode: number, duration: number, meta?: Record<string, any>) {
    this.info(`${method} ${url} - ${statusCode} (${duration}ms)`, {
      type: 'api_request',
      method,
      url,
      statusCode,
      duration,
      ...meta
    });
  }

  apiError(method: string, url: string, error: Error, meta?: Record<string, any>) {
    this.error(`${method} ${url} - Erreur: ${error.message}`, {
      type: 'api_error',
      method,
      url,
      error: error.message,
      stack: error.stack,
      ...meta
    });
  }

  userAction(action: string, userId: string, meta?: Record<string, any>) {
    this.info(`Action utilisateur: ${action}`, {
      type: 'user_action',
      action,
      userId,
      ...meta
    });
  }

  authEvent(event: string, userId?: string, meta?: Record<string, any>) {
    this.info(`Événement d'authentification: ${event}`, {
      type: 'auth_event',
      event,
      userId,
      ...meta
    });
  }

  databaseQuery(query: string, duration: number, meta?: Record<string, any>) {
    this.debug(`Requête DB: ${query} (${duration}ms)`, {
      type: 'db_query',
      query,
      duration,
      ...meta
    });
  }

  paymentEvent(event: string, amount?: number, currency?: string, meta?: Record<string, any>) {
    this.info(`Événement de paiement: ${event}`, {
      type: 'payment_event',
      event,
      amount,
      currency,
      ...meta
    });
  }
}

// Créer une instance globale du logger
const logger = new Logger();

// Middleware pour les requêtes API
export const createApiLogger = (context: string) => {
  return new Logger(context);
};

// Utilitaire pour lire les logs
export const readLogs = (level: LogLevel, limit: number = 100): LogEntry[] => {
  const filePath = getLogFilePath(level);
  
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.trim().split('\n').filter(line => line.trim());
    
    return lines
      .slice(-limit)
      .map(line => JSON.parse(line))
      .reverse();
  } catch (error) {
    console.error('Erreur lors de la lecture des logs:', error);
    return [];
  }
};

// Utilitaire pour nettoyer les anciens logs
export const cleanOldLogs = (daysToKeep: number = 30) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  const files = fs.readdirSync(LOG_DIR);
  
  files.forEach(file => {
    const filePath = path.join(LOG_DIR, file);
    const stats = fs.statSync(filePath);
    
    if (stats.mtime < cutoffDate) {
      fs.unlinkSync(filePath);
      console.log(`Log supprimé: ${file}`);
    }
  });
};

export default logger;
export { Logger };
export type { LogLevel, LogEntry }; 