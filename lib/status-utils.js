import { 
  Clock, 
  CheckCircle, 
  Truck, 
  X, 
  AlertCircle, 
  Navigation, 
  Package 
} from 'lucide-react';

// Configuration complète des statuts de livraison
export const getStatusConfig = (status) => {
  const configs = {
    'PENDING': { 
      color: 'yellow', 
      text: 'En attente', 
      bgColor: 'bg-yellow-100', 
      textColor: 'text-yellow-800', 
      darkBg: 'dark:bg-yellow-900', 
      darkText: 'dark:text-yellow-300',
      icon: Clock,
      progress: 0
    },
    'CONFIRMED': { 
      color: 'blue', 
      text: 'Confirmé', 
      bgColor: 'bg-blue-100', 
      textColor: 'text-blue-800', 
      darkBg: 'dark:bg-blue-900', 
      darkText: 'dark:text-blue-300',
      icon: CheckCircle,
      progress: 1
    },
    'ACCEPTED_BY_SENDER': { 
      color: 'green', 
      text: 'Accepté et payé', 
      bgColor: 'bg-green-100', 
      textColor: 'text-green-800', 
      darkBg: 'dark:bg-green-900', 
      darkText: 'dark:text-green-300',
      icon: CheckCircle,
      progress: 1
    },
    'ACCEPTED_BY_CARRIER': { 
      color: 'blue', 
      text: 'Pris en charge', 
      bgColor: 'bg-blue-100', 
      textColor: 'text-blue-800', 
      darkBg: 'dark:bg-blue-900', 
      darkText: 'dark:text-blue-300',
      icon: CheckCircle,
      progress: 2
    },
    'IN_TRANSIT': { 
      color: 'orange', 
      text: 'En transit', 
      bgColor: 'bg-orange-100', 
      textColor: 'text-orange-800', 
      darkBg: 'dark:bg-orange-900', 
      darkText: 'dark:text-orange-300',
      icon: Truck,
      progress: 2
    },
    'DELIVERED': { 
      color: 'green', 
      text: 'Livré', 
      bgColor: 'bg-green-100', 
      textColor: 'text-green-800', 
      darkBg: 'dark:bg-green-900', 
      darkText: 'dark:text-green-300',
      icon: CheckCircle,
      progress: 3
    },
    'CANCELLED': { 
      color: 'red', 
      text: 'Annulé', 
      bgColor: 'bg-red-100', 
      textColor: 'text-red-800', 
      darkBg: 'dark:bg-red-900', 
      darkText: 'dark:text-red-300',
      icon: X,
      progress: 0
    },
    'AWAITING_RELAY': { 
      color: 'orange', 
      text: 'En attente de relais', 
      bgColor: 'bg-orange-100', 
      textColor: 'text-orange-800', 
      darkBg: 'dark:bg-orange-900', 
      darkText: 'dark:text-orange-300',
      icon: Navigation,
      progress: 2
    },
    'RELAY_IN_PROGRESS': { 
      color: 'purple', 
      text: 'Relais en cours', 
      bgColor: 'bg-purple-100', 
      textColor: 'text-purple-800', 
      darkBg: 'dark:bg-purple-900', 
      darkText: 'dark:text-purple-300',
      icon: Navigation,
      progress: 2
    }
  };
  
  return configs[status] || { 
    color: 'gray', 
    text: status, 
    bgColor: 'bg-gray-100', 
    textColor: 'text-gray-800', 
    darkBg: 'dark:bg-gray-900', 
    darkText: 'dark:text-gray-300',
    icon: AlertCircle,
    progress: 0
  };
};

// Fonction pour obtenir uniquement les couleurs (compatible avec delivery-tracking.jsx)
export const getStatusColor = (status) => {
  const config = getStatusConfig(status);
  return `${config.bgColor} ${config.textColor} ${config.darkBg} ${config.darkText}`;
};

// Fonction pour obtenir uniquement l'icône (compatible avec delivery-tracking.jsx)
export const getStatusIcon = (status) => {
  const config = getStatusConfig(status);
  const Icon = config.icon;
  return <Icon className="w-4 h-4" />;
};

// Fonction pour obtenir uniquement le texte (compatible avec delivery-tracking.jsx)
export const getStatusText = (status) => {
  const config = getStatusConfig(status);
  return config.text;
};

// Fonction pour obtenir le niveau de progression (0-3)
export const getStatusProgress = (status) => {
  const config = getStatusConfig(status);
  return config.progress;
};

// Fonction pour vérifier si un statut est actif (en cours de traitement)
export const isActiveStatus = (status) => {
  return ['CONFIRMED', 'ACCEPTED_BY_SENDER', 'ACCEPTED_BY_CARRIER', 'IN_TRANSIT', 'AWAITING_RELAY', 'RELAY_IN_PROGRESS'].includes(status);
};

// Fonction pour vérifier si un statut est terminé
export const isCompletedStatus = (status) => {
  return ['DELIVERED', 'CANCELLED'].includes(status);
};

// Fonction pour obtenir les prochaines actions possibles selon le statut
export const getNextActions = (status) => {
  const actions = {
    'PENDING': ['CONFIRMED', 'CANCELLED'],
    'CONFIRMED': ['ACCEPTED_BY_SENDER', 'CANCELLED'],
    'ACCEPTED_BY_SENDER': ['ACCEPTED_BY_CARRIER', 'CANCELLED'],
    'ACCEPTED_BY_CARRIER': ['IN_TRANSIT', 'AWAITING_RELAY'],
    'IN_TRANSIT': ['DELIVERED', 'AWAITING_RELAY'],
    'AWAITING_RELAY': ['RELAY_IN_PROGRESS'],
    'RELAY_IN_PROGRESS': ['DELIVERED', 'AWAITING_RELAY']
  };
  
  return actions[status] || [];
};

// Options pour les filtres (compatible avec delivery-tracking.jsx)
export const statusFilterOptions = [
  { id: 'all', name: 'Tous les statuts', icon: Package, color: 'gray' },
  { id: 'PENDING', name: 'En attente', icon: Clock, color: 'yellow' },
  { id: 'CONFIRMED', name: 'Confirmé', icon: CheckCircle, color: 'blue' },
  { id: 'ACCEPTED_BY_SENDER', name: 'Accepté et payé', icon: CheckCircle, color: 'green' },
  { id: 'ACCEPTED_BY_CARRIER', name: 'Pris en charge', icon: CheckCircle, color: 'blue' },
  { id: 'IN_TRANSIT', name: 'En transit', icon: Truck, color: 'orange' },
  { id: 'DELIVERED', name: 'Livré', icon: CheckCircle, color: 'green' },
  { id: 'CANCELLED', name: 'Annulé', icon: X, color: 'red' },
  { id: 'AWAITING_RELAY', name: 'En attente de relais', icon: Navigation, color: 'orange' },
  { id: 'RELAY_IN_PROGRESS', name: 'Relais en cours', icon: Navigation, color: 'purple' }
];

// Fonction utilitaire pour calculer les statistiques des packages
export const calculatePackageStats = (packages) => {
  return {
    totalPackages: packages.length,
    inTransit: packages.filter(p => ['ACCEPTED_BY_CARRIER', 'IN_TRANSIT'].includes(p.status)).length,
    delivered: packages.filter(p => p.status === 'DELIVERED').length,
    pending: packages.filter(p => ['PENDING', 'CONFIRMED', 'ACCEPTED_BY_SENDER'].includes(p.status)).length
  };
};

// Fonction pour obtenir les étapes de la timeline de livraison
export const getTimelineSteps = (pkg) => {
  const baseSteps = [
    { 
      status: 'CREATED', 
      label: 'Colis créé', 
      icon: Package, 
      timestamp: pkg.createdAt,
      completed: true 
    },
    { 
      status: 'CONFIRMED', 
      label: 'Confirmé et payé', 
      icon: CheckCircle, 
      timestamp: pkg.updatedAt,
      completed: ['CONFIRMED', 'ACCEPTED_BY_SENDER', 'ACCEPTED_BY_CARRIER', 'IN_TRANSIT', 'DELIVERED'].includes(pkg.status)
    },
    { 
      status: 'ACCEPTED_BY_CARRIER', 
      label: 'Pris en charge par le transporteur', 
      icon: CheckCircle, 
      timestamp: null,
      completed: ['ACCEPTED_BY_CARRIER', 'IN_TRANSIT', 'DELIVERED'].includes(pkg.status)
    },
    { 
      status: 'IN_TRANSIT', 
      label: 'En transit', 
      icon: Truck, 
      timestamp: null,
      completed: ['IN_TRANSIT', 'DELIVERED'].includes(pkg.status)
    },
    { 
      status: 'DELIVERED', 
      label: 'Livré', 
      icon: CheckCircle, 
      timestamp: null,
      completed: pkg.status === 'DELIVERED'
    }
  ];

  return baseSteps;
};

// Fonction pour synchroniser l'état entre carrier et customer
export const syncDeliveryStatus = (carrierDelivery, customerPackage) => {
  // Assure que les deux objets ont le même statut
  const status = carrierDelivery.status || customerPackage.status;
  const config = getStatusConfig(status);
  
  return {
    ...config,
    status,
    isActive: isActiveStatus(status),
    isCompleted: isCompletedStatus(status),
    progressLevel: config.progress,
    // Données combinées
    carrierData: carrierDelivery,
    customerData: customerPackage
  };
}; 