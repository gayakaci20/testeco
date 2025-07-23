import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Play, SkipForward } from 'lucide-react';

const TutorialOverlay = ({ userRole, onComplete, isVisible }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Configuration des tutoriels pour chaque type d'utilisateur
  const tutorialConfigs = {
    CUSTOMER: {
      title: "Bienvenue sur votre espace client !",
      subtitle: "Découvrez comment utiliser la plateforme pour vos envois et services",
      steps: [
        {
          title: "Tableau de bord principal",
          description: "Voici votre tableau de bord où vous pouvez voir toutes vos activités : colis, réservations, paiements, et plus encore.",
          target: ".overview-section",
          position: "bottom",
          icon: "📊"
        },
        {
          title: "Envoyer un colis",
          description: "Cliquez sur 'Créer un Colis' pour envoyer vos packages partout. Vous pouvez suivre leur statut en temps réel.",
          target: ".create-package-btn",
          position: "bottom",
          icon: "📦"
        },
        {
          title: "Réserver des services",
          description: "Parcourez et réservez des services proposés par les prestataires de la plateforme.",
          target: ".services-section",
          position: "top",
          icon: "🔧"
        },
        {
          title: "Louer des espaces",
          description: "Vous pouvez louer des espaces de stockage sécurisés pour vos affaires.",
          target: ".storage-section",
          position: "top",
          icon: "📦"
        },
        {
          title: "Messagerie intégrée",
          description: "Communiquez directement avec les transporteurs et prestataires via notre système de messagerie.",
          target: ".messages-tab",
          position: "left",
          icon: "💬"
        },
        {
          title: "Suivi financier",
          description: "Gardez un œil sur vos dépenses et l'historique de vos paiements.",
          target: ".payments-section",
          position: "top",
          icon: "💳"
        }
      ]
    },
    CARRIER: {
      title: "Bienvenue transporteur !",
      subtitle: "Découvrez comment maximiser vos revenus avec notre plateforme",
      steps: [
        {
          title: "Tableau de bord transporteur",
          description: "Visualisez vos performances, revenus et nouvelles opportunités de livraison.",
          target: ".overview-section",
          position: "bottom",
          icon: "🚛"
        },
        {
          title: "Accepter des livraisons",
          description: "Consultez et acceptez les demandes de livraison qui correspondent à vos trajets.",
          target: ".deliveries-section",
          position: "top",
          icon: "✅"
        },
        {
          title: "Proposer des trajets",
          description: "Créez vos propres trajets pour optimiser vos revenus et aider d'autres transporteurs.",
          target: ".create-ride-btn",
          position: "bottom",
          icon: "🗺️"
        },
        {
          title: "Système de relais",
          description: "Participez au réseau de relais pour des livraisons collaboratives longue distance.",
          target: ".relay-section",
          position: "top",
          icon: "🔄"
        },
        {
          title: "Gestion des revenus",
          description: "Suivez vos gains quotidiens, mensuels et votre historique de paiements.",
          target: ".earnings-section",
          position: "top",
          icon: "💰"
        },
        {
          title: "Évaluations clients",
          description: "Maintenez une bonne réputation grâce aux avis clients et améliorez votre service.",
          target: ".reviews-section",
          position: "top",
          icon: "⭐"
        }
      ]
    },
    MERCHANT: {
      title: "Bienvenue commerçant !",
      subtitle: "Gérez votre boutique et vos ventes efficacement",
      steps: [
        {
          title: "Tableau de bord marchand",
          description: "Suivez vos ventes, commandes et performances commerciales en un coup d'œil.",
          target: ".overview-section",
          position: "bottom",
          icon: "🏪"
        },
        {
          title: "Gestion des produits",
          description: "Ajoutez, modifiez et gérez votre catalogue de produits facilement.",
          target: ".products-section",
          position: "top",
          icon: "🛍️"
        },
        {
          title: "Suivi des commandes",
          description: "Gérez toutes vos commandes, leur statut et les expéditions.",
          target: ".orders-section",
          position: "top",
          icon: "📋"
        },
        {
          title: "Analyse des ventes",
          description: "Analysez vos performances avec des graphiques détaillés et des statistiques.",
          target: ".analytics-section",
          position: "top",
          icon: "📈"
        },
        {
          title: "Gestion financière",
          description: "Suivez vos revenus, créez des factures et gérez vos finances.",
          target: ".finances-section",
          position: "top",
          icon: "💳"
        }
      ]
    },
    SERVICE_PROVIDER: {
      title: "Bienvenue prestataire !",
      subtitle: "Proposez vos services et gérez vos réservations",
      steps: [
        {
          title: "Tableau de bord prestataire",
          description: "Visualisez vos services, réservations et revenus sur votre dashboard.",
          target: ".overview-section",
          position: "bottom",
          icon: "🔧"
        },
        {
          title: "Créer des services",
          description: "Ajoutez vos services avec descriptions, prix et disponibilités.",
          target: ".create-service-btn",
          position: "bottom",
          icon: "➕"
        },
        {
          title: "Gestion des réservations",
          description: "Acceptez ou refusez les demandes de réservation de vos clients.",
          target: ".bookings-section",
          position: "top",
          icon: "📅"
        },
        {
          title: "Suivi des revenus",
          description: "Consultez vos gains et l'historique de vos paiements.",
          target: ".earnings-section",
          position: "top",
          icon: "💰"
        },
        {
          title: "Avis clients",
          description: "Consultez les évaluations de vos clients pour améliorer vos services.",
          target: ".reviews-section",
          position: "top",
          icon: "⭐"
        }
      ]
    },
    PROVIDER: {
      title: "Bienvenue fournisseur !",
      subtitle: "Gérez vos services et espaces de stockage",
      steps: [
        {
          title: "Tableau de bord fournisseur",
          description: "Vue d'ensemble de vos services, locations d'espaces et revenus.",
          target: ".overview-section",
          position: "bottom",
          icon: "🏢"
        },
        {
          title: "Services proposés",
          description: "Créez et gérez vos différents services avec tarifs personnalisés.",
          target: ".services-section",
          position: "top",
          icon: "🔧"
        },
        {
          title: "Espaces de stockage",
          description: "Proposez vos espaces de stockage à la location avec photos et descriptions.",
          target: ".storage-section",
          position: "top",
          icon: "📦"
        },
        {
          title: "Réservations actives",
          description: "Gérez toutes vos réservations en cours et à venir.",
          target: ".bookings-section",
          position: "top",
          icon: "📅"
        },
        {
          title: "Communication client",
          description: "Restez en contact avec vos clients via la messagerie intégrée.",
          target: ".messages-section",
          position: "left",
          icon: "💬"
        }
      ]
    },
    SPECIALIZED_PROVIDER: {
      title: "Bienvenue prestataire spécialisé !",
      subtitle: "Gérez vos rendez-vous et votre planning professionnel",
      steps: [
        {
          title: "Calendrier de rendez-vous",
          description: "Votre planning principal pour gérer tous vos rendez-vous clients.",
          target: ".calendar-section",
          position: "bottom",
          icon: "📅"
        },
        {
          title: "Ajouter un rendez-vous",
          description: "Planifiez facilement de nouveaux rendez-vous avec vos clients.",
          target: ".add-appointment-btn",
          position: "bottom",
          icon: "➕"
        },
        {
          title: "Gestion des clients",
          description: "Gérez votre portefeuille client et leur historique de rendez-vous.",
          target: ".clients-section",
          position: "top",
          icon: "👥"
        },
        {
          title: "Paramètres de disponibilité",
          description: "Configurez vos horaires de travail et disponibilités.",
          target: ".settings-section",
          position: "top",
          icon: "⚙️"
        },
        {
          title: "Facturation automatique",
          description: "Générez automatiquement des factures pour vos prestations.",
          target: ".invoices-section",
          position: "top",
          icon: "💳"
        }
      ]
    }
  };

  const currentConfig = tutorialConfigs[userRole] || tutorialConfigs.CUSTOMER;
  const totalSteps = currentConfig.steps.length;

  useEffect(() => {
    if (isVisible) {
      // Highlight la zone cible
      highlightTarget();
    }
  }, [currentStep, isVisible]);

  const highlightTarget = () => {
    // Retire les anciens highlights
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
      el.classList.remove('tutorial-highlight');
    });

    // Ajoute le highlight à la nouvelle cible
    const targetSelector = currentConfig.steps[currentStep]?.target;
    if (targetSelector) {
      const targetElement = document.querySelector(targetSelector);
      if (targetElement) {
        targetElement.classList.add('tutorial-highlight');
        // Scroll vers l'élément
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsAnimating(false);
      }, 200);
    } else {
      completeTutorial();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsAnimating(false);
      }, 200);
    }
  };

  const skipTutorial = () => {
    completeTutorial();
  };

  const completeTutorial = () => {
    // Retire tous les highlights
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
      el.classList.remove('tutorial-highlight');
    });
    
    // Marque le tutoriel comme terminé dans le localStorage
    localStorage.setItem(`tutorial_completed_${userRole}`, 'true');
    
    onComplete();
  };

  if (!isVisible) return null;

  const currentStepData = currentConfig.steps[currentStep];

  return (
    <>
      {/* Overlay sombre */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40 tutorial-overlay" />
      
      {/* Modal du tutoriel */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full transform transition-all duration-300 ${isAnimating ? 'scale-95 opacity-50' : 'scale-100 opacity-100'}`}>
          {/* Header */}
          <div className="bg-sky-400 text-white p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{currentConfig.title}</h2>
                <p className="text-blue-100 mt-1">{currentConfig.subtitle}</p>
              </div>
              <button
                onClick={skipTutorial}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="px-6 pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Étape {currentStep + 1} sur {totalSteps}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {Math.round(((currentStep + 1) / totalSteps) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-6">
              <div 
                className="bg-sky-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Contenu de l'étape */}
          <div className="px-6 pb-6">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">{currentStepData.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {currentStepData.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {currentStepData.description}
              </p>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className={`flex items-center px-4 py-2 rounded-lg transition-all ${
                  currentStep === 0 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <ChevronLeft size={16} className="mr-1" />
                Précédent
              </button>

              <div className="flex space-x-2">
                <button
                  onClick={skipTutorial}
                  className="flex items-center px-4 py-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  <SkipForward size={16} className="mr-1" />
                  Passer
                </button>
                
                <button
                  onClick={nextStep}
                  className="flex items-center px-6 py-2 bg-sky-400 text-white rounded-lg hover:bg-sky-500 transition-all transform hover:scale-105"
                >
                  {currentStep === totalSteps - 1 ? (
                    <>
                      Terminer
                      <Play size={16} className="ml-1" />
                    </>
                  ) : (
                    <>
                      Suivant
                      <ChevronRight size={16} className="ml-1" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Styles CSS pour le highlight */}
      <style jsx global>{`
        .tutorial-highlight {
          position: relative;
          z-index: 45;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 
                      0 0 20px rgba(59, 130, 246, 0.3);
          border-radius: 8px;
          animation: tutorial-pulse 2s infinite;
        }

        @keyframes tutorial-pulse {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 
                        0 0 20px rgba(59, 130, 246, 0.3);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.3), 
                        0 0 30px rgba(59, 130, 246, 0.2);
          }
        }

        .tutorial-overlay {
          pointer-events: auto;
        }

        .tutorial-highlight {
          pointer-events: auto;
        }
      `}</style>
    </>
  );
};

export default TutorialOverlay; 