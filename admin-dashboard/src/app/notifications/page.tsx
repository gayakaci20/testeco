'use client';

import { useState, useEffect } from 'react';
import { Bell, Send, Users, History, FileText, Plus, RefreshCw, Eye, Edit, Trash2, CheckCircle, XCircle, AlertCircle, Smartphone, Monitor, Tablet } from 'lucide-react';

interface NotificationSubscription {
  id: string;
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  isActive: boolean;
  deviceType: 'MOBILE' | 'DESKTOP' | 'TABLET';
  browserInfo: string;
  createdAt: string;
  lastUsed: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

interface NotificationHistory {
  id: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  targetType: 'ALL' | 'ROLE' | 'USER' | 'SUBSCRIPTION';
  targetValue?: string;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'PARTIALLY_SENT';
  totalRecipients: number;
  successfulSends: number;
  failedSends: number;
  createdAt: string;
  sentAt?: string;
  createdBy: {
    firstName: string;
    lastName: string;
  };
}

interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  body: string;
  icon?: string;
  category: 'BOOKING' | 'PAYMENT' | 'SYSTEM' | 'MARKETING' | 'REMINDER';
  isActive: boolean;
  createdAt: string;
}

export default function PushNotificationsPage() {
  const [subscriptions, setSubscriptions] = useState<NotificationSubscription[]>([]);
  const [notificationHistory, setNotificationHistory] = useState<NotificationHistory[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'send' | 'subscriptions' | 'history' | 'templates'>('send');
  
  // Send notification form
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    body: '',
    icon: '',
    targetType: 'ALL',
    targetValue: '',
    templateId: ''
  });
  const [sending, setSending] = useState(false);

  // Template form
  const [templateForm, setTemplateForm] = useState({
    name: '',
    title: '',
    body: '',
    icon: '',
    category: 'SYSTEM'
  });
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  const [users, setUsers] = useState<any[]>([]);
  const [roles] = useState(['CUSTOMER', 'CARRIER', 'SERVICE_PROVIDER', 'MERCHANT', 'PROVIDER']);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subscriptionsRes, historyRes, templatesRes, usersRes] = await Promise.all([
        fetch('/api/notifications/subscriptions'),
        fetch('/api/notifications/history'),
        fetch('/api/notifications/templates'),
        fetch('/api/users')
      ]);

      if (subscriptionsRes.ok) {
        const subscriptionsData = await subscriptionsRes.json();
        setSubscriptions(subscriptionsData);
      }

      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setNotificationHistory(historyData);
      }

      if (templatesRes.ok) {
        const templatesData = await templatesRes.json();
        setTemplates(templatesData);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendNotification = async () => {
    setSending(true);
    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationForm),
      });

      if (response.ok) {
        alert('Notification sent successfully!');
        setNotificationForm({
          title: '',
          body: '',
          icon: '',
          targetType: 'ALL',
          targetValue: '',
          templateId: ''
        });
        fetchData(); // Refresh history
      } else {
        alert('Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Error sending notification');
    } finally {
      setSending(false);
    }
  };

  const createTemplate = async () => {
    try {
      const response = await fetch('/api/notifications/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateForm),
      });

      if (response.ok) {
        const newTemplate = await response.json();
        setTemplates([...templates, newTemplate]);
        setTemplateForm({
          name: '',
          title: '',
          body: '',
          icon: '',
          category: 'SYSTEM'
        });
        setShowTemplateModal(false);
      }
    } catch (error) {
      console.error('Error creating template:', error);
    }
  };

  const toggleSubscription = async (subscriptionId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/notifications/subscriptions/${subscriptionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      });

      if (response.ok) {
        setSubscriptions(subscriptions.map(sub => 
          sub.id === subscriptionId ? { ...sub, isActive } : sub
        ));
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
    }
  };

  const useTemplate = (template: NotificationTemplate) => {
    setNotificationForm({
      ...notificationForm,
      title: template.title,
      body: template.body,
      icon: template.icon || '',
      templateId: template.id
    });
    setActiveTab('send');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      SENT: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
      PARTIALLY_SENT: 'bg-orange-100 text-orange-800',
    };
    return colors[status] || colors.PENDING;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      BOOKING: 'bg-blue-100 text-blue-800',
      PAYMENT: 'bg-green-100 text-green-800',
      SYSTEM: 'bg-gray-100 text-gray-800',
      MARKETING: 'bg-purple-100 text-purple-800',
      REMINDER: 'bg-yellow-100 text-yellow-800',
    };
    return colors[category] || colors.SYSTEM;
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'MOBILE':
        return '📱';
      case 'DESKTOP':
        return '💻';
      case 'TABLET':
        return '📋';
      default:
        return '📱';
    }
  };

  // Calculate stats
  const totalSubscriptions = subscriptions.length;
  const activeSubscriptions = subscriptions.filter(s => s.isActive).length;
  const totalNotifications = notificationHistory.length;
  const successfulNotifications = notificationHistory.filter(n => n.status === 'SENT').length;

  if (loading) {
    return (
      <div className="p-12 bg-white rounded-xl border shadow-sm">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full border-4 border-purple-600 animate-spin border-t-transparent"></div>
          <p className="mt-2 text-gray-500">Chargement des notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Bell className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications Push</h1>
              <p className="mt-1 text-gray-600">Gestion des notifications et abonnements</p>
            </div>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 font-medium text-white bg-gray-600 rounded-lg shadow-sm transition-all duration-200 hover:bg-gray-700 hover:shadow-md disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Abonnements Actifs</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {subscriptions.filter(s => s.isActive).length}
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <Bell className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="font-medium text-purple-600">{subscriptions.length}</span>
            <span className="ml-1 text-gray-500">total</span>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Notifications Envoyées</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{notificationHistory.length}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Send className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="font-medium text-green-600">
              {notificationHistory.filter(n => n.status === 'SENT').length}
            </span>
            <span className="ml-1 text-gray-500">réussies</span>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Modèles Actifs</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {templates.filter(t => t.isActive).length}
              </p>
            </div>
                         <div className="p-3 bg-blue-50 rounded-lg">
               <FileText className="w-6 h-6 text-blue-600" />
             </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="font-medium text-blue-600">{templates.length}</span>
            <span className="ml-1 text-gray-500">total</span>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Taux de Succès</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {notificationHistory.length > 0 
                  ? Math.round((notificationHistory.reduce((sum, n) => sum + n.successfulSends, 0) / 
                      notificationHistory.reduce((sum, n) => sum + n.totalRecipients, 0)) * 100)
                  : 0}%
              </p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="font-medium text-orange-600">
              {notificationHistory.reduce((sum, n) => sum + n.successfulSends, 0)}
            </span>
            <span className="ml-1 text-gray-500">envoyées</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'send', name: 'Envoyer', icon: Send },
              { id: 'subscriptions', name: 'Abonnements', icon: Users },
              { id: 'history', name: 'Historique', icon: History },
                             { id: 'templates', name: 'Modèles', icon: FileText },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'send' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Envoyer une Notification</h2>
                <button
                  onClick={() => setShowTemplateModal(true)}
                  className="inline-flex items-center px-4 py-2 font-medium text-white bg-purple-600 rounded-lg shadow-sm transition-all duration-200 hover:bg-purple-700 hover:shadow-md"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau Modèle
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Utiliser un modèle (optionnel)
                    </label>
                    <select
                      value={notificationForm.templateId}
                      onChange={(e) => {
                        const template = templates.find(t => t.id === e.target.value);
                        if (template) {
                          useTemplate(template);
                        } else {
                          setNotificationForm({ ...notificationForm, templateId: '' });
                        }
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Sélectionner un modèle...</option>
                      {templates.filter(t => t.isActive).map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Titre *
                    </label>
                    <input
                      type="text"
                      required
                      value={notificationForm.title}
                      onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Titre de la notification"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message *
                    </label>
                    <textarea
                      required
                      value={notificationForm.body}
                      onChange={(e) => setNotificationForm({ ...notificationForm, body: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={4}
                      placeholder="Contenu de la notification"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Icône (URL optionnelle)
                    </label>
                    <input
                      type="url"
                      value={notificationForm.icon}
                      onChange={(e) => setNotificationForm({ ...notificationForm, icon: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="https://example.com/icon.png"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type de cible
                    </label>
                    <select
                      value={notificationForm.targetType}
                      onChange={(e) => setNotificationForm({ 
                        ...notificationForm, 
                        targetType: e.target.value,
                        targetValue: ''
                      })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="ALL">Tous les utilisateurs</option>
                      <option value="ROLE">Par rôle</option>
                      <option value="USER">Utilisateur spécifique</option>
                    </select>
                  </div>

                  {notificationForm.targetType === 'ROLE' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sélectionner le rôle
                      </label>
                      <select
                        value={notificationForm.targetValue}
                        onChange={(e) => setNotificationForm({ ...notificationForm, targetValue: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="">Choisir un rôle...</option>
                        {roles.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {notificationForm.targetType === 'USER' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sélectionner l'utilisateur
                      </label>
                      <select
                        value={notificationForm.targetValue}
                        onChange={(e) => setNotificationForm({ ...notificationForm, targetValue: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="">Choisir un utilisateur...</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.firstName} {user.lastName} ({user.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="pt-4">
                    <button
                      onClick={sendNotification}
                      disabled={sending || !notificationForm.title || !notificationForm.body}
                      className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sending ? (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-white animate-spin border-t-transparent mr-2"></div>
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Envoyer la Notification
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'subscriptions' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  Abonnements aux Notifications ({subscriptions.length})
                </h2>
              </div>

              {subscriptions.length === 0 ? (
                <div className="p-12 text-center">
                  <Bell className="mx-auto w-12 h-12 text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-500">Aucun abonnement trouvé</p>
                  <p className="text-sm text-gray-400">Les utilisateurs doivent s'abonner aux notifications</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>Utilisateur</span>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Appareil</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dernière utilisation</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {subscriptions.map((subscription) => (
                        <tr key={subscription.id} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {subscription.user.firstName} {subscription.user.lastName}
                              </div>
                              <div className="text-sm text-gray-500">{subscription.user.email}</div>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                subscription.user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                                subscription.user.role === 'CUSTOMER' ? 'bg-blue-100 text-blue-800' :
                                subscription.user.role === 'CARRIER' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {subscription.user.role}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {subscription.deviceType === 'MOBILE' && <Smartphone className="w-4 h-4 text-gray-400 mr-2" />}
                              {subscription.deviceType === 'DESKTOP' && <Monitor className="w-4 h-4 text-gray-400 mr-2" />}
                              {subscription.deviceType === 'TABLET' && <Tablet className="w-4 h-4 text-gray-400 mr-2" />}
                              <div>
                                <div className="text-sm font-medium text-gray-900">{subscription.deviceType}</div>
                                <div className="text-sm text-gray-500 truncate max-w-32">{subscription.browserInfo}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              subscription.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {subscription.isActive ? 'Actif' : 'Inactif'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(subscription.lastUsed)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => toggleSubscription(subscription.id, !subscription.isActive)}
                              className={`text-sm font-medium ${
                                subscription.isActive 
                                  ? 'text-red-600 hover:text-red-900' 
                                  : 'text-green-600 hover:text-green-900'
                              } transition-colors duration-150`}
                            >
                              {subscription.isActive ? 'Désactiver' : 'Activer'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  Historique des Notifications ({notificationHistory.length})
                </h2>
              </div>

              {notificationHistory.length === 0 ? (
                <div className="p-12 text-center">
                  <History className="mx-auto w-12 h-12 text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-500">Aucune notification envoyée</p>
                  <p className="text-sm text-gray-400">L'historique apparaîtra ici après l'envoi de notifications</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notificationHistory
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((notification) => (
                      <div key={notification.id} className="p-6 bg-gray-50 rounded-xl border">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900">{notification.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{notification.body}</p>
                          </div>
                          <span className={`ml-4 px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(notification.status)}`}>
                            {notification.status === 'SENT' ? 'Envoyée' :
                             notification.status === 'FAILED' ? 'Échouée' :
                             notification.status === 'PENDING' ? 'En attente' : 'Partiellement envoyée'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">Destinataires</div>
                              <div className="text-sm text-gray-500">{notification.totalRecipients}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">Succès</div>
                              <div className="text-sm text-gray-500">{notification.successfulSends}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <XCircle className="w-4 h-4 text-red-500" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">Échecs</div>
                              <div className="text-sm text-gray-500">{notification.failedSends}</div>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>Créée par: {notification.createdBy.firstName} {notification.createdBy.lastName}</span>
                            <span>•</span>
                            <span>{formatDate(notification.createdAt)}</span>
                            {notification.sentAt && (
                              <>
                                <span>•</span>
                                <span>Envoyée: {formatDate(notification.sentAt)}</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              notification.targetType === 'ALL' ? 'bg-blue-100 text-blue-800' :
                              notification.targetType === 'ROLE' ? 'bg-green-100 text-green-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {notification.targetType === 'ALL' ? 'Tous' :
                               notification.targetType === 'ROLE' ? `Rôle: ${notification.targetValue}` :
                               'Utilisateur spécifique'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  Modèles de Notifications ({templates.length})
                </h2>
                <button
                  onClick={() => setShowTemplateModal(true)}
                  className="inline-flex items-center px-4 py-2 font-medium text-white bg-purple-600 rounded-lg shadow-sm transition-all duration-200 hover:bg-purple-700 hover:shadow-md"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau Modèle
                </button>
              </div>

              {templates.length === 0 ? (
                                 <div className="p-12 text-center">
                   <FileText className="mx-auto w-12 h-12 text-gray-400 mb-4" />
                   <p className="text-lg font-medium text-gray-500">Aucun modèle créé</p>
                  <p className="text-sm text-gray-400">Créez des modèles pour réutiliser vos notifications</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {templates.map((template) => (
                    <div key={template.id} className="p-6 border rounded-xl transition-all duration-200 hover:shadow-lg hover:border-purple-200">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(template.category)}`}>
                            {template.category}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => useTemplate(template)}
                            className="text-purple-600 hover:text-purple-900 transition-colors duration-150"
                            title="Utiliser ce modèle"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900 transition-colors duration-150"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="text-sm font-medium text-gray-700">Titre:</div>
                          <div className="text-sm text-gray-900">{template.title}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700">Message:</div>
                          <div className="text-sm text-gray-900 line-clamp-3">{template.body}</div>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {template.isActive ? 'Actif' : 'Inactif'}
                          </span>
                          <span className="text-xs text-gray-500">{formatDate(template.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Nouveau Modèle</h2>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-150"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du modèle *
                </label>
                <input
                  type="text"
                  required
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ex: Bienvenue nouvel utilisateur"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie
                </label>
                <select
                  value={templateForm.category}
                  onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="SYSTEM">Système</option>
                  <option value="BOOKING">Réservation</option>
                  <option value="PAYMENT">Paiement</option>
                  <option value="MARKETING">Marketing</option>
                  <option value="REMINDER">Rappel</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre *
                </label>
                <input
                  type="text"
                  required
                  value={templateForm.title}
                  onChange={(e) => setTemplateForm({ ...templateForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Titre de la notification"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  required
                  value={templateForm.body}
                  onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={4}
                  placeholder="Contenu de la notification"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icône (URL optionnelle)
                </label>
                <input
                  type="url"
                  value={templateForm.icon}
                  onChange={(e) => setTemplateForm({ ...templateForm, icon: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="https://example.com/icon.png"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Annuler
                </button>
                <button
                  onClick={createTemplate}
                  disabled={!templateForm.name || !templateForm.title || !templateForm.body}
                  className="flex-1 px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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