'use client';

import { useEffect, useState } from 'react';

interface ConfigStatus {
  email: {
    success: boolean;
    error?: string;
  };
  sms: {
    success: boolean;
    error?: string;
    accountName?: string;
  };
  configured: {
    email: boolean;
    sms: boolean;
  };
}

interface Templates {
  email: string[];
  sms: string[];
}

interface TestResult {
  success: boolean;
  messageId?: string;
  error?: string;
  reason?: string;
}

interface TestResults {
  email?: TestResult;
  sms?: TestResult;
}

export default function NotificationTestContent() {
  const [activeTab, setActiveTab] = useState('test');
  const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null);
  const [templates, setTemplates] = useState<Templates>({ email: [], sms: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [testForm, setTestForm] = useState({
    type: 'email',
    templateType: 'WELCOME',
    customData: '{}'
  });
  const [testResults, setTestResults] = useState<{ result: TestResults } | null>(null);

  useEffect(() => {
    fetchConfigStatus();
    fetchTemplates();
  }, []);

  const fetchConfigStatus = async () => {
    try {
      const response = await fetch('/api/notifications/email-sms?action=test');
      if (response.ok) {
        const data = await response.json();
        setConfigStatus(data);
      }
    } catch (error) {
      console.error('Error fetching config status:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/notifications/email-sms?action=templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleTestSend = async () => {
    setIsLoading(true);
    setTestResults(null);

    try {
      let customDataObj = {};
      try {
        customDataObj = JSON.parse(testForm.customData);
      } catch (e) {
        alert('Invalid JSON in custom data');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/notifications/email-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'test_send',
          type: testForm.type,
          templateType: testForm.templateType,
          data: customDataObj
        }),
      });

      const result = await response.json();
      setTestResults(result);

      if (result.result?.success || result.result?.email?.success || result.result?.sms?.success) {
        alert('Test notification envoyée avec succès!');
      } else {
        alert('Échec de l\'envoi de la notification test. Vérifiez les résultats ci-dessous.');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      alert('Erreur lors de l\'envoi de la notification test');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status?: TestResult) => {
    if (status?.success) return '✅';
    if (status?.success === false) return '❌';
    return '⚪';
  };

  const getStatusColor = (status?: TestResult) => {
    if (status?.success) return 'text-green-600';
    if (status?.success === false) return 'text-red-600';
    return 'text-gray-600';
  };

  const tabs = [
    { id: 'test', label: 'Test Notifications', icon: '🧪' },
    { id: 'config', label: 'Configuration', icon: '⚙️' },
    { id: 'templates', label: 'Templates', icon: '📋' },
    { id: 'logs', label: 'Logs', icon: '📝' }
  ];

  return (
    <div className="space-y-6">
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
            </button>
          ))}
        </nav>
      </div>

      {/* Test Tab */}
      {activeTab === 'test' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Form */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Envoyer une Notification Test</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de Notification
                </label>
                <select
                  value={testForm.type}
                  onChange={(e) => setTestForm({ ...testForm, type: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                >
                  <option value="email">Email Seulement</option>
                  <option value="sms">SMS Seulement</option>
                  <option value="both">Email & SMS</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de Template
                </label>
                <select
                  value={testForm.templateType}
                  onChange={(e) => setTestForm({ ...testForm, templateType: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                >
                  {testForm.type === 'sms' 
                    ? templates.sms.map((template) => (
                        <option key={template} value={template}>{template}</option>
                      ))
                    : templates.email.map((template) => (
                        <option key={template} value={template}>{template}</option>
                      ))
                  }
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Données Personnalisées (JSON)
                </label>
                <textarea
                  value={testForm.customData}
                  onChange={(e) => setTestForm({ ...testForm, customData: e.target.value })}
                  rows={6}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  placeholder='{"customField": "customValue"}'
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optionnel: Ajoutez des données personnalisées pour remplacer les valeurs par défaut
                </p>
              </div>

              <button
                onClick={handleTestSend}
                disabled={isLoading}
                className="w-full bg-sky-600 text-white px-4 py-3 rounded-lg hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Envoi en cours...' : 'Envoyer Notification Test'}
              </button>
            </div>
          </div>

          {/* Test Results */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Résultats du Test</h3>
            {testResults ? (
              <div className="space-y-4">
                {testResults.result?.email && (
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-gray-900">Email</span>
                      <span className={`text-2xl ${getStatusColor(testResults.result.email)}`}>
                        {getStatusIcon(testResults.result.email)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {testResults.result.email.success 
                        ? `Envoyé avec succès (ID: ${testResults.result.email.messageId})`
                        : `Échec: ${testResults.result.email.error || testResults.result.email.reason}`
                      }
                    </div>
                  </div>
                )}

                {testResults.result?.sms && (
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-gray-900">SMS</span>
                      <span className={`text-2xl ${getStatusColor(testResults.result.sms)}`}>
                        {getStatusIcon(testResults.result.sms)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {testResults.result.sms.success 
                        ? `Envoyé avec succès (ID: ${testResults.result.sms.messageId})`
                        : `Échec: ${testResults.result.sms.error || testResults.result.sms.reason}`
                      }
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                Aucun résultat de test pour le moment. Envoyez une notification test pour voir les résultats ici.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Configuration Tab */}
      {activeTab === 'config' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email Configuration */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Service Email</h3>
                <span className={`text-3xl ${configStatus?.configured?.email ? 'text-green-600' : 'text-red-600'}`}>
                  {configStatus?.configured?.email ? '✅' : '❌'}
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">SMTP Host:</span>
                  <span className="text-sm font-medium">
                    {configStatus?.configured?.email ? 'Configuré' : 'Non configuré'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">SMTP User:</span>
                  <span className="text-sm font-medium">
                    {configStatus?.configured?.email ? 'Configuré' : 'Non configuré'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Test de Connexion:</span>
                  <span className={`text-sm font-medium ${getStatusColor(configStatus?.email)}`}>
                    {configStatus?.email?.success ? 'Succès' : 'Échec'}
                  </span>
                </div>
                {configStatus?.email?.error && (
                  <div className="text-xs text-red-600 mt-2 p-2 bg-red-50 rounded">
                    Erreur: {configStatus.email.error}
                  </div>
                )}
              </div>
            </div>

            {/* SMS Configuration */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Service SMS (Twilio)</h3>
                <span className={`text-3xl ${configStatus?.configured?.sms ? 'text-green-600' : 'text-red-600'}`}>
                  {configStatus?.configured?.sms ? '✅' : '❌'}
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Account SID:</span>
                  <span className="text-sm font-medium">
                    {configStatus?.configured?.sms ? 'Configuré' : 'Non configuré'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Auth Token:</span>
                  <span className="text-sm font-medium">
                    {configStatus?.configured?.sms ? 'Configuré' : 'Non configuré'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Test de Connexion:</span>
                  <span className={`text-sm font-medium ${getStatusColor(configStatus?.sms)}`}>
                    {configStatus?.sms?.success ? 'Succès' : 'Échec'}
                  </span>
                </div>
                {configStatus?.sms?.accountName && (
                  <div className="text-xs text-green-600 mt-2 p-2 bg-green-50 rounded">
                    Compte: {configStatus.sms.accountName}
                  </div>
                )}
                {configStatus?.sms?.error && (
                  <div className="text-xs text-red-600 mt-2 p-2 bg-red-50 rounded">
                    Erreur: {configStatus.sms.error}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-3">Instructions de Configuration:</h4>
            <div className="text-sm text-blue-800 space-y-2">
              <p><strong>Pour Email:</strong> Définissez SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS dans votre fichier .env</p>
              <p><strong>Pour SMS:</strong> Définissez TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER dans votre fichier .env</p>
            </div>
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email Templates */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Templates Email</h3>
            <div className="space-y-3">
              {templates.email.map((template) => (
                <div key={template} className="p-3 border rounded-lg flex justify-between items-center">
                  <span className="font-medium text-gray-900">{template}</span>
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">HTML</span>
                </div>
              ))}
            </div>
          </div>

          {/* SMS Templates */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Templates SMS</h3>
            <div className="space-y-3">
              {templates.sms.map((template) => (
                <div key={template} className="p-3 border rounded-lg flex justify-between items-center">
                  <span className="font-medium text-gray-900">{template}</span>
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">Texte</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Fonctionnalité Logs</h3>
            <p className="text-gray-600">Les logs de notifications seront implémentés dans une future mise à jour</p>
          </div>
        </div>
      )}
    </div>
  );
}