import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import RoleBasedNavigation from '../../components/RoleBasedNavigation';
import TutorialOverlay from '../../components/TutorialOverlay';
import { useTutorial } from '../../components/useTutorial';
import { 
  Sun, 
  Moon, 
  User, 
  Menu, 
  X,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  TrendingUp,
  Package,
  Eye,
  Search,
  Star,
  MessageCircle,
  Send,
  Users,
  Plus,
  Settings,
  BarChart3,
  Award,
  Box,
  Crown,
  AlertTriangle,
  Lock
} from 'lucide-react';

export default function ProviderDashboard({ isDarkMode, toggleDarkMode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Tutoriel
  const { showTutorial, completeTutorial, forceTutorial } = useTutorial(user?.role);
  const [services, setServices] = useState([]);
  const [storageBoxes, setStorageBoxes] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [boxRentals, setBoxRentals] = useState([]);
  const [payments, setPayments] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [earningsTotals, setEarningsTotals] = useState({ today: 0, month: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedStorageBox, setSelectedStorageBox] = useState(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);

  // Messages state
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Subscription states
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [showSubscriptionBanner, setShowSubscriptionBanner] = useState(false);

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'SERVICE_PROVIDER' && user.role !== 'PROVIDER'))) {
      router.push('/login');
      return;
    }

    // Rediriger les prestataires professionnels vers le dashboard spécialisé
    if (user && user.role === 'PROVIDER' && user.userType === 'PROFESSIONAL') {
      router.replace('/dashboard/proprovider');
      return;
    }

    if (user) {
      fetchDashboardData();
      checkSubscriptionStatus();
    }
  }, [user, loading, router]);

  // Effet séparé pour gérer le message de succès
  useEffect(() => {
    // Vérifier si un service ou une boîte vient d'être créé
    if (router.query.serviceCreated || router.query.storageBoxCreated) {
      setShowSuccessMessage(true);
      // Rafraîchir les données du dashboard
      fetchDashboardData();
      // Effacer le paramètre de l'URL après 5 secondes
      setTimeout(() => {
        setShowSuccessMessage(false);
        router.replace('/dashboard/provider', undefined, { shallow: true });
      }, 5000);
    }
  }, [router.query.serviceCreated, router.query.storageBoxCreated, router]);

  // Effet pour rafraîchir les données périodiquement
  useEffect(() => {
    if (user) {
      // Rafraîchir les données toutes les 30 secondes si l'utilisateur est sur la page
      const interval = setInterval(() => {
        fetchDashboardData();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Force cache refresh by adding timestamp
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/dashboard/service-provider?_t=${timestamp}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Provider dashboard data received:', {
          services: data.services?.length || 0,
          storageBoxes: data.storageBoxes?.length || 0,
          bookings: data.bookings?.length || 0,
          boxRentals: data.boxRentals?.length || 0,
          payments: data.payments?.length || 0,
          reviews: data.reviews?.length || 0
        });
        
        setServices(data.services || []);
        setStorageBoxes(data.storageBoxes || []);
        setBookings(data.bookings || []);
        setBoxRentals(data.boxRentals || []);
        setPayments(data.payments || []);
        setReviews(data.reviews || []);
        setDashboardStats(data.stats || {});
        setNotifications(data.notifications || []);
        setEarningsTotals(data.earnings || { today: 0, month: 0, total: 0 });
      } else {
        console.error('❌ Provider Dashboard API error:', response.status, response.statusText);
      }

      // Fetch notifications separately
      const notificationsRes = await fetch(`/api/notifications?limit=5&_t=${timestamp}`);
      if (notificationsRes.ok) {
        const notificationsData = await notificationsRes.json();
        setNotifications(notificationsData.notifications || []);
      }

    } catch (error) {
      console.error('❌ Error fetching provider dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      const response = await fetch('/api/subscriptions');
      if (response.ok) {
        const data = await response.json();
        setSubscriptionStatus(data);
        
        // Show banner if subscription is required but not active
        if (!data.hasActiveSubscription) {
          setShowSubscriptionBanner(true);
        }
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  const handleSubscribe = () => {
    router.push('/subscribe');
  };

  const handleFeatureClick = (featureName, callback) => {
    if (!subscriptionStatus?.hasActiveSubscription) {
      alert('Un abonnement professionnel est requis pour accéder à cette fonctionnalité. Cliquez sur "S\'abonner" pour continuer.');
      return;
    }
    callback();
  };

  // Messages functions
  const fetchConversations = async () => {
    if (!user?.id) return;
    
    try {
      setMessagesLoading(true);
      const response = await fetch('/api/conversations', {
        headers: {
          'x-user-id': user.id
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setConversations(data || []);
      } else {
        console.error('Error fetching conversations:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const fetchMessages = async (partnerId) => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/messages?conversationWith=${partnerId}`, {
        headers: {
          'x-user-id': user.id
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data || []);
        
        // Mark conversation as read
        markConversationAsRead(partnerId);
      } else {
        console.error('Error fetching messages:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const markConversationAsRead = async (partnerId) => {
    if (!user?.id) return;
    
    try {
      const response = await fetch('/api/conversations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({
          partnerId: partnerId
        })
      });

      if (response.ok) {
        // Update conversations list to reflect read status
        setConversations(prev => 
          prev.map(conv => 
            conv.partner.id === partnerId 
              ? { ...conv, unreadCount: 0 }
              : conv
          )
        );
      }
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedConversation || sendingMessage || !user?.id) {
      return;
    }

    try {
      setSendingMessage(true);
      
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({
          receiverId: selectedConversation.id,
          content: newMessage.trim()
        })
      });

      if (response.ok) {
        const newMsg = await response.json();
        setMessages(prev => [...prev, newMsg]);
        setNewMessage('');
        
        // Update conversation list
        setConversations(prev => 
          prev.map(conv => 
            conv.partner.id === selectedConversation.id
              ? { 
                  ...conv, 
                  lastMessage: { 
                    content: newMessage.trim(), 
                    createdAt: new Date().toISOString() 
                  } 
                }
              : conv
          )
        );
      } else {
        console.error('Error sending message:', response.statusText);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  // Fetch conversations when messages tab is selected
  useEffect(() => {
    if (activeTab === 'messages' && user?.id) {
      fetchConversations();
    }
  }, [activeTab, user?.id]);

  // Fetch messages when conversation is selected
  useEffect(() => {
    if (selectedConversation && user?.id) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation, user?.id]);

  const handleCreateService = () => {
    handleFeatureClick('create_service', () => {
      router.push('/services/create');
    });
  };

  const handleCreateStorageBox = () => {
    handleFeatureClick('create_storage_box', () => {
      router.push('/storage/create');
    });
  };

  const handleEditStorageBox = (boxId) => {
    handleFeatureClick('edit_storage_box', () => {
      router.push(`/storage/edit/${boxId}`);
    });
  };

  const handleEditService = (serviceId) => {
    handleFeatureClick('edit_service', () => {
      router.push(`/services/edit/${serviceId}`);
    });
  };

  const handleViewBooking = (bookingId) => {
    router.push(`/bookings/${bookingId}`);
  };

  const handleViewServiceDetails = (service) => {
    setSelectedService(service);
    setIsServiceModalOpen(true);
  };

  const handleViewStorageBoxDetails = (box) => {
    setSelectedStorageBox(box);
    setIsStorageModalOpen(true);
  };

  const closeServiceModal = () => {
    setIsServiceModalOpen(false);
    setSelectedService(null);
  };

  const closeStorageModal = () => {
    setIsStorageModalOpen(false);
    setSelectedStorageBox(null);
  };

  // Fonction pour accepter une réservation
  const handleAcceptBooking = async (bookingId) => {
    try {
      const response = await fetch('/api/bookings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: bookingId,
          status: 'CONFIRMED'
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Rafraîchir les données du dashboard
        fetchDashboardData();
        // Afficher un message de succès temporaire
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
        console.log('✅ Réservation acceptée avec succès!');
      } else {
        const error = await response.json();
        console.error('❌ Erreur lors de l\'acceptation de la réservation:', error.error);
        alert('Erreur lors de l\'acceptation de la réservation: ' + error.error);
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'acceptation de la réservation:', error);
      alert('Erreur lors de l\'acceptation de la réservation');
    }
  };

  // Fonction pour refuser une réservation
  const handleRejectBooking = async (bookingId) => {
    if (!confirm('Êtes-vous sûr de vouloir refuser cette réservation ?')) {
      return;
    }

    try {
      const response = await fetch('/api/bookings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: bookingId,
          status: 'CANCELLED'
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Rafraîchir les données du dashboard
        fetchDashboardData();
        console.log('✅ Réservation refusée avec succès!');
      } else {
        const error = await response.json();
        console.error('❌ Erreur lors du refus de la réservation:', error.error);
        alert('Erreur lors du refus de la réservation: ' + error.error);
      }
    } catch (error) {
      console.error('❌ Erreur lors du refus de la réservation:', error);
      alert('Erreur lors du refus de la réservation');
    }
  };

  // Fonction pour accepter une location de boîte de stockage
  const handleAcceptRental = async (rentalId) => {
    try {
      const response = await fetch('/api/box-rentals/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rentalId: rentalId,
          action: 'ACCEPT'
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Rafraîchir les données du dashboard
        fetchDashboardData();
        // Afficher un message de succès temporaire
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
        console.log('✅ Location acceptée avec succès!');
      } else {
        const error = await response.json();
        console.error('❌ Erreur lors de l\'acceptation de la location:', error.error);
        alert('Erreur lors de l\'acceptation de la location: ' + error.error);
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'acceptation de la location:', error);
      alert('Erreur lors de l\'acceptation de la location');
    }
  };

  // Fonction pour refuser une location de boîte de stockage
  const handleRejectRental = async (rentalId) => {
    const reason = prompt('Raison du refus (optionnel):');
    if (reason === null) return; // User cancelled

    if (!confirm('Êtes-vous sûr de vouloir refuser cette demande de location ?')) {
      return;
    }

    try {
      const response = await fetch('/api/box-rentals/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rentalId: rentalId,
          action: 'REJECT',
          reason: reason
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Rafraîchir les données du dashboard
        fetchDashboardData();
        console.log('✅ Location refusée avec succès!');
      } else {
        const error = await response.json();
        console.error('❌ Erreur lors du refus de la location:', error.error);
        alert('Erreur lors du refus de la location: ' + error.error);
      }
    } catch (error) {
      console.error('❌ Erreur lors du refus de la location:', error);
      alert('Erreur lors du refus de la location');
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: notificationId,
          isRead: true
        })
      });

      if (response.ok) {
        // Mettre à jour les notifications localement
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
      }
    } catch (error) {
      console.error('Erreur lors du marquage de la notification:', error);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full border-4 border-sky-400 animate-spin border-t-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  const stats = {
    totalServices: services.length,
    activeServices: services.filter(s => s.isActive).length,
    totalStorageBoxes: storageBoxes.length,
    availableStorageBoxes: storageBoxes.filter(box => box.isAvailable).length,
    totalBookings: bookings.length + boxRentals.length,
    pendingBookings: bookings.filter(b => ['PENDING', 'CONFIRMED'].includes(b.status)).length + boxRentals.filter(r => r.status === 'ACTIVE').length,
    completedBookings: bookings.filter(b => b.status === 'COMPLETED').length,
    totalEarnings: earningsTotals.total || 0,
    averageRating: reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : 0
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Head>
        <title>Tableau de Bord Prestataire - ecodeli</title>
        <meta name="description" content="Gérez vos services et boîtes de stockage" />
        <link rel="icon" href="/LOGO_.png" />
      </Head>

      {/* Header avec RoleBasedNavigation */}
      <RoleBasedNavigation isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

      {/* Header Section */}
      <div className="px-6 py-8 bg-sky-50 dark:bg-sky-900/20">
        <div className="mx-auto max-w-7xl">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Bienvenue, {user?.firstName}!
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Gérez vos services et boîtes de stockage
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/manage-reservations')}
                className="flex gap-2 items-center px-6 py-2 font-medium text-white bg-orange-500 rounded-full transition hover:bg-orange-600"
              >
                <Calendar className="w-4 h-4" />
                Gérer réservations
              </button>
              <button
                onClick={handleCreateService}
                className={`flex gap-2 items-center px-6 py-2 font-medium text-white rounded-full transition ${
                  !subscriptionStatus?.hasActiveSubscription 
                    ? 'bg-gray-400 cursor-not-allowed opacity-75' 
                    : 'bg-green-500 hover:bg-green-600'
                }`}
                title={!subscriptionStatus?.hasActiveSubscription ? 'Abonnement requis' : ''}
              >
                {!subscriptionStatus?.hasActiveSubscription && <Lock className="w-4 h-4" />}
                <Plus className="w-4 h-4" />
                Créer un service
              </button>
              <button
                onClick={handleCreateStorageBox}
                className={`flex gap-2 items-center px-6 py-2 font-medium text-white rounded-full transition ${
                  !subscriptionStatus?.hasActiveSubscription 
                    ? 'bg-gray-400 cursor-not-allowed opacity-75' 
                    : 'bg-purple-500 hover:bg-purple-600'
                }`}
                title={!subscriptionStatus?.hasActiveSubscription ? 'Abonnement requis' : ''}
              >
                {!subscriptionStatus?.hasActiveSubscription && <Lock className="w-4 h-4" />}
                <Box className="w-4 h-4" />
                Ajouter une boîte
              </button>
              <button
                onClick={() => router.push('/services/browse')}
                className="flex gap-2 items-center px-6 py-2 font-medium text-white bg-sky-400 rounded-full transition hover:bg-sky-500"
              >
                <Search className="w-4 h-4" />
                Voir tous les services
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Message de succès */}
      {showSuccessMessage && (
        <div className="px-6 mx-auto max-w-7xl">
          <div className="p-4 mb-6 bg-green-50 rounded-lg border border-green-200 dark:bg-green-900/20 dark:border-green-800">
            <div className="flex items-center">
              <CheckCircle className="mr-3 w-5 h-5 text-green-400" />
              <div>
                <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                  {router.query.serviceCreated ? 'Service créé avec succès !' : 'Boîte de stockage ajoutée avec succès !'}
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {router.query.serviceCreated 
                    ? 'Votre service a été enregistré et est maintenant disponible pour les clients.'
                    : 'Votre boîte de stockage est maintenant disponible à la location.'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Banner */}
      {showSubscriptionBanner && subscriptionStatus && !subscriptionStatus.hasActiveSubscription && (
        <div className="px-6 mx-auto max-w-7xl">
          <div className="p-4 mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200 dark:from-yellow-900/20 dark:to-orange-900/20 dark:border-yellow-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Crown className="mr-3 w-6 h-6 text-yellow-600" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Abonnement Professionnel Requis
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Pour accéder à toutes les fonctionnalités (créer des services, gérer vos annonces, etc.), vous devez souscrire à l'abonnement professionnel.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <div className="text-right mr-4">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Seulement</p>
                  <p className="text-xl font-bold text-yellow-600">10€/mois</p>
                </div>
                <button
                  onClick={handleSubscribe}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg transition hover:from-yellow-600 hover:to-orange-600"
                >
                  S'abonner maintenant
                </button>
                <button
                  onClick={() => setShowSubscriptionBanner(false)}
                  className="p-1 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200"
                  title="Masquer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications importantes */}
      {notifications.filter(n => !n.isRead && ['BOOKING_REQUEST', 'BOOKING_CONFIRMED', 'PAYMENT_RECEIVED', 'STORAGE_RENTAL'].includes(n.type)).length > 0 && (
        <div className="px-6 mx-auto max-w-7xl">
          <div className="mb-6 space-y-3">
            {notifications
              .filter(n => !n.isRead && ['BOOKING_REQUEST', 'BOOKING_CONFIRMED', 'PAYMENT_RECEIVED', 'STORAGE_RENTAL'].includes(n.type))
              .slice(0, 3)
              .map((notification) => (
                <div key={notification.id} className="p-4 bg-blue-50 rounded-lg border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="mr-3 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <div>
                        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          {notification.title}
                        </h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          {notification.message}
                        </p>
                        <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                          {new Date(notification.createdAt).toLocaleDateString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {(notification.type === 'BOOKING_REQUEST' || notification.type === 'STORAGE_RENTAL') && (
                        <button
                          onClick={() => {
                            markNotificationAsRead(notification.id);
                            setActiveTab(notification.type === 'STORAGE_RENTAL' ? 'storage' : 'bookings');
                          }}
                          className="px-3 py-1 text-sm font-medium text-white bg-blue-500 rounded-lg transition hover:bg-blue-600"
                        >
                          Voir la demande
                        </button>
                      )}
                      <button
                        onClick={() => markNotificationAsRead(notification.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="Marquer comme lu"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-6 py-8 mx-auto max-w-7xl">
        {/* Stats Cards */}
        <div className="grid gap-6 mb-8 md:grid-cols-4 overview-section">
          <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Services actifs</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeServices}</p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-green-100 rounded-full dark:bg-green-900">
                <Package className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Boîtes disponibles</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.availableStorageBoxes}</p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-purple-100 rounded-full dark:bg-purple-900">
                <Box className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Réservations actives</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingBookings}</p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-sky-100 rounded-full dark:bg-sky-900">
                <Clock className="w-6 h-6 text-sky-600 dark:text-sky-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Gains totaux</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">€{stats.totalEarnings.toFixed(2)}</p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-orange-100 rounded-full dark:bg-orange-900">
                <DollarSign className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex px-6 -mb-px space-x-8">
              {[
                { id: 'overview', name: 'Aperçu', icon: TrendingUp },
                { id: 'services', name: 'Mes Services', icon: Package },
                { id: 'storage', name: 'Mes Boîtes', icon: Box },
                { id: 'bookings', name: 'Réservations', icon: Calendar, badge: stats.pendingBookings },
                { id: 'earnings', name: 'Gains', icon: DollarSign },
                { id: 'reviews', name: 'Avis', icon: Star, badge: reviews.filter(r => !r.isRead).length },
                { id: 'subscription', name: 'Abonnement', icon: Crown },
                { id: 'notifications', name: 'Notifications', icon: Clock, badge: notifications.filter(n => !n.isRead).length },
                { id: 'messages', name: 'Messages', icon: MessageCircle, badge: conversations.filter(c => c.unreadCount > 0).length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition ${
                    activeTab === tab.id
                      ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.name}
                  {tab.badge > 0 && (
                    <span className="inline-flex justify-center items-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Aperçu de votre activité</h3>
                
                <div className="grid gap-6 lg:grid-cols-3">
                  <div>
                    <h4 className="mb-4 font-medium text-gray-900 dark:text-white">Services récents</h4>
                    {services.slice(0, 3).length > 0 ? (
                      <div className="space-y-3">
                        {services.slice(0, 3).map((service) => (
                          <div key={service.id} className="flex justify-between items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{service.name}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">€{service.price}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              service.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                            }`}>
                              {service.isActive ? 'Actif' : 'Inactif'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400">Aucun service récent</p>
                    )}
                  </div>

                  <div>
                    <h4 className="mb-4 font-medium text-gray-900 dark:text-white">Boîtes de stockage</h4>
                    {storageBoxes.slice(0, 3).length > 0 ? (
                      <div className="space-y-3">
                        {storageBoxes.slice(0, 3).map((box) => (
                          <div key={box.id} className="flex justify-between items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{box.title}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">€{box.pricePerDay}/jour</p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              box.isAvailable ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                              'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                            }`}>
                              {box.isAvailable ? 'Disponible' : 'Occupée'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400">Aucune boîte de stockage</p>
                    )}
                  </div>

                  <div>
                    <h4 className="mb-4 font-medium text-gray-900 dark:text-white">Réservations récentes</h4>
                    {bookings.slice(0, 3).length > 0 ? (
                      <div className="space-y-3">
                        {bookings.slice(0, 3).map((booking) => (
                          <div key={booking.id} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                            <p className="text-sm text-gray-900 dark:text-white">{booking.serviceName}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {new Date(booking.scheduledAt).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400">Aucune réservation récente</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'services' && (
              <div className="space-y-6 services-section">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Mes Services</h3>
                  <button
                    onClick={handleCreateService}
                    className="flex gap-2 items-center px-4 py-2 font-medium text-white bg-green-500 rounded-lg transition hover:bg-green-600"
                  >
                    <Plus className="w-4 h-4" />
                    Créer un nouveau service
                  </button>
                </div>

                {services.length > 0 ? (
                  <div className="space-y-4">
                    {services.map((service) => (
                      <div key={service.id} className="p-6 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white">{service.name}</h4>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{service.description}</p>
                          </div>
                          <div className="flex gap-2 items-center">
                            <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                              service.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                            }`}>
                              {service.isActive ? 'Actif' : 'Inactif'}
                            </span>
                            <span className="text-lg font-bold text-green-600 dark:text-green-400">
                              €{service.price}
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid gap-4 md:grid-cols-3">
                          <div>
                            <h5 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Catégorie</h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{service.category || 'Non spécifiée'}</p>
                          </div>
                          <div>
                            <h5 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Durée</h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{service.duration || 'Non spécifiée'}</p>
                          </div>
                          <div>
                            <h5 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Note moyenne</h5>
                            <div className="flex gap-1 items-center">
                              <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {service.averageRating || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-200 dark:border-gray-600">
                          <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span>Créé le {new Date(service.createdAt).toLocaleDateString()}</span>
                            {service.bookings && (
                              <span>{service.bookings.length} réservation(s)</span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleViewServiceDetails(service)}
                              className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300"
                            >
                              <Eye className="w-4 h-4" />
                              Voir détails
                            </button>
                            <button
                              onClick={() => handleEditService(service.id)}
                              className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                            >
                              <Settings className="w-4 h-4" />
                              Modifier
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Package className="mx-auto mb-4 w-12 h-12 text-gray-400" />
                    <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Aucun service créé</h3>
                    <p className="mb-4 text-gray-600 dark:text-gray-400">
                      Vous n'avez pas encore créé de service. Commencez par créer votre premier service.
                    </p>
                    <button
                      onClick={handleCreateService}
                      className="flex gap-2 items-center px-6 py-3 mx-auto font-medium text-white bg-green-500 rounded-lg transition hover:bg-green-600"
                    >
                      <Plus className="w-5 h-5" />
                      Créer mon premier service
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'storage' && (
              <div className="space-y-6 storage-section">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Mes Boîtes de Stockage</h3>
                  <button
                    onClick={handleCreateStorageBox}
                    className="flex gap-2 items-center px-4 py-2 font-medium text-white bg-purple-500 rounded-lg transition hover:bg-purple-600"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter une boîte
                  </button>
                </div>

                {storageBoxes.length > 0 ? (
                  <div className="space-y-4">
                    {storageBoxes.map((box) => (
                      <div key={box.id} className="p-6 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white">{box.title}</h4>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                              Prix: €{box.pricePerDay}/jour
                            </p>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                              Capacité: {box.capacity} m²
                            </p>
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                            <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                              box.isAvailable ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                              'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                            }`}>
                              {box.isAvailable ? 'Disponible' : 'Occupée'}
                            </span>
                            <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                              €{box.pricePerDay}
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid gap-4 md:grid-cols-3">
                          <div>
                            <h5 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Localisation</h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{box.location}</p>
                          </div>
                          <div>
                            <h5 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Type</h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{box.type}</p>
                          </div>
                          <div>
                            <h5 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Code d'accès</h5>
                            <p className="text-sm font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded">
                              {box.accessCode || 'Non défini'}
                            </p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-200 dark:border-gray-600">
                          <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span>Créé le {new Date(box.createdAt).toLocaleDateString()}</span>
                            {box.rentals && (
                              <span>{box.rentals.length} location(s)</span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleViewStorageBoxDetails(box)}
                              className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                            >
                              <Eye className="w-4 h-4" />
                              Voir détails
                            </button>
                            <button
                              onClick={() => handleEditStorageBox(box.id)}
                              className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                            >
                              <Settings className="w-4 h-4" />
                              Modifier
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Box className="mx-auto mb-4 w-12 h-12 text-gray-400" />
                    <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Aucune boîte de stockage</h3>
                    <p className="mb-4 text-gray-600 dark:text-gray-400">
                      Vous n'avez pas encore créé de boîte de stockage. Commencez par ajouter votre première boîte.
                    </p>
                    <button
                      onClick={handleCreateStorageBox}
                      className="flex gap-2 items-center px-6 py-3 mx-auto font-medium text-white bg-purple-500 rounded-lg transition hover:bg-purple-600"
                    >
                      <Plus className="w-5 h-5" />
                      Ajouter une boîte
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'bookings' && (
              <div className="space-y-6 bookings-section">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Réservations</h3>
                  <div className="flex gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Services: {bookings.filter(b => ['PENDING', 'CONFIRMED'].includes(b.status)).length} • Boîtes: {boxRentals.filter(r => r.status === 'ACTIVE').length}
                    </span>
                  </div>
                </div>

                {(bookings.length > 0 || boxRentals.length > 0) ? (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <div key={booking.id} className="p-6 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex gap-3 items-center mb-2">
                              <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                                {booking.serviceName}
                              </h4>
                              <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                                booking.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                                booking.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                                booking.status === 'CANCELLED' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                                'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                              }`}>
                                {booking.status === 'PENDING' ? 'En attente' :
                                 booking.status === 'CONFIRMED' ? 'Confirmé' :
                                 booking.status === 'COMPLETED' ? 'Terminé' :
                                 booking.status === 'CANCELLED' ? 'Annulé' : booking.status}
                              </span>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                              <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  <strong>Client:</strong> {booking.customerName}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  <strong>Date:</strong> {new Date(booking.scheduledAt).toLocaleDateString('fr-FR', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  <strong>Email:</strong> {booking.customerEmail}
                                </p>
                                {booking.notes && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    <strong>Notes:</strong> {booking.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                              €{booking.totalPrice?.toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {booking.duration || 'Durée non spécifiée'}
                            </p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-200 dark:border-gray-600">
                          <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span>Réservé le {new Date(booking.createdAt).toLocaleDateString()}</span>
                            {booking.payment && (
                              <span>Paiement: {booking.payment.status === 'COMPLETED' ? 'Effectué' : 'En attente'}</span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleViewBooking(booking.id)}
                              className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300"
                            >
                              <Eye className="w-4 h-4" />
                              Voir détails
                            </button>
                            {booking.status === 'PENDING' && (
                              <div className="flex gap-1">
                                <button 
                                  onClick={() => handleAcceptBooking(booking.id)}
                                  className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Accepter
                                </button>
                                <button 
                                  onClick={() => handleRejectBooking(booking.id)}
                                  className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                                >
                                  <X className="w-4 h-4" />
                                  Refuser
                                </button>
                              </div>
                            )}
                            {(booking.status === 'CONFIRMED' || booking.status === 'IN_PROGRESS' || booking.status === 'COMPLETED') && (
                              <button
                                onClick={() => {
                                  setSelectedConversation({
                                    id: booking.customer?.id || booking.customerId,
                                    firstName: booking.customer?.firstName || booking.customerName?.split(' ')[0] || 'Client',
                                    lastName: booking.customer?.lastName || booking.customerName?.split(' ').slice(1).join(' ') || '',
                                    email: booking.customer?.email || booking.customerEmail
                                  });
                                  setActiveTab('messages');
                                }}
                                className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                              >
                                <MessageCircle className="w-4 h-4" />
                                Contacter le client
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Locations de boîtes de stockage */}
                    {boxRentals.length > 0 && (
                      <div className="mt-8">
                        <h4 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">Locations de boîtes de stockage</h4>
                        {boxRentals.map((rental) => (
                          <div key={rental.id} className="p-6 mb-4 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex-1">
                                <div className="flex gap-3 items-center mb-2">
                                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                                    {rental.storageBoxTitle}
                                  </h4>
                                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                    rental.isActive === false ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                                    rental.status === 'ACTIVE' || rental.isActive === true ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                                    rental.status === 'ENDED' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' :
                                    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                  }`}>
                                    {rental.isActive === false ? 'En attente' :
                                     rental.status === 'ACTIVE' || rental.isActive === true ? 'Active' :
                                     rental.status === 'ENDED' ? 'Terminée' : rental.status}
                                  </span>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                  <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      <strong>Locataire:</strong> {rental.customerName}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      <strong>Début:</strong> {new Date(rental.startDate).toLocaleDateString('fr-FR')}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      <strong>Email:</strong> {rental.customerEmail}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      <strong>Fin prévue:</strong> {rental.endDate ? new Date(rental.endDate).toLocaleDateString('fr-FR') : 'Non définie'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                  €{rental.dailyPrice?.toFixed(2)}/jour
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {rental.duration ? `${rental.duration} jours` : 'Durée indéterminée'}
                                </p>
                              </div>
                            </div>

                            <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-200 dark:border-gray-600">
                              <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                                <span>Demandé le {new Date(rental.createdAt).toLocaleDateString()}</span>
                                {rental.payment && (
                                  <span>Paiement: {rental.payment.status === 'COMPLETED' ? 'Effectué' : 'En attente'}</span>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                                >
                                  <Eye className="w-4 h-4" />
                                  Voir détails
                                </button>
                                {rental.isActive === false && (
                                  <div className="flex gap-1">
                                    <button 
                                      onClick={() => handleAcceptRental(rental.id)}
                                      className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                      Accepter
                                    </button>
                                    <button 
                                      onClick={() => handleRejectRental(rental.id)}
                                      className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                                    >
                                      <X className="w-4 h-4" />
                                      Refuser
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Calendar className="mx-auto mb-4 w-12 h-12 text-gray-400" />
                    <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Aucune réservation</h3>
                    <p className="mb-4 text-gray-600 dark:text-gray-400">
                      Les réservations de vos services et locations de boîtes apparaîtront ici.
                    </p>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={handleCreateService}
                        className="flex gap-2 items-center px-6 py-3 font-medium text-white bg-green-500 rounded-lg transition hover:bg-green-600"
                      >
                        <Plus className="w-5 h-5" />
                        Créer un service
                      </button>
                      <button
                        onClick={handleCreateStorageBox}
                        className="flex gap-2 items-center px-6 py-3 font-medium text-white bg-purple-500 rounded-lg transition hover:bg-purple-600"
                      >
                        <Box className="w-5 h-5" />
                        Ajouter une boîte
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'earnings' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Gains</h3>
                
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="p-6 text-center bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Gains totaux</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">€{stats.totalEarnings.toFixed(2)}</p>
                  </div>
                  <div className="p-6 text-center bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ce mois</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">€{earningsTotals.month.toFixed(2)}</p>
                  </div>
                  <div className="p-6 text-center bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Moyenne par service</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      €{stats.completedBookings > 0 ? (stats.totalEarnings / stats.completedBookings).toFixed(2) : '0.00'}
                    </p>
                  </div>
                </div>

                {payments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-gray-200 dark:border-gray-700">
                        <tr>
                          <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                            Date
                          </th>
                          <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                            Service
                          </th>
                          <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                            Client
                          </th>
                          <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                            Montant
                          </th>
                          <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                            Statut
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {payments.map((payment) => (
                          <tr key={payment.id}>
                            <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                              {new Date(payment.createdAt).toLocaleDateString('fr-FR', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex gap-2 items-center">
                                <span>{payment.serviceName || payment.storageBoxName}</span>
                                {payment.type === 'service' && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                    Service
                                  </span>
                                )}
                                {payment.type === 'storage' && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                                    Boîte
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                              {payment.customerName}
                            </td>
                            <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
                              €{payment.amount.toFixed(2)}
                            </td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                payment.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 
                                payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                                payment.status === 'FAILED' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                                'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                              }`}>
                                {payment.status === 'COMPLETED' ? 'Terminé' :
                                 payment.status === 'PENDING' ? 'En attente' :
                                 payment.status === 'FAILED' ? 'Échoué' :
                                 payment.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <DollarSign className="mx-auto mb-4 w-12 h-12 text-gray-400" />
                    <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Aucun paiement</h3>
                    <p className="text-gray-600 dark:text-gray-400">L'historique des paiements apparaîtra ici</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Avis clients</h3>
                  <div className="flex gap-2 items-center">
                    <Star className="w-5 h-5 text-yellow-400" fill="currentColor" />
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      {stats.averageRating}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      ({reviews.length} avis)
                    </span>
                  </div>
                </div>

                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="p-6 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex gap-3 items-center mb-2">
                              <div className="flex gap-1 items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                                    }`}
                                    fill="currentColor"
                                  />
                                ))}
                              </div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {review.customerName}
                              </p>
                            </div>
                            <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                              <strong>{review.type === 'storage' ? 'Boîte de stockage' : 'Service'}:</strong> {review.serviceName || review.storageBoxName}
                            </p>
                            <p className="text-gray-900 dark:text-white">
                              {review.comment}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Star className="mx-auto mb-4 w-12 h-12 text-gray-400" />
                    <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Aucun avis pour le moment</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Les avis de vos clients apparaîtront ici après la completion de vos services et locations de boîtes.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'subscription' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Abonnement</h3>
                  {subscriptionStatus?.hasActiveSubscription && (
                    <span className="inline-flex items-center px-3 py-1 text-sm font-medium text-green-800 bg-green-100 rounded-full dark:bg-green-900 dark:text-green-300">
                      <Crown className="w-4 h-4 mr-1" />
                      Abonnement Actif
                    </span>
                  )}
                </div>

                {subscriptionStatus?.hasActiveSubscription ? (
                  // Active subscription view
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="p-6 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                      <h4 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
                        Plan Professionnel
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">Prix mensuel</span>
                          <span className="font-semibold text-gray-900 dark:text-white">10€/mois</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">Statut</span>
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full dark:bg-green-900 dark:text-green-300">
                            Actif
                          </span>
                        </div>
                        {subscriptionStatus.subscription?.currentPeriodEnd && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">Prochaine facturation</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {new Date(subscriptionStatus.subscription.currentPeriodEnd).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">Renouvellement automatique</span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {subscriptionStatus.subscription?.autoRenew ? 'Activé' : 'Désactivé'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border border-green-200 dark:from-green-900/20 dark:to-blue-900/20 dark:border-green-800">
                      <h4 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
                        Fonctionnalités incluses
                      </h4>
                      <div className="space-y-2">
                        {[
                          'Services illimités',
                          'Boîtes de stockage illimitées',
                          'Gestion des réservations',
                          'Messagerie premium',
                          'Statistiques avancées',
                          'Support prioritaire'
                        ].map((feature, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  // No subscription view
                  <div className="text-center p-12">
                    <Crown className="mx-auto mb-6 w-16 h-16 text-yellow-500" />
                    <h3 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
                      Passez au Plan Professionnel
                    </h3>
                    <p className="mb-6 text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                      Débloquez toutes les fonctionnalités d'ecodeli pour développer votre activité. 
                      Créez des services, gérez vos boîtes de stockage et accédez aux outils avancés.
                    </p>
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">10€</span>
                      <span className="text-xl text-gray-600 dark:text-gray-400">/mois</span>
                    </div>
                    <button
                      onClick={handleSubscribe}
                      className="px-8 py-3 text-lg font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition"
                    >
                      S'abonner maintenant
                    </button>
                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                      Sans engagement • Résiliation possible à tout moment
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        // Marquer toutes les notifications comme lues
                        const unreadNotifications = notifications.filter(n => !n.isRead);
                        for (const notification of unreadNotifications) {
                          await markNotificationAsRead(notification.id);
                        }
                      }}
                      className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    >
                      Tout marquer comme lu
                    </button>
                  </div>
                </div>

                {notifications.length > 0 ? (
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div 
                        key={notification.id} 
                        className={`p-4 rounded-lg border transition-colors ${
                          !notification.isRead 
                            ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' 
                            : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex flex-1 gap-3 items-start">
                            {!notification.isRead && (
                              <div className="mt-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            )}
                            <div className="flex-1">
                              <div className="flex gap-2 items-center mb-1">
                                <h4 className="font-medium text-gray-900 dark:text-white">
                                  {notification.title}
                                </h4>
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                  notification.type === 'BOOKING_REQUEST' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                                  notification.type === 'BOOKING_CONFIRMED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                                  notification.type === 'PAYMENT_RECEIVED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                                  'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                                }`}>
                                  {notification.type === 'BOOKING_REQUEST' ? 'Demande' :
                                   notification.type === 'BOOKING_CONFIRMED' ? 'Confirmée' :
                                   notification.type === 'PAYMENT_RECEIVED' ? 'Paiement' :
                                   notification.type}
                                </span>
                              </div>
                              <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(notification.createdAt).toLocaleDateString('fr-FR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            {notification.type === 'BOOKING_REQUEST' && !notification.isRead && (
                              <button
                                onClick={() => {
                                  markNotificationAsRead(notification.id);
                                  setActiveTab('bookings');
                                }}
                                className="px-3 py-1 text-sm font-medium text-white bg-blue-500 rounded-lg transition hover:bg-blue-600"
                              >
                                Voir demande
                              </button>
                            )}
                            {!notification.isRead && (
                              <button
                                onClick={() => markNotificationAsRead(notification.id)}
                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                title="Marquer comme lu"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Clock className="mx-auto mb-4 w-12 h-12 text-gray-400" />
                    <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Aucune notification</h3>
                    <p className="text-gray-600 dark:text-gray-400">Vos notifications apparaîtront ici</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'messages' && (
              <div className="space-y-6 messages-section">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Messages</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        // Marquer toutes les conversations comme lues
                        const unreadConversations = conversations.filter(c => c.unreadCount > 0);
                        for (const conversation of unreadConversations) {
                          await markConversationAsRead(conversation.partner.id);
                        }
                      }}
                      className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    >
                      Tout marquer comme lu
                    </button>
                    <Link
                      href="/messages"
                      className="px-3 py-1 text-sm font-medium text-white bg-sky-500 rounded-lg transition hover:bg-sky-600"
                    >
                      Ouvrir la messagerie complète
                    </Link>
                  </div>
                </div>

                <div className="overflow-hidden bg-white rounded-lg shadow-sm dark:bg-gray-800" style={{ height: '500px' }}>
                  <div className="flex h-full">
                    {/* Conversations List */}
                    <div className="flex flex-col w-2/5 border-r border-gray-200 dark:border-gray-700">
                      <div className="p-3 bg-sky-50 border-b border-gray-200 dark:bg-sky-900/20 dark:border-gray-700">
                        <div className="flex gap-2 items-center">
                          <MessageCircle className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                          <h4 className="font-medium text-gray-900 dark:text-white">Conversations</h4>
                          {conversations.filter(c => c.unreadCount > 0).length > 0 && (
                            <span className="inline-flex justify-center items-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                              {conversations.filter(c => c.unreadCount > 0).length}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="overflow-y-auto flex-1">
                        {messagesLoading ? (
                          <div className="flex justify-center items-center h-32">
                            <div className="w-6 h-6 rounded-full border-2 border-sky-400 animate-spin border-t-transparent"></div>
                          </div>
                        ) : conversations.length === 0 ? (
                          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                            <div className="mb-2 text-2xl">💬</div>
                            <p className="text-sm">Aucune conversation</p>
                            <p className="mt-1 text-xs">Les clients vous contacteront via vos services et boîtes</p>
                          </div>
                        ) : (
                          conversations.map((conversation) => (
                            <div
                              key={conversation.partner.id}
                              onClick={() => setSelectedConversation(conversation.partner)}
                              className={`p-3 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition ${
                                selectedConversation?.id === conversation.partner.id ? 'bg-sky-50 border-sky-200 dark:bg-sky-900/20 dark:border-sky-800' : ''
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <div className="flex items-center space-x-2">
                                  <div className="flex justify-center items-center w-8 h-8 text-xs font-semibold text-white bg-sky-500 rounded-full">
                                    {conversation.partner.firstName?.[0]}{conversation.partner.lastName?.[0]}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                                      {conversation.partner.firstName} {conversation.partner.lastName}
                                    </p>
                                    {conversation.lastMessage && (
                                      <p className="text-xs text-gray-500 truncate dark:text-gray-400">
                                        {conversation.lastMessage.content}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end space-y-1">
                                  {conversation.lastMessage && (
                                    <span className="text-xs text-gray-400 dark:text-gray-500">
                                      {formatMessageTime(conversation.lastMessage.createdAt)}
                                    </span>
                                  )}
                                  {conversation.unreadCount > 0 && (
                                    <span className="bg-sky-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[16px] text-center">
                                      {conversation.unreadCount}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex flex-col flex-1">
                      {selectedConversation ? (
                        <>
                          {/* Chat Header */}
                          <div className="p-3 bg-sky-50 border-b border-gray-200 dark:bg-sky-900/20 dark:border-gray-700">
                            <div className="flex items-center space-x-2">
                              <div className="flex justify-center items-center w-8 h-8 text-xs font-semibold text-white bg-sky-500 rounded-full">
                                {selectedConversation.firstName?.[0]}{selectedConversation.lastName?.[0]}
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {selectedConversation.firstName} {selectedConversation.lastName}
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{selectedConversation.email}</p>
                              </div>
                            </div>
                          </div>

                          {/* Messages */}
                          <div className="overflow-y-auto flex-1 p-3 space-y-3">
                            {messages.map((message) => (
                              <div
                                key={message.id}
                                className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-xs px-3 py-2 rounded-lg ${
                                    message.senderId === user?.id
                                      ? 'bg-sky-500 text-white'
                                      : 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white'
                                  }`}
                                >
                                  <p className="text-sm">{message.content}</p>
                                  <p className={`text-xs mt-1 ${
                                    message.senderId === user?.id ? 'text-sky-100' : 'text-gray-500 dark:text-gray-400'
                                  }`}>
                                    {formatMessageTime(message.createdAt)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Message Input */}
                          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                            <form onSubmit={sendMessage} className="flex space-x-2">
                              <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Tapez votre message..."
                                className="flex-1 px-3 py-2 text-sm rounded-full border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                disabled={sendingMessage}
                              />
                              <button
                                type="submit"
                                disabled={!newMessage.trim() || sendingMessage}
                                className="flex gap-1 items-center px-3 py-2 text-sm font-medium text-white bg-sky-600 rounded-full transition hover:bg-sky-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                              >
                                <Send className="w-3 h-3" />
                                {sendingMessage ? 'Envoi...' : 'Envoyer'}
                              </button>
                            </form>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-1 justify-center items-center">
                          <div className="text-center text-gray-500 dark:text-gray-400">
                            <div className="mb-4 text-4xl">💬</div>
                            <h4 className="mb-2 font-medium text-gray-900 dark:text-white">Sélectionnez une conversation</h4>
                            <p className="text-sm">Choisissez une conversation pour commencer à chatter</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {conversations.length === 0 && (
                  <div className="p-6 text-center bg-gray-50 rounded-lg dark:bg-gray-800">
                    <MessageCircle className="mx-auto mb-3 w-8 h-8 text-gray-400" />
                    <h4 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Pas encore de conversations</h4>
                    <p className="mb-3 text-xs text-gray-600 dark:text-gray-400">
                      Les conversations avec vos clients apparaîtront ici quand ils réserveront vos services ou loueront vos boîtes.
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Link 
                        href="/services/create"
                        className="inline-block px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-lg transition hover:bg-green-600"
                      >
                        Créer un service
                      </Link>
                      <Link 
                        href="/storage/create"
                        className="inline-block px-4 py-2 text-sm font-medium text-white bg-purple-500 rounded-lg transition hover:bg-purple-600"
                      >
                        Ajouter une boîte
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal des détails du service */}
      {isServiceModalOpen && selectedService && (
        <div className="overflow-y-auto fixed inset-0 z-50">
          <div className="flex justify-center items-center px-4 pt-4 pb-20 min-h-screen text-center sm:block sm:p-0">
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={closeServiceModal}
            />
            
            {/* Modal */}
            <div className="inline-block overflow-hidden text-left align-bottom bg-white rounded-lg shadow-xl transition-all transform dark:bg-gray-800 sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              {/* Header */}
              <div className="px-6 pt-6 bg-white dark:bg-gray-800">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Détails du service
                  </h3>
                  <button
                    onClick={closeServiceModal}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-4 bg-white dark:bg-gray-800">
                <div className="space-y-6">
                  {/* Titre et statut */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {selectedService.name}
                      </h4>
                      <p className="mt-2 text-gray-600 dark:text-gray-400">
                        {selectedService.description}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                        selectedService.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                      }`}>
                        {selectedService.isActive ? 'Actif' : 'Inactif'}
                      </span>
                      <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                        €{selectedService.price}
                      </span>
                    </div>
                  </div>

                  {/* Informations du service */}
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <h5 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        Catégorie
                      </h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedService.category || 'Non spécifiée'}
                      </p>
                    </div>
                    <div>
                      <h5 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        Durée
                      </h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedService.duration || 'Non spécifiée'}
                      </p>
                    </div>
                  </div>

                  {/* Statistiques */}
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
                      <h5 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        Réservations
                      </h5>
                      <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">
                        {selectedService.bookings?.length || 0}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
                      <h5 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        Note moyenne
                      </h5>
                      <div className="flex gap-2 items-center">
                        <Star className="w-5 h-5 text-yellow-400" fill="currentColor" />
                        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                          {selectedService.averageRating || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
                      <h5 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        Gains générés
                      </h5>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        €{selectedService.totalEarnings?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  </div>

                  {/* Avis récents */}
                  {selectedService.reviews && selectedService.reviews.length > 0 && (
                    <div>
                      <h5 className="mb-3 text-lg font-medium text-gray-900 dark:text-white">
                        Avis récents
                      </h5>
                      <div className="space-y-3">
                        {selectedService.reviews.slice(0, 3).map((review) => (
                          <div key={review.id} className="p-3 bg-gray-50 rounded-lg dark:bg-gray-700">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex gap-2 items-center mb-1">
                                  <div className="flex gap-1 items-center">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`w-3 h-3 ${
                                          i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                                        }`}
                                        fill="currentColor"
                                      />
                                    ))}
                                  </div>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {review.customerName}
                                  </p>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {review.comment}
                                </p>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700">
                <div className="flex justify-between">
                  <button
                    onClick={() => {
                      closeServiceModal();
                      handleEditService(selectedService.id);
                    }}
                    className="px-4 py-2 text-sky-700 bg-sky-100 rounded-lg transition dark:bg-sky-900 dark:text-sky-300 hover:bg-sky-200 dark:hover:bg-sky-800"
                  >
                    Modifier le service
                  </button>
                  <button
                    onClick={closeServiceModal}
                    className="px-4 py-2 text-gray-700 bg-gray-300 rounded-lg transition dark:bg-gray-600 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-500"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal des détails de la boîte de stockage */}
      {isStorageModalOpen && selectedStorageBox && (
        <div className="overflow-y-auto fixed inset-0 z-50">
          <div className="flex justify-center items-center px-4 pt-4 pb-20 min-h-screen text-center sm:block sm:p-0">
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={closeStorageModal}
            />
            
            {/* Modal */}
            <div className="inline-block overflow-hidden text-left align-bottom bg-white rounded-lg shadow-xl transition-all transform dark:bg-gray-800 sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              {/* Header */}
              <div className="px-6 pt-6 bg-white dark:bg-gray-800">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Détails de la boîte de stockage
                  </h3>
                  <button
                    onClick={closeStorageModal}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-4 bg-white dark:bg-gray-800">
                <div className="space-y-6">
                  {/* Titre et statut */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {selectedStorageBox.title}
                      </h4>
                      <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Prix: €{selectedStorageBox.pricePerDay}/jour
                      </p>
                      <p className="mt-1 text-gray-600 dark:text-gray-400">
                        Capacité: {selectedStorageBox.capacity} m²
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                        selectedStorageBox.isAvailable ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {selectedStorageBox.isAvailable ? 'Disponible' : 'Occupée'}
                      </span>
                      <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        €{selectedStorageBox.pricePerDay}
                      </span>
                    </div>
                  </div>

                  {/* Informations de la boîte */}
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div>
                      <h5 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        Localisation
                      </h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedStorageBox.location}
                      </p>
                    </div>
                    <div>
                      <h5 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        Type
                      </h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedStorageBox.type}
                      </p>
                    </div>
                    <div>
                      <h5 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        Code d'accès
                      </h5>
                      <p className="text-sm font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-3 py-2 rounded-lg">
                        {selectedStorageBox.accessCode || 'Non défini'}
                      </p>
                    </div>
                  </div>

                  {/* Statistiques */}
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
                      <h5 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        Locations
                      </h5>
                      <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">
                        {selectedStorageBox.rentals?.length || 0}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
                      <h5 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        Note moyenne
                      </h5>
                      <div className="flex gap-2 items-center">
                        <Star className="w-5 h-5 text-yellow-400" fill="currentColor" />
                        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                          {selectedStorageBox.averageRating || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
                      <h5 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        Gains générés
                      </h5>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        €{selectedStorageBox.totalEarnings?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  </div>

                  {/* Avis récents */}
                  {selectedStorageBox.reviews && selectedStorageBox.reviews.length > 0 && (
                    <div>
                      <h5 className="mb-3 text-lg font-medium text-gray-900 dark:text-white">
                        Avis récents
                      </h5>
                      <div className="space-y-3">
                        {selectedStorageBox.reviews.slice(0, 3).map((review) => (
                          <div key={review.id} className="p-3 bg-gray-50 rounded-lg dark:bg-gray-700">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex gap-2 items-center mb-1">
                                  <div className="flex gap-1 items-center">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`w-3 h-3 ${
                                          i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                                        }`}
                                        fill="currentColor"
                                      />
                                    ))}
                                  </div>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {review.customerName}
                                  </p>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {review.comment}
                                </p>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700">
                <div className="flex justify-between">
                  <button
                    onClick={() => {
                      closeStorageModal();
                      handleEditStorageBox(selectedStorageBox.id);
                    }}
                    className="px-4 py-2 text-purple-700 bg-purple-100 rounded-lg transition dark:bg-purple-900 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800"
                  >
                    Modifier la boîte
                  </button>
                  <button
                    onClick={closeStorageModal}
                    className="px-4 py-2 text-gray-700 bg-gray-300 rounded-lg transition dark:bg-gray-600 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-500"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bouton tutoriel dans l'interface utilisateur */}
      <div className="fixed right-4 bottom-4 z-30">
        <button
          onClick={forceTutorial}
          className="flex gap-2 items-center px-4 py-2 text-white bg-blue-500 rounded-full shadow-lg transition-all transform hover:bg-blue-600 hover:scale-105"
          title="Relancer le tutoriel"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Guide
        </button>
      </div>

      {/* Composant TutorialOverlay */}
      <TutorialOverlay
        userRole={user?.role}
        onComplete={completeTutorial}
        isVisible={showTutorial}
      />
    </div>
  );
} 