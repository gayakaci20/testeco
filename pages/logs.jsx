import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';

const LogsPage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState('info');
  const [limit, setLimit] = useState(100);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const levels = ['info', 'warn', 'error', 'debug'];

  // Rediriger si pas admin
  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/logs?level=${selectedLevel}&limit=${limit}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setLogs(data.logs);
        setError(null);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message || 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  const cleanOldLogs = async () => {
    try {
      await fetch('/api/logs?clean=true', { credentials: 'include' });
      await fetchLogs();
    } catch (err) {
      setError(err.message || 'Erreur lors du nettoyage');
    }
  };

  // Convertir les logs en format UserLog pour l'affichage
  const convertToUserLogs = (logs) => {
    return logs.map(log => {
      const meta = log.meta || {};
      const userAgent = meta.userAgent || 'Inconnu';
      const ipAddress = meta.ip || '127.0.0.1';
      
      let status = 'Réussie';
      if (log.level === 'error') status = 'Échec';
      if (log.level === 'warn') status = 'Avertissement';
      
      let username = 'Anonyme';
      let email = 'N/A';
      let role = 'Client';
      let details = log.message;
      
      if (meta.type === 'auth_event') {
        username = meta.username || log.userId || 'Anonyme';
        email = meta.email || 'N/A';
        role = meta.role || 'Client';
        
        if (meta.event === 'login') {
          details = meta.details || 'Connexion réussie via interface web';
        } else if (meta.event === 'logout') {
          details = meta.details || 'Déconnexion réussie';
        } else if (meta.event === 'register') {
          details = meta.details || 'Inscription réussie';
        }
      }
      
      if (meta.type === 'api_request') {
        if (meta.statusCode >= 200 && meta.statusCode < 300) {
          status = 'Réussie';
        } else if (meta.statusCode >= 400) {
          status = 'Échec';
        }
      }
      
      if (meta.type === 'api_error') {
        status = 'Échec';
      }
      
      if (log.userId && username === 'Anonyme') {
        username = log.userId;
      }
      
      return {
        timestamp: log.timestamp,
        username,
        email,
        ipAddress,
        status,
        details,
        userAgent,
        level: log.level,
        userId: log.userId,
        sessionId: log.sessionId,
        requestId: log.requestId,
        role
      };
    });
  };

  const userLogs = convertToUserLogs(logs);
  const filteredLogs = userLogs.filter(log => 
    log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'Réussie': return 'bg-green-100 text-green-800';
      case 'Échec': return 'bg-red-100 text-red-800';
      case 'Avertissement': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBrowserIcon = (userAgent) => {
    if (userAgent.includes('Chrome')) return '🌐';
    if (userAgent.includes('Firefox')) return '🦊';
    if (userAgent.includes('Safari')) return '🧭';
    if (userAgent.includes('Mobile')) return '📱';
    return '🖥️';
  };

  const getBrowserName = (userAgent) => {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Mobile')) return 'Mobile App';
    return 'Desktop';
  };

  const formatDate = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return isNaN(date.getTime()) ? timestamp : date.toLocaleDateString('fr-FR');
    } catch {
      return timestamp.split(' ')[0] || 'Date invalide';
    }
  };

  const formatTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return isNaN(date.getTime()) ? timestamp : date.toLocaleTimeString('fr-FR');
    } catch {
      return timestamp.split(' ')[1] || 'Heure invalide';
    }
  };

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      fetchLogs();
    }
  }, [selectedLevel, limit, user]);

  useEffect(() => {
    if (autoRefresh && user && user.role === 'ADMIN') {
      const interval = setInterval(fetchLogs, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, selectedLevel, limit, user]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Chargement...</div>;
  }

  if (!user || user.role !== 'ADMIN') {
    return <div className="flex justify-center items-center min-h-screen">Accès refusé</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <Head>
        <title>Logs d'Activité - EcoDeli</title>
        <meta name="description" content="Logs d'activité du système EcoDeli" />
      </Head>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Logs d'Activité</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={cleanOldLogs}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Nettoyer les anciens logs
              </button>
              <button
                onClick={fetchLogs}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Chargement...' : 'Actualiser'}
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Niveau:</label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {levels.map(level => (
                  <option key={level} value={level}>
                    {level.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Limite:</label>
              <select
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={500}>500</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoRefresh"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="autoRefresh" className="text-sm font-medium text-gray-700">
                Actualisation automatique (5s)
              </label>
            </div>

            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Rechercher par utilisateur, email ou détails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-4">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 font-medium">Erreur: {error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Chargement des logs...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date/Heure
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utilisateur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Adresse IP
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Détails
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Navigateur
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        Aucun log trouvé
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log, index) => (
                      <tr key={`${log.timestamp}-${index}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(log.timestamp)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatTime(log.timestamp)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{log.username}</div>
                          <div className="text-sm text-gray-500">{log.role}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-blue-600">{log.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-red-600 font-mono">{log.ipAddress}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(log.status)}`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {log.details}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <span className="mr-2">{getBrowserIcon(log.userAgent)}</span>
                            {getBrowserName(log.userAgent)}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogsPage; 