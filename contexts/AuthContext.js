import { createContext, useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import { setAuthCookie, removeAuthCookie } from '../lib/auth';

// Créer le contexte d'authentification
const AuthContext = createContext();

// Export du contexte pour utilisation directe
export { AuthContext };

// Hook personnalisé pour utiliser le contexte d'authentification
export const useAuth = () => useContext(AuthContext);

// Fournisseur du contexte d'authentification
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Vérifier l'authentification au chargement en appelant l'API /api/auth/me
  useEffect(() => {
    const checkUserLoggedIn = async () => {
      try {
        console.log('🔍 Vérification de l\'authentification...');
        const response = await fetch('/api/auth/me', {
          credentials: 'include' // Important pour inclure les cookies
        });
        
        if (response.ok) {
          const userData = await response.json();
          
          // L'API /api/auth/me retourne directement l'utilisateur
          if (userData && userData.id) {
            console.log('✅ Utilisateur authentifié:', userData.email);
            setUser(userData);
          } else {
            console.error('❌ Données utilisateur manquantes:', userData);
            setUser(null);
          }
        } else {
           // Si la réponse n'est pas ok (401, 500, etc.), l'utilisateur n'est pas connecté
           // ou le token est invalide
           console.log('❌ Authentification échouée:', response.status, response.statusText);
           const errorData = await response.json().catch(() => ({}));
           console.log('❌ Détails de l\'erreur:', errorData);
           setUser(null); 
        }
      } catch (error) {
        // Erreur réseau ou autre problème
        console.error('❌ Erreur lors de la vérification d\'authentification:', error);
        setUser(null);
      } finally {
        // Indiquer que le chargement initial est terminé
        setLoading(false);
      }
    };

    checkUserLoggedIn();
  }, []); // Exécuter une seule fois au montage

  // Fonction de connexion
  const login = async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur de connexion');
      }

      // Stocker le token dans un cookie
      setAuthCookie(data.token);
      
      // Mettre à jour l'état utilisateur
      setUser(data.user);
      
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Fonction de déconnexion
  const logout = async () => {
    try {
      // Appeler l'API de déconnexion
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // Supprimer le cookie côté client
      removeAuthCookie();
      
      // Réinitialiser l'état utilisateur
      setUser(null);
      
      // Rediriger vers la page d'accueil
      router.push('/');
      
      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      return { success: false, error: error.message };
    }
  };

  // Vérifier si l'utilisateur est authentifié
  const isAuthenticated = !!user;

  // Valeur du contexte
  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}