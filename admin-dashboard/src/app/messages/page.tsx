'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Search, Plus, Send, User, Clock, CheckCircle, XCircle, RefreshCw, Users } from 'lucide-react';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  receiver: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

interface Conversation {
  id: string;
  participants: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  }>;
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    setMessagesLoading(true);
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
        // Mark messages as read
        markMessagesAsRead(conversationId);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const markMessagesAsRead = async (conversationId: string) => {
    try {
      await fetch(`/api/conversations/${conversationId}/mark-read`, {
        method: 'PUT',
      });
      // Update conversation unread count
      setConversations(conversations.map(conv => 
        conv.id === conversationId 
          ? { ...conv, unreadCount: 0 }
          : conv
      ));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;

    try {
      const response = await fetch(`/api/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage,
          messageType: 'TEXT',
        }),
      });

      if (response.ok) {
        const sentMessage = await response.json();
        setMessages([...messages, sentMessage]);
        setNewMessage('');
        // Update conversation last message
        setConversations(conversations.map(conv => 
          conv.id === selectedConversation.id 
            ? { ...conv, lastMessage: sentMessage, updatedAt: sentMessage.createdAt }
            : conv
        ));
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const createNewConversation = async () => {
    if (selectedUsers.length === 0) return;

    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantIds: selectedUsers,
        }),
      });

      if (response.ok) {
        const newConversation = await response.json();
        setConversations([newConversation, ...conversations]);
        setSelectedConversation(newConversation);
        setShowNewConversationModal(false);
        setSelectedUsers([]);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const filteredConversations = conversations.filter(conversation => {
    const participantNames = conversation.participants
      .map(p => `${p.firstName} ${p.lastName}`)
      .join(' ');
    return participantNames.toLowerCase().includes(searchTerm.toLowerCase()) ||
           conversation.lastMessage?.content.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays <= 7) {
      return date.toLocaleDateString('fr-FR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
    }
  };

  const formatMessageTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: 'bg-red-100 text-red-800',
      CUSTOMER: 'bg-blue-100 text-blue-800',
      CARRIER: 'bg-green-100 text-green-800',
      SERVICE_PROVIDER: 'bg-purple-100 text-purple-800',
      MERCHANT: 'bg-yellow-100 text-yellow-800',
      PROVIDER: 'bg-indigo-100 text-indigo-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getConversationTitle = (conversation: Conversation) => {
    const otherParticipants = conversation.participants.filter(p => p.role !== 'ADMIN');
    if (otherParticipants.length === 1) {
      return `${otherParticipants[0].firstName} ${otherParticipants[0].lastName}`;
    }
    return `Group (${conversation.participants.length} participants)`;
  };

  const totalUnreadMessages = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  if (loading) {
    return (
      <div className="p-12 bg-white rounded-xl border shadow-sm">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full border-4 border-blue-600 animate-spin border-t-transparent"></div>
          <p className="mt-2 text-gray-500">Chargement des conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <MessageCircle className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
              <p className="mt-1 text-gray-600">Gestion des conversations et messagerie</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchConversations}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 font-medium text-white bg-gray-600 rounded-lg shadow-sm transition-all duration-200 hover:bg-gray-700 hover:shadow-md disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
            <button
              onClick={() => setShowNewConversationModal(true)}
              className="inline-flex items-center px-4 py-2 font-medium text-white bg-blue-600 rounded-lg shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow-md"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Conversation
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Conversations</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{conversations.length}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <MessageCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="font-medium text-blue-600">{conversations.filter(c => c.unreadCount > 0).length}</span>
            <span className="ml-1 text-gray-500">non lues</span>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Messages Non Lus</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {conversations.reduce((sum, c) => sum + c.unreadCount, 0)}
              </p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <XCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="font-medium text-orange-600">
              {Math.round((conversations.filter(c => c.unreadCount > 0).length / conversations.length) * 100 || 0)}%
            </span>
            <span className="ml-1 text-gray-500">taux non lu</span>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversations Actives</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {conversations.filter(c => c.lastMessage && 
                  new Date(c.lastMessage.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="font-medium text-green-600">24h</span>
            <span className="ml-1 text-gray-500">dernières</span>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Utilisateurs Actifs</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="font-medium text-purple-600">
              {conversations.reduce((acc, c) => acc + c.participants.length, 0)}
            </span>
            <span className="ml-1 text-gray-500">participants</span>
          </div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Conversations List */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
              <span className="text-sm text-gray-500">({conversations.length})</span>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 w-4 h-4 text-gray-400 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher des conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-2 pl-10 pr-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="mx-auto w-12 h-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-500">Aucune conversation</p>
                <p className="text-sm text-gray-400">Commencez une nouvelle conversation</p>
              </div>
            ) : (
              conversations
                .filter(conv => 
                  getConversationTitle(conv).toLowerCase().includes(searchTerm.toLowerCase()) ||
                  conv.lastMessage?.content.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`p-4 border-b border-gray-100 cursor-pointer transition-colors duration-150 hover:bg-gray-50 ${
                      selectedConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {getConversationTitle(conversation)}
                      </h3>
                      {conversation.unreadCount > 0 && (
                        <span className="ml-2 px-2 py-1 text-xs font-semibold text-white bg-blue-600 rounded-full">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                    {conversation.lastMessage && (
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.lastMessage.content}
                        </p>
                        <span className="text-xs text-gray-400 ml-2">
                          {formatMessageTime(conversation.lastMessage.createdAt)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center mt-2 space-x-2">
                      {conversation.participants.slice(0, 3).map((participant, index) => (
                        <span
                          key={participant.id}
                          className={`px-2 py-1 text-xs rounded-full ${getRoleColor(participant.role)}`}
                        >
                          {participant.role}
                        </span>
                      ))}
                      {conversation.participants.length > 3 && (
                        <span className="text-xs text-gray-500">+{conversation.participants.length - 3}</span>
                      )}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-2 bg-white rounded-xl border shadow-sm overflow-hidden">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {getConversationTitle(selectedConversation)}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      {selectedConversation.participants.map((participant) => (
                        <span
                          key={participant.id}
                          className={`px-2 py-1 text-xs rounded-full ${getRoleColor(participant.role)}`}
                        >
                          {participant.firstName} {participant.lastName} ({participant.role})
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">
                      {formatDate(selectedConversation.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 max-h-96 overflow-y-auto space-y-4">
                {messagesLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="w-6 h-6 rounded-full border-2 border-blue-600 animate-spin border-t-transparent"></div>
                    <span className="ml-2 text-gray-500">Chargement des messages...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="mx-auto w-12 h-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">Aucun message dans cette conversation</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className="flex space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {message.sender.firstName} {message.sender.lastName}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(message.sender.role)}`}>
                            {message.sender.role}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatMessageTime(message.createdAt)}
                          </span>
                        </div>
                        <div className="bg-gray-100 rounded-lg p-3">
                          <p className="text-sm text-gray-900">{message.content}</p>
                        </div>
                        <div className="flex items-center mt-1 space-x-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            message.messageType === 'TEXT' ? 'bg-blue-100 text-blue-800' :
                            message.messageType === 'IMAGE' ? 'bg-green-100 text-green-800' :
                            message.messageType === 'FILE' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {message.messageType}
                          </span>
                          {message.isRead && (
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex space-x-3">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Tapez votre message..."
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={2}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <MessageCircle className="mx-auto w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Sélectionnez une conversation</h3>
                <p className="text-gray-500">Choisissez une conversation pour commencer à discuter</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Conversation Modal */}
      {showNewConversationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Nouvelle Conversation</h2>
                <button
                  onClick={() => setShowNewConversationModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-150"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sélectionner les participants
                </label>
                <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-lg">
                  {users.map((user) => (
                    <label key={user.id} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers([...selectedUsers, user.id]);
                          } else {
                            setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                          }
                        }}
                        className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowNewConversationModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Annuler
                </button>
                <button
                  onClick={createNewConversation}
                  disabled={selectedUsers.length === 0}
                  className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Créer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 