import { createContext, useContext, useState, useEffect } from 'react';

// Traductions complètes pour l'application
const translations = {
  fr: {
    // Navigation générale
    home: 'Accueil',
    services: 'Services',
    storage: 'Stockage',
    rides: 'Trajets',
    login: 'Connexion',
    register: 'Inscription',
    dashboard: 'Dashboard',
    messages: 'Messages',
    notifications: 'Notifications',
    myProfile: 'Mon Profil',
    logout: 'Déconnexion',
    
    // Actions communes
    save: 'Sauvegarder',
    cancel: 'Annuler',
    edit: 'Modifier',
    delete: 'Supprimer',
    confirm: 'Confirmer',
    close: 'Fermer',
    back: 'Retour',
    next: 'Suivant',
    previous: 'Précédent',
    submit: 'Envoyer',
    create: 'Créer',
    update: 'Mettre à jour',
    loading: 'Chargement...',
    search: 'Rechercher',
    filter: 'Filtrer',
    show: 'Afficher',
    hide: 'Masquer',
    view: 'Voir',
    download: 'Télécharger',
    upload: 'Téléverser',
    yes: 'Oui',
    no: 'Non',
    
    // Formulaires
    name: 'Nom',
    email: 'Email',
    password: 'Mot de passe',
    confirmPassword: 'Confirmer le mot de passe',
    phone: 'Téléphone',
    address: 'Adresse',
    city: 'Ville',
    postalCode: 'Code postal',
    country: 'Pays',
    description: 'Description',
    price: 'Prix',
    quantity: 'Quantité',
    weight: 'Poids',
    size: 'Taille',
    date: 'Date',
    time: 'Heure',
    location: 'Localisation',
    
    // Statuts
    pending: 'En attente',
    inProgress: 'En cours',
    completed: 'Terminé',
    cancelled: 'Annulé',
    confirmed: 'Confirmé',
    rejected: 'Rejeté',
    active: 'Actif',
    inactive: 'Inactif',
    available: 'Disponible',
    unavailable: 'Indisponible',
    
    // Rôles utilisateur
    client: 'Client',
    customer: 'Client',
    carrier: 'Transporteur',
    carrierPro: 'Transporteur Pro',
    merchant: 'Marchand',
    provider: 'Prestataire',
    serviceProvider: 'Prestataire de Services',
    specializedProvider: 'Prestataire Spécialisé',
    admin: 'Administrateur',
    user: 'Utilisateur',
    
    // Navigation par rôle
    courses: 'Courses',
    send: 'Envoyer',
    tracking: 'Suivi',
    findPackages: 'Trouver colis',
    matches: 'Correspondances',
    earnings: 'Revenus',
    dashboardPro: 'Dashboard Pro',
    products: 'Produits',
    orders: 'Commandes',
    shipments: 'Expéditions',
    analytics: 'Analytics',
    myServices: 'Mes services',
    bookings: 'Réservations',
    clients: 'Clients',
    calendar: 'Calendrier',
    specializedServices: 'Services',
    manageClients: 'Clients',
    invoices: 'Facturation',
    
    // Titres de dashboard
    clientDashboard: 'Tableau de bord Client',
    customerDashboard: 'Tableau de bord Client',
    carrierDashboard: 'Tableau de bord Transporteur',
    carrierProDashboard: 'Tableau de bord Transporteur Pro',
    merchantDashboard: 'Tableau de bord Marchand',
    providerDashboard: 'Tableau de bord Prestataire',
    serviceProviderDashboard: 'Tableau de bord Prestataire de Services',
    specializedProviderDashboard: 'Tableau de bord Prestataire Spécialisé',
    adminDashboard: 'Tableau de bord Administrateur',
    
    // Page d'accueil
    welcomeTitle: 'La plateforme',
    welcomeSubtitle: 'écologique',
    welcomeMultiServices: 'multi-services',
    welcomeDescription: 'Livraisons durables, services à domicile, marketplace intégrée. Rejoignez l\'économie collaborative et écologique.',
    getStarted: 'Commencer',
    learnMore: 'En savoir plus',
    
    // Types d'utilisateurs
    individualClient: 'Particulier - Client',
    professionalCarrier: 'Transporteur',
    merchantSeller: 'Marchand', 
    serviceProvider: 'Prestataire Services',
    individualClientDesc: 'Envoyez vos colis et utilisez nos services',
    professionalCarrierDesc: 'Proposez vos trajets et gérez vos livraisons',
    merchantSellerDesc: 'Vendez vos produits et gérez vos expéditions',
    serviceProviderDesc: 'Offrez vos services spécialisés',
    
    // Fonctionnalités
    packageSending: 'Envoie de colis',
    homeServices: 'Services à domicile',
    realTimeTracking: 'Suivi en temps réel',
    routeProposals: 'Proposition de trajets',
    deliveryManagement: 'Gestion livraisons',
    flexibleEarnings: 'Revenus flexibles',
    productSales: 'Vente de produits',
    shippingManagement: 'Gestion expéditions',
    businessAnalytics: 'Analytics business',
    variousServices: 'Services variés',
    bookingCalendar: 'Calendrier de réservation',
    automaticBilling: 'Facturation automatique',
    
    // Colis et livraisons
    package: 'Colis',
    packages: 'Colis',
    delivery: 'Livraison',
    deliveries: 'Livraisons',
    shipment: 'Expédition',
    shipments: 'Expéditions',
    sender: 'Expéditeur',
    recipient: 'Destinataire',
    pickupAddress: 'Adresse de collecte',
    deliveryAddress: 'Adresse de livraison',
    packageDetails: 'Détails du colis',
    objectName: 'Nom de l\'objet',
    
    // Services
    service: 'Service',
    serviceBooking: 'Réservation de service',
    serviceCategory: 'Catégorie de service',
    serviceDetails: 'Détails du service',
    serviceProvider: 'Prestataire de service',
    
    // Stockage
    storageBox: 'Box de stockage',
    storageBoxes: 'Boxes de stockage',
    storageRental: 'Location de stockage',
    storageSize: 'Taille de stockage',
    storageLocation: 'Lieu de stockage',
    
    // Paiements
    payment: 'Paiement',
    payments: 'Paiements',
    paymentMethod: 'Méthode de paiement',
    paymentStatus: 'Statut de paiement',
    paymentHistory: 'Historique des paiements',
    totalAmount: 'Montant total',
    
    // Messages d'erreur
    errorOccurred: 'Une erreur s\'est produite',
    tryAgain: 'Réessayer',
    fieldRequired: 'Ce champ est requis',
    invalidEmail: 'Email invalide',
    passwordTooShort: 'Mot de passe trop court',
    passwordMismatch: 'Les mots de passe ne correspondent pas',
    
    // Messages de succès
    savedSuccessfully: 'Sauvegardé avec succès',
    createdSuccessfully: 'Créé avec succès',
    updatedSuccessfully: 'Mis à jour avec succès',
    deletedSuccessfully: 'Supprimé avec succès',
    
    // Labels d'accessibilité
    toggleDarkMode: 'Basculer le mode sombre',
    openUserMenu: 'Ouvrir le menu utilisateur',
    toggleLanguage: 'Changer de langue',
    closeModal: 'Fermer la modal',
    
    // Contrats
    contract: 'Contrat',
    contracts: 'Contrats',
    signContract: 'Signer le contrat',
    contractSigned: 'Contrat signé',
    contractStatus: 'Statut du contrat',
    contractDetails: 'Détails du contrat',
    
    // Trajets
    ride: 'Trajet',
    rides: 'Trajets',
    createRide: 'Créer un trajet',
    fromCity: 'Ville de départ',
    toCity: 'Ville d\'arrivée',
    departureDate: 'Date de départ',
    departureTime: 'Heure de départ',
    availableSpaces: 'Places disponibles',
    
    // Tutoriel
    welcome: 'Bienvenue',
    tutorial: 'Tutoriel',
    skipTutorial: 'Passer le tutoriel',
    nextStep: 'Étape suivante',
    previousStep: 'Étape précédente',
    finishTutorial: 'Terminer le tutoriel',
    
    // Catégories de services
    cleaning: 'Nettoyage',
    maintenance: 'Maintenance',
    repair: 'Réparation',
    installation: 'Installation',
    consulting: 'Conseil',
    delivery: 'Livraison',
    gardening: 'Jardinage',
    moving: 'Déménagement',
    handyman: 'Bricolage',
    other: 'Autre',
    
    // Page de connexion
    loginDescription: 'Connectez-vous à votre compte ecodeli',
    welcomeToEcodeli: 'Bienvenue chez ecodeli !',
    loginOrRegisterPrompt: 'Connectez-vous ou inscrivez-vous.',
    forgotPassword: 'Mot de passe oublié',
    loggingIn: 'Connexion en cours...',
    loginButton: 'Me connecter',
    registerLink: 'S\'inscrire',
    
    // Page d'inscription
    registerTitle: 'Créer un compte',
    registerDescription: 'Créez votre compte ecodeli',
    createAccount: 'Créer mon compte',
    alreadyHaveAccount: 'Déjà un compte ?',
    loginLink: 'Se connecter',
    firstName: 'Prénom',
    lastName: 'Nom',
    confirmPassword: 'Confirmer le mot de passe',
    acceptTerms: 'J\'accepte les conditions d\'utilisation',
    
    // Messages d'erreur communs
    fieldRequired: 'Ce champ est requis',
    invalidEmail: 'Email invalide',
    passwordTooShort: 'Mot de passe trop court',
    passwordMismatch: 'Les mots de passe ne correspondent pas',
    loginError: 'Erreur de connexion',
    registrationError: 'Erreur lors de l\'inscription',
    passwordTooWeak: 'Votre mot de passe est trop faible. Veuillez le renforcer.',
    mustAcceptTerms: 'Vous devez accepter les conditions d\'utilisation.',
    fillFirstLastName: 'Veuillez remplir le prénom et le nom.',
    fillCompanyFields: 'Veuillez remplir tous les champs de la société.',
    
    // Force du mot de passe
    veryWeak: 'Très faible',
    weak: 'Faible',
    medium: 'Moyen',
    strong: 'Fort',
    veryStrong: 'Très fort',
    
    // Page d'inscription - suite
    registerSubtitle: 'Rejoignez ecodeli pour profiter de tous nos services.',
    iAm: 'Je suis',
    individual: 'Particulier',
    professional: 'Professionnel',
    
    // Rôles utilisateur
    customerRole: 'Client',
    customerRoleDesc: 'J\'envoie des colis et utilise des services',
    carrierRole: 'Transporteur',
    carrierRoleDesc: 'Je transporte des colis lors de mes trajets',
    merchantRole: 'Marchand',
    merchantRoleDesc: 'Je vends des produits et expédie régulièrement',
    providerRole: 'Prestataire',
    providerRoleDesc: 'J\'offre des services généraux',
    serviceProviderRole: 'Prestataire de Services',
    serviceProviderRoleDesc: 'J\'offre des services spécialisés (nettoyage, réparation, etc.)',
    
    // Champs de formulaire
    companyName: 'Nom de l\'entreprise',
    companyFirstName: 'Prénom du contact',
    companyLastName: 'Nom du contact',
    myProfile: 'Mon profil',
    companyInformation: 'Informations société',
    companyManager: 'Dirigeant(e) de la société',
    passwordStrength: 'Robustesse',
    iAcceptThe: 'J\'accepte les',
    termsOfUse: 'conditions d\'utilisation',
    creatingAccount: 'Création en cours...',
    alreadyRegistered: 'Déjà inscrit ?',
    
    // Profil utilisateur
    fullName: 'Nom complet',
    emailPlaceholder: 'votre@email.com',
    notProvided: 'Non renseigné',
    unknown: 'Inconnu',
    loadingMap: 'Chargement de la carte...',
  },
  en: {
    // Navigation générale
    home: 'Home',
    services: 'Services',
    storage: 'Storage',
    rides: 'Rides',
    login: 'Login',
    register: 'Register',
    dashboard: 'Dashboard',
    messages: 'Messages',
    notifications: 'Notifications',
    myProfile: 'My Profile',
    logout: 'Logout',
    
    // Actions communes
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    confirm: 'Confirm',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    submit: 'Submit',
    create: 'Create',
    update: 'Update',
    loading: 'Loading...',
    search: 'Search',
    filter: 'Filter',
    show: 'Show',
    hide: 'Hide',
    view: 'View',
    download: 'Download',
    upload: 'Upload',
    yes: 'Yes',
    no: 'No',
    
    // Formulaires
    name: 'Name',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    phone: 'Phone',
    address: 'Address',
    city: 'City',
    postalCode: 'Postal Code',
    country: 'Country',
    description: 'Description',
    price: 'Price',
    quantity: 'Quantity',
    weight: 'Weight',
    size: 'Size',
    date: 'Date',
    time: 'Time',
    location: 'Location',
    
    // Statuts
    pending: 'Pending',
    inProgress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    confirmed: 'Confirmed',
    rejected: 'Rejected',
    active: 'Active',
    inactive: 'Inactive',
    available: 'Available',
    unavailable: 'Unavailable',
    
    // Rôles utilisateur
    client: 'Client',
    customer: 'Customer',
    carrier: 'Carrier',
    carrierPro: 'Pro Carrier',
    merchant: 'Merchant',
    provider: 'Provider',
    serviceProvider: 'Service Provider',
    specializedProvider: 'Specialized Provider',
    admin: 'Administrator',
    user: 'User',
    
    // Navigation par rôle
    courses: 'Courses',
    send: 'Send',
    tracking: 'Tracking',
    findPackages: 'Find Packages',
    matches: 'Matches',
    earnings: 'Earnings',
    dashboardPro: 'Pro Dashboard',
    products: 'Products',
    orders: 'Orders',
    shipments: 'Shipments',
    analytics: 'Analytics',
    myServices: 'My Services',
    bookings: 'Bookings',
    clients: 'Clients',
    calendar: 'Calendar',
    specializedServices: 'Services',
    manageClients: 'Clients',
    invoices: 'Invoicing',
    
    // Titres de dashboard
    clientDashboard: 'Client Dashboard',
    customerDashboard: 'Customer Dashboard',
    carrierDashboard: 'Carrier Dashboard',
    carrierProDashboard: 'Pro Carrier Dashboard',
    merchantDashboard: 'Merchant Dashboard',
    providerDashboard: 'Provider Dashboard',
    serviceProviderDashboard: 'Service Provider Dashboard',
    specializedProviderDashboard: 'Specialized Provider Dashboard',
    adminDashboard: 'Admin Dashboard',
    
    // Page d'accueil
    welcomeTitle: 'The',
    welcomeSubtitle: 'ecological',
    welcomeMultiServices: 'multi-service platform',
    welcomeDescription: 'Sustainable deliveries, home services, integrated marketplace. Join the collaborative and ecological economy.',
    getStarted: 'Get Started',
    learnMore: 'Learn More',
    
    // Types d'utilisateurs
    individualClient: 'Individual - Client',
    professionalCarrier: 'Carrier',
    merchantSeller: 'Merchant',
    serviceProvider: 'Service Provider',
    individualClientDesc: 'Send your packages and use our services',
    professionalCarrierDesc: 'Offer your routes and manage deliveries',
    merchantSellerDesc: 'Sell your products and manage shipments',
    serviceProviderDesc: 'Offer your specialized services',
    
    // Fonctionnalités
    packageSending: 'Package sending',
    homeServices: 'Home services',
    realTimeTracking: 'Real-time tracking',
    routeProposals: 'Route proposals',
    deliveryManagement: 'Delivery management',
    flexibleEarnings: 'Flexible earnings',
    productSales: 'Product sales',
    shippingManagement: 'Shipping management',
    businessAnalytics: 'Business analytics',
    variousServices: 'Various services',
    bookingCalendar: 'Booking calendar',
    automaticBilling: 'Automatic billing',
    
    // Colis et livraisons
    package: 'Package',
    packages: 'Packages',
    delivery: 'Delivery',
    deliveries: 'Deliveries',
    shipment: 'Shipment',
    shipments: 'Shipments',
    sender: 'Sender',
    recipient: 'Recipient',
    pickupAddress: 'Pickup address',
    deliveryAddress: 'Delivery address',
    packageDetails: 'Package details',
    objectName: 'Object name',
    
    // Services
    service: 'Service',
    serviceBooking: 'Service booking',
    serviceCategory: 'Service category',
    serviceDetails: 'Service details',
    serviceProvider: 'Service provider',
    
    // Stockage
    storageBox: 'Storage box',
    storageBoxes: 'Storage boxes',
    storageRental: 'Storage rental',
    storageSize: 'Storage size',
    storageLocation: 'Storage location',
    
    // Paiements
    payment: 'Payment',
    payments: 'Payments',
    paymentMethod: 'Payment method',
    paymentStatus: 'Payment status',
    paymentHistory: 'Payment history',
    totalAmount: 'Total amount',
    
    // Messages d'erreur
    errorOccurred: 'An error occurred',
    tryAgain: 'Try again',
    fieldRequired: 'This field is required',
    invalidEmail: 'Invalid email',
    passwordTooShort: 'Password too short',
    passwordMismatch: 'Passwords do not match',
    
    // Messages de succès
    savedSuccessfully: 'Saved successfully',
    createdSuccessfully: 'Created successfully',
    updatedSuccessfully: 'Updated successfully',
    deletedSuccessfully: 'Deleted successfully',
    
    // Labels d'accessibilité
    toggleDarkMode: 'Toggle dark mode',
    openUserMenu: 'Open user menu',
    toggleLanguage: 'Change language',
    closeModal: 'Close modal',
    
    // Contrats
    contract: 'Contract',
    contracts: 'Contracts',
    signContract: 'Sign contract',
    contractSigned: 'Contract signed',
    contractStatus: 'Contract status',
    contractDetails: 'Contract details',
    
    // Trajets
    ride: 'Ride',
    rides: 'Rides',
    createRide: 'Create ride',
    fromCity: 'From city',
    toCity: 'To city',
    departureDate: 'Departure date',
    departureTime: 'Departure time',
    availableSpaces: 'Available spaces',
    
    // Tutoriel
    welcome: 'Welcome',
    tutorial: 'Tutorial',
    skipTutorial: 'Skip tutorial',
    nextStep: 'Next step',
    previousStep: 'Previous step',
    finishTutorial: 'Finish tutorial',
    
    // Catégories de services
    cleaning: 'Cleaning',
    maintenance: 'Maintenance',
    repair: 'Repair',
    installation: 'Installation',
    consulting: 'Consulting',
    delivery: 'Delivery',
    gardening: 'Gardening',
    moving: 'Moving',
    handyman: 'Handyman',
    other: 'Other',
    
    // Page de connexion
    loginDescription: 'Log in to your ecodeli account',
    welcomeToEcodeli: 'Welcome to ecodeli!',
    loginOrRegisterPrompt: 'Log in or sign up.',
    forgotPassword: 'Forgot password',
    loggingIn: 'Logging in...',
    loginButton: 'Log in',
    registerLink: 'Sign up',
    
    // Page d'inscription
    registerTitle: 'Create account',
    registerDescription: 'Create your ecodeli account',
    createAccount: 'Create my account',
    alreadyHaveAccount: 'Already have an account?',
    loginLink: 'Log in',
    firstName: 'First name',
    lastName: 'Last name',
    confirmPassword: 'Confirm password',
    acceptTerms: 'I accept the terms of use',
    
    // Messages d'erreur communs
    fieldRequired: 'This field is required',
    invalidEmail: 'Invalid email',
    passwordTooShort: 'Password too short',
    passwordMismatch: 'Passwords do not match',
    loginError: 'Login error',
    registrationError: 'Registration error',
    passwordTooWeak: 'Your password is too weak. Please strengthen it.',
    mustAcceptTerms: 'You must accept the terms of use.',
    fillFirstLastName: 'Please fill in first and last name.',
    fillCompanyFields: 'Please fill in all company fields.',
    
    // Force du mot de passe
    veryWeak: 'Very weak',
    weak: 'Weak',
    medium: 'Medium',
    strong: 'Strong',
    veryStrong: 'Very strong',
    
    // Page d'inscription - suite
    registerSubtitle: 'Join ecodeli to enjoy all our services.',
    iAm: 'I am',
    individual: 'Individual',
    professional: 'Professional',
    
    // Rôles utilisateur
    customerRole: 'Client',
    customerRoleDesc: 'I send packages and use services',
    carrierRole: 'Carrier',
    carrierRoleDesc: 'I transport packages during my trips',
    merchantRole: 'Merchant',
    merchantRoleDesc: 'I sell products and ship regularly',
    providerRole: 'Provider',
    providerRoleDesc: 'I offer general services',
    serviceProviderRole: 'Service Provider',
    serviceProviderRoleDesc: 'I offer specialized services (cleaning, repair, etc.)',
    
    // Champs de formulaire
    companyName: 'Company name',
    companyFirstName: 'Contact first name',
    companyLastName: 'Contact last name',
    myProfile: 'My profile',
    companyInformation: 'Company information',
    companyManager: 'Company manager',
    passwordStrength: 'Strength',
    iAcceptThe: 'I accept the',
    termsOfUse: 'terms of use',
    creatingAccount: 'Creating account...',
    alreadyRegistered: 'Already registered?',
    
    // Profil utilisateur
    fullName: 'Full name',
    emailPlaceholder: 'your@email.com',
    notProvided: 'Not provided',
    unknown: 'Unknown',
    loadingMap: 'Loading map...',
  }
};

const TranslationContext = createContext();

export const TranslationProvider = ({ children }) => {
  const [language, setLanguage] = useState('fr');

  // Charger la langue depuis localStorage au démarrage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('ecodeli-language');
    if (savedLanguage && ['fr', 'en'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Sauvegarder la langue dans localStorage quand elle change
  useEffect(() => {
    localStorage.setItem('ecodeli-language', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'fr' ? 'en' : 'fr');
  };

  const t = (key, fallback = key) => {
    return translations[language]?.[key] || translations.fr[key] || fallback;
  };

  const value = {
    language,
    setLanguage,
    toggleLanguage,
    t,
    translations: translations[language]
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};

export default TranslationContext; 