import { useState, useEffect } from 'react';

export const useTutorial = (userRole) => {
  const [showTutorial, setShowTutorial] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userRole) {
      checkTutorialStatus();
    }
  }, [userRole]);

  const checkTutorialStatus = () => {
    try {
      setIsLoading(true);
      
      // Vérifier dans le localStorage si le tutoriel a déjà été vu
      const tutorialCompleted = localStorage.getItem(`tutorial_completed_${userRole}`);
      const lastLoginDate = localStorage.getItem(`last_login_${userRole}`);
      const currentDate = new Date().toDateString();

      // Si c'est la première fois qu'on voit cet utilisateur ou 
      // si le tutoriel n'a jamais été terminé
      if (!tutorialCompleted || !lastLoginDate) {
        setShowTutorial(true);
      }

      // Mettre à jour la date de dernière connexion
      localStorage.setItem(`last_login_${userRole}`, currentDate);
      
    } catch (error) {
      console.error('Erreur lors de la vérification du statut du tutoriel:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const completeTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem(`tutorial_completed_${userRole}`, 'true');
  };

  const resetTutorial = () => {
    localStorage.removeItem(`tutorial_completed_${userRole}`);
    localStorage.removeItem(`last_login_${userRole}`);
    setShowTutorial(true);
  };

  const forceTutorial = () => {
    setShowTutorial(true);
  };

  return {
    showTutorial,
    isLoading,
    completeTutorial,
    resetTutorial,
    forceTutorial
  };
}; 