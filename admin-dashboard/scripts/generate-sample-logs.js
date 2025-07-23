// Script pour générer des logs d'exemple
const fs = require('fs');
const path = require('path');

// Configuration
const LOG_DIR = path.join(__dirname, '../logs');
const sampleUsers = [
  { id: 'skande0', email: 'skande0@gmail.com', name: 'skande0', role: 'Client' },
  { id: 'mardaci', email: 'mardaciskander23425@gmail.com', name: 'mardaci', role: 'Administrateur' },
  { id: 'onfanda', email: 'onfanda@gmail.com', name: 'onfanda', role: 'Client' },
  { id: 'aniece', email: 'avnfanda@gmail.com', name: 'aniece', role: 'Administrateur' },
  { id: 'lolojuju', email: 'lolojuju@gmail.com', name: 'lolojuju', role: 'Prestataire' }
];

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
  'Mozilla/5.0 (Android 11; Mobile; rv:68.0) Gecko/68.0 Firefox/88.0',
  'EcoDeliveryApp/1.0 (Mobile; Android 11)',
  'EcoDeliveryApp/1.0 (Mobile; iOS 14.6)'
];

// Créer le répertoire de logs s'il n'existe pas
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Fonction pour obtenir la date actuelle au format ISO
const getFormattedDate = (date = new Date()) => {
  return date.toISOString();
};

// Fonction pour générer un log d'authentification
const generateAuthLog = (user, success = true, eventType = 'login') => {
  const timestamp = getFormattedDate();
  const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
  const isMobile = userAgent.includes('Mobile') || userAgent.includes('iPhone') || userAgent.includes('Android');
  const details = success 
    ? `Connexion réussie via ${isMobile ? 'API mobile' : 'interface web Django'}`
    : `Tentative de connexion échouée`;
  
  return {
    timestamp,
    level: success ? 'info' : 'warn',
    message: `[AUTH] Événement d'authentification: ${eventType}`,
    meta: {
      type: 'auth_event',
      event: eventType,
      username: user.name,
      email: user.email,
      role: user.role,
      ip: '127.0.0.1',
      userAgent,
      status: success ? 'Réussie' : 'Échec',
      details,
      duration: Math.floor(Math.random() * 500) + 100
    },
    userId: user.id,
    sessionId: Math.random().toString(36).substring(2, 15),
    requestId: Math.random().toString(36).substring(2, 15)
  };
};

// Fonction pour générer un log d'action utilisateur
const generateUserActionLog = (user, action) => {
  const timestamp = getFormattedDate();
  const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
  
  return {
    timestamp,
    level: 'info',
    message: `[USER_ACTION] Action utilisateur: ${action}`,
    meta: {
      type: 'user_action',
      action,
      username: user.name,
      email: user.email,
      role: user.role,
      ip: '127.0.0.1',
      userAgent,
      status: 'Réussie',
      userId: user.id
    },
    userId: user.id,
    sessionId: Math.random().toString(36).substring(2, 15),
    requestId: Math.random().toString(36).substring(2, 15)
  };
};

// Fonction pour générer un log d'API
const generateApiLog = (user, method, endpoint, statusCode) => {
  const timestamp = getFormattedDate();
  const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
  const duration = Math.floor(Math.random() * 1000) + 50;
  
  return {
    timestamp,
    level: statusCode >= 400 ? 'error' : 'info',
    message: `[API] ${method} ${endpoint} - ${statusCode} (${duration}ms)`,
    meta: {
      type: statusCode >= 400 ? 'api_error' : 'api_request',
      method,
      url: endpoint,
      statusCode,
      duration,
      username: user.name,
      email: user.email,
      ip: '127.0.0.1',
      userAgent,
      status: statusCode >= 400 ? 'Échec' : 'Réussie'
    },
    userId: user.id,
    sessionId: Math.random().toString(36).substring(2, 15),
    requestId: Math.random().toString(36).substring(2, 15)
  };
};

// Fonction pour écrire les logs dans le fichier
const writeLogToFile = (level, logEntry) => {
  const today = new Date().toISOString().split('T')[0];
  const fileName = `${level}-${today}.log`;
  const filePath = path.join(LOG_DIR, fileName);
  
  const logLine = JSON.stringify(logEntry) + '\n';
  fs.appendFileSync(filePath, logLine, 'utf8');
};

// Générer des logs d'exemple
console.log('🚀 Génération des logs d\'exemple...');

// Générer des logs de connexion réussie
sampleUsers.forEach(user => {
  const loginLog = generateAuthLog(user, true, 'login');
  writeLogToFile('info', loginLog);
  
  // Quelques actions après la connexion
  const actions = ['view_dashboard', 'create_package', 'update_profile', 'view_orders'];
  const randomAction = actions[Math.floor(Math.random() * actions.length)];
  const actionLog = generateUserActionLog(user, randomAction);
  writeLogToFile('info', actionLog);
  
  // Quelques requêtes API
  const apiEndpoints = ['/api/dashboard', '/api/packages', '/api/users', '/api/orders'];
  const randomEndpoint = apiEndpoints[Math.floor(Math.random() * apiEndpoints.length)];
  const apiLog = generateApiLog(user, 'GET', randomEndpoint, 200);
  writeLogToFile('info', apiLog);
});

// Générer quelques logs d'erreur
const errorUser = sampleUsers[0];
const errorLog = generateAuthLog(errorUser, false, 'login');
writeLogToFile('warn', errorLog);

const apiErrorLog = generateApiLog(errorUser, 'POST', '/api/orders', 500);
writeLogToFile('error', apiErrorLog);

// Générer des logs de déconnexion
sampleUsers.slice(0, 3).forEach(user => {
  const logoutLog = generateAuthLog(user, true, 'logout');
  writeLogToFile('info', logoutLog);
});

console.log('✅ Logs d\'exemple générés avec succès !');
console.log(`📁 Répertoire: ${LOG_DIR}`);
console.log('📊 Vous pouvez maintenant voir les logs dans l\'interface d\'administration à /logs'); 