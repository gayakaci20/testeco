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
  ShoppingCart,
  AlertCircle,
  Car
} from 'lucide-react';

export default function CustomerDashboard({ isDarkMode, toggleDarkMode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Tutoriel
  const { showTutorial, completeTutorial, forceTutorial } = useTutorial(user?.role);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [packages, setPackages] = useState([]);
  const [orders, setOrders] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({});
  const [storageBoxes, setStorageBoxes] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [spendingTotals, setSpendingTotals] = useState({ today: 0, month: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);

  // Messages state
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // États pour les demandes de trajets du customer
  const [myRideRequests, setMyRideRequests] = useState([]);
  const [rideRequestsLoading, setRideRequestsLoading] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'CUSTOMER')) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchDashboardData();
    }
  }, [user, loading]); // Retirer router de la dépendance

  // Effet séparé pour gérer le message de succès
  useEffect(() => {
    // Vérifier si un package vient d'être créé
    if (router.query.packageCreated) {
      setShowSuccessMessage(true);
      // Rafraîchir les données du dashboard
      fetchDashboardData();
      // Effacer le paramètre de l'URL après 3 secondes
      setTimeout(() => {
        setShowSuccessMessage(false);
        router.replace('/dashboard/customer', undefined, { shallow: true });
      }, 5000);
    }
    
    // Vérifier si un paiement vient d'être effectué
    if (router.query.paymentSuccess) {
      // Rafraîchir les données du dashboard plusieurs fois pour s'assurer que les changements sont visibles
      fetchDashboardData();
      setTimeout(() => fetchDashboardData(), 2000);
      setTimeout(() => fetchDashboardData(), 5000);
      // Effacer le paramètre de l'URL
      setTimeout(() => {
        router.replace('/dashboard/customer', undefined, { shallow: true });
      }, 3000);
    }
  }, [router.query.packageCreated, router.query.paymentSuccess, router]); // Ajouter router à la dépendance

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
      const response = await fetch(`/api/dashboard/customer?_t=${timestamp}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Dashboard data received:', {
          packages: data.packages?.length || 0,
          services: data.availableServices?.length || 0,
          bookings: data.recentBookings?.length || 0,
          payments: data.payments?.length || 0,
          storageBoxes: data.storageBoxes?.length || 0
        });
        
        setServices(data.availableServices || []);
        setBookings(data.recentBookings || []);
        setPayments(data.payments || []); // Changed to use the payments array
        setPackages(data.packages || []);
        setDashboardStats(data.stats || {});
        setStorageBoxes(data.storageBoxes || []);
        setNotifications(data.notifications || [] );
        setSpendingTotals(data.spending || { today: 0, month: 0, total: 0 });
        
        // Log notifications for debugging
        console.log('🔔 Notifications received:', data.notifications?.map(n => ({
          id: n.id,
          type: n.type,
          title: n.title,
          isRead: n.isRead,
          relatedEntityId: n.relatedEntityId
        })) || []);
        
        // Log packages specifically for debugging
        if (data.packages && data.packages.length > 0) {
          console.log('📦 Packages found:', data.packages.map(pkg => ({
            id: pkg.id,
            title: pkg.title,
            status: pkg.status,
            createdAt: pkg.createdAt,
            matches: pkg.matches?.map(m => ({
              id: m.id,
              status: m.status,
              proposedPrice: m.proposedPrice
            })) || []
          })));
        } else {
          console.log('❌ No packages found in dashboard data');
        }
      } else {
        console.error('❌ Dashboard API error:', response.status, response.statusText);
      }

      // Fetch notifications separately
      const notificationsRes = await fetch(`/api/notifications?limit=5&_t=${timestamp}`);
      if (notificationsRes.ok) {
        const notificationsData = await notificationsRes.json();
        setNotifications(notificationsData.notifications || []);
      }

      // Fetch customer orders
      const ordersRes = await fetch(`/api/customer-orders?_t=${timestamp}`, {
        credentials: 'include'
      });
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData || []);
      }

    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };



  // Nouvelle fonction pour récupérer les demandes de trajets du customer
  const fetchMyRideRequests = async () => {
    if (!user?.id) {
      console.log('❌ No user ID for fetchMyRideRequests');
      return;
    }
    
    try {
      setRideRequestsLoading(true);
      console.log('🚗 Fetching my ride requests...');
      
      // Récupérer toutes les demandes de trajets de l'utilisateur (en tant que passager)
      const response = await fetch('/api/ride-requests');
      
      if (response.ok) {
        const data = await response.json();
        
        // Filtrer pour ne garder que les demandes où l'utilisateur est le passager
        const myRequests = data.rideRequests.filter(request => 
          request.passengerId === user.id
        );
        
        console.log('✅ My ride requests fetched:', myRequests.length, 'requests');
        setMyRideRequests(myRequests);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error fetching ride requests:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
      }
    } catch (error) {
      console.error('❌ Network error fetching ride requests:', error);
    } finally {
      setRideRequestsLoading(false);
    }
  };

  // Messages functions
  const fetchConversations = async () => {
    if (!user?.id) {
      console.log('❌ No user ID for fetchConversations');
      return;
    }
    
    try {
      setMessagesLoading(true);
      console.log('📱 Fetching conversations for user:', user.id);
      
      const response = await fetch('/api/conversations', {
        headers: {
          'x-user-id': user.id
        }
      });
      
      console.log('📥 Conversations response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Conversations fetched:', data?.length || 0, 'conversations');
        console.log('📊 Conversations data:', data);
        setConversations(data || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error fetching conversations:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
      }
    } catch (error) {
      console.error('❌ Network error fetching conversations:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const fetchMessages = async (partnerId) => {
    if (!user?.id) {
      console.log('❌ No user ID for fetchMessages');
      return;
    }
    
    try {
      console.log('💬 Fetching messages with partner:', partnerId);
      
      const response = await fetch(`/api/messages?conversationWith=${partnerId}`, {
        headers: {
          'x-user-id': user.id
        }
      });
      
      console.log('📥 Messages response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Messages fetched:', data?.length || 0, 'messages');
        setMessages(data || []);
        
        // Mark conversation as read
        markConversationAsRead(partnerId);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error fetching messages:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
      }
    } catch (error) {
      console.error('❌ Network error fetching messages:', error);
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
      console.log('❌ Send message validation failed:', {
        hasMessage: !!newMessage.trim(),
        hasConversation: !!selectedConversation,
        isSending: sendingMessage,
        hasUser: !!user?.id
      });
      return;
    }

    try {
      setSendingMessage(true);
      
      console.log('📤 Sending message:', {
        receiverId: selectedConversation.id,
        content: newMessage.trim(),
        userId: user.id
      });
      
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

      console.log('📥 Response status:', response.status);
      
      if (response.ok) {
        const newMsg = await response.json();
        console.log('✅ Message sent successfully:', newMsg);
        
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
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error sending message:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        
        // Show error message to user
        alert(`Erreur lors de l'envoi du message: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Network error sending message:', error);
      alert('Erreur de connexion. Veuillez réessayer.');
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
      console.log('📱 Fetching conversations for user:', user.id);
      fetchConversations();
    }
  }, [activeTab, user?.id]);

  // Fetch messages when conversation is selected
  useEffect(() => {
    if (selectedConversation && user?.id) {
      console.log('💬 Fetching messages for conversation:', selectedConversation.id);
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation, user?.id]);

  const handleBookService = (serviceId) => {
    router.push(`/services/book/${serviceId}`);
  };

  const handleRentBox = (boxId) => {
    router.push(`/storage/rent/${boxId}`);
  };

  const handleViewPackageDetails = (pkg) => {
    setSelectedPackage(pkg);
    setIsPackageModalOpen(true);
  };

  const closePackageModal = () => {
    setIsPackageModalOpen(false);
    setSelectedPackage(null);
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

  // Fetch rides when rides tab is selected
  useEffect(() => {
    if (activeTab === 'rides' && user?.id) {
      console.log('🚗 Fetching my ride requests for user:', user.id);
      fetchMyRideRequests();
    }
  }, [activeTab, user?.id]);

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
    totalBookings: bookings.length,
    activeBookings: bookings.filter(b => ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status)).length,
    completedBookings: bookings.filter(b => b.status === 'COMPLETED').length,
    totalSpent: spendingTotals.total || 0,
    totalPackages: dashboardStats.totalPackages || packages.length,
    activePackages: dashboardStats.activePackages || 0,
    pendingPackages: dashboardStats.pendingPackages || 0,
    deliveredPackages: dashboardStats.deliveredPackages || 0
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Head>
        <title>Tableau de Bord Client - ecodeli</title>
        <meta name="description" content="Gérez vos services et réservations" />
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
                Gérez vos services et réservations
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/exp')}
                className="flex gap-2 items-center px-6 py-2 font-medium text-white bg-green-500 rounded-full transition hover:bg-green-600 create-package-btn"
              >
                <Package className="w-4 h-4" />
                Créer un colis
              </button>
              <button
                onClick={() => router.push('/services/browse')}
                className="flex gap-2 items-center px-6 py-2 font-medium text-white bg-sky-400 rounded-full transition hover:bg-sky-500"
              >
                <Search className="w-4 h-4" />
                Parcourir les services
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
                  Colis créé avec succès !
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Votre colis a été enregistré et sera bientôt traité par nos partenaires.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

                        {/* Notifications importantes */}
      {notifications.filter(n => !n.isRead && ['MATCH_UPDATE', 'MATCH_ACCEPTED', 'PAYMENT_SUCCESS', 'PAYMENT_REQUIRED', 'BOOKING_CONFIRMED', 'RENTAL_CONFIRMED'].includes(n.type)).length > 0 && (
        <div className="px-6 mx-auto max-w-7xl">
          <div className="mb-6 space-y-3">
            {notifications
              .filter(n => !n.isRead && ['MATCH_UPDATE', 'MATCH_ACCEPTED', 'PAYMENT_SUCCESS', 'PAYMENT_REQUIRED', 'BOOKING_CONFIRMED', 'RENTAL_CONFIRMED'].includes(n.type))
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
                      {/* Notification de paiement requis */}
                      {notification.type === 'PAYMENT_REQUIRED' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              // Marquer comme lu et rediriger vers le paiement
                              markNotificationAsRead(notification.id);
                              const redirectUrl = notification.data?.redirectUrl || `/payments/process?matchId=${notification.relatedEntityId}`;
                              router.push(redirectUrl);
                            }}
                            className="px-3 py-1 text-sm font-medium text-white bg-green-500 rounded-lg transition hover:bg-green-600"
                          >
                            💳 Procéder au paiement
                          </button>
                          <button
                            onClick={() => {
                              // Marquer comme lu
                              markNotificationAsRead(notification.id);
                            }}
                            className="px-3 py-1 text-sm font-medium text-white bg-gray-500 rounded-lg transition hover:bg-gray-600"
                          >
                            Plus tard
                          </button>
                        </div>
                      )}
                      
                      {/* Notification de match update */}
                      {notification.type === 'MATCH_UPDATE' && (
                        <div className="flex gap-2">
                          {/* Check if this is a priority/automatic match */}
                          {(() => {
                            let notificationData = null;
                            try {
                              notificationData = notification.data ? JSON.parse(notification.data) : null;
                            } catch (e) {
                              console.error('Error parsing notification data:', e);
                            }
                            
                            const isPriority = notificationData?.priority || notificationData?.canPayNow;
                            
                            if (isPriority) {
                              return (
                                <>
                                  <button
                                    onClick={() => {
                                      markNotificationAsRead(notification.id);
                                      if (notification.relatedEntityId) {
                                        router.push(`/payments/process?matchId=${notification.relatedEntityId}&type=priority`);
                                      }
                                    }}
                                    className="flex gap-1 items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg transition-all animate-pulse transform hover:scale-105 hover:from-green-600 hover:to-green-700"
                                  >
                                    <span>⚡</span>
                                    Payer maintenant (Priorité transporteurs)
                                  </button>
                                  <button
                                    onClick={() => {
                                      markNotificationAsRead(notification.id);
                                      setActiveTab('packages');
                                    }}
                                    className="px-3 py-1 text-sm font-medium text-blue-600 rounded-lg border border-blue-600 transition hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                  >
                                    Voir détails
                                  </button>
                                </>
                              );
                            } else {
                              return (
                                <>
                                  <button
                                    onClick={() => {
                                      markNotificationAsRead(notification.id);
                                      if (notification.relatedEntityId) {
                                        router.push(`/payments/process?matchId=${notification.relatedEntityId}`);
                                      }
                                    }}
                                    className="px-3 py-1 text-sm font-medium text-white bg-green-500 rounded-lg transition hover:bg-green-600"
                                  >
                                    Accepter et payer
                                  </button>
                                  <button
                                    onClick={() => {
                                      markNotificationAsRead(notification.id);
                                      router.push('/matches');
                                    }}
                                    className="px-3 py-1 text-sm font-medium text-white bg-blue-500 rounded-lg transition hover:bg-blue-600"
                                  >
                                    Voir la proposition
                                  </button>
                                </>
                              );
                            }
                          })()}
                          <button
                            onClick={async () => {
                              if (confirm('Êtes-vous sûr de vouloir refuser cette proposition ?')) {
                                try {
                                  const response = await fetch('/api/matches', {
                                    method: 'PUT',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      'x-user-id': user?.id || ''
                                    },
                                    body: JSON.stringify({
                                      id: notification.relatedEntityId,
                                      status: 'REJECTED'
                                    })
                                  });
                                  
                                  if (response.ok) {
                                    markNotificationAsRead(notification.id);
                                    alert('Proposition refusée avec succès');
                                    // Rafraîchir les données
                                    fetchDashboardData();
                                  } else {
                                    alert('Erreur lors du refus de la proposition');
                                  }
                                } catch (error) {
                                  console.error('Erreur:', error);
                                  alert('Erreur lors du refus de la proposition');
                                }
                              }
                            }}
                            className="px-3 py-1 text-sm font-medium text-red-600 rounded-lg border border-red-600 transition hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            Refuser
                          </button>
                        </div>
                      )}
                      
                      {/* Notification de réservation confirmée */}
                      {notification.type === 'BOOKING_CONFIRMED' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              // Marquer comme lu et rediriger vers le paiement
                              markNotificationAsRead(notification.id);
                              router.push(`/payments/process?bookingId=${notification.relatedEntityId}`);
                            }}
                            className="px-3 py-1 text-sm font-medium text-white bg-green-500 rounded-lg transition hover:bg-green-600"
                          >
                            💳 Procéder au paiement
                          </button>
                          <button
                            onClick={() => {
                              // Marquer comme lu
                              markNotificationAsRead(notification.id);
                            }}
                            className="px-3 py-1 text-sm font-medium text-white bg-gray-500 rounded-lg transition hover:bg-gray-600"
                          >
                            Plus tard
                          </button>
                        </div>
                      )}
                      
                      {/* Notification de location confirmée */}
                      {notification.type === 'RENTAL_CONFIRMED' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              // Marquer comme lu et rediriger vers le paiement
                              markNotificationAsRead(notification.id);
                              router.push(`/payments/process?rentalId=${notification.relatedEntityId}`);
                            }}
                            className="px-3 py-1 text-sm font-medium text-white bg-green-500 rounded-lg transition hover:bg-green-600"
                          >
                            💳 Procéder au paiement
                          </button>
                          <button
                            onClick={() => {
                              // Marquer comme lu
                              markNotificationAsRead(notification.id);
                            }}
                            className="px-3 py-1 text-sm font-medium text-white bg-gray-500 rounded-lg transition hover:bg-gray-600"
                          >
                            Plus tard
                          </button>
                        </div>
                      )}
                      
                      {/* Bouton par défaut pour les autres types de notifications */}
                      {!['PAYMENT_REQUIRED', 'MATCH_UPDATE', 'BOOKING_CONFIRMED', 'RENTAL_CONFIRMED'].includes(notification.type) && (
                        <button
                          onClick={() => markNotificationAsRead(notification.id)}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          title="Marquer comme lu"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
            ))}
          </div>
        </div>
      )}

      {/* Message d'aide pour les propositions */}
      {packages.some(pkg => pkg.matches && pkg.matches.some(match => ['PROPOSED', 'PENDING'].includes(match.status))) && (
        <div className="px-6 mx-auto max-w-7xl">
          <div className="p-4 mb-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200 dark:from-blue-900/20 dark:to-green-900/20 dark:border-blue-800">
            <div className="flex items-center">
              <AlertCircle className="mr-3 w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Vous avez des propositions de transport
                </h3>
                <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                  <p className="mb-2">
                    <span className="inline-flex items-center px-2 py-0.5 mr-2 text-xs font-medium text-orange-800 bg-orange-100 rounded-full dark:bg-orange-900 dark:text-orange-300">
                      <span className="mr-1 w-2 h-2 bg-orange-500 rounded-full"></span>
                      Nouvelle proposition
                    </span>
                    <strong>Correspondance automatique :</strong> Un transporteur avec un trajet compatible a été trouvé automatiquement. 
                    <strong className="text-green-600 dark:text-green-400"> Payez maintenant pour bénéficier de la priorité transporteur ⚡</strong>
                  </p>
                  <p>
                    <span className="inline-flex items-center px-2 py-0.5 mr-2 text-xs font-medium text-blue-800 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-300">
                      Proposition manuelle
                    </span>
                    <strong>Proposition classique :</strong> Un transporteur a manifesté son intérêt pour votre colis. 
                    Vous pouvez accepter et payer normalement.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="px-6 py-8 mx-auto max-w-7xl">
        {/* Stats Cards */}
        <div className="grid gap-6 mb-8 md:grid-cols-4 overview-section">
          <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Colis totaux</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalPackages}</p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-green-100 rounded-full dark:bg-green-900">
                <Package className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Colis en cours</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activePackages}</p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-sky-100 rounded-full dark:bg-sky-900">
                <Clock className="w-6 h-6 text-sky-600 dark:text-sky-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Livrés</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.deliveredPackages}</p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-green-100 rounded-full dark:bg-green-900">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total dépensé</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">€{stats.totalSpent.toFixed(2)}</p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-sky-100 rounded-full dark:bg-sky-900">
                <DollarSign className="w-6 h-6 text-sky-600 dark:text-sky-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex justify-center px-6 -mb-px space-x-8">
              {[
                { id: 'overview', name: 'Aperçu', icon: TrendingUp },
                { id: 'packages', name: 'Mes Colis', icon: Package },
                { id: 'rides', name: 'Mes Trajets', icon: Car, badge: myRideRequests.filter(r => r.status === 'PENDING').length },
                { id: 'orders', name: 'Mes Commandes', icon: ShoppingCart },
                { id: 'bookings', name: 'Mes Réservations', icon: Calendar },
                { id: 'notifications', name: 'Notifications', icon: Clock, badge: notifications.filter(n => !n.isRead).length },
                { id: 'payments', name: 'Historique Paiements', icon: DollarSign },
                { id: 'messages', name: 'Messages', icon: MessageCircle, badge: conversations.filter(c => c.unreadCount > 0).length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition ${tab.id}-tab ${
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
                
                <div className="grid gap-6 lg:grid-cols-2">
                  <div>
                    <h4 className="mb-4 font-medium text-gray-900 dark:text-white">Colis récents</h4>
                    {packages.slice(0, 3).length > 0 ? (
                      <div className="space-y-3">
                        {packages.slice(0, 3).map((pkg) => (
                          <div key={pkg.id} className="flex justify-between items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{pkg.title}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{new Date(pkg.createdAt).toLocaleDateString()}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              pkg.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                              pkg.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                              pkg.status === 'DELIVERED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                            }`}>
                              {pkg.status === 'PENDING' ? 'En attente' :
                               pkg.status === 'CONFIRMED' ? 'Confirmé' :
                               pkg.status === 'DELIVERED' ? 'Livré' : pkg.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400">Aucun colis récent</p>
                    )}
                  </div>

                  <div>
                    <h4 className="mb-4 font-medium text-gray-900 dark:text-white">Notifications</h4>
                    {notifications.length > 0 ? (
                      <div className="space-y-3">
                        {notifications.map((notification) => (
                          <div key={notification.id} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                            <p className="text-sm text-gray-900 dark:text-white">{notification.message}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {new Date(notification.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400">Aucune notification</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'rides' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Mes Trajets</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fetchMyRideRequests()}
                      className="flex gap-1 items-center px-3 py-2 text-sm text-gray-600 transition-colors dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                      title="Rafraîchir les trajets"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Actualiser
                    </button>
                    <button
                      onClick={() => router.push('/trajet')}
                      className="flex gap-2 items-center px-4 py-2 font-medium text-white bg-blue-500 rounded-lg transition hover:bg-blue-600"
                    >
                      <Search className="w-4 h-4" />
                      Rechercher des trajets
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                  <div className="flex items-center">
                    <svg className="mr-3 w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Vos demandes de trajets
                      </h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Ici vous trouvez toutes vos demandes de trajets passées et en cours. Vous pouvez suivre leur statut et communiquer avec les transporteurs.
                      </p>
                    </div>
                  </div>
                </div>

                {rideRequestsLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="text-center">
                      <div className="mx-auto w-8 h-8 rounded-full border-4 border-blue-400 animate-spin border-t-transparent"></div>
                      <p className="mt-2 text-gray-600 dark:text-gray-300">Chargement de vos trajets...</p>
                    </div>
                  </div>
                ) : myRideRequests.length > 0 ? (
                  <div className="space-y-4">
                    {myRideRequests.map((request) => (
                      <div key={request.id} className="p-6 bg-white rounded-lg border border-gray-200 transition-shadow dark:bg-gray-800 dark:border-gray-700 hover:shadow-md">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex gap-2 items-center mb-3">
                              <div className="flex items-center space-x-2 text-lg font-semibold text-gray-900 dark:text-white">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">
                                  <svg className="mr-1 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                  Transporteur: {request.carrier.firstName} {request.carrier.lastName}
                                </span>
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                  request.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                                  request.status === 'ACCEPTED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 animate-pulse' :
                                  request.status === 'REJECTED' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                                  request.status === 'CANCELLED' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' :
                                  request.status === 'PAID' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                                  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                }`}>
                                  {request.status === 'PENDING' ? 'En attente' :
                                   request.status === 'ACCEPTED' ? 'Acceptée - Paiement requis' :
                                   request.status === 'REJECTED' ? 'Refusée' :
                                   request.status === 'CANCELLED' ? 'Annulée' :
                                   request.status === 'PAID' ? 'Payée - Confirmée' :
                                   request.status}
                                </span>
                              </div>
                            </div>
                            
                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                  <svg className="mr-2 w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  <span><strong>Trajet:</strong> {request.ride.origin} → {request.ride.destination}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                  <svg className="mr-2 w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  <span><strong>Départ:</strong> {request.pickupLocation}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                  <svg className="mr-2 w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  <span><strong>Arrivée:</strong> {request.dropoffLocation}</span>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                  <svg className="mr-2 w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span><strong>Heure de départ:</strong> {new Date(request.ride.departureTime).toLocaleDateString('fr-FR', {
                                    weekday: 'short',
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                  <svg className="mr-2 w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                  </svg>
                                  <span><strong>Places demandées:</strong> {request.requestedSeats}</span>
                                </div>
                                {request.price && (
                                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                    <svg className="mr-2 w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                    <span><strong>Prix:</strong> {request.price}€</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {request.message && (
                              <div className="mt-3">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  <strong>Message:</strong> {request.message}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-600">
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                            <span>Demandé le {new Date(request.createdAt).toLocaleDateString('fr-FR')}</span>
                            {request.acceptedAt && (
                              <span className="ml-4">Accepté le {new Date(request.acceptedAt).toLocaleDateString('fr-FR')}</span>
                            )}
                            {request.rejectedAt && (
                              <span className="ml-4">Refusé le {new Date(request.rejectedAt).toLocaleDateString('fr-FR')}</span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {request.status === 'ACCEPTED' && (
                              <>
                                <button
                                  onClick={() => {
                                    router.push(`/payments/process?rideRequestId=${request.id}`);
                                  }}
                                  className="flex gap-1 items-center px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-lg transition animate-pulse hover:bg-green-600"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                  </svg>
                                  Payer {request.price}€
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedConversation({
                                      id: request.carrier.id,
                                      firstName: request.carrier.firstName,
                                      lastName: request.carrier.lastName,
                                      email: request.carrier.email
                                    });
                                    setActiveTab('messages');
                                  }}
                                  className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-white bg-blue-500 rounded-lg transition hover:bg-blue-600"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                  Contacter
                                </button>
                              </>
                            )}
                            {request.status === 'PAID' && (
                              <>
                                <div className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-green-600 dark:text-green-400">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Course confirmée
                                </div>
                                <button
                                  onClick={() => {
                                    setSelectedConversation({
                                      id: request.carrier.id,
                                      firstName: request.carrier.firstName,
                                      lastName: request.carrier.lastName,
                                      email: request.carrier.email
                                    });
                                    setActiveTab('messages');
                                  }}
                                  className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-white bg-blue-500 rounded-lg transition hover:bg-blue-600"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                  Contacter
                                </button>
                              </>
                            )}
                            {request.status === 'PENDING' && (
                              <button
                                onClick={async () => {
                                  if (confirm('Êtes-vous sûr de vouloir annuler cette demande ?')) {
                                    try {
                                      const response = await fetch('/api/ride-requests', {
                                        method: 'PUT',
                                        headers: {
                                          'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({
                                          rideRequestId: request.id,
                                          action: 'CANCEL'
                                        })
                                      });
                                      
                                      if (response.ok) {
                                        alert('Demande annulée avec succès');
                                        fetchMyRideRequests(); // Rafraîchir la liste
                                      } else {
                                        alert('Erreur lors de l\'annulation');
                                      }
                                    } catch (error) {
                                      console.error('Erreur:', error);
                                      alert('Erreur lors de l\'annulation');
                                    }
                                  }
                                }}
                                className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-red-600 rounded-lg border border-red-600 transition hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <X className="w-4 h-4" />
                                Annuler
                              </button>
                            )}
                            <button
                              onClick={() => router.push(`/trajet?rideId=${request.ride.id}`)}
                              className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-gray-600 rounded-lg border border-gray-300 transition hover:bg-gray-50 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-700"
                            >
                              <Eye className="w-4 h-4" />
                              Voir détails
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <svg className="mx-auto mb-4 w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V11a1 1 0 011-1h16a1 1 0 011 1v5.382a1 1 0 01-.553.894L15 20M9 20h6m-6 0v-2m6 2v-2" />
                    </svg>
                    <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Aucune demande de trajet</h3>
                    <p className="mb-4 text-gray-600 dark:text-gray-400">
                      Vous n'avez pas encore fait de demande de trajet. Recherchez des trajets disponibles pour commencer.
                    </p>
                    <button
                      onClick={() => router.push('/trajet')}
                      className="flex gap-2 items-center px-6 py-3 mx-auto font-medium text-white bg-blue-500 rounded-lg transition hover:bg-blue-600"
                    >
                      <Search className="w-5 h-5" />
                      Rechercher des trajets
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'packages' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Mes Colis</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fetchDashboardData()}
                      className="flex gap-1 items-center px-3 py-2 text-sm text-gray-600 transition-colors dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                      title="Rafraîchir les données"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Actualiser
                    </button>
                    <button
                      onClick={() => router.push('/exp')}
                      className="flex gap-2 items-center px-4 py-2 font-medium text-white bg-green-500 rounded-lg transition hover:bg-green-600"
                    >
                      <Package className="w-4 h-4" />
                      Créer un nouveau colis
                    </button>
                  </div>
                </div>

                {packages.length > 0 ? (
                  <div className="space-y-4">
                    {packages.map((pkg) => (
                      <div key={pkg.id} className="p-6 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                                                  <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <div className="flex gap-2 items-center mb-2">
                                <h4 className="text-lg font-medium text-gray-900 dark:text-white">{pkg.title}</h4>
                                {/* Indicateur de nouvelle proposition */}
                                {pkg.matches && pkg.matches.some(match => match.status === 'PROPOSED') && (
                                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-orange-800 bg-orange-100 rounded-full animate-pulse dark:bg-orange-900 dark:text-orange-300">
                                    <span className="mr-1 w-2 h-2 bg-orange-500 rounded-full"></span>
                                    Nouvelle proposition
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{pkg.description}</p>
                            </div>
                            <div className="flex gap-2 items-center">
                              <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                pkg.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                                pkg.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                                pkg.status === 'DELIVERED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                                'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                              }`}>
                                {pkg.status === 'PENDING' ? 'En attente' :
                                 pkg.status === 'CONFIRMED' ? 'Confirmé' :
                                 pkg.status === 'DELIVERED' ? 'Livré' : pkg.status}
                              </span>
                              {pkg.price && (
                                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                  €{pkg.price}
                                </span>
                              )}
                            </div>
                          </div>
                        
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <h5 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Adresse d'enlèvement</h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{pkg.fromAddress}</p>
                          </div>
                          <div>
                            <h5 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Adresse de livraison</h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{pkg.toAddress}</p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-200 dark:border-gray-600">
                          <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span>Créé le {new Date(pkg.createdAt).toLocaleDateString()}</span>
                            {pkg.matches && pkg.matches.length > 0 && (
                              <span>{pkg.matches.length} transporteur(s) intéressé(s)</span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {/* Boutons pour accepter ou refuser une proposition si il y en a */}
                            {pkg.matches && pkg.matches.some(match => match.status === 'PROPOSED') && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    const proposedMatch = pkg.matches.find(match => match.status === 'PROPOSED');
                                    if (proposedMatch) {
                                      router.push(`/payments/process?matchId=${proposedMatch.id}&type=priority`);
                                    }
                                  }}
                                  className="flex gap-1 items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg transition-all transform hover:scale-105 hover:from-green-600 hover:to-green-700"
                                >
                                  <span>⚡</span>
                                  Payer maintenant (Priorité transporteurs)
                                </button>
                                <button
                                  onClick={async () => {
                                    if (confirm('Êtes-vous sûr de vouloir refuser cette proposition ?')) {
                                      try {
                                        const proposedMatch = pkg.matches.find(match => match.status === 'PROPOSED');
                                        if (proposedMatch) {
                                          const response = await fetch('/api/matches', {
                                            method: 'PUT',
                                            headers: {
                                              'Content-Type': 'application/json',
                                              'x-user-id': user?.id || ''
                                            },
                                            body: JSON.stringify({
                                              id: proposedMatch.id,
                                              status: 'REJECTED'
                                            })
                                          });
                                          
                                          if (response.ok) {
                                            alert('Proposition refusée avec succès');
                                            // Rafraîchir les données
                                            fetchDashboardData();
                                          } else {
                                            alert('Erreur lors du refus de la proposition');
                                          }
                                        }
                                      } catch (error) {
                                        console.error('Erreur:', error);
                                        alert('Erreur lors du refus de la proposition');
                                      }
                                    }
                                  }}
                                  className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-red-600 rounded-lg border border-red-600 transition hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                  <X className="w-4 h-4" />
                                  Refuser
                                </button>
                              </div>
                            )}
                            {/* Boutons pour accepter ou refuser une proposition manuelle si il y en a */}
                            {pkg.matches && pkg.matches.some(match => match.status === 'PENDING') && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    const proposedMatch = pkg.matches.find(match => match.status === 'PENDING');
                                    if (proposedMatch) {
                                      router.push(`/payments/process?matchId=${proposedMatch.id}`);
                                    }
                                  }}
                                  className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-white bg-green-500 rounded-lg transition hover:bg-green-600"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Accepter
                                </button>
                                <button
                                  onClick={async () => {
                                    if (confirm('Êtes-vous sûr de vouloir refuser cette proposition ?')) {
                                      try {
                                        const proposedMatch = pkg.matches.find(match => match.status === 'PENDING');
                                        if (proposedMatch) {
                                          const response = await fetch('/api/matches', {
                                            method: 'PUT',
                                            headers: {
                                              'Content-Type': 'application/json',
                                              'x-user-id': user?.id || ''
                                            },
                                            body: JSON.stringify({
                                              id: proposedMatch.id,
                                              status: 'REJECTED'
                                            })
                                          });
                                          
                                          if (response.ok) {
                                            alert('Proposition refusée avec succès');
                                            // Rafraîchir les données
                                            fetchDashboardData();
                                          } else {
                                            alert('Erreur lors du refus de la proposition');
                                          }
                                        }
                                      } catch (error) {
                                        console.error('Erreur:', error);
                                        alert('Erreur lors du refus de la proposition');
                                      }
                                    }
                                  }}
                                  className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-red-600 rounded-lg border border-red-600 transition hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                  <X className="w-4 h-4" />
                                  Refuser
                                </button>
                              </div>
                            )}
                            <button
                              onClick={() => handleViewPackageDetails(pkg)}
                              className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300"
                            >
                              <Eye className="w-4 h-4" />
                              Voir détails
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Package className="mx-auto mb-4 w-12 h-12 text-gray-400" />
                    <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Aucun colis créé</h3>
                    <p className="mb-4 text-gray-600 dark:text-gray-400">
                      Vous n'avez pas encore créé de colis. Commencez par créer votre premier colis.
                    </p>
                    <button
                      onClick={() => router.push('/exp')}
                      className="flex gap-2 items-center px-6 py-3 mx-auto font-medium text-white bg-green-500 rounded-lg transition hover:bg-green-600"
                    >
                      <Package className="w-5 h-5" />
                      Créer mon premier colis
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Mes Commandes</h3>
                  <button
                    onClick={() => router.push('/courses')}
                    className="flex gap-2 items-center px-4 py-2 font-medium text-white bg-sky-500 rounded-lg transition hover:bg-sky-600"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Passer une commande
                  </button>
                </div>

                {orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="p-6 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex gap-3 items-center mb-2">
                              <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                                Commande #{order.id}
                              </h4>
                              <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                                order.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                                order.status === 'PROCESSING' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' :
                                order.status === 'SHIPPED' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300' :
                                order.status === 'DELIVERED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                                order.status === 'CANCELLED' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                                'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                              }`}>
                                {order.status === 'PENDING' ? 'En attente' :
                                 order.status === 'CONFIRMED' ? 'Confirmé' :
                                 order.status === 'PROCESSING' ? 'En préparation' :
                                 order.status === 'SHIPPED' ? 'Expédié' :
                                 order.status === 'DELIVERED' ? 'Livré' :
                                 order.status === 'CANCELLED' ? 'Annulé' : order.status}
                              </span>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                              <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  <strong>Marchand:</strong> {order.merchant?.companyName || `${order.merchant?.firstName} ${order.merchant?.lastName}`}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  <strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString('fr-FR', {
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
                                  <strong>Type:</strong> {order.hasDelivery ? 'Livraison' : 'Retrait en magasin'}
                                </p>
                                {order.hasDelivery && order.deliveryAddress && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    <strong>Adresse:</strong> {order.deliveryAddress}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                              €{order.total?.toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {order.items?.length || 0} article(s)
                            </p>
                          </div>
                        </div>

                        {/* Articles de la commande */}
                        {order.items && order.items.length > 0 && (
                          <div className="mb-4">
                            <h5 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Articles commandés</h5>
                            <div className="space-y-2">
                              {order.items.map((item) => (
                                <div key={item.id} className="flex justify-between items-center px-3 py-2 bg-gray-50 rounded dark:bg-gray-700">
                                  <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.productName}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      €{item.unitPrice?.toFixed(2)} × {item.quantity}
                                    </p>
                                  </div>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    €{item.totalPrice?.toFixed(2)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Résumé des coûts */}
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Sous-total:</span>
                            <span className="text-gray-900 dark:text-white">€{order.subtotal?.toFixed(2)}</span>
                          </div>
                          {order.deliveryFee > 0 && (
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Livraison:</span>
                              <span className="text-gray-900 dark:text-white">€{order.deliveryFee?.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center pt-2 text-lg font-bold border-t border-gray-200 dark:border-gray-600">
                            <span className="text-gray-900 dark:text-white">Total:</span>
                            <span className="text-gray-900 dark:text-white">€{order.total?.toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-200 dark:border-gray-600">
                          <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                            {order.confirmedAt && (
                              <span>Confirmé le {new Date(order.confirmedAt).toLocaleDateString()}</span>
                            )}
                            {order.shippedAt && (
                              <span>Expédié le {new Date(order.shippedAt).toLocaleDateString()}</span>
                            )}
                            {order.deliveredAt && (
                              <span>Livré le {new Date(order.deliveredAt).toLocaleDateString()}</span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => router.push(`/order-tracking?orderId=${order.id}`)}
                              className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300"
                            >
                              <Eye className="w-4 h-4" />
                              Suivre
                            </button>
                            {order.status === 'DELIVERED' && (
                              <button className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300">
                                <Star className="w-4 h-4" />
                                Évaluer
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <ShoppingCart className="mx-auto mb-4 w-12 h-12 text-gray-400" />
                    <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Aucune commande</h3>
                    <p className="mb-4 text-gray-600 dark:text-gray-400">
                      Vous n'avez pas encore passé de commande. Découvrez nos marchands partenaires.
                    </p>
                    <button
                      onClick={() => router.push('/courses')}
                      className="flex gap-2 items-center px-6 py-3 mx-auto font-medium text-white bg-sky-500 rounded-lg transition hover:bg-sky-600"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      Découvrir les marchands
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'services' && (
              <div className="space-y-6 services-section">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Services Populaires</h3>
                  <Link
                    href="/services/browse"
                    className="px-4 py-2 font-medium text-white bg-sky-400 rounded-lg transition hover:bg-sky-500"
                  >
                    Voir tous les services
                  </Link>
                </div>

                {services.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {services.map((service) => (
                      <div key={service.id} className="p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-medium text-gray-900 dark:text-white">{service.name}</h4>
                          <span className="font-bold text-sky-600 dark:text-sky-400">€{service.price}</span>
                        </div>
                        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">{service.description}</p>
                        <div className="flex justify-between items-center">
                          <div className="flex gap-1 items-center">
                            <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">{service.averageRating || 'N/A'}</span>
                          </div>
                          <button
                            onClick={() => handleBookService(service.id)}
                            className="px-3 py-1 text-sm font-medium text-white bg-sky-400 rounded transition hover:bg-sky-500"
                          >
                            Réserver
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Search className="mx-auto mb-4 w-12 h-12 text-gray-400" />
                    <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Aucun service disponible</h3>
                    <p className="text-gray-600 dark:text-gray-400">Les services populaires apparaîtront ici</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'bookings' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Mes Réservations</h3>
                
                {bookings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-gray-200 dark:border-gray-700">
                        <tr>
                          <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                            Service
                          </th>
                          <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                            Date prévue
                          </th>
                          <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                            Statut
                          </th>
                          <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                            Prix
                          </th>
                          <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {bookings.map((booking) => (
                          <tr key={booking.id}>
                            <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
                              <div className="flex gap-2 items-center">
                                {booking.type === 'box_rental' && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                                    📦 Box
                                  </span>
                                )}
                                {booking.type === 'service' && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                    🔧 Service
                                  </span>
                                )}
                                {booking.serviceName}
                              </div>
                              {booking.type === 'box_rental' && booking.box && (
                                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                  {booking.box.location} • Taille {booking.box.size} • {booking.box.pricePerDay}€/jour
                                  {booking.box.accessCode && (
                                    <span className="ml-2 font-mono text-green-600 dark:text-green-400">
                                      Code: {booking.box.accessCode}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                              {new Date(booking.scheduledAt).toLocaleDateString()}
                              {booking.type === 'box_rental' && booking.endDate && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Fin: {new Date(booking.endDate).toLocaleDateString()}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                                booking.status === 'CONFIRMED' || booking.status === 'PAID' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                                booking.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                                'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                              }`}>
                                {booking.status === 'PENDING' ? 'En attente' :
                                 booking.status === 'CONFIRMED' ? 'Confirmé' :
                                 booking.status === 'PAID' ? 'Payé' :
                                 booking.status === 'COMPLETED' ? 'Terminé' :
                                 booking.status}
                              </span>
                              {booking.type === 'box_rental' && booking.isActive && (
                                <div className="mt-1">
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                    ✅ Active
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
                              €{booking.totalPrice}
                            </td>
                            <td className="px-4 py-4 text-sm font-medium">
                              <div className="flex gap-2">
                                <button className="flex gap-1 items-center px-3 py-1 text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300">
                                  <Eye className="w-4 h-4" />
                                  Voir
                                </button>
                                {/* Actions spécifiques aux box rentals */}
                                {booking.type === 'box_rental' && booking.status === 'PENDING' && (
                                  <button
                                    onClick={() => {
                                      router.push(`/payments/process?rentalId=${booking.id}&type=storage_rental`);
                                    }}
                                    className="flex gap-1 items-center px-3 py-1 text-white bg-green-500 rounded-lg transition hover:bg-green-600"
                                  >
                                    💳 Payer
                                  </button>
                                )}
                                {/* Messages pour services et box rentals confirmés */}
                                {((booking.status === 'CONFIRMED' || booking.status === 'IN_PROGRESS' || booking.status === 'COMPLETED' || booking.status === 'PAID') && booking.service?.provider) && (
                                   <button
                                     onClick={() => {
                                       setSelectedConversation({
                                         id: booking.service?.provider?.id || booking.providerId,
                                         firstName: booking.service?.provider?.firstName || 'Prestataire',
                                         lastName: booking.service?.provider?.lastName || '',
                                         email: booking.service?.provider?.email || ''
                                       });
                                       setActiveTab('messages');
                                     }}
                                     className="flex gap-1 items-center px-3 py-1 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                                   >
                                     <MessageCircle className="w-4 h-4" />
                                     Message
                                   </button>
                                 )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Calendar className="mx-auto mb-4 w-12 h-12 text-gray-400" />
                    <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Aucune réservation</h3>
                    <p className="text-gray-600 dark:text-gray-400">Vos réservations apparaîtront ici</p>
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
                                  notification.type === 'MATCH_UPDATE' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                                  notification.type === 'MATCH_ACCEPTED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                                  notification.type === 'PAYMENT_SUCCESS' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                                  notification.type === 'PAYMENT_REQUIRED' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                                  notification.type === 'BOOKING_CONFIRMED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                                  notification.type === 'RENTAL_CONFIRMED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                                  'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                                }`}>
                                  {notification.type === 'MATCH_UPDATE' ? 'Proposition' :
                                   notification.type === 'MATCH_ACCEPTED' ? 'Acceptée' :
                                   notification.type === 'PAYMENT_SUCCESS' ? 'Paiement' :
                                   notification.type === 'PAYMENT_REQUIRED' ? 'Paiement requis' :
                                   notification.type === 'BOOKING_CONFIRMED' ? 'Réservation confirmée' :
                                   notification.type === 'RENTAL_CONFIRMED' ? 'Location confirmée' :
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
                            {notification.type === 'MATCH_UPDATE' && !notification.isRead && (
                              <button
                                onClick={() => {
                                  markNotificationAsRead(notification.id);
                                  router.push('/matches');
                                }}
                                className="px-3 py-1 text-sm font-medium text-white bg-blue-500 rounded-lg transition hover:bg-blue-600"
                              >
                                Voir proposition
                              </button>
                            )}
                            {notification.type === 'PAYMENT_REQUIRED' && !notification.isRead && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    markNotificationAsRead(notification.id);
                                    let redirectUrl = '/payments/process';
                                    
                                    // Parse notification data to get the correct URL
                                    const notificationData = notification.data ? JSON.parse(notification.data) : null;
                                    if (notificationData && notificationData.redirectUrl) {
                                      redirectUrl = notificationData.redirectUrl;
                                    } else if (notification.relatedEntityId) {
                                      // Check if this is a ride request payment by checking notification data
                                      if (notificationData && notificationData.rideRequestId) {
                                        redirectUrl = `/payments/process?rideRequestId=${notificationData.rideRequestId}`;
                                      } else {
                                        // Default fallback for match payments
                                        redirectUrl = `/payments/process?matchId=${notification.relatedEntityId}`;
                                      }
                                    }
                                    
                                    router.push(redirectUrl);
                                  }}
                                  className="px-3 py-1 text-sm font-medium text-white bg-green-500 rounded-lg transition hover:bg-green-600"
                                >
                                  💳 Payer maintenant
                                </button>
                                <button
                                  onClick={() => markNotificationAsRead(notification.id)}
                                  className="px-3 py-1 text-sm font-medium text-white bg-gray-500 rounded-lg transition hover:bg-gray-600"
                                >
                                  Plus tard
                                </button>
                              </div>
                            )}
                            {(notification.type === 'BOOKING_CONFIRMED' || notification.type === 'RENTAL_CONFIRMED') && !notification.isRead && (
                              <button
                                onClick={() => {
                                  markNotificationAsRead(notification.id);
                                  const redirectUrl = notification.type === 'BOOKING_CONFIRMED' 
                                    ? `/payments/process?bookingId=${notification.relatedEntityId}`
                                    : `/payments/process?rentalId=${notification.relatedEntityId}`;
                                  router.push(redirectUrl);
                                }}
                                className="px-3 py-1 text-sm font-medium text-white bg-green-500 rounded-lg transition hover:bg-green-600"
                              >
                                💳 Procéder au paiement
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

            {activeTab === 'storage' && (
              <div className="space-y-6 storage-section">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Boîtes de Stockage Disponibles</h3>
                  <Link
                    href="/storage/browse"
                    className="px-4 py-2 font-medium text-white bg-sky-400 rounded-lg transition hover:bg-sky-500"
                  >
                    Voir toutes les boîtes
                  </Link>
                </div>

                {storageBoxes.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2">
                    {storageBoxes.map((box) => (
                      <div key={box.id} className="p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">{box.title}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{box.location}</p>
                          </div>
                          <span className="font-bold text-sky-600 dark:text-sky-400">€{box.pricePerDay}/jour</span>
                        </div>
                        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">{box.description}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">{box.size}</span>
                          <button
                            onClick={() => handleRentBox(box.id)}
                            className="px-3 py-1 text-sm font-medium text-white bg-sky-400 rounded transition hover:bg-sky-500"
                          >
                            Louer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Package className="mx-auto mb-4 w-12 h-12 text-gray-400" />
                    <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Aucune boîte disponible</h3>
                    <p className="text-gray-600 dark:text-gray-400">Les boîtes de stockage disponibles apparaîtront ici</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="space-y-6 payments-section">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Historique des Paiements</h3>
                
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
                                <span>{payment.serviceName}</span>
                                {payment.type === 'delivery' && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                    Livraison
                                  </span>
                                )}
                                {payment.type === 'service' && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                                    Service
                                  </span>
                                )}
                              </div>
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

                         {activeTab === 'messages' && (
               <div className="space-y-6">
                 <div className="flex justify-between items-center">
                   <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Messages</h3>
                   <div className="flex gap-2">
                     <button
                       onClick={() => fetchDashboardData()}
                       className="flex gap-1 items-center px-3 py-1 text-sm text-gray-600 transition-colors dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                       title="Rafraîchir les données"
                     >
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                       </svg>
                       Actualiser
                     </button>
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
                             <p className="mt-1 text-xs">Créez un colis pour commencer à échanger</p>
                           </div>
                         ) : (
                           conversations.map((conversation) => (
                             <div
                               key={conversation.partner.id}
                               onClick={() => {
                                 console.log('🔗 Selecting conversation with partner:', conversation.partner);
                                 setSelectedConversation(conversation.partner);
                               }}
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
                                 onClick={() => {
                                   console.log('🔍 Send button clicked with selectedConversation:', selectedConversation);
                                 }}
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
                       Les conversations avec les transporteurs apparaîtront ici quand vous créerez des colis.
                     </p>
                     <Link 
                       href="/exp"
                       className="inline-block px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-lg transition hover:bg-green-600"
                     >
                       Créer un colis
                     </Link>
                   </div>
                 )}
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Modal des détails du colis */}
      {isPackageModalOpen && selectedPackage && (
        <div className="overflow-y-auto fixed inset-0 z-50">
          <div className="flex justify-center items-center px-4 pt-4 pb-20 min-h-screen text-center sm:block sm:p-0">
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={closePackageModal}
            />
            
            {/* Modal */}
            <div className="inline-block overflow-hidden text-left align-bottom bg-white rounded-lg shadow-xl transition-all transform dark:bg-gray-800 sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              {/* Header */}
              <div className="px-6 pt-6 bg-white dark:bg-gray-800">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Détails du colis
                  </h3>
                  <button
                    onClick={closePackageModal}
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
                        {selectedPackage.description}
                      </h4>
                      {selectedPackage.description && (
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                          {selectedPackage.description}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                        selectedPackage.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                        selectedPackage.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                        selectedPackage.status === 'DELIVERED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                      }`}>
                        {selectedPackage.status === 'PENDING' ? 'En attente' :
                         selectedPackage.status === 'CONFIRMED' ? 'Confirmé' :
                         selectedPackage.status === 'DELIVERED' ? 'Livré' : selectedPackage.status}
                      </span>
                      {selectedPackage.price && (
                        <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                          €{selectedPackage.price}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Informations générales */}
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <h5 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        ID du colis
                      </h5>
                      <p className="font-mono text-sm text-gray-600 dark:text-gray-400">
                        {selectedPackage.id}
                      </p>
                    </div>
                    <div>
                      <h5 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        Date de création
                      </h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(selectedPackage.createdAt).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Adresses */}
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
                      <h5 className="flex items-center mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        <div className="mr-2 w-3 h-3 bg-blue-500 rounded-full"></div>
                        Adresse d'enlèvement
                      </h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedPackage.fromAddress}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
                      <h5 className="flex items-center mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        <div className="mr-2 w-3 h-3 bg-green-500 rounded-full"></div>
                        Adresse de livraison
                      </h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedPackage.toAddress}
                      </p>
                    </div>
                  </div>

                  {/* Caractéristiques du colis */}
                  {(selectedPackage.weight || selectedPackage.dimensions || selectedPackage.sizeLabel || selectedPackage.isFragile || selectedPackage.requiresRefrigeration) && (
                    <div>
                      <h5 className="mb-3 text-lg font-medium text-gray-900 dark:text-white">
                        Caractéristiques
                      </h5>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {selectedPackage.weight && (
                          <div className="p-3 text-center bg-gray-50 rounded-lg dark:bg-gray-700">
                            <p className="text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">
                              Poids
                            </p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              {selectedPackage.weight} kg
                            </p>
                          </div>
                        )}
                        {selectedPackage.dimensions && (
                          <div className="p-3 text-center bg-gray-50 rounded-lg dark:bg-gray-700">
                            <p className="text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">
                              Dimensions
                            </p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              {selectedPackage.dimensions}
                            </p>
                          </div>
                        )}
                        {selectedPackage.sizeLabel && (
                          <div className="p-3 text-center bg-gray-50 rounded-lg dark:bg-gray-700">
                            <p className="text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">
                              Taille
                            </p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              {selectedPackage.sizeLabel}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {/* Caractéristiques spéciales */}
                      {(selectedPackage.isFragile || selectedPackage.requiresRefrigeration) && (
                        <div className="mt-4">
                          <h6 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
                            Caractéristiques spéciales
                          </h6>
                          <div className="flex flex-wrap gap-2">
                            {selectedPackage.isFragile && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">
                                🔸 Fragile
                              </span>
                            )}
                            {selectedPackage.requiresRefrigeration && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                ❄️ Réfrigération requise
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Transporteurs intéressés */}
                  {selectedPackage.matches && selectedPackage.matches.length > 0 && (
                    <div>
                      <h5 className="mb-3 text-lg font-medium text-gray-900 dark:text-white">
                        Transporteurs intéressés ({selectedPackage.matches.length})
                      </h5>
                      <div className="space-y-3">
                        {selectedPackage.matches.map((match) => (
                          <div key={match.id} className="p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex gap-2 items-center mb-2">
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {match.carrier?.firstName} {match.carrier?.lastName}
                                  </p>
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    match.status === 'PROPOSED' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                                    match.status === 'ACCEPTED_BY_SENDER' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                                    match.status === 'CONFIRMED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                                    'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                                  }`}>
                                    {match.status === 'PROPOSED' ? 'Proposé' :
                                     match.status === 'ACCEPTED_BY_SENDER' ? 'Accepté et payé' :
                                     match.status === 'CONFIRMED' ? 'Confirmé' :
                                     match.status}
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    📧 {match.carrier?.email}
                                  </p>
                                  {match.carrier?.phoneNumber && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      📞 {match.carrier.phoneNumber}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                {match.proposedPrice && (
                                  <div className="mb-2">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Prix proposé</p>
                                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                      €{match.proposedPrice}
                                    </p>
                                  </div>
                                )}
                                {match.payment && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Paiement: {match.payment.status === 'COMPLETED' ? 'Effectué' : 'En attente'}
                                  </div>
                                )}
                              </div>
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
                <div className="flex justify-end">
                  <button
                    onClick={closePackageModal}
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