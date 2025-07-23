import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import RoleBasedNavigation from '../../components/RoleBasedNavigation';
import RelayManager from '../../components/RelayManager';
import TutorialOverlay from '../../components/TutorialOverlay';
import VehicleTypeModal from '../../components/VehicleTypeModal';
import { useTutorial } from '../../components/useTutorial';
import { getStatusConfig, isActiveStatus, isCompletedStatus } from '../../lib/status-utils';
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
  Truck,
  MapPin,
  Route,
  Navigation,
  ShieldCheck,
  Zap,
  Activity,
  AlertCircle,
  Bell,
  RefreshCw,
  Crown,
  Lock
} from 'lucide-react';

export default function CarrierDashboard({ isDarkMode, toggleDarkMode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Tutoriel
  const { showTutorial, completeTutorial, forceTutorial } = useTutorial(user?.role);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Main state
  const [dashboardStats, setDashboardStats] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [relayProposals, setRelayProposals] = useState([]);
  const [rideRequests, setRideRequests] = useState([]);
  const [rides, setRides] = useState([]);
  const [packages, setPackages] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [earnings, setEarnings] = useState({ today: 0, month: 0, total: 0 });
  const [reviews, setReviews] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [isRelayModalOpen, setIsRelayModalOpen] = useState(false);

  // Messages state
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  
  // Vehicle type modal state
  const [showVehicleTypeModal, setShowVehicleTypeModal] = useState(false);

  // Subscription states
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [showSubscriptionBanner, setShowSubscriptionBanner] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'CARRIER')) {
      router.push('/login');
      return;
    }

    // Rediriger les transporteurs professionnels vers le dashboard pro
    if (user && user.role === 'CARRIER' && user.userType === 'PROFESSIONAL') {
      router.replace('/dashboard/procarrier');
      return;
    }

    if (user) {
      fetchDashboardData();
      fetchNotifications();
      fetchRelayProposals();
      fetchRideRequests();
      checkSubscriptionStatus();
      
      // Check if user needs to set vehicle type
      if (!user.vehicleType) {
        setShowVehicleTypeModal(true);
      }
    }
  }, [user, loading]);

  // Effet séparé pour gérer le message de succès
  useEffect(() => {
    if (router.query.rideCreated || router.query.profileUpdated) {
      setShowSuccessMessage(true);
      fetchDashboardData();
      setTimeout(() => {
        setShowSuccessMessage(false);
        router.replace('/dashboard/carrier', undefined, { shallow: true });
      }, 5000);
    }
  }, [router.query.rideCreated, router.query.profileUpdated, router]);

  // Effet pour rafraîchir les données périodiquement
  useEffect(() => {
    if (user) {
      const interval = setInterval(() => {
        fetchDashboardData();
        fetchNotifications();
        fetchRelayProposals();
        fetchRideRequests();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/dashboard/carrier?_t=${timestamp}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Carrier dashboard data received:', data);
        
        setDashboardStats(data.stats || {});
        setRides(data.rides || []);
        setPackages(data.packages || []);
        setDeliveries(data.deliveries || []);
        setEarnings(data.earnings || { today: 0, month: 0, total: 0 });
        setReviews(data.reviews || []);
        setCurrentLocation(data.currentLocation);
      } else {
        console.error('❌ Carrier Dashboard API error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Error fetching carrier dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications?limit=10');
      if (response.ok) {
        const data = await response.json();
        console.log('🔔 Carrier notifications received:', data.notifications?.map(n => ({
          id: n.id,
          type: n.type,
          title: n.title,
          isRead: n.isRead,
          createdAt: n.createdAt
        })) || []);
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchRelayProposals = async () => {
    try {
      const response = await fetch('/api/carriers/relay-proposals');
      if (response.ok) {
        const data = await response.json();
        setRelayProposals(data.proposals || []);
      }
    } catch (error) {
      console.error('Error fetching relay proposals:', error);
    }
  };

  const fetchRideRequests = async () => {
    try {
      const response = await fetch('/api/ride-requests');
      if (response.ok) {
        const data = await response.json();
        console.log('🚗 Ride requests received:', data.rideRequests?.length || 0);
        setRideRequests(data.rideRequests || []);
      }
    } catch (error) {
      console.error('Error fetching ride requests:', error);
    }
  };

  const refreshData = async () => {
    await Promise.all([
      fetchDashboardData(),
      fetchNotifications(),
      fetchRelayProposals(),
      fetchRideRequests()
    ]);
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

  const acceptMatch = async (matchId) => {
    try {
      const response = await fetch(`/api/matches/${matchId}/accept`, {
        method: 'POST',
      });

      if (response.ok) {
        await refreshData();
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      }
    } catch (error) {
      console.error('Error accepting match:', error);
    }
  };

  const acceptRelayProposal = async (proposalId) => {
    try {
      const response = await fetch(`/api/matches/${proposalId}/accept-relay`, {
        method: 'POST',
      });

      if (response.ok) {
        await refreshData();
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      } else {
        const error = await response.json();
        alert('Erreur: ' + error.message);
      }
    } catch (error) {
      console.error('Error accepting relay proposal:', error);
      alert('Erreur lors de l\'acceptation du relais');
    }
  };

  const handleRideRequest = async (rideRequestId, action) => {
    try {
      const response = await fetch('/api/ride-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rideRequestId, action })
      });

      if (response.ok) {
        const data = await response.json();
        await refreshData();
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
        
        if (action === 'ACCEPT') {
          alert('Demande de course acceptée ! Vous pouvez maintenant communiquer avec le passager.');
        } else {
          alert('Demande de course refusée.');
        }
      } else {
        const error = await response.json();
        alert('Erreur: ' + error.error);
      }
    } catch (error) {
      console.error('Error handling ride request:', error);
      alert('Erreur réseau');
    }
  };

  // Helper function to get the correct package ID from a delivery object
  const getPackageId = (delivery) => {
    console.log('📦 Getting package ID from delivery:', delivery);
    // Try different possible structures
    const packageId = delivery.package?.id || delivery.packageId || delivery.id;
    console.log('📦 Extracted package ID:', packageId);
    return packageId;
  };

  const updateDeliveryStatus = async (delivery, status) => {
    try {
      const packageId = getPackageId(delivery);
      
      if (!packageId) {
        console.error('❌ No package ID found in delivery object:', delivery);
        alert('Erreur: ID du colis non trouvé');
        return;
      }
      
      console.log('🚀 Updating delivery status:', { packageId, status, delivery });
      
      const response = await fetch(`/api/packages/${packageId}/update-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status })
      });

      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Status update successful:', data);
        await refreshData();
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
        
        // Notifier les clients en temps réel (optionnel)
        if (window.localStorage) {
          const deliveryUpdate = {
            packageId: packageId,
            status: status,
            timestamp: new Date().toISOString(),
            updatedBy: 'carrier'
          };
          window.localStorage.setItem('deliveryUpdate', JSON.stringify(deliveryUpdate));
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'deliveryUpdate',
            newValue: JSON.stringify(deliveryUpdate)
          }));
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Status update failed:', errorData);
        alert(`Erreur lors de la mise à jour: ${errorData.error || 'Erreur inconnue'}`);
      }
    } catch (error) {
      console.error('Error updating delivery status:', error);
      alert(`Erreur réseau: ${error.message}`);
    }
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
    } else if (diffInHours < 168) {
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

  const handleCreateRide = () => {
    // Check if user has vehicle type before allowing ride creation
    if (!user?.vehicleType) {
      setShowVehicleTypeModal(true);
      return;
    }
    
    handleFeatureClick('create_ride', () => {
      router.push('/rides/create');
    });
  };

  const handleVehicleTypeSaved = (vehicleType) => {
    // Update user context or refetch user data
    setShowVehicleTypeModal(false);
    // Optionally refresh the page to get updated user data
    window.location.reload();
  };

  const handleViewDelivery = (delivery) => {
    setSelectedDelivery(delivery);
    // Logique pour afficher les détails de la livraison
  };

  const handleCreateRelay = (delivery) => {
    setSelectedDelivery(delivery);
    setIsRelayModalOpen(true);
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
    totalRides: rides.length,
    activeRides: rides.filter(r => ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(r.status)).length,
    totalDeliveries: deliveries.length,
    activeDeliveries: deliveries.filter(d => isActiveStatus(d.status)).length,
    completedDeliveries: deliveries.filter(d => isCompletedStatus(d.status) && d.status === 'DELIVERED').length,
    totalEarnings: earnings.total || 0,
    activeRelays: deliveries.filter(d => ['AWAITING_RELAY', 'RELAY_IN_PROGRESS'].includes(d.status)).length,
    pendingRideRequests: rideRequests.filter(r => r.status === 'PENDING').length,
    averageRating: reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : 0
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Head>
        <title>Tableau de Bord Transporteur - ecodeli</title>
        <meta name="description" content="Gérez vos trajets, livraisons et relais efficacement" />
        <link rel="icon" href="/LOGO_.png" />
      </Head>

      {/* Header avec RoleBasedNavigation */}
      <RoleBasedNavigation isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

      {/* Header Section */}
      <div className="px-6 py-8 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20">
        <div className="mx-auto max-w-7xl">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Bienvenue, {user?.firstName}!
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Gérez vos trajets, livraisons et relais efficacement
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCreateRide}
                className={`flex gap-2 items-center px-6 py-3 font-medium text-white rounded-full shadow-lg transition-all transform create-ride-btn ${
                  !subscriptionStatus?.hasActiveSubscription 
                    ? 'bg-gray-400 cursor-not-allowed opacity-75' 
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:scale-105 hover:from-blue-600 hover:to-blue-700 shadow-blue-500/25'
                }`}
                title={!subscriptionStatus?.hasActiveSubscription ? 'Abonnement requis' : ''}
              >
                {!subscriptionStatus?.hasActiveSubscription && <Lock className="w-4 h-4" />}
                <Plus className="w-4 h-4" />
                Créer un trajet
              </button>
              <button
                onClick={refreshData}
                className="flex gap-2 items-center px-6 py-3 font-medium text-white bg-gradient-to-r from-sky-500 to-sky-600 rounded-full shadow-lg transition-all transform hover:scale-105 hover:from-sky-600 hover:to-sky-700 shadow-sky-500/25"
              >
                <RefreshCw className="w-4 h-4" />
                Actualiser
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
                  Action effectuée avec succès !
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Votre opération a été prise en compte et vos données ont été mises à jour.
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
                    Pour créer des trajets, publier des annonces de livraison et accéder aux fonctionnalités avancées.
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
      {notifications.filter(n => !n.isRead && ['MATCH_PROPOSED', 'MATCH_UPDATE', 'DELIVERY_ASSIGNED', 'RELAY_REQUEST', 'RIDE_REQUEST'].includes(n.type)).length > 0 && (
        <div className="px-6 mx-auto max-w-7xl">
          <div className="mb-6 space-y-3">
            {notifications
              .filter(n => !n.isRead && ['MATCH_PROPOSED', 'MATCH_UPDATE', 'DELIVERY_ASSIGNED', 'RELAY_REQUEST', 'RIDE_REQUEST'].includes(n.type))
              .slice(0, 3)
              .map((notification) => (
                <div key={notification.id} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-800">
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
                      {notification.type === 'MATCH_PROPOSED' && (
                        <button
                          onClick={() => {
                            markNotificationAsRead(notification.id);
                            setActiveTab('deliveries');
                          }}
                          className="px-3 py-1 text-sm font-medium text-white bg-blue-500 rounded-lg transition hover:bg-blue-600"
                        >
                          Voir proposition
                        </button>
                      )}
                      {notification.type === 'MATCH_UPDATE' && (
                        <button
                          onClick={() => {
                            markNotificationAsRead(notification.id);
                            setActiveTab('deliveries');
                          }}
                          className="px-3 py-1 text-sm font-medium text-white bg-green-500 rounded-lg transition hover:bg-green-600"
                        >
                          Voir livraison
                        </button>
                      )}
                      {notification.type === 'RELAY_REQUEST' && (
                        <button
                          onClick={() => {
                            markNotificationAsRead(notification.id);
                            setActiveTab('relays');
                          }}
                          className="px-3 py-1 text-sm font-medium text-white bg-purple-500 rounded-lg transition hover:bg-purple-600"
                        >
                          Voir relais
                        </button>
                      )}
                      {notification.type === 'RIDE_REQUEST' && (
                        <button
                          onClick={() => {
                            markNotificationAsRead(notification.id);
                            setActiveTab('ride-requests');
                          }}
                          className="px-3 py-1 text-sm font-medium text-white bg-blue-500 rounded-lg transition hover:bg-blue-600"
                        >
                          Voir demande
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
        <div className="grid gap-6 mb-8 md:grid-cols-5 overview-section">
          <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm transition-shadow dark:bg-gray-800 dark:border-gray-700 hover:shadow-md">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Trajets actifs</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeRides}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total: {stats.totalRides}</p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full dark:from-blue-900 dark:to-blue-800">
                <Route className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm transition-shadow dark:bg-gray-800 dark:border-gray-700 hover:shadow-md">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Livraisons en cours</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeDeliveries}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total: {stats.totalDeliveries}</p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-gradient-to-r from-green-100 to-green-200 rounded-full dark:from-green-900 dark:to-green-800">
                <Package className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm transition-shadow dark:bg-gray-800 dark:border-gray-700 hover:shadow-md">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Livrées</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completedDeliveries}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Note: {stats.averageRating}⭐</p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-gradient-to-r from-emerald-100 to-emerald-200 rounded-full dark:from-emerald-900 dark:to-emerald-800">
                <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm transition-shadow dark:bg-gray-800 dark:border-gray-700 hover:shadow-md">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Gains totaux</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">€{stats.totalEarnings.toFixed(2)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Ce mois: €{earnings.month.toFixed(2)}</p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-gradient-to-r from-orange-100 to-orange-200 rounded-full dark:from-orange-900 dark:to-orange-800">
                <DollarSign className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm transition-shadow dark:bg-gray-800 dark:border-gray-700 hover:shadow-md">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Relais actifs</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeRelays}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Propositions: {relayProposals.length}</p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-gradient-to-r from-purple-100 to-purple-200 rounded-full dark:from-purple-900 dark:to-purple-800">
                <Navigation className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 bg-white rounded-xl border border-gray-100 shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex px-6 -mb-px space-x-8">
              {[
                { id: 'overview', name: 'Aperçu', icon: TrendingUp },
                { id: 'rides', name: 'Mes Trajets', icon: Route },
                { id: 'ride-requests', name: 'Demandes de course', icon: Users, badge: stats.pendingRideRequests },
                { id: 'deliveries', name: 'Livraisons', icon: Package, badge: stats.activeDeliveries },
                { id: 'relays', name: 'Relais', icon: Navigation, badge: relayProposals.length + stats.activeRelays },
                { id: 'earnings', name: 'Gains', icon: DollarSign },
                { id: 'reviews', name: 'Avis', icon: Star, badge: reviews.filter(r => !r.isRead).length },
                { id: 'subscription', name: 'Abonnement', icon: Crown },
                { id: 'notifications', name: 'Notifications', icon: Bell, badge: notifications.filter(n => !n.isRead).length },
                { id: 'messages', name: 'Messages', icon: MessageCircle, badge: conversations.filter(c => c.unreadCount > 0).length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-all ${
                    activeTab === tab.id
                      ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.name}
                  {tab.badge > 0 && (
                    <span className="inline-flex justify-center items-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full animate-pulse">
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
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Aperçu de votre activité</h3>
                </div>
                
                <div className="grid gap-6 lg:grid-cols-3">
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-800">
                    <h4 className="flex gap-2 items-center mb-4 font-medium text-gray-900 dark:text-white">
                      <Route className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      Trajets récents
                    </h4>
                    {rides.slice(0, 3).length > 0 ? (
                      <div className="space-y-3">
                        {rides.slice(0, 3).map((ride) => (
                          <div key={ride.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{ride.from} → {ride.to}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{new Date(ride.departureTime).toLocaleDateString()}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(ride.status) ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                            }`}>
                              {ride.status === 'PENDING' ? 'En attente' :
                               ride.status === 'CONFIRMED' ? 'Confirmé' :
                               ride.status === 'IN_PROGRESS' ? 'En cours' :
                               ride.status === 'COMPLETED' ? 'Terminé' :
                               ride.status === 'CANCELLED' ? 'Annulé' : ride.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400">Aucun trajet récent</p>
                    )}
                  </div>

                  <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100 dark:from-green-900/20 dark:to-emerald-900/20 dark:border-green-800">
                    <h4 className="flex gap-2 items-center mb-4 font-medium text-gray-900 dark:text-white">
                      <Package className="w-5 h-5 text-green-600 dark:text-green-400" />
                      Livraisons actives
                    </h4>
                    {deliveries.filter(d => isActiveStatus(d.status)).slice(0, 3).length > 0 ? (
                      <div className="space-y-3">
                        {deliveries.filter(d => isActiveStatus(d.status)).slice(0, 3).map((delivery) => (
                          <div key={delivery.id} className="p-3 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                            <p className="font-medium text-gray-900 dark:text-white">{delivery.title}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{delivery.fromAddress} → {delivery.toAddress}</p>
                            <div className="flex justify-between items-center mt-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusConfig(delivery.status).bgColor} ${getStatusConfig(delivery.status).textColor} ${getStatusConfig(delivery.status).darkBg} ${getStatusConfig(delivery.status).darkText}`}>
                                {getStatusConfig(delivery.status).text}
                              </span>
                              <span className="text-sm font-medium text-green-600 dark:text-green-400">€{delivery.price}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400">Aucune livraison active</p>
                    )}
                  </div>

                  <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100 dark:from-purple-900/20 dark:to-pink-900/20 dark:border-purple-800">
                    <h4 className="flex gap-2 items-center mb-4 font-medium text-gray-900 dark:text-white">
                      <Navigation className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      Système de relais
                    </h4>
                    {relayProposals.slice(0, 3).length > 0 ? (
                      <div className="space-y-3">
                        {relayProposals.slice(0, 3).map((proposal) => (
                          <div key={proposal.id} className="p-3 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                            <p className="font-medium text-gray-900 dark:text-white">{proposal.packageTitle}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{proposal.pickupLocation} → {proposal.dropoffLocation}</p>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-sm font-medium text-purple-600 dark:text-purple-400">€{proposal.proposedPrice}</span>
                              <button
                                onClick={() => acceptRelayProposal(proposal.id)}
                                className="px-2 py-1 text-xs font-medium text-white bg-purple-500 rounded transition hover:bg-purple-600"
                              >
                                Accepter
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-4 text-center">
                        <Navigation className="mx-auto mb-2 w-8 h-8 text-gray-400" />
                        <p className="text-gray-600 dark:text-gray-400">Aucune proposition de relais</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Les propositions apparaîtront ici</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick actions */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <button
                    onClick={handleCreateRide}
                    className="p-4 text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg transition-all transform hover:from-blue-600 hover:to-blue-700 hover:scale-105 shadow-blue-500/25"
                  >
                    <Plus className="mx-auto mb-2 w-6 h-6" />
                    <p className="font-medium">Créer un trajet</p>
                  </button>
                  <button
                    onClick={() => setActiveTab('deliveries')}
                    className="p-4 text-white bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg transition-all transform hover:from-green-600 hover:to-green-700 hover:scale-105 shadow-green-500/25"
                  >
                    <Package className="mx-auto mb-2 w-6 h-6" />
                    <p className="font-medium">Voir livraisons</p>
                  </button>
                  <button
                    onClick={() => setActiveTab('relays')}
                    className="p-4 text-white bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg transition-all transform hover:from-purple-600 hover:to-purple-700 hover:scale-105 shadow-purple-500/25"
                  >
                    <Navigation className="mx-auto mb-2 w-6 h-6" />
                    <p className="font-medium">Gérer relais</p>
                  </button>
                  <button
                    onClick={() => setActiveTab('earnings')}
                    className="p-4 text-white bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg transition-all transform hover:from-orange-600 hover:to-orange-700 hover:scale-105 shadow-orange-500/25"
                  >
                    <DollarSign className="mx-auto mb-2 w-6 h-6" />
                    <p className="font-medium">Voir gains</p>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'rides' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Mes Trajets</h3>
                  <button
                    onClick={handleCreateRide}
                    className="flex gap-2 items-center px-4 py-2 font-medium text-white bg-blue-500 rounded-lg transition hover:bg-blue-600"
                  >
                    <Plus className="w-4 h-4" />
                    Créer un nouveau trajet
                  </button>
                </div>

                {rides.length > 0 ? (
                  <div className="space-y-4">
                    {rides.map((ride) => (
                      <div key={ride.id} className="p-6 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white">{ride.from} → {ride.to}</h4>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                              Départ: {new Date(ride.departureTime).toLocaleDateString('fr-FR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <div className="flex gap-2 items-center">
                            <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                              ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(ride.status) ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                              ride.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                            }`}>
                              {ride.status === 'PENDING' ? 'En attente' :
                               ride.status === 'CONFIRMED' ? 'Confirmé' :
                               ride.status === 'IN_PROGRESS' ? 'En cours' :
                               ride.status === 'COMPLETED' ? 'Terminé' :
                               ride.status === 'CANCELLED' ? 'Annulé' : ride.status}
                            </span>
                            <span className="text-lg font-bold text-green-600 dark:text-green-400">
                              €{ride.pricePerKm}/km
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid gap-4 md:grid-cols-3">
                          <div>
                            <h5 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Capacité</h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{ride.availableSpace} places</p>
                          </div>
                          <div>
                            <h5 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Distance</h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{ride.distance} km</p>
                          </div>
                          <div>
                            <h5 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Véhicule</h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{ride.vehicleType}</p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-200 dark:border-gray-600">
                          <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span>Créé le {new Date(ride.createdAt).toLocaleDateString()}</span>
                            {ride.packages && (
                              <span>{ride.packages.length} colis accepté(s)</span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300"
                            >
                              <Eye className="w-4 h-4" />
                              Voir détails
                            </button>
                            <button
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
                    <Route className="mx-auto mb-4 w-12 h-12 text-gray-400" />
                    <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Aucun trajet créé</h3>
                    <p className="mb-4 text-gray-600 dark:text-gray-400">
                      Vous n'avez pas encore créé de trajet. Commencez par créer votre premier trajet.
                    </p>
                    <button
                      onClick={handleCreateRide}
                      className="flex gap-2 items-center px-6 py-3 mx-auto font-medium text-white bg-blue-500 rounded-lg transition hover:bg-blue-600"
                    >
                      <Plus className="w-5 h-5" />
                      Créer mon premier trajet
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'ride-requests' && (
              <div className="space-y-6 ride-requests-section">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Demandes de course</h3>
                  <div className="flex gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      En attente: {stats.pendingRideRequests} • Total: {rideRequests.length}
                    </span>
                  </div>
                </div>

                {rideRequests.length > 0 ? (
                  <div className="space-y-4">
                    {rideRequests
                      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                      .map((request) => (
                        <div key={request.id} className="p-6 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <div className="flex gap-3 items-center mb-2">
                                <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                                  Demande de {request.passenger.firstName} {request.passenger.lastName}
                                </h4>
                                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                                  request.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                                  request.status === 'ACCEPTED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                                  request.status === 'REJECTED' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                                  'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                                }`}>
                                  {request.status === 'PENDING' ? 'En attente' :
                                   request.status === 'ACCEPTED' ? 'Acceptée' :
                                   request.status === 'REJECTED' ? 'Refusée' :
                                   request.status}
                                </span>
                              </div>
                              
                              <div className="grid gap-4 mb-4 md:grid-cols-2">
                                <div>
                                  <h5 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Trajet</h5>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {request.ride.origin} → {request.ride.destination}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Départ: {new Date(request.ride.departureTime).toLocaleDateString('fr-FR', {
                                      weekday: 'short',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                                <div>
                                  <h5 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Détails</h5>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {request.requestedSeats} place(s) demandée(s)
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Contact: {request.passenger.email}
                                  </p>
                                </div>
                              </div>
                              
                              {request.message && (
                                <div className="p-3 mb-4 bg-gray-50 rounded-lg dark:bg-gray-700">
                                  <h5 className="mb-1 text-sm font-medium text-gray-900 dark:text-white">Message:</h5>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{request.message}</p>
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                €{request.price}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Prix estimé
                              </p>
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-200 dark:border-gray-600">
                            <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <span>Demande envoyée le {new Date(request.createdAt).toLocaleDateString('fr-FR', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}</span>
                              {request.acceptedAt && (
                                <span className="text-green-600 dark:text-green-400">
                                  Acceptée le {new Date(request.acceptedAt).toLocaleDateString('fr-FR')}
                                </span>
                              )}
                            </div>
                            <div className="flex gap-2">
                              {request.status === 'PENDING' && (
                                <>
                                  <button
                                    onClick={() => handleRideRequest(request.id, 'ACCEPT')}
                                    className="flex gap-1 items-center px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-lg transition hover:bg-green-600"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Accepter
                                  </button>
                                  <button
                                    onClick={() => handleRideRequest(request.id, 'REJECT')}
                                    className="flex gap-1 items-center px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg transition hover:bg-red-600"
                                  >
                                    <X className="w-4 h-4" />
                                    Refuser
                                  </button>
                                </>
                              )}
                              {request.status === 'ACCEPTED' && (
                                <button
                                  onClick={() => {
                                    // Ouvrir la messagerie avec ce passager
                                    setSelectedConversation(request.passenger);
                                    setActiveTab('messages');
                                  }}
                                  className="flex gap-1 items-center px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg transition hover:bg-blue-600"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                  Contacter le passager
                                </button>
                              )}
                              {request.status === 'REJECTED' && (
                                <span className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                                  Demande refusée
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Users className="mx-auto mb-4 w-12 h-12 text-gray-400" />
                    <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Aucune demande de course</h3>
                    <p className="mb-4 text-gray-600 dark:text-gray-400">
                      Les demandes de course des passagers apparaîtront ici quand vous aurez des trajets publiés.
                    </p>
                    <button
                      onClick={handleCreateRide}
                      className="flex gap-2 items-center px-6 py-3 mx-auto font-medium text-white bg-blue-500 rounded-lg transition hover:bg-blue-600"
                    >
                      <Plus className="w-5 h-5" />
                      Créer un trajet
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'deliveries' && (
              <div className="space-y-6 deliveries-section">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Mes Livraisons</h3>
                  <div className="flex gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Actives: {stats.activeDeliveries} • Terminées: {stats.completedDeliveries}
                    </span>
                  </div>
                </div>

                {deliveries.length > 0 ? (
                  <div className="space-y-4">
                    {deliveries.map((delivery) => {
                      const statusConfig = getStatusConfig(delivery.status);
                      return (
                        <div key={delivery.id} className="p-6 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <div className="flex gap-3 items-center mb-2">
                                <h4 className="text-lg font-medium text-gray-900 dark:text-white">{delivery.title}</h4>
                                <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.darkBg} ${statusConfig.darkText}`}>
                                  {statusConfig.text}
                                </span>
                                {delivery.isMultiSegment && (
                                  <span className="px-2 py-1 text-xs font-medium text-purple-800 bg-purple-100 rounded-full dark:bg-purple-900 dark:text-purple-300">
                                    Segment {delivery.segmentNumber}/{delivery.totalSegments}
                                  </span>
                                )}
                              </div>
                              
                              {/* Indicateur de progression des étapes */}
                              <div className="mb-4">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progression de la livraison</span>
                                  <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {delivery.status === 'CONFIRMED' || delivery.status === 'ACCEPTED_BY_SENDER' ? '1/3' :
                                     delivery.status === 'ACCEPTED_BY_CARRIER' ? '2/3' :
                                     delivery.status === 'IN_TRANSIT' ? '2/3' :
                                     delivery.status === 'DELIVERED' ? '3/3' : '0/3'}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {/* Étape 1: Pris en charge */}
                                  <div className="flex items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                      ['CONFIRMED', 'ACCEPTED_BY_SENDER', 'ACCEPTED_BY_CARRIER', 'IN_TRANSIT', 'DELIVERED'].includes(delivery.status)
                                        ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                                    }`}>
                                      <CheckCircle className="w-4 h-4" />
                                    </div>
                                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Pris en charge</span>
                                  </div>
                                  
                                  {/* Ligne de progression */}
                                  <div className={`flex-1 h-0.5 ${
                                    ['ACCEPTED_BY_CARRIER', 'IN_TRANSIT', 'DELIVERED'].includes(delivery.status)
                                      ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-600'
                                  }`}></div>
                                  
                                  {/* Étape 2: En transit */}
                                  <div className="flex items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                      ['IN_TRANSIT', 'DELIVERED'].includes(delivery.status)
                                        ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                                    }`}>
                                      <Truck className="w-4 h-4" />
                                    </div>
                                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">En transit</span>
                                  </div>
                                  
                                  {/* Ligne de progression */}
                                  <div className={`flex-1 h-0.5 ${
                                    delivery.status === 'DELIVERED' ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600'
                                  }`}></div>
                                  
                                  {/* Étape 3: Livré */}
                                  <div className="flex items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                      delivery.status === 'DELIVERED'
                                        ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                                    }`}>
                                      <CheckCircle className="w-4 h-4" />
                                    </div>
                                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Livré</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                  <h5 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Enlèvement</h5>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{delivery.fromAddress}</p>
                                </div>
                                <div>
                                  <h5 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Livraison</h5>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{delivery.toAddress}</p>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                €{delivery.price}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {delivery.weight} kg
                              </p>
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-200 dark:border-gray-600">
                            <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <span>Client: {delivery.senderName}</span>
                              <span>Accepté le {new Date(delivery.acceptedAt || delivery.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleViewDelivery(delivery)}
                                className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300"
                              >
                                <Eye className="w-4 h-4" />
                                Voir détails
                              </button>
                              
                              <button
                                onClick={() => window.open(`/delivery-tracking?packageId=${getPackageId(delivery)}`, '_blank')}
                                className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                                title="Voir le suivi client"
                              >
                                <Navigation className="w-4 h-4" />
                                Suivi client
                              </button>
                              
                              {/* Actions selon l'état de la livraison */}
                              {(delivery.status === 'CONFIRMED' || delivery.status === 'ACCEPTED_BY_SENDER') && (
                                <button
                                  onClick={() => updateDeliveryStatus(delivery, 'ACCEPTED_BY_CARRIER')}
                                  className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Prendre en charge
                                </button>
                              )}
                              
                              {delivery.status === 'ACCEPTED_BY_CARRIER' && (
                                <button
                                  onClick={() => updateDeliveryStatus(delivery, 'IN_TRANSIT')}
                                  className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300"
                                >
                                  <Truck className="w-4 h-4" />
                                  Démarrer transport
                                </button>
                              )}
                              
                              {delivery.status === 'IN_TRANSIT' && (
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => updateDeliveryStatus(delivery, 'DELIVERED')}
                                    className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Marquer comme livré
                                  </button>
                                  <button
                                    onClick={() => handleCreateRelay(delivery)}
                                    className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                                  >
                                    <Navigation className="w-4 h-4" />
                                    Créer relais
                                  </button>
                                </div>
                              )}
                              
                              {delivery.status === 'DELIVERED' && (
                                <div className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-green-600 dark:text-green-400">
                                  <CheckCircle className="w-4 h-4" />
                                  Livraison terminée
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Package className="mx-auto mb-4 w-12 h-12 text-gray-400" />
                    <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Aucune livraison</h3>
                    <p className="mb-4 text-gray-600 dark:text-gray-400">
                      Les livraisons que vous acceptez apparaîtront ici.
                    </p>
                    <button
                      onClick={handleCreateRide}
                      className="flex gap-2 items-center px-6 py-3 mx-auto font-medium text-white bg-blue-500 rounded-lg transition hover:bg-blue-600"
                    >
                      <Plus className="w-5 h-5" />
                      Créer un trajet pour recevoir des propositions
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'relays' && (
              <div className="space-y-6 relay-section">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Système de Relais</h3>
                  <div className="flex gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Propositions: {relayProposals.length} • Relais actifs: {stats.activeRelays}
                    </span>
                  </div>
                </div>

                {/* Propositions de relais */}
                {relayProposals.length > 0 && (
                  <div>
                    <h4 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">Propositions de relais</h4>
                    <div className="space-y-4">
                      {relayProposals.map((proposal) => (
                        <div key={proposal.id} className="p-6 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <h5 className="text-lg font-medium text-gray-900 dark:text-white">{proposal.packageTitle}</h5>
                              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                Transporteur actuel: {proposal.currentCarrierName}
                              </p>
                              <div className="grid gap-4 mt-3 md:grid-cols-2">
                                <div>
                                  <h6 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Point de récupération</h6>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{proposal.pickupLocation}</p>
                                </div>
                                <div>
                                  <h6 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Destination finale</h6>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{proposal.dropoffLocation}</p>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                €{proposal.proposedPrice}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {proposal.estimatedDistance} km
                              </p>
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-200 dark:border-gray-600">
                            <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <span>Code de transfert: {proposal.transferCode}</span>
                              <span>Proposé le {new Date(proposal.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => acceptRelayProposal(proposal.id)}
                                className="flex gap-1 items-center px-4 py-2 text-sm font-medium text-white bg-purple-500 rounded-lg transition hover:bg-purple-600"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Accepter le relais
                              </button>
                              <button
                                className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                              >
                                <Eye className="w-4 h-4" />
                                Voir détails
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Relais actifs */}
                {stats.activeRelays > 0 && (
                  <div>
                    <h4 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">Relais en cours</h4>
                    <div className="space-y-4">
                      {deliveries.filter(d => ['AWAITING_RELAY', 'RELAY_IN_PROGRESS'].includes(d.status)).map((relay) => {
                        const statusConfig = getStatusConfig(relay.status);
                        return (
                          <div key={relay.id} className="p-6 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex-1">
                                <div className="flex gap-3 items-center mb-2">
                                  <h5 className="text-lg font-medium text-gray-900 dark:text-white">{relay.title}</h5>
                                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.darkBg} ${statusConfig.darkText}`}>
                                    {statusConfig.text}
                                  </span>
                                  <span className="px-2 py-1 text-xs font-medium text-purple-800 bg-purple-100 rounded-full dark:bg-purple-900 dark:text-purple-300">
                                    Segment {relay.segmentNumber}/{relay.totalSegments}
                                  </span>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                  <div>
                                    <h6 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Position actuelle</h6>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{relay.currentLocation}</p>
                                  </div>
                                  <div>
                                    <h6 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Destination finale</h6>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{relay.finalDestination}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                  €{relay.price}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {relay.weight} kg
                                </p>
                              </div>
                            </div>

                            <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-200 dark:border-gray-600">
                              <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                                <span>Client: {relay.senderName}</span>
                                <span>Prochaine étape: {relay.nextLocation}</span>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleViewDelivery(relay)}
                                  className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                                >
                                  <Eye className="w-4 h-4" />
                                  Voir détails
                                </button>
                                {relay.status === 'RELAY_IN_PROGRESS' && (
                                  <button
                                    onClick={() => handleCreateRelay(relay)}
                                    className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                                  >
                                    <Navigation className="w-4 h-4" />
                                    Créer nouveau relais
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {relayProposals.length === 0 && stats.activeRelays === 0 && (
                  <div className="p-8 text-center">
                    <Navigation className="mx-auto mb-4 w-12 h-12 text-gray-400" />
                    <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Aucun relais actif</h3>
                    <p className="mb-4 text-gray-600 dark:text-gray-400">
                      Les propositions de relais et vos relais actifs apparaîtront ici.
                    </p>
                    <button
                      onClick={handleCreateRide}
                      className="flex gap-2 items-center px-6 py-3 mx-auto font-medium text-white bg-purple-500 rounded-lg transition hover:bg-purple-600"
                    >
                      <Plus className="w-5 h-5" />
                      Créer un trajet pour recevoir des relais
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'earnings' && (
              <div className="space-y-6 earnings-section">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Gains</h3>
                
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="p-6 text-center bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Gains totaux</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">€{stats.totalEarnings.toFixed(2)}</p>
                  </div>
                  <div className="p-6 text-center bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ce mois</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">€{earnings.month.toFixed(2)}</p>
                  </div>
                  <div className="p-6 text-center bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Moyenne par livraison</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      €{stats.completedDeliveries > 0 ? (stats.totalEarnings / stats.completedDeliveries).toFixed(2) : '0.00'}
                    </p>
                  </div>
                </div>

                {/* Historique des gains */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                          Date
                        </th>
                        <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                          Type
                        </th>
                        <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                          Description
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
                      {deliveries.filter(d => d.status === 'DELIVERED').map((delivery) => (
                        <tr key={delivery.id}>
                          <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                            {new Date(delivery.completedAt || delivery.updatedAt).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                              {delivery.isMultiSegment ? 'Relais' : 'Livraison'}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                            {delivery.title}
                          </td>
                          <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
                            €{delivery.price}
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full dark:bg-green-900 dark:text-green-300">
                              Payé
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6 reviews-section">
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
                              <strong>Livraison:</strong> {review.deliveryTitle}
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
                      Les avis de vos clients apparaîtront ici après la completion de vos livraisons.
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

                    <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-800">
                      <h4 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
                        Fonctionnalités incluses
                      </h4>
                      <div className="space-y-2">
                        {[
                          'Trajets illimités',
                          'Annonces de livraison',
                          'Gestion des relais',
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
                      Débloquez toutes les fonctionnalités d'ecodeli pour développer votre activité de transport. 
                      Créez des trajets, publiez des annonces et accédez aux outils avancés.
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
                                  notification.type === 'MATCH_PROPOSED' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                                  notification.type === 'MATCH_UPDATE' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                                  notification.type === 'DELIVERY_ASSIGNED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                                  notification.type === 'RELAY_REQUEST' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' :
                                  notification.type === 'RIDE_REQUEST' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                                  'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                                }`}>
                                  {notification.type === 'MATCH_PROPOSED' ? 'Proposition' :
                                   notification.type === 'MATCH_UPDATE' ? 'Accepté' :
                                   notification.type === 'DELIVERY_ASSIGNED' ? 'Livraison' :
                                   notification.type === 'RELAY_REQUEST' ? 'Relais' :
                                   notification.type === 'RIDE_REQUEST' ? 'Demande course' :
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
                            {notification.type === 'MATCH_PROPOSED' && !notification.isRead && (
                              <button
                                onClick={() => {
                                  markNotificationAsRead(notification.id);
                                  setActiveTab('deliveries');
                                }}
                                className="px-3 py-1 text-sm font-medium text-white bg-blue-500 rounded-lg transition hover:bg-blue-600"
                              >
                                Voir proposition
                              </button>
                            )}
                            {notification.type === 'MATCH_UPDATE' && !notification.isRead && (
                              <button
                                onClick={() => {
                                  markNotificationAsRead(notification.id);
                                  setActiveTab('deliveries');
                                }}
                                className="px-3 py-1 text-sm font-medium text-white bg-green-500 rounded-lg transition hover:bg-green-600"
                              >
                                Voir livraison
                              </button>
                            )}
                            {notification.type === 'RELAY_REQUEST' && !notification.isRead && (
                              <button
                                onClick={() => {
                                  markNotificationAsRead(notification.id);
                                  setActiveTab('relays');
                                }}
                                className="px-3 py-1 text-sm font-medium text-white bg-purple-500 rounded-lg transition hover:bg-purple-600"
                              >
                                Voir relais
                              </button>
                            )}
                            {notification.type === 'RIDE_REQUEST' && !notification.isRead && (
                              <button
                                onClick={() => {
                                  markNotificationAsRead(notification.id);
                                  setActiveTab('ride-requests');
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
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Messages</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
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
                            <p className="mt-1 text-xs">Les clients vous contacteront via vos livraisons</p>
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
                      Les conversations avec vos clients apparaîtront ici quand vous accepterez des livraisons.
                    </p>
                    <button
                      onClick={handleCreateRide}
                      className="inline-block px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg transition hover:bg-blue-600"
                    >
                      Créer un trajet
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal RelayManager */}
      {isRelayModalOpen && selectedDelivery && (
        <RelayManager
          isOpen={isRelayModalOpen}
          onClose={() => {
            setIsRelayModalOpen(false);
            setSelectedDelivery(null);
          }}
          packageId={selectedDelivery.id}
          onRelayCreated={() => {
            setIsRelayModalOpen(false);
            setSelectedDelivery(null);
            refreshData();
          }}
        />
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

      {/* Modal Vehicle Type */}
      <VehicleTypeModal
        isOpen={showVehicleTypeModal}
        onClose={() => {}} // Prevent closing without selection
        onSave={handleVehicleTypeSaved}
        currentVehicleType={user?.vehicleType || ''}
      />
    </div>
  );
}