import { useEffect, useState } from 'react';
import { detectSessionConflicts, resolveSessionConflicts, getActiveSessions, getCurrentSessionId } from '../lib/session-manager';
import { AlertTriangle, X, RefreshCw, User } from 'lucide-react';

const SessionConflictManager = () => {
  const [conflicts, setConflicts] = useState({ hasConflict: false });
  const [activeSessions, setActiveSessions] = useState([]);
  const [showManager, setShowManager] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  // Vérifier les conflits au montage et périodiquement
  useEffect(() => {
    const checkConflicts = () => {
      const conflictInfo = detectSessionConflicts();
      const sessions = getActiveSessions();
      
      setConflicts(conflictInfo);
      setActiveSessions(sessions);
      
      // Afficher automatiquement si conflit détecté
      if (conflictInfo.hasConflict && !showManager) {
        setShowManager(true);
      }
    };

    // Vérification initiale
    checkConflicts();

    // Vérification périodique (toutes les 30 secondes)
    const interval = setInterval(checkConflicts, 30000);

    // Vérification quand la fenêtre reprend le focus
    const handleFocus = () => checkConflicts();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [showManager]);

  const handleResolveConflicts = async () => {
    setIsResolving(true);
    
    try {
      const resolved = await resolveSessionConflicts();
      
      if (resolved) {
        console.log('✅ Conflits de sessions résolus');
        
        // Attendre un peu puis recharger pour appliquer les changements
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
      
      setShowManager(false);
    } catch (error) {
      console.error('❌ Erreur lors de la résolution des conflits:', error);
    } finally {
      setIsResolving(false);
    }
  };

  const handleDismiss = () => {
    setShowManager(false);
  };

  // Ne rien afficher si pas de conflits et manager fermé
  if (!conflicts.hasConflict && !showManager) {
    return null;
  }

  return (
    <>
      {/* Notification flottante de conflit */}
      {conflicts.hasConflict && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg dark:bg-yellow-900 dark:border-yellow-700">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Sessions multiples détectées
                </h3>
                <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                  {conflicts.tokens?.length} sessions actives peuvent causer des conflits de données.
                </p>
                <div className="mt-3 flex space-x-2">
                  <button
                    onClick={handleResolveConflicts}
                    disabled={isResolving}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 border border-transparent rounded hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 dark:bg-yellow-800 dark:text-yellow-200 dark:hover:bg-yellow-700"
                  >
                    {isResolving ? (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        Résolution...
                      </>
                    ) : (
                      'Résoudre'
                    )}
                  </button>
                  <button
                    onClick={() => setShowManager(true)}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-yellow-800 bg-transparent border border-yellow-300 rounded hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 dark:border-yellow-600 dark:text-yellow-200 dark:hover:bg-yellow-800"
                  >
                    Détails
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="inline-flex items-center text-yellow-400 hover:text-yellow-600 dark:hover:text-yellow-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de gestion des sessions */}
      {showManager && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleDismiss}></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full dark:bg-gray-800">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 dark:bg-gray-800">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10 dark:bg-yellow-900">
                    <User className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      Gestionnaire de Sessions
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Sessions actives détectées : {activeSessions.length}
                      </p>
                      
                      {conflicts.hasConflict && (
                        <div className="mt-3 p-3 bg-yellow-50 rounded-md dark:bg-yellow-900">
                          <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            ⚠️ Conflit détecté : Les données peuvent se mélanger entre les comptes connectés.
                          </p>
                        </div>
                      )}

                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Sessions actives :
                        </h4>
                        <div className="space-y-2">
                          {activeSessions.map((session, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded dark:bg-gray-700">
                              <div className="flex-1">
                                <p className="text-xs font-mono text-gray-600 dark:text-gray-400">
                                  {session.sessionId}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                  {session.sessionId === getCurrentSessionId() ? '(Session actuelle)' : '(Session inactive)'}
                                </p>
                              </div>
                              <div className={`w-2 h-2 rounded-full ${
                                session.sessionId === getCurrentSessionId() ? 'bg-green-500' : 'bg-gray-400'
                              }`}></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse dark:bg-gray-700">
                <button
                  type="button"
                  onClick={handleResolveConflicts}
                  disabled={isResolving || !conflicts.hasConflict}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isResolving ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Résolution...
                    </>
                  ) : (
                    'Nettoyer les conflits'
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SessionConflictManager; 