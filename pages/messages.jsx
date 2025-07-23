import { useState, useEffect, useRef } from 'react';
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
  MessageCircle,
  Send,
  Clock,
  Search,
  Users,
  Home,
  Package,
  LogOut,
  ChevronRight,
  UserPlus,
  Truck,
  Star,
  Filter,
  Grid,
  List,
  TrendingUp,
  Activity,
  Target,
  MessageSquare,
  Mail,
  Phone
} from 'lucide-react';

export default function MessagesPage({ isDarkMode, toggleDarkMode }) {
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const messagesEndRef = useRef(null);
  const router = useRouter();

  const filterOptions = [
    { id: 'all', name: 'Toutes les conversations', icon: MessageCircle, color: 'blue' },
    { id: 'active', name: 'Conversations actives', icon: MessageSquare, color: 'green' },
    { id: 'new', name: 'Nouveaux contacts', icon: UserPlus, color: 'purple' },
    { id: 'carriers', name: 'Transporteurs', icon: Truck, color: 'orange' },
    { id: 'customers', name: 'Clients', icon: User, color: 'pink' }
  ];

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchConversations();
  }, [user]);

  useEffect(() => {
    // Auto-select conversation if conversationWith is in URL
    const { conversationWith, merchantId, merchantName, orderId } = router.query;
    
    if (merchantId && conversations.length > 0) {
      // Chercher une conversation existante avec ce marchand
      let conversation = conversations.find(conv => conv.partner.id === merchantId);
      
      if (conversation) {
        setSelectedConversation(conversation.partner);
      } else if (merchantName) {
        // Créer une conversation virtuelle avec le marchand
        const virtualPartner = {
          id: merchantId,
          firstName: merchantName.includes(' ') ? merchantName.split(' ')[0] : merchantName,
          lastName: merchantName.includes(' ') ? merchantName.split(' ').slice(1).join(' ') : '',
          companyName: merchantName,
          userType: 'MERCHANT'
        };
        setSelectedConversation(virtualPartner);
        
        // Pré-remplir le message avec le contexte de la commande si orderId est fourni
        if (orderId) {
          setNewMessage(`Bonjour, j'ai une question concernant ma commande #${orderId.substring(0, 8)}. `);
        }
      }
    } else if (conversationWith && conversations.length > 0) {
      const conversation = conversations.find(conv => conv.partner.id === conversationWith);
      if (conversation) {
        setSelectedConversation(conversation.partner);
      }
    }
  }, [router.query, conversations]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching conversations for user:', user?.id);
      
      const response = await fetch('/api/conversations', {
        headers: {
          'x-user-id': user?.id || 'demo-user-id'
        }
      });
      
      console.log('📡 Conversations API response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API Error Response:', errorData);
        throw new Error(errorData.details || errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Conversations loaded successfully:', data.length, 'conversations');
      setConversations(data || []);
    } catch (error) {
      console.error('❌ Error fetching conversations:', error);
      setError(`Erreur lors du chargement des conversations: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (partnerId) => {
    try {
      const response = await fetch(`/api/messages?conversationWith=${partnerId}`, {
        headers: {
          'x-user-id': user?.id || 'demo-user-id'
        }
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des messages');
      }
      
      const data = await response.json();
      setMessages(data || []);
      
      // Mark conversation as read
      markConversationAsRead(partnerId);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Erreur lors du chargement des messages');
    }
  };

  const markConversationAsRead = async (partnerId) => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || 'demo-user-id'
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
    
    if (!newMessage.trim() || !selectedConversation || sending) {
      return;
    }

    try {
      setSending(true);
      
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || 'demo-user-id'
        },
        body: JSON.stringify({
          receiverId: selectedConversation.id,
          content: newMessage.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi du message');
      }

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
                  createdAt: new Date().toISOString(),
                  senderId: user?.id 
                },
                hasMessages: true
              }
            : conv
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Erreur lors de l\'envoi du message');
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString) => {
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

  const getUserRoleDisplay = (partner) => {
    const role = partner.role || partner.userType;
    if (role === 'CARRIER') return '🚛 Transporteur';
    if (role === 'CUSTOMER') return '📦 Client';
    return '👤 Utilisateur';
  };

  const getConversationIcon = (conversation) => {
    if (conversation.hasMessages) {
      return <MessageCircle className="w-4 h-4 text-blue-500" />;
    } else {
      return <UserPlus className="w-4 h-4 text-green-500" />;
    }
  };

  // Filter conversations based on search and filter type
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.partner.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.partner.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.lastMessage?.content?.toLowerCase().includes(searchTerm.toLowerCase());
    
    switch (filterType) {
      case 'active':
        return matchesSearch && conv.hasMessages;
      case 'new':
        return matchesSearch && !conv.hasMessages;
      case 'carriers':
        return matchesSearch && (conv.partner.role === 'CARRIER' || conv.partner.userType === 'CARRIER');
      case 'customers':
        return matchesSearch && (conv.partner.role === 'CUSTOMER' || conv.partner.userType === 'CUSTOMER');
      default:
        return matchesSearch;
    }
  });

  // Separate conversations with messages from matches without messages
  const conversationsWithMessages = filteredConversations.filter(conv => conv.hasMessages);
  const matchesWithoutMessages = filteredConversations.filter(conv => !conv.hasMessages);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full border-4 border-sky-400 animate-spin border-t-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Chargement des messages...</p>
        </div>
      </div>
    );
  }

  // Statistics calculation
  const stats = {
    totalConversations: conversations.length,
    activeConversations: conversationsWithMessages.length,
    newContacts: matchesWithoutMessages.length,
    unreadMessages: conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0)
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Head>
        <title>Messages - ecodeli</title>
        <meta name="description" content="Chattez avec d'autres utilisateurs" />
        <link rel="icon" href="/LOGO_.png" />
      </Head>

      <RoleBasedNavigation isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

      {/* Header Section */}
      <div className="px-6 py-8 bg-sky-50 dark:bg-sky-900/20">
        <div className="mx-auto max-w-7xl">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Messages
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Chattez avec vos partenaires de livraison
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/exp"
                className="flex items-center px-6 py-2 font-medium text-white bg-green-500 rounded-full transition hover:bg-green-600"
              >
                <Package className="mr-2 w-4 h-4" />
                Créer un colis
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8 mx-auto max-w-7xl">
        {/* Stats Cards */}
        <div className="grid gap-6 mb-8 md:grid-cols-4">
          <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total contacts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalConversations}</p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-blue-100 rounded-full dark:bg-blue-900">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Conversations actives</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeConversations}</p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-green-100 rounded-full dark:bg-green-900">
                <MessageCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Nouveaux contacts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.newContacts}</p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-purple-100 rounded-full dark:bg-purple-900">
                <UserPlus className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Messages non lus</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.unreadMessages}</p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-red-100 rounded-full dark:bg-red-900">
                <Mail className="w-6 h-6 text-red-600 dark:text-red-400" />
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
              placeholder="Rechercher dans les conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="py-3 pr-4 pl-10 w-full text-gray-900 bg-white rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
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
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="p-6 mb-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="grid gap-6 md:grid-cols-1">
              <div>
                <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">Type de conversation</h3>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setFilterType(option.id)}
                      className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                        filterType === option.id
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

        {error && (
          <div className="p-4 mb-6 bg-red-50 rounded-lg border border-red-200 dark:bg-red-900/20 dark:border-red-800">
            <p className="text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="overflow-hidden bg-white rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700" style={{ height: '700px' }}>
          <div className="flex h-full">
            {/* Conversations List */}
            <div className="flex flex-col w-1/3 border-r border-gray-200 dark:border-gray-700">
              <div className="p-4 bg-sky-50 border-b border-gray-200 dark:bg-sky-900/20 dark:border-gray-700">
                <div className="flex gap-2 items-center">
                  <div className="flex justify-center items-center w-6 h-6 bg-sky-100 rounded-full dark:bg-sky-900">
                    <Users className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Contacts ({filteredConversations.length})
                  </h2>
                </div>
              </div>
              
              <div className="overflow-y-auto flex-1">
                {filteredConversations.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                    <div className="mb-4 text-6xl">💬</div>
                    <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Aucun contact</h3>
                    <p className="mb-4 text-sm">Créez un colis ou acceptez des matches pour commencer à échanger</p>
                    <Link 
                      href="/exp"
                      className="inline-block px-6 py-3 text-sm font-medium text-white bg-sky-500 rounded-full shadow-lg transition-all transform hover:scale-105 hover:bg-sky-600"
                    >
                      Créer un colis
                    </Link>
                  </div>
                ) : (
                  <>
                    {/* Active Conversations */}
                    {conversationsWithMessages.length > 0 && (
                      <>
                        <div className="px-4 py-2 bg-green-50 border-b border-green-100 dark:bg-green-900/20 dark:border-green-800">
                          <h3 className="text-sm font-medium text-green-700 dark:text-green-400">
                            CONVERSATIONS ACTIVES ({conversationsWithMessages.length})
                          </h3>
                        </div>
                        {conversationsWithMessages.map((conversation) => (
                          <div
                            key={conversation.partner.id}
                            onClick={() => setSelectedConversation(conversation.partner)}
                            className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition ${
                              selectedConversation?.id === conversation.partner.id ? 'bg-sky-50 border-sky-200 dark:bg-sky-900/20 dark:border-sky-800' : ''
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-3">
                                <div className="flex justify-center items-center w-10 h-10 font-semibold text-white bg-sky-500 rounded-full">
                                  {conversation.partner.firstName?.[0]}{conversation.partner.lastName?.[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex gap-2 items-center mb-1">
                                    <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                                      {conversation.partner.firstName} {conversation.partner.lastName}
                                    </p>
                                    {getConversationIcon(conversation)}
                                  </div>
                                  <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                                    {getUserRoleDisplay(conversation.partner)}
                                  </p>
                                  {conversation.lastMessage && (
                                    <p className="text-sm text-gray-600 truncate dark:text-gray-400">
                                      {conversation.lastMessage.senderId === user?.id ? 'Vous: ' : ''}
                                      {conversation.lastMessage.content}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-end space-y-1">
                                {conversation.lastMessage && (
                                  <span className="text-xs text-gray-400 dark:text-gray-500">
                                    {formatTime(conversation.lastMessage.createdAt)}
                                  </span>
                                )}
                                {conversation.unreadCount > 0 && (
                                  <span className="bg-sky-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center shadow-sm">
                                    {conversation.unreadCount}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}

                    {/* New Matches */}
                    {matchesWithoutMessages.length > 0 && (
                      <>
                        <div className="px-4 py-2 bg-purple-50 border-b border-purple-100 dark:bg-purple-900/20 dark:border-purple-800">
                          <h3 className="text-sm font-medium text-purple-700 dark:text-purple-400">
                            NOUVEAUX CONTACTS ({matchesWithoutMessages.length})
                          </h3>
                        </div>
                        {matchesWithoutMessages.map((conversation) => (
                          <div
                            key={conversation.partner.id}
                            onClick={() => setSelectedConversation(conversation.partner)}
                            className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition ${
                              selectedConversation?.id === conversation.partner.id ? 'bg-sky-50 border-sky-200 dark:bg-sky-900/20 dark:border-sky-800' : ''
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-3">
                                <div className="relative">
                                  <div className="flex justify-center items-center w-10 h-10 font-semibold text-white bg-green-500 rounded-full">
                                    {conversation.partner.firstName?.[0]}{conversation.partner.lastName?.[0]}
                                  </div>
                                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white dark:border-gray-800">
                                    <UserPlus className="w-2 h-2 text-white ml-0.5 mt-0.5" />
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex gap-2 items-center mb-1">
                                    <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                                      {conversation.partner.firstName} {conversation.partner.lastName}
                                    </p>
                                    <span className="px-2 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded-full dark:bg-green-900 dark:text-green-300">
                                      Nouveau
                                    </span>
                                  </div>
                                  <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                                    {getUserRoleDisplay(conversation.partner)}
                                  </p>
                                  {conversation.matchContext && (
                                    <p className="text-xs text-green-600 dark:text-green-400">
                                      {conversation.matchContext}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center">
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex flex-col flex-1">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 bg-sky-50 border-b border-gray-200 dark:bg-sky-900/20 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                      <div className="flex justify-center items-center w-10 h-10 font-semibold text-white bg-sky-500 rounded-full">
                        {selectedConversation.firstName?.[0]}{selectedConversation.lastName?.[0]}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {selectedConversation.firstName} {selectedConversation.lastName}
                        </h3>
                        <div className="flex gap-3 items-center">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {getUserRoleDisplay(selectedConversation)}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {selectedConversation.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="overflow-y-auto flex-1 p-4 space-y-4">
                    {messages.length === 0 ? (
                      <div className="flex flex-col justify-center items-center h-full text-center text-gray-500 dark:text-gray-400">
                        <div className="mb-4 text-4xl">💬</div>
                        <h4 className="mb-2 font-medium text-gray-900 dark:text-white">Aucun message</h4>
                        <p className="text-sm">Commencez la conversation en envoyant le premier message</p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm ${
                              message.senderId === user?.id
                                ? 'bg-sky-500 text-white'
                                : 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              message.senderId === user?.id ? 'text-sky-100' : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {formatTime(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 bg-gray-50 border-t border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                    <form onSubmit={sendMessage} className="flex space-x-3">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Tapez votre message..."
                        className="flex-1 px-4 py-3 rounded-full border border-gray-300 shadow-sm transition-all dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        disabled={sending}
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="flex gap-2 items-center px-6 py-3 font-medium text-white bg-sky-500 rounded-full shadow-lg transition-all transform hover:scale-105 hover:bg-sky-600 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        <Send className="w-4 h-4" />
                        {sending ? 'Envoi...' : 'Envoyer'}
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 justify-center items-center">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <div className="mb-4 text-6xl">💬</div>
                    <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Sélectionnez un contact</h3>
                    <p className="mb-4">Choisissez une conversation ou un nouveau contact pour commencer à chatter</p>
                    {conversations.length === 0 && (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Créez un colis ou acceptez des matches pour voir vos contacts apparaître
                        </p>
                        <Link 
                          href="/exp"
                          className="inline-block px-6 py-3 font-medium text-white bg-sky-500 rounded-full shadow-lg transition-all transform hover:scale-105 hover:bg-sky-600"
                        >
                          Créer un colis
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 