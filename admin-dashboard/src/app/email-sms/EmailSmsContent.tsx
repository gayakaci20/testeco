'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';

interface NotificationHistory {
  id: string;
  type: 'email' | 'sms';
  templateType: string;
  recipient: string;
  status: 'sent' | 'failed' | 'pending';
  sentAt: string;
  error?: string;
  messageId?: string;
}

interface BulkSendForm {
  type: 'email' | 'sms' | 'both';
  templateType: string;
  recipients: string;
  customData: string;
}

interface Stats {
  totalSent: number;
  emailsSent: number;
  smsSent: number;
  failedDeliveries: number;
  successRate: number;
}

function formatDate(date: string) {
  return format(new Date(date), 'dd/MM/yyyy HH:mm');
}

export default function EmailSmsContent() {
  const [activeTab, setActiveTab] = useState('send');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalSent: 0,
    emailsSent: 0,
    smsSent: 0,
    failedDeliveries: 0,
    successRate: 0
  });
  const [history, setHistory] = useState<NotificationHistory[]>([]);
  const [bulkForm, setBulkForm] = useState<BulkSendForm>({
    type: 'email',
    templateType: 'WELCOME',
    recipients: '',
    customData: '{}'
  });

  useEffect(() => {
    fetchStats();
    fetchHistory();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/notifications/email-sms?action=stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/notifications/email-sms?action=history');
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const handleBulkSend = async () => {
    if (!bulkForm.recipients.trim()) {
      alert('Veuillez saisir au moins un destinataire');
      return;
    }

    setLoading(true);
    try {
      let customDataObj = {};
      try {
        customDataObj = JSON.parse(bulkForm.customData);
      } catch (e) {
        alert('Données JSON invalides');
        setLoading(false);
        return;
      }

      const recipients = bulkForm.recipients
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      const response = await fetch('/api/notifications/email-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'bulk_send',
          type: bulkForm.type,
          templateType: bulkForm.templateType,
          recipients: recipients,
          data: customDataObj
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`Notifications envoyées avec succès à ${recipients.length} destinataires!`);
        setBulkForm({
          ...bulkForm,
          recipients: '',
          customData: '{}'
        });
        fetchStats();
        fetchHistory();
      } else {
        alert(`Erreur lors de l'envoi: ${result.error}`);
      }
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      alert('Erreur lors de l\'envoi des notifications');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return '✅';
      case 'failed': return '❌';
      case 'pending': return '⏳';
      default: return '⚪';
    }
  };

  const tabs = [
    { id: 'send', label: 'Envoi Groupé', icon: '📤', count: null },
    { id: 'history', label: 'Historique', icon: '📋', count: history.length },
    { id: 'stats', label: 'Statistiques', icon: '📊', count: null },
    { id: 'templates', label: 'Gestion Templates', icon: '📝', count: null }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
          <div className="flex items-center">
            <div className="p-3 bg-blue-400 bg-opacity-50 rounded-lg">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-100">Total Envoyé</p>
              <p className="text-3xl font-bold">{stats.totalSent}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
          <div className="flex items-center">
            <div className="p-3 bg-green-400 bg-opacity-50 rounded-lg">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-100">Emails</p>
              <p className="text-3xl font-bold">{stats.emailsSent}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg text-white">
          <div className="flex items-center">
            <div className="p-3 bg-purple-400 bg-opacity-50 rounded-lg">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-100">SMS</p>
              <p className="text-3xl font-bold">{stats.smsSent}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-lg text-white">
          <div className="flex items-center">
            <div className="p-3 bg-red-400 bg-opacity-50 rounded-lg">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-red-100">Échecs</p>
              <p className="text-3xl font-bold">{stats.failedDeliveries}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-6 rounded-lg text-white">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-400 bg-opacity-50 rounded-lg">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-yellow-100">Taux de Réussite</p>
              <p className="text-3xl font-bold">{stats.successRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
              {tab.count !== null && (
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-sky-100 text-sky-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow">
        {/* Bulk Send Tab */}
        {activeTab === 'send' && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Form */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Envoi Groupé de Notifications</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type de Notification
                    </label>
                    <select
                      value={bulkForm.type}
                      onChange={(e) => setBulkForm({ ...bulkForm, type: e.target.value as 'email' | 'sms' | 'both' })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    >
                      <option value="email">Email Seulement</option>
                      <option value="sms">SMS Seulement</option>
                      <option value="both">Email & SMS</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Template
                    </label>
                    <select
                      value={bulkForm.templateType}
                      onChange={(e) => setBulkForm({ ...bulkForm, templateType: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    >
                      <option value="WELCOME">Bienvenue</option>
                      <option value="BOOKING_CONFIRMATION">Confirmation de Réservation</option>
                      <option value="DELIVERY_UPDATE">Mise à jour de Livraison</option>
                      <option value="PAYMENT_CONFIRMATION">Confirmation de Paiement</option>
                      <option value="SECURITY_ALERT">Alerte de Sécurité</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Destinataires
                    </label>
                    <textarea
                      value={bulkForm.recipients}
                      onChange={(e) => setBulkForm({ ...bulkForm, recipients: e.target.value })}
                      rows={8}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      placeholder="Saisissez les emails/téléphones, un par ligne:&#10;email@example.com&#10;+33123456789&#10;user@domain.com"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Un destinataire par ligne. Pour Email: adresses email. Pour SMS: numéros de téléphone avec indicatif (+33...)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Données Personnalisées (JSON)
                    </label>
                    <textarea
                      value={bulkForm.customData}
                      onChange={(e) => setBulkForm({ ...bulkForm, customData: e.target.value })}
                      rows={4}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      placeholder='{"customField": "customValue"}'
                    />
                  </div>

                  <button
                    onClick={handleBulkSend}
                    disabled={loading}
                    className="w-full bg-sky-600 text-white px-4 py-3 rounded-lg hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Envoi en cours...' : 'Envoyer aux Destinataires'}
                  </button>
                </div>
              </div>

              {/* Preview */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Aperçu</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Type:</span>
                      <span className="text-sm font-medium">{bulkForm.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Template:</span>
                      <span className="text-sm font-medium">{bulkForm.templateType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Destinataires:</span>
                      <span className="text-sm font-medium">
                        {bulkForm.recipients.split('\n').filter(line => line.trim().length > 0).length}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Instructions:</h4>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Utilisez un destinataire par ligne</li>
                    <li>• Pour les SMS, incluez l'indicatif pays (+33 pour la France)</li>
                    <li>• Les données JSON personnalisées remplacent les valeurs par défaut</li>
                    <li>• Vérifiez la configuration email/SMS dans l'onglet Tests</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Template</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destinataire</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date d'envoi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message ID</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.type === 'email' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {item.type === 'email' ? '📧 Email' : '📱 SMS'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.templateType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.recipient}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                        <span className="mr-1">{getStatusIcon(item.status)}</span>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(item.sentAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {item.messageId || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {history.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                Aucun historique de notifications pour le moment.
              </div>
            )}
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Répartition par Type</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Emails envoyés:</span>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${stats.totalSent > 0 ? (stats.emailsSent / stats.totalSent) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="font-medium">{stats.emailsSent}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">SMS envoyés:</span>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                        <div 
                          className="bg-purple-600 h-2 rounded-full" 
                          style={{ width: `${stats.totalSent > 0 ? (stats.smsSent / stats.totalSent) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="font-medium">{stats.smsSent}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Performance</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Taux de réussite:</span>
                    <span className="font-medium text-green-600">{stats.successRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total envoyé:</span>
                    <span className="font-medium">{stats.totalSent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Échecs:</span>
                    <span className="font-medium text-red-600">{stats.failedDeliveries}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="p-6">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Gestion des Templates</h3>
              <p className="text-gray-600">La gestion avancée des templates sera implémentée dans une future mise à jour</p>
              <p className="text-sm text-gray-500 mt-2">
                Pour le moment, les templates sont définis dans le code. Consultez l'onglet Tests pour voir les templates disponibles.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}