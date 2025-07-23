import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from '../contexts/TranslationContext'
import PersonalInfoSection from '../components/profile/PersonalInfoSection'
import SecuritySection from '../components/profile/SecuritySection'
import CompanySection from '../components/profile/CompanySection'
import VehicleSection from '../components/profile/VehicleSection'
import MessageFeedback from '../components/profile/MessageFeedback'
import RoleBasedNavigation, { getRoleSpecificDashboardUrl } from '../components/RoleBasedNavigation'
import { 
  Sun, 
  Moon, 
  User, 
  Menu, 
  X,
  MessageCircle,
  Heart,
  Bell,
  CreditCard,
  Package,
  Truck,
  Store,
  Users,
  Wrench,
  Home,
  Settings,
  LogOut,
  ChevronRight,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  TrendingUp,
  Eye,
  Search,
  Star,
  Plus,
  ArrowRight,
  Shield,
  Database,
  BarChart3,
  FileText,
  UserPlus,
  AlertTriangle,
  Activity,
  Zap,
  Edit,
  Save,
  XCircle,
  Check,
  AlertCircle,
  Loader2,
  Lock,
  Mail,
  Phone,
  MapPin,
  Building,
  Globe
} from 'lucide-react'

export default function Profile({ isDarkMode, toggleDarkMode }) {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dashboardData, setDashboardData] = useState({
    services: [],
    bookings: [],
    payments: [],
    matches: [],
    packages: [],
    rides: [],
    contracts: [],
    storageBoxes: []
  });
  const [stats, setStats] = useState({});
  const [systemStatus, setSystemStatus] = useState({ api: t('unknown'), db: t('unknown'), server: t('unknown') });
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // États pour l'édition du profil
  const [isEditing, setIsEditing] = useState({
    personal: false,
    password: false,
    company: false,
    vehicle: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // États du formulaire
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    address: '',
    companyName: '',
    companyAddress: '',
    website: '',
    vehicleType: ''
  });
  
  // États pour le changement de mot de passe
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({});

  // Rediriger vers la page de connexion si non connecté
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading]);

  // Profile page redirection removed - users can access profile directly
  // useEffect(() => {
  //   if (user && !router.query.stay) {
  //     // Si l'utilisateur n'est pas admin et accède au profil sans le paramètre "stay",
  //     // le rediriger vers son dashboard spécifique
  //     if (user.role !== 'ADMIN') {
  //       const dashboardUrl = getRoleSpecificDashboardUrl(user);
  //       console.log('🔄 Profile redirect: User role:', user.role, 'Redirecting to:', dashboardUrl);
  //       router.push(dashboardUrl);
  //     }
  //   }
  // }, [user, router]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchDashboardData();
      
      // Initialiser le formulaire avec les données utilisateur
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        address: user.address || '',
        companyName: user.companyName || '',
        companyAddress: user.companyAddress || '',
        website: user.website || '',
        vehicleType: user.vehicleType || ''
      });
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications?limit=5');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setIsLoadingData(true);
      const userRole = user.userType || user.role || 'CUSTOMER';
      
      // Fetch data based on user role
      const promises = [];
      
      if (userRole === 'CARRIER') {
        promises.push(
          fetch('/api/matches'),
          fetch('/api/rides?carrier=true'),
          fetch('/api/payments')
        );
      } else if (userRole === 'CUSTOMER') {
        promises.push(
          fetch('/api/packages'),
          fetch('/api/matches'),
          fetch('/api/payments'),
          fetch('/api/bookings')
        );
      } else if (userRole === 'MERCHANT') {
        promises.push(
          fetch('/api/contracts'),
          fetch('/api/payments'),
          fetch('/api/packages')
        );
      } else if (userRole === 'SERVICE_PROVIDER' || userRole === 'PROVIDER') {
        promises.push(
          fetch('/api/services'),
          fetch('/api/bookings'),
          fetch('/api/payments')
        );
      } else if (userRole === 'ADMIN') {
        // Admin peut voir toutes les données
        promises.push(
          fetch('/api/packages'),
          fetch('/api/rides'),
          fetch('/api/payments'),
          fetch('/api/matches'),
          fetch('/api/contracts')
        );
      }

      const responses = await Promise.all(promises);
      const data = await Promise.all(responses.map(r => r.ok ? r.json() : []));

      // Process data based on user role
      if (userRole === 'CARRIER') {
        const [matches, rides, payments] = data;
        setDashboardData(prev => ({ ...prev, matches, rides, payments }));
        setStats({
          totalDeliveries: rides.length,
          activeDeliveries: rides.filter(r => ['PENDING', 'IN_PROGRESS'].includes(r.status)).length,
          completedDeliveries: rides.filter(r => r.status === 'COMPLETED').length,
          totalEarnings: payments.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + p.amount, 0)
        });
      } else if (userRole === 'CUSTOMER') {
        const [packages, matches, payments, bookings] = data;
        setDashboardData(prev => ({ ...prev, packages, matches, payments, bookings }));
        setStats({
          totalPackages: packages.length,
          activePackages: packages.filter(p => ['PENDING', 'IN_TRANSIT'].includes(p.status)).length,
          totalBookings: bookings.length,
          totalSpent: payments.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + p.amount, 0)
        });
      } else if (userRole === 'MERCHANT') {
        const [contracts, payments, packages] = data;
        setDashboardData(prev => ({ ...prev, contracts, payments, packages }));
        setStats({
          totalContracts: contracts.length,
          activeContracts: contracts.filter(c => c.status === 'ACTIVE').length,
          totalPackages: packages.length,
          totalRevenue: payments.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + p.amount, 0)
        });
      } else if (userRole === 'SERVICE_PROVIDER' || userRole === 'PROVIDER') {
        const [services, bookings, payments] = data;
        setDashboardData(prev => ({ ...prev, services, bookings, payments }));
        setStats({
          totalServices: services.length,
          totalBookings: bookings.length,
          activeBookings: bookings.filter(b => ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status)).length,
          totalEarnings: payments.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + p.amount, 0)
        });
      } else if (userRole === 'ADMIN') {
        const [packages, rides, payments, matches, contracts] = data;
        setDashboardData(prev => ({ ...prev, packages, rides, payments, matches, contracts }));
        
        // Calculer les statistiques admin et mettre à jour le statut système
        const dashboardResp = await fetch('/api/dashboard');
        const dashboardData = dashboardResp.ok ? await dashboardResp.json() : {};
        const totalUsers = dashboardData.totalUsers || 0;
        // Mettre à jour le statut système
        setSystemStatus({ api: dashboardResp.ok ? 'Opérationnel' : 'Indisponible', db: dashboardResp.ok ? 'Connectée' : 'Indisponible', server: 'En ligne' });
        
        const totalCarriers = rides.filter((r, i, arr) => arr.findIndex(ride => ride.carrierId === r.carrierId) === i).length;
        
        setStats({
          totalUsers,
          activePackages: packages.filter(p => ['PENDING', 'IN_TRANSIT'].includes(p.status)).length,
          totalCarriers,
          totalRevenue: payments.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + p.amount, 0)
        });
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Fonction pour afficher un message temporaire
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // Fonction pour gérer les changements dans le formulaire
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Effacer l'erreur pour ce champ
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Fonction pour gérer les changements de mot de passe
  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Fonction pour valider les données
  const validateForm = (section) => {
    const newErrors = {};
    
    if (section === 'personal') {
      if (!formData.firstName.trim()) newErrors.firstName = 'Le prénom est requis';
      if (!formData.lastName.trim()) newErrors.lastName = 'Le nom est requis';
      if (!formData.email.trim()) newErrors.email = 'L\'email est requis';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Format d\'email invalide';
      }
      if (formData.phoneNumber && !/^(\+33|0)[1-9](\d{8})$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
        newErrors.phoneNumber = 'Format de téléphone invalide';
      }
    }
    
    if (section === 'password') {
      if (!passwordData.currentPassword) newErrors.currentPassword = 'Mot de passe actuel requis';
      if (!passwordData.newPassword) newErrors.newPassword = 'Nouveau mot de passe requis';
      else if (passwordData.newPassword.length < 6) {
        newErrors.newPassword = 'Le mot de passe doit contenir au moins 6 caractères';
      }
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
      }
    }
    
    if (section === 'vehicle') {
      if (!formData.vehicleType) newErrors.vehicleType = 'Type de véhicule requis';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Fonction pour sauvegarder les modifications
  const handleSave = async (section) => {
    if (!validateForm(section)) return;
    
    setIsLoading(true);
    try {
      const dataToSend = { ...formData };
      
      if (section === 'password') {
        dataToSend.currentPassword = passwordData.currentPassword;
        dataToSend.newPassword = passwordData.newPassword;
      }
      
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showMessage('success', data.message);
        setIsEditing(prev => ({ ...prev, [section]: false }));
        
        if (section === 'password') {
          setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          });
        }
        
        // Mettre à jour les données utilisateur sans recharger la page
        // Refetch user data from AuthContext if needed
        if (window.location.pathname === '/profile') {
          // Juste recharger les données depuis l'API si on est sur la page profile
          fetchDashboardData();
        }
      } else {
        showMessage('error', data.message);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      showMessage('error', 'Erreur lors de la sauvegarde');
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour annuler les modifications
  const handleCancel = (section) => {
    setIsEditing(prev => ({ ...prev, [section]: false }));
    setErrors({});
    
    if (section === 'password') {
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } else {
      // Réinitialiser les données du formulaire
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        address: user.address || '',
        companyName: user.companyName || '',
        companyAddress: user.companyAddress || '',
        website: user.website || '',
        vehicleType: user.vehicleType || ''
      });
    }
  };

  // Get navigation items based on user role
  const getNavigationItems = () => {
    if (!user) return [];

    const baseItems = [
      { href: '/', label: 'Accueil', icon: Home },
      { href: '/messages', label: 'Messages', icon: MessageCircle },
      { href: '/notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    ];

    const roleSpecificItems = {
      CARRIER: [
        { href: '/trajet', label: 'Mes trajets', icon: Truck },
        { href: '/matches', label: 'Correspondances', icon: Heart },
        { href: '/payments', label: 'Paiements', icon: CreditCard },
      ],
      CUSTOMER: [
        { href: '/exp', label: 'Expédier un colis', icon: Package },
        { href: '/services/browse', label: 'Services', icon: Wrench },
        { href: '/storage/browse', label: 'Stockage', icon: Store },
        { href: '/matches', label: 'Mes colis', icon: Package },
        { href: '/payments', label: 'Paiements', icon: CreditCard },
      ],
      MERCHANT: [
        { href: '/exp', label: 'Expédier un colis', icon: Package },
        { href: '/matches', label: 'Correspondances', icon: Heart },
        { href: '/payments', label: 'Paiements', icon: CreditCard },
      ],
      PROVIDER: [
        { href: '/services/browse', label: 'Services', icon: Wrench },
        { href: '/matches', label: 'Réservations', icon: Heart },
        { href: '/payments', label: 'Paiements', icon: CreditCard },
      ],
      SERVICE_PROVIDER: [
        { href: '/services/browse', label: 'Mes services', icon: Wrench },
        { href: '/matches', label: 'Réservations', icon: Heart },
        { href: '/payments', label: 'Paiements', icon: CreditCard },
      ],
      ADMIN: [
        { href: '/admin-dashboard', label: 'Tableau de bord Admin', icon: Shield },
        { href: '/admin/notifications-test', label: 'Test Notifications', icon: Bell },
      ]
    };

    const userRole = user.userType || user.role || 'CUSTOMER';
    return [...baseItems, ...(roleSpecificItems[userRole] || roleSpecificItems.CUSTOMER)];
  };

  // Gérer la déconnexion
  const handleLogout = async () => {
    await logout();
  };

  // Get role-specific quick actions
  const getQuickActions = () => {
    if (!user) return [];
    
    const userRole = user.userType || user.role || 'CUSTOMER';
    
    const actions = {
      CARRIER: [
        { href: '/trajet', label: 'Proposer un trajet', icon: Plus, color: 'bg-green-500 hover:bg-green-600' },
        { href: '/matches', label: 'Voir les correspondances', icon: Heart, color: 'bg-blue-500 hover:bg-blue-600' },
        { href: '/payments', label: 'Mes gains', icon: DollarSign, color: 'bg-purple-500 hover:bg-purple-600' }
      ],
      CUSTOMER: [
        { href: '/exp', label: 'Expédier un colis', icon: Package, color: 'bg-sky-500 hover:bg-sky-600' },
        { href: '/services/browse', label: 'Réserver un service', icon: Wrench, color: 'bg-green-500 hover:bg-green-600' },
        { href: '/storage/browse', label: 'Louer un box', icon: Store, color: 'bg-orange-500 hover:bg-orange-600' }
      ],
      MERCHANT: [
        { href: '/contracts/create', label: 'Nouveau contrat', icon: Plus, color: 'bg-blue-500 hover:bg-blue-600' },
        { href: '/exp', label: 'Expédier un colis', icon: Package, color: 'bg-sky-500 hover:bg-sky-600' },
        { href: '/payments', label: 'Mes revenus', icon: DollarSign, color: 'bg-green-500 hover:bg-green-600' }
      ],
      SERVICE_PROVIDER: [
        { href: '/services/browse', label: 'Gérer mes services', icon: Wrench, color: 'bg-blue-500 hover:bg-blue-600' },
        { href: '/matches', label: 'Mes réservations', icon: Calendar, color: 'bg-green-500 hover:bg-green-600' },
        { href: '/payments', label: 'Mes gains', icon: DollarSign, color: 'bg-purple-500 hover:bg-purple-600' }
      ],
      PROVIDER: [
        { href: '/services/browse', label: 'Mes services', icon: Wrench, color: 'bg-blue-500 hover:bg-blue-600' },
        { href: '/matches', label: 'Réservations', icon: Heart, color: 'bg-green-500 hover:bg-green-600' },
        { href: '/payments', label: 'Paiements', icon: CreditCard, color: 'bg-purple-500 hover:bg-purple-600' }
      ],
      ADMIN: [
        { href: 'http://localhost:3001', label: 'Tableau de bord Admin', icon: Shield, color: 'bg-red-500 hover:bg-red-600', external: true },
        { href: '/admin/notifications-test', label: 'Test Notifications', icon: Zap, color: 'bg-yellow-500 hover:bg-yellow-600' },
        { href: '/admin', label: 'Panel Admin', icon: Settings, color: 'bg-purple-500 hover:bg-purple-600' }
      ]
    };
    
    return actions[userRole] || actions.ADMIN || actions.CARRIER || actions.CUSTOMER || actions.MERCHANT || actions.SERVICE_PROVIDER || actions.PROVIDER;
  };

  // Get role-specific stats cards
  const getStatsCards = () => {
    if (!user) return [];
    
    const userRole = user.userType || user.role || 'CUSTOMER';
    
    if (userRole === 'CARRIER') {
      return [
        { title: 'Total Livraisons', value: stats.totalDeliveries || 0, icon: Truck, color: 'text-blue-600' },
        { title: 'Livraisons Actives', value: stats.activeDeliveries || 0, icon: Clock, color: 'text-orange-600' },
        { title: 'Livraisons Terminées', value: stats.completedDeliveries || 0, icon: CheckCircle, color: 'text-green-600' },
        { title: 'Gains Totaux', value: `${stats.totalEarnings || 0}€`, icon: DollarSign, color: 'text-purple-600' }
      ];
    } else if (userRole === 'CUSTOMER') {
      return [
        { title: 'Total Colis', value: stats.totalPackages || 0, icon: Package, color: 'text-blue-600' },
        { title: 'Colis Actifs', value: stats.activePackages || 0, icon: Clock, color: 'text-orange-600' },
        { title: 'Réservations', value: stats.totalBookings || 0, icon: Calendar, color: 'text-green-600' },
        { title: 'Dépenses', value: `${stats.totalSpent || 0}€`, icon: DollarSign, color: 'text-purple-600' }
      ];
    } else if (userRole === 'MERCHANT') {
      return [
        { title: 'Total Contrats', value: stats.totalContracts || 0, icon: Users, color: 'text-blue-600' },
        { title: 'Contrats Actifs', value: stats.activeContracts || 0, icon: CheckCircle, color: 'text-green-600' },
        { title: 'Total Colis', value: stats.totalPackages || 0, icon: Package, color: 'text-orange-600' },
        { title: 'Revenus', value: `${stats.totalRevenue || 0}€`, icon: DollarSign, color: 'text-purple-600' }
      ];
    } else if (userRole === 'SERVICE_PROVIDER' || userRole === 'PROVIDER') {
      return [
        { title: 'Mes Services', value: stats.totalServices || 0, icon: Wrench, color: 'text-blue-600' },
        { title: 'Réservations', value: stats.totalBookings || 0, icon: Calendar, color: 'text-green-600' },
        { title: 'Réservations Actives', value: stats.activeBookings || 0, icon: Clock, color: 'text-orange-600' },
        { title: 'Gains', value: `${stats.totalEarnings || 0}€`, icon: DollarSign, color: 'text-purple-600' }
      ];
    } else if (userRole === 'ADMIN') {
      return [
        { title: 'Total Utilisateurs', value: stats.totalUsers || 0, icon: Users, color: 'text-blue-600' },
        { title: 'Colis Actifs', value: stats.activePackages || 0, icon: Package, color: 'text-green-600' },
        { title: 'Transporteurs', value: stats.totalCarriers || 0, icon: Truck, color: 'text-orange-600' },
        { title: 'Revenus Totaux', value: `${stats.totalRevenue || 0}€`, icon: DollarSign, color: 'text-purple-600' }
      ];
    }
    
    return [];
  };

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full border-t-2 border-b-2 border-sky-500 animate-spin"></div>
          <p className="mt-4 text-gray-700 dark:text-gray-300">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Head>
        <title>Mon Profil - ecodeli</title>
        <meta name="description" content="Gérez votre profil et tableau de bord ecodeli" />
        <link rel="icon" href="/LOGO_.png" />
      </Head>

      {/* Global Navigation */}
      <RoleBasedNavigation isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

      {/* Main Content */}
      <main className="px-6 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Message de feedback */}
        <MessageFeedback message={message} setMessage={setMessage} />
        {/* Profile Header Section */}
        <div className="overflow-hidden mb-8 bg-white rounded-lg shadow dark:bg-gray-800">
          {/* Profile Banner */}
          <div className="relative px-6 py-16 bg-sky-500">
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
              <div className="flex justify-center items-center w-24 h-24 bg-gray-200 rounded-full border-4 border-white dark:bg-gray-700 dark:border-gray-800">
                <User className="w-12 h-12 text-gray-400" />
              </div>
            </div>
          </div>
          
          {/* Profile Info */}
          <div className="px-6 pt-16 pb-6">
            <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
              {user.userType === 'PROFESSIONAL' ? (
                <>
                  {user.companyName && (
                    <div className="text-2xl font-bold text-black dark:text-white">
                      {user.companyName}
                    </div>
                  )}
                  <div className="text-lg font-medium text-gray-700 dark:text-gray-300">
                    {user.companyFirstName || user.firstName} {user.companyLastName || user.lastName}
                  </div>
                </>
              ) : (
                `${user.firstName} ${user.lastName}`
              )}
            </h1>
            <p className="mt-1 text-center text-gray-500 dark:text-gray-400">
              {user.role === 'SENDER' ? 'Expéditeur' : 
               user.role === 'CARRIER' ? 'Transporteur' : 
               user.role === 'CUSTOMER' ? 'Client' :
               user.role === 'MERCHANT' ? 'Marchand' :
               user.role === 'SERVICE_PROVIDER' ? 'Prestataire de Services' :
               user.role === 'PROVIDER' ? 'Prestataire' :
               user.role === 'ADMIN' ? 'Administrateur' :
               'Utilisateur'}
            </p>
            {(user.role === 'ADMIN' || user.userType === 'ADMIN') && (
              <div className="flex justify-center mt-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full dark:text-red-300 dark:bg-red-900/20">
                  <Shield className="w-3 h-3" />
                  Accès Administrateur
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
          {getStatsCards().map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
                <div className="flex items-center">
                  <div className={`p-3 rounded-full bg-gray-100 dark:bg-gray-700 ${stat.color}`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {isLoadingData ? (
                        <div className="w-12 h-6 bg-gray-200 rounded animate-pulse dark:bg-gray-700"></div>
                      ) : (
                        stat.value
                      )}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Admin Tools Section - Only for ADMIN users */}
        {(user.role === 'ADMIN' || user.userType === 'ADMIN') && (
          <section className="mb-8">
            <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Outils d'Administration</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* System Status */}
              <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
                <div className="flex gap-3 items-center mb-4">
                  <Activity className="w-6 h-6 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">État du Système</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">API Status</span>
                    <span className={`text-sm font-medium ${systemStatus.api === 'Opérationnel' ? 'text-green-600' : 'text-red-600'}`}>{systemStatus.api}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Base de données</span>
                    <span className={`text-sm font-medium ${systemStatus.db === 'Connectée' ? 'text-green-600' : 'text-red-600'}`}>{systemStatus.db}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Serveur</span>
                    <span className="text-sm font-medium text-green-600">{systemStatus.server}</span>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
                <div className="flex gap-3 items-center mb-4">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Statistiques Rapides</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Utilisateurs</span>
                    <span className="text-sm font-medium text-blue-600">{stats.totalUsers ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Colis actifs</span>
                    <span className="text-sm font-medium text-green-600">{stats.activePackages ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Revenus totaux</span>
                    <span className="text-sm font-medium text-purple-600">{stats.totalRevenue ?? 0 }€</span>
                  </div>
                </div>
              </div>

              {/* Recent Alerts */}
              <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
                <div className="flex gap-3 items-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Alertes Récentes</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex gap-2 items-start">
                    <div className="flex-shrink-0 mt-2 w-2 h-2 bg-orange-500 rounded-full"></div>
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white">Colis en retard</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">3 colis nécessitent une attention</p>
                    </div>
                  </div>
                  <div className="flex gap-2 items-start">
                    <div className="flex-shrink-0 mt-2 w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white">Système mis à jour</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Mise à jour réussie il y a 2h</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Section des paramètres du profil */}
        <div className="space-y-8">
          {/* Informations personnelles */}
          <div className="overflow-hidden bg-white rounded-lg shadow dark:bg-gray-800">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex gap-3 items-center">
                <User className="w-5 h-5 text-gray-500" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Informations personnelles</h2>
              </div>
              {!isEditing.personal && (
                <button
                  onClick={() => setIsEditing(prev => ({ ...prev, personal: true }))}
                  className="flex gap-2 items-center px-3 py-2 text-sm text-blue-600 rounded-md transition-colors hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
                >
                  <Edit className="w-4 h-4" />
                  Modifier
                </button>
              )}
            </div>
            
            <div className="px-6 py-6">
              {isEditing.personal ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Prénom *
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                          errors.firstName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Votre prénom"
                      />
                      {errors.firstName && (
                        <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Nom *
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                          errors.lastName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Votre nom"
                      />
                      {errors.lastName && (
                        <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Mail className="inline mr-2 w-4 h-4" />
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder={t('emailPlaceholder')}
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Phone className="inline mr-2 w-4 h-4" />
{t('phone')}
                    </label>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                        errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="06 12 34 56 78"
                    />
                    {errors.phoneNumber && (
                      <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <MapPin className="inline mr-2 w-4 h-4" />
{t('address')}
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      rows={3}
                      className="px-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Votre adresse complète"
                    />
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => handleSave('personal')}
                      disabled={isLoading}
                      className="flex gap-2 items-center px-4 py-2 text-white bg-blue-600 rounded-md transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
{t('save')}
                    </button>
                    <button
                      onClick={() => handleCancel('personal')}
                      disabled={isLoading}
                      className="flex gap-2 items-center px-4 py-2 text-gray-700 rounded-md border border-gray-300 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <XCircle className="w-4 h-4" />
{t('cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <dl className="grid grid-cols-1 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('fullName')}</dt>
                    <dd className="mt-1 text-gray-900 dark:text-white">
                      {user.userType === 'PROFESSIONAL'
                        ? `${user.companyFirstName || user.firstName} ${user.companyLastName || user.lastName}`
                        : `${user.firstName} ${user.lastName}`}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('email')}</dt>
                    <dd className="mt-1 text-gray-900 dark:text-white">{user.email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('phone')}</dt>
                    <dd className="mt-1 text-gray-900 dark:text-white">{user.phoneNumber || t('notProvided')}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('address')}</dt>
                    <dd className="mt-1 text-gray-900 dark:text-white">{user.address || t('notProvided')}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Membre depuis</dt>
                    <dd className="mt-1 text-gray-900 dark:text-white">
                      {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </dd>
                  </div>
                </dl>
              )}
            </div>
          </div>

          {/* Section véhicule (pour les transporteurs) */}
          {user?.role === 'CARRIER' && (
            <VehicleSection
              user={user}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              vehicleType={formData.vehicleType}
              setVehicleType={(value) => setFormData(prev => ({ ...prev, vehicleType: value }))}
              errors={errors}
              handleSave={handleSave}
              handleCancel={handleCancel}
              isLoading={isLoading}
            />
          )}

          {/* Section sécurité */}
          <div className="overflow-hidden bg-white rounded-lg shadow dark:bg-gray-800">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex gap-3 items-center">
                <Lock className="w-5 h-5 text-gray-500" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Sécurité</h2>
              </div>
              {!isEditing.password && (
                <button
                  onClick={() => setIsEditing(prev => ({ ...prev, password: true }))}
                  className="flex gap-2 items-center px-3 py-2 text-sm text-blue-600 rounded-md transition-colors hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
                >
                  <Edit className="w-4 h-4" />
                  Changer le mot de passe
                </button>
              )}
            </div>
            
            <div className="px-6 py-6">
              {isEditing.password ? (
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Mot de passe actuel *
                    </label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                        errors.currentPassword ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Votre mot de passe actuel"
                    />
                    {errors.currentPassword && (
                      <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nouveau mot de passe *
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                        errors.newPassword ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Votre nouveau mot de passe"
                    />
                    {errors.newPassword && (
                      <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Confirmer le nouveau mot de passe *
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                        errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Confirmez votre nouveau mot de passe"
                    />
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                    )}
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => handleSave('password')}
                      disabled={isLoading}
                      className="flex gap-2 items-center px-4 py-2 text-white bg-blue-600 rounded-md transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Changer le mot de passe
                    </button>
                    <button
                      onClick={() => handleCancel('password')}
                      disabled={isLoading}
                      className="flex gap-2 items-center px-4 py-2 text-gray-700 rounded-md border border-gray-300 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <XCircle className="w-4 h-4" />
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 dark:text-gray-400">
                    Votre mot de passe a été défini. Cliquez sur "Changer le mot de passe" pour le modifier.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Informations d'entreprise (pour les merchants et providers) */}
          {(user.userType === 'MERCHANT' || user.userType === 'SERVICE_PROVIDER' || user.userType === 'PROVIDER') && (
            <div className="overflow-hidden bg-white rounded-lg shadow dark:bg-gray-800">
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex gap-3 items-center">
                  <Building className="w-5 h-5 text-gray-500" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Informations d'entreprise</h2>
                </div>
                {!isEditing.company && (
                  <button
                    onClick={() => setIsEditing(prev => ({ ...prev, company: true }))}
                    className="flex gap-2 items-center px-3 py-2 text-sm text-blue-600 rounded-md transition-colors hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
                  >
                    <Edit className="w-4 h-4" />
                    Modifier
                  </button>
                )}
              </div>
              
              <div className="px-6 py-6">
                {isEditing.company ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Nom de l'entreprise
                      </label>
                      <input
                        type="text"
                        value={formData.companyName}
                        onChange={(e) => handleInputChange('companyName', e.target.value)}
                        className="px-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="Nom de votre entreprise"
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Adresse de l'entreprise
                      </label>
                      <textarea
                        value={formData.companyAddress}
                        onChange={(e) => handleInputChange('companyAddress', e.target.value)}
                        rows={3}
                        className="px-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="Adresse complète de l'entreprise"
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <Globe className="inline mr-2 w-4 h-4" />
                        Site web
                      </label>
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        className="px-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="https://votre-site.com"
                      />
                    </div>
                    
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => handleSave('company')}
                        disabled={isLoading}
                        className="flex gap-2 items-center px-4 py-2 text-white bg-blue-600 rounded-md transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Sauvegarder
                      </button>
                      <button
                        onClick={() => handleCancel('company')}
                        disabled={isLoading}
                        className="flex gap-2 items-center px-4 py-2 text-gray-700 rounded-md border border-gray-300 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        <XCircle className="w-4 h-4" />
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <dl className="grid grid-cols-1 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Nom de l'entreprise</dt>
                      <dd className="mt-1 text-gray-900 dark:text-white">{user.companyName || 'Non renseigné'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Adresse de l'entreprise</dt>
                      <dd className="mt-1 text-gray-900 dark:text-white">{user.companyAddress || 'Non renseignée'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Site web</dt>
                      <dd className="mt-1 text-gray-900 dark:text-white">
                        {user.website ? (
                          <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                            {user.website}
                          </a>
                        ) : (
                          'Non renseigné'
                        )}
                      </dd>
                    </div>
                  </dl>
                )}
              </div>
            </div>
          )}

          {/* Section admin (si applicable) */}
          {(user.role === 'ADMIN' || user.userType === 'ADMIN') && (
            <div className="overflow-hidden bg-white rounded-lg shadow dark:bg-gray-800">
              <div className="flex gap-3 items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <Shield className="w-5 h-5 text-red-500" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Administration</h2>
              </div>
              <div className="px-6 py-6">
                <dl className="grid grid-cols-1 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Niveau d'accès</dt>
                    <dd className="mt-1">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium text-red-700 bg-red-100 rounded-full dark:text-red-300 dark:bg-red-900/20">
                        <Shield className="w-3 h-3" />
                        Administrateur Système
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Permissions</dt>
                    <dd className="mt-1 text-gray-900 dark:text-white">
                      <div className="flex flex-wrap gap-1">
                        <span className="px-2 py-1 text-xs text-blue-800 bg-blue-100 rounded dark:bg-blue-900/20 dark:text-blue-300">Gestion Utilisateurs</span>
                        <span className="px-2 py-1 text-xs text-green-800 bg-green-100 rounded dark:bg-green-900/20 dark:text-green-300">Système</span>
                        <span className="px-2 py-1 text-xs text-purple-800 bg-purple-100 rounded dark:bg-purple-900/20 dark:text-purple-300">Analytics</span>
                      </div>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          )}
        </div>

        {/* Notifications récentes */}
        <div className="mt-8">
          <div className="overflow-hidden bg-white rounded-lg shadow dark:bg-gray-800">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Notifications récentes</h2>
                <Link 
                  href="/notifications"
                  className="text-sm text-sky-600 hover:text-sky-500 dark:text-sky-400"
                >
                  Voir tout
                </Link>
              </div>
            </div>
            <div className="px-6 py-4">
              {notifications.length > 0 ? (
                <div className="space-y-4">
                  {notifications.slice(0, 5).map((notification, index) => (
                    <div key={index} className="flex gap-3 items-start">
                      <div className="flex-shrink-0">
                        <Bell className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-white">
                          {notification.title || notification.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(notification.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-gray-500 dark:text-gray-400">
                  Aucune notification récente
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}