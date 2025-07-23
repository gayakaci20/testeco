import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import RoleBasedNavigation from '../components/RoleBasedNavigation';
import { 
  Sun, 
  Moon, 
  User, 
  Menu, 
  X,
  Bell,
  BellOff,
  Package,
  Truck,
  DollarSign,
  MessageCircle,
  Star,
  AlertCircle,
  CheckCircle,
  Info,
  Heart,
  Settings,
  Filter,
  Search,
  MoreHorizontal,
  Archive,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  Clock,
  Users,
  FileText,
  Mail,
  Phone,
  Grid,
  List,
  TrendingUp,
  Activity,
  Target,
  Zap,
  Shield
} from 'lucide-react';

export default function NotificationsPage({ isDarkMode, toggleDarkMode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    newMessages: true,
    bookingUpdates: true,
    paymentReminders: true,
    promotions: false,
    weeklyReports: true
  });

  const filterOptions = [
    { id: 'all', name: 'Toutes', icon: Bell, color: 'blue' },
    { id: 'unread', name: 'Non lues', icon: BellOff, color: 'red' },
    { id: 'read', name: 'Lues', icon: Eye, color: 'green' },
    { id: 'important', name: 'Importantes', icon: AlertCircle, color: 'yellow' },
    { id: 'messages', name: 'Messages', icon: MessageCircle, color: 'purple' },
    { id: 'bookings', name: 'Réservations', icon: Calendar, color: 'orange' },
    { id: 'payments', name: 'Paiements', icon: DollarSign, color: 'pink' }
  ];

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }
    
    if (user) {
      fetchNotifications();
      fetchNotificationSettings();
    }
  }, [user, loading, router]);

  useEffect(() => {
    filterNotifications();
  }, [notifications, activeFilter, searchTerm]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/notifications', {
        headers: {
          'x-user-id': user?.id || 'demo-user-id'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        
        // Log notifications for debugging
        console.log('🔔 Notifications page - notifications received:', data.notifications?.map(n => ({
          id: n.id,
          type: n.type,
          title: n.title,
          isRead: n.isRead,
          relatedEntityId: n.relatedEntityId
        })) || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNotificationSettings = async () => {
    try {
      const response = await fetch('/api/notifications/settings', {
        headers: {
          'x-user-id': user?.id || 'demo-user-id'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotificationSettings({ ...notificationSettings, ...data });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
    }
  };

  const filterNotifications = () => {
    let filtered = notifications.filter(notification => {
      const matchesSearch = notification.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           notification.title?.toLowerCase().includes(searchTerm.toLowerCase());
      
      switch (activeFilter) {
        case 'unread':
          return matchesSearch && !notification.isRead;
        case 'read':
          return matchesSearch && notification.isRead;
        case 'important':
          return matchesSearch && notification.priority === 'HIGH';
        case 'messages':
          return matchesSearch && notification.type === 'MESSAGE';
        case 'bookings':
          return matchesSearch && notification.type === 'BOOKING';
        case 'payments':
          return matchesSearch && notification.type === 'PAYMENT';
        default:
          return matchesSearch;
      }
    });
    
    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setFilteredNotifications(filtered);
  };

  const markAsRead = async (notificationIds) => {
    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || 'demo-user-id'
        },
        body: JSON.stringify({ notificationIds })
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => 
            notificationIds.includes(notification.id) 
              ? { ...notification, isRead: true }
              : notification
          )
        );
      }
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
    }
  };

  const markAsUnread = async (notificationIds) => {
    try {
      const response = await fetch('/api/notifications/mark-unread', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || 'demo-user-id'
        },
        body: JSON.stringify({ notificationIds })
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => 
            notificationIds.includes(notification.id) 
              ? { ...notification, isRead: false }
              : notification
          )
        );
      }
    } catch (error) {
      console.error('Erreur lors du marquage comme non lu:', error);
    }
  };

  const deleteNotifications = async (notificationIds) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ces notifications ?')) {
      try {
        const response = await fetch('/api/notifications/delete', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user?.id || 'demo-user-id'
          },
          body: JSON.stringify({ notificationIds })
        });

        if (response.ok) {
          setNotifications(prev => 
            prev.filter(notification => !notificationIds.includes(notification.id))
          );
          setSelectedNotifications([]);
        }
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const updateNotificationSettings = async (settings) => {
    try {
      const response = await fetch('/api/notifications/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || 'demo-user-id'
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        setNotificationSettings(settings);
        alert('Paramètres sauvegardés avec succès!');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres:', error);
      alert('Erreur lors de la sauvegarde des paramètres');
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark as read if not already
    if (!notification.isRead) {
      markAsRead([notification.id]);
    }
    
    // Navigate to related page based on notification type
    switch (notification.type) {
      case 'MESSAGE':
        router.push(`/messages?conversationWith=${notification.relatedId}`);
        break;
      case 'BOOKING':
        router.push(`/bookings/${notification.relatedId}`);
        break;
      case 'PAYMENT':
        router.push(`/payments/${notification.relatedId}`);
        break;
      case 'MATCH':
        router.push(`/matches/${notification.relatedId}`);
        break;
      default:
        // Handle other notification types
        break;
    }
  };

  const getNotificationIcon = (type, priority) => {
    const iconClass = priority === 'HIGH' ? 'w-6 h-6' : 'w-5 h-5';
    
    switch (type) {
      case 'MESSAGE':
        return <MessageCircle className={`text-blue-500 ${iconClass}`} />;
      case 'BOOKING':
        return <Calendar className={`text-green-500 ${iconClass}`} />;
      case 'PAYMENT':
        return <DollarSign className={`text-yellow-500 ${iconClass}`} />;
      case 'MATCH':
        return <Users className={`text-purple-500 ${iconClass}`} />;
      case 'DELIVERY':
        return <Package className={`text-orange-500 ${iconClass}`} />;
      case 'REVIEW':
        return <Star className={`text-pink-500 ${iconClass}`} />;
      case 'SYSTEM':
        return <Settings className={`text-gray-500 ${iconClass}`} />;
      default:
        return <Bell className={`text-gray-500 ${iconClass}`} />;
    }
  };

  const getNotificationColor = (type, isRead) => {
    const baseColor = isRead ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-700';
    const borderColor = isRead ? 'border-gray-200 dark:border-gray-700' : 'border-sky-200 dark:border-sky-700';
    
    return `${baseColor} ${borderColor}`;
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'À l\'instant';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}j`;
    return date.toLocaleDateString('fr-FR');
  };

  const toggleNotificationSelection = (notificationId) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n.id));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full border-4 border-sky-400 animate-spin border-t-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Chargement des notifications...</p>
        </div>
      </div>
    );
  }

  // Statistics calculation
  const stats = {
    totalNotifications: notifications.length,
    unreadNotifications: notifications.filter(n => !n.isRead).length,
    importantNotifications: notifications.filter(n => n.priority === 'HIGH').length,
    todayNotifications: notifications.filter(n => {
      const today = new Date();
      const notifDate = new Date(n.createdAt);
      return notifDate.toDateString() === today.toDateString();
    }).length
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Head>
        <title>Notifications - ecodeli</title>
        <meta name="description" content="Gérez vos notifications et paramètres" />
        <link rel="icon" href="/LOGO_.png" />
      </Head>

      <RoleBasedNavigation isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

      {/* Header Section */}
      <div className="px-6 py-8 bg-sky-50 dark:bg-sky-900/20">
        <div className="mx-auto max-w-7xl">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Notifications
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Gérez vos notifications et paramètres
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center px-6 py-2 font-medium text-gray-700 bg-white rounded-full border border-gray-200 shadow-sm transition hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <Settings className="mr-2 w-4 h-4" />
                Paramètres
              </button>
              {selectedNotifications.length > 0 && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => markAsRead(selectedNotifications)}
                    className="flex items-center px-4 py-2 text-white bg-green-500 rounded-full shadow-lg transition hover:bg-green-600"
                  >
                    <Eye className="mr-1 w-4 h-4" />
                    Marquer comme lu
                  </button>
                  <button
                    onClick={() => deleteNotifications(selectedNotifications)}
                    className="flex items-center px-4 py-2 text-white bg-red-500 rounded-full shadow-lg transition hover:bg-red-600"
                  >
                    <Trash2 className="mr-1 w-4 h-4" />
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-8 mx-auto max-w-7xl">
        {/* Stats Cards */}
        <div className="grid gap-6 mb-8 md:grid-cols-4">
          <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total notifications</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalNotifications}</p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-blue-100 rounded-full dark:bg-blue-900">
                <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Non lues</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.unreadNotifications}</p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-red-100 rounded-full dark:bg-red-900">
                <BellOff className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Importantes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.importantNotifications}</p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-yellow-100 rounded-full dark:bg-yellow-900">
                <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aujourd'hui</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.todayNotifications}</p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-green-100 rounded-full dark:bg-green-900">
                <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 mb-6 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 w-5 h-5 text-gray-400 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher dans les notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="py-3 pr-4 pl-10 w-full text-gray-900 bg-white rounded-lg border border-gray-200 shadow-sm transition-all dark:border-gray-700 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-3 text-gray-900 rounded-lg border border-gray-200 transition-colors dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white"
            >
              <Filter className="mr-2 w-5 h-5 text-gray-900 dark:text-white" />
              Filtres
            </button>
            <div className="flex rounded-lg border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center px-3 py-3 rounded-l-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Grid className="w-5 h-5 text-gray-900 dark:text-white" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center px-3 py-3 rounded-r-lg transition-colors ${
                  viewMode === 'list' ? 'bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <List className="w-5 h-5 text-gray-900 dark:text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="p-6 mb-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="grid gap-6 md:grid-cols-1">
              <div>
                <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">Type de notification</h3>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setActiveFilter(option.id)}
                      className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                        activeFilter === option.id
                          ? 'bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <option.icon className="w-4 h-4" />
                      {option.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        {filteredNotifications.length > 0 && (
          <div className="flex justify-between items-center p-4 mb-4 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedNotifications.length === filteredNotifications.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-sky-600 rounded border-gray-300 focus:ring-sky-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Tout sélectionner
                </span>
              </label>
              {selectedNotifications.length > 0 && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedNotifications.length} sélectionné(s)
                </span>
              )}
            </div>
            {selectedNotifications.length > 0 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => markAsUnread(selectedNotifications)}
                  className="flex items-center px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg shadow-sm transition hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  <EyeOff className="mr-1 w-4 h-4" />
                  Non lu
                </button>
                <button
                  onClick={() => markAsRead(selectedNotifications)}
                  className="flex items-center px-3 py-2 text-sm text-green-700 bg-green-100 rounded-lg shadow-sm transition hover:bg-green-200 dark:bg-green-800 dark:text-green-300 dark:hover:bg-green-700"
                >
                  <Eye className="mr-1 w-4 h-4" />
                  Lu
                </button>
                <button
                  onClick={() => deleteNotifications(selectedNotifications)}
                  className="flex items-center px-3 py-2 text-sm text-red-700 bg-red-100 rounded-lg shadow-sm transition hover:bg-red-200 dark:bg-red-800 dark:text-red-300 dark:hover:bg-red-700"
                >
                  <Trash2 className="mr-1 w-4 h-4" />
                  Supprimer
                </button>
              </div>
            )}
          </div>
        )}

        {/* Notifications List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="py-12 text-center bg-white rounded-lg shadow-sm dark:bg-gray-800">
              <div className="mx-auto w-16 h-16 rounded-full border-4 border-sky-400 animate-spin border-t-transparent"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-300">Chargement des notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-lg shadow-sm dark:bg-gray-800">
              <div className="flex justify-center items-center mx-auto mb-6 w-16 h-16 bg-gray-100 rounded-full dark:bg-gray-700">
                <Bell className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                Aucune notification
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {activeFilter === 'all' ? 'Vous n\'avez aucune notification' : 'Aucune notification dans cette catégorie'}
              </p>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3' : 'space-y-3'}>
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`${getNotificationColor(notification.type, notification.isRead)} border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
                    viewMode === 'list' ? 'flex items-start gap-4' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedNotifications.includes(notification.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleNotificationSelection(notification.id);
                        }}
                        className="w-4 h-4 text-sky-600 rounded border-gray-300 focus:ring-sky-500"
                      />
                      <div className="flex flex-shrink-0 justify-center items-center w-10 h-10 bg-gray-100 rounded-full dark:bg-gray-700">
                        {getNotificationIcon(notification.type, notification.priority)}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <p className={`text-sm font-medium ${notification.isRead ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                            {notification.title}
                          </p>
                          {notification.priority === 'HIGH' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                              Important
                            </span>
                          )}
                          {!notification.isRead && (
                            <span className="w-2 h-2 bg-sky-500 rounded-full"></span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Add more options menu here
                            }}
                            className="p-1 rounded transition-colors hover:bg-gray-100 dark:hover:bg-gray-600"
                          >
                            <MoreHorizontal className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      </div>
                      <p className={`text-sm mt-1 ${notification.isRead ? 'text-gray-500 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                        {notification.message}
                      </p>
                      {notification.actionUrl && (
                        <div className="mt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(notification.actionUrl);
                            }}
                            className="text-sm font-medium text-sky-600 transition-colors dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300"
                          >
                            {notification.actionText || 'Voir plus'}
                          </button>
                        </div>
                      )}
                      
                      {/* Boutons d'action spécifiques pour les propositions de match */}
                      {notification.type === 'MATCH_UPDATE' && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead([notification.id]);
                              if (notification.relatedEntityId) {
                                router.push(`/payments/process?matchId=${notification.relatedEntityId}`);
                              }
                            }}
                            className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-white bg-green-500 rounded-lg transition hover:bg-green-600"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Accepter et payer
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead([notification.id]);
                              router.push('/matches');
                            }}
                            className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-sky-600 rounded-lg border border-sky-600 transition hover:bg-sky-50 dark:hover:bg-sky-900/20"
                          >
                            <Eye className="w-4 h-4" />
                            Voir détails
                          </button>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
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
                                    markAsRead([notification.id]);
                                    alert('Proposition refusée avec succès');
                                    // Rafraîchir les notifications
                                    fetchNotifications();
                                  } else {
                                    alert('Erreur lors du refus de la proposition');
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
                      
                      {/* Boutons d'action spécifiques pour les paiements */}
                      {notification.type === 'PAYMENT_SUCCESS' && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead([notification.id]);
                              router.push('/dashboard/customer');
                            }}
                            className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-sky-600 rounded-lg border border-sky-600 transition hover:bg-sky-50 dark:hover:bg-sky-900/20"
                          >
                            <Package className="w-4 h-4" />
                            Voir mes colis
                          </button>
                        </div>
                      )}
                      
                      {/* Boutons d'action spécifiques pour les matches acceptés */}
                      {notification.type === 'MATCH_ACCEPTED' && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead([notification.id]);
                              router.push('/messages');
                            }}
                            className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-sky-600 rounded-lg border border-sky-600 transition hover:bg-sky-50 dark:hover:bg-sky-900/20"
                          >
                            <MessageCircle className="w-4 h-4" />
                            Contacter le client
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

        {/* Load More Button */}
        {filteredNotifications.length > 0 && (
          <div className="mt-8 text-center">
            <button className="px-6 py-3 rounded-lg border border-gray-300 shadow-sm transition-colors dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
              Charger plus
            </button>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Paramètres de notification
              </h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Notification Methods */}
              <div>
                <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
                  Méthodes de notification
                </h3>
                <div className="space-y-3">
                  <label className="flex justify-between items-center p-3 bg-blue-50 rounded-lg dark:bg-blue-900/20">
                    <div className="flex items-center space-x-3">
                      <div className="flex justify-center items-center w-6 h-6 bg-blue-100 rounded-full dark:bg-blue-900">
                        <Mail className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Email</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationSettings.emailNotifications}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        emailNotifications: e.target.checked
                      })}
                      className="w-4 h-4 text-sky-600 rounded border-gray-300 focus:ring-sky-500"
                    />
                  </label>
                  <label className="flex justify-between items-center p-3 bg-green-50 rounded-lg dark:bg-green-900/20">
                    <div className="flex items-center space-x-3">
                      <div className="flex justify-center items-center w-6 h-6 bg-green-100 rounded-full dark:bg-green-900">
                        <Phone className="w-3 h-3 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">SMS</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationSettings.smsNotifications}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        smsNotifications: e.target.checked
                      })}
                      className="w-4 h-4 text-sky-600 rounded border-gray-300 focus:ring-sky-500"
                    />
                  </label>
                  <label className="flex justify-between items-center p-3 bg-purple-50 rounded-lg dark:bg-purple-900/20">
                    <div className="flex items-center space-x-3">
                      <div className="flex justify-center items-center w-6 h-6 bg-purple-100 rounded-full dark:bg-purple-900">
                        <Bell className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Push</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationSettings.pushNotifications}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        pushNotifications: e.target.checked
                      })}
                      className="w-4 h-4 text-sky-600 rounded border-gray-300 focus:ring-sky-500"
                    />
                  </label>
                </div>
              </div>

              {/* Notification Types */}
              <div>
                <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
                  Types de notifications
                </h3>
                <div className="space-y-3">
                  <label className="flex justify-between items-center p-3 bg-gray-50 rounded-lg dark:bg-gray-700">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Nouveaux messages</span>
                    <input
                      type="checkbox"
                      checked={notificationSettings.newMessages}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        newMessages: e.target.checked
                      })}
                      className="w-4 h-4 text-sky-600 rounded border-gray-300 focus:ring-sky-500"
                    />
                  </label>
                  <label className="flex justify-between items-center p-3 bg-gray-50 rounded-lg dark:bg-gray-700">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Mises à jour des réservations</span>
                    <input
                      type="checkbox"
                      checked={notificationSettings.bookingUpdates}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        bookingUpdates: e.target.checked
                      })}
                      className="w-4 h-4 text-sky-600 rounded border-gray-300 focus:ring-sky-500"
                    />
                  </label>
                  <label className="flex justify-between items-center p-3 bg-gray-50 rounded-lg dark:bg-gray-700">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Rappels de paiement</span>
                    <input
                      type="checkbox"
                      checked={notificationSettings.paymentReminders}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        paymentReminders: e.target.checked
                      })}
                      className="w-4 h-4 text-sky-600 rounded border-gray-300 focus:ring-sky-500"
                    />
                  </label>
                  <label className="flex justify-between items-center p-3 bg-gray-50 rounded-lg dark:bg-gray-700">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Promotions</span>
                    <input
                      type="checkbox"
                      checked={notificationSettings.promotions}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        promotions: e.target.checked
                      })}
                      className="w-4 h-4 text-sky-600 rounded border-gray-300 focus:ring-sky-500"
                    />
                  </label>
                  <label className="flex justify-between items-center p-3 bg-gray-50 rounded-lg dark:bg-gray-700">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Rapports hebdomadaires</span>
                    <input
                      type="checkbox"
                      checked={notificationSettings.weeklyReports}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        weeklyReports: e.target.checked
                      })}
                      className="w-4 h-4 text-sky-600 rounded border-gray-300 focus:ring-sky-500"
                    />
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end items-center pt-6 space-x-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-6 py-3 text-gray-600 transition-colors dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    updateNotificationSettings(notificationSettings);
                    setShowSettings(false);
                  }}
                  className="px-6 py-3 text-white bg-sky-500 rounded-lg shadow-lg transition hover:bg-sky-600"
                >
                  Sauvegarder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 