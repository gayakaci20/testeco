'use client';

import { useState, useEffect } from 'react';
import { Settings, User, Bell, CreditCard, Shield, Zap, Monitor, Database, Save, Lock, Eye, EyeOff, Check, X } from 'lucide-react';

interface AppSettings {
  general: {
    appName: string;
    supportEmail: string;
    defaultLanguage: string;
    timezone: string;
    maintenanceMode: boolean;
    allowRegistration: boolean;
  };
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
    emailProvider: string;
    smsProvider: string;
  };
  payments: {
    stripeEnabled: boolean;
    paypalEnabled: boolean;
    defaultCurrency: string;
    taxRate: number;
    commissionRate: number;
  };
  security: {
    passwordMinLength: number;
    requireTwoFactor: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    requireEmailVerification: boolean;
  };
  features: {
    deliveryTracking: boolean;
    storageBoxes: boolean;
    serviceBookings: boolean;
    chatSupport: boolean;
    ratingSystem: boolean;
  };
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
  };
  dashboard: {
    defaultView: string;
    itemsPerPage: number;
    autoRefresh: boolean;
    refreshInterval: number;
  };
}

interface SystemInfo {
  version: string;
  environment: string;
  database: {
    status: 'connected' | 'disconnected';
    version: string;
    size: string;
  };
  cache: {
    status: 'active' | 'inactive';
    hitRate: number;
    size: string;
  };
  storage: {
    used: string;
    available: string;
    total: string;
  };
  lastBackup: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'payments' | 'security' | 'features' | 'preferences' | 'system'>('general');
  const [appSettings, setAppSettings] = useState<AppSettings>({
    general: {
      appName: 'EcoDeli Admin',
      supportEmail: 'support@ecodeli.com',
      defaultLanguage: 'fr',
      timezone: 'Europe/Paris',
      maintenanceMode: false,
      allowRegistration: true,
    },
    notifications: {
      emailEnabled: true,
      smsEnabled: true,
      pushEnabled: true,
      emailProvider: 'sendgrid',
      smsProvider: 'twilio',
    },
    payments: {
      stripeEnabled: true,
      paypalEnabled: false,
      defaultCurrency: 'EUR',
      taxRate: 20,
      commissionRate: 5,
    },
    security: {
      passwordMinLength: 8,
      requireTwoFactor: false,
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      requireEmailVerification: true,
    },
    features: {
      deliveryTracking: true,
      storageBoxes: true,
      serviceBookings: true,
      chatSupport: true,
      ratingSystem: true,
    },
  });

  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    theme: 'light',
    language: 'fr',
    notifications: {
      email: true,
      push: true,
      desktop: false,
    },
    dashboard: {
      defaultView: 'overview',
      itemsPerPage: 20,
      autoRefresh: true,
      refreshInterval: 30,
    },
  });

  const [systemInfo, setSystemInfo] = useState<SystemInfo>({
    version: '1.0.0',
    environment: 'production',
    database: {
      status: 'connected',
      version: 'PostgreSQL 14.5',
      size: '2.1 GB',
    },
    cache: {
      status: 'active',
      hitRate: 95.2,
      size: '512 MB',
    },
    storage: {
      used: '1.8 GB',
      available: '8.2 GB',
      total: '10 GB',
    },
    lastBackup: '2024-01-15T10:30:00Z',
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const tabs = [
    { key: 'general', label: 'Général', icon: Settings, color: 'blue' },
    { key: 'notifications', label: 'Notifications', icon: Bell, color: 'purple' },
    { key: 'payments', label: 'Paiements', icon: CreditCard, color: 'green' },
    { key: 'security', label: 'Sécurité', icon: Shield, color: 'red' },
    { key: 'features', label: 'Fonctionnalités', icon: Zap, color: 'orange' },
    { key: 'preferences', label: 'Préférences', icon: User, color: 'indigo' },
    { key: 'system', label: 'Système', icon: Monitor, color: 'gray' }
  ];

  const saveSettings = async (section: keyof AppSettings, data: any) => {
    setSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, data }),
      });

      if (response.ok) {
        alert('Paramètres sauvegardés avec succès!');
      } else {
        alert('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }

    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (response.ok) {
        alert('Mot de passe changé avec succès!');
        setShowPasswordModal(false);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        alert('Erreur lors du changement de mot de passe');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Erreur lors du changement de mot de passe');
    }
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

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="p-6 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-slate-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-slate-100 rounded-lg">
              <Settings className="w-8 h-8 text-slate-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
              <p className="mt-1 text-gray-600">Gérez les paramètres de l'application et vos préférences</p>
            </div>
          </div>
          <button 
            onClick={() => setShowPasswordModal(true)}
            className="inline-flex items-center px-6 py-3 font-medium text-white bg-slate-600 rounded-lg shadow-sm transition-all duration-200 hover:bg-slate-700 hover:shadow-md"
          >
            <Lock className="mr-2 w-5 h-5" />
            Changer le Mot de Passe
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6 overflow-x-auto">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors duration-200 flex items-center space-x-2 ${
                    activeTab === tab.key
                      ? `border-${tab.color}-500 text-${tab.color}-600`
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="max-w-4xl">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Paramètres Généraux</h3>
                <p className="text-gray-600">Configuration générale de l'application</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom de l'Application</label>
                    <input
                      type="text"
                      value={appSettings.general.appName}
                      onChange={(e) => setAppSettings({
                        ...appSettings,
                        general: { ...appSettings.general, appName: e.target.value }
                      })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email de Support</label>
                    <input
                      type="email"
                      value={appSettings.general.supportEmail}
                      onChange={(e) => setAppSettings({
                        ...appSettings,
                        general: { ...appSettings.general, supportEmail: e.target.value }
                      })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Langue par Défaut</label>
                    <select
                      value={appSettings.general.defaultLanguage}
                      onChange={(e) => setAppSettings({
                        ...appSettings,
                        general: { ...appSettings.general, defaultLanguage: e.target.value }
                      })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    >
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                      <option value="es">Español</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fuseau Horaire</label>
                    <select
                      value={appSettings.general.timezone}
                      onChange={(e) => setAppSettings({
                        ...appSettings,
                        general: { ...appSettings.general, timezone: e.target.value }
                      })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    >
                      <option value="Europe/Paris">Europe/Paris</option>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New_York</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Options Système</h4>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Mode Maintenance</span>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={appSettings.general.maintenanceMode}
                            onChange={(e) => setAppSettings({
                              ...appSettings,
                              general: { ...appSettings.general, maintenanceMode: e.target.checked }
                            })}
                            className="sr-only"
                          />
                          <div className={`w-10 h-6 rounded-full transition-colors ${appSettings.general.maintenanceMode ? 'bg-red-500' : 'bg-gray-300'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${appSettings.general.maintenanceMode ? 'translate-x-5' : 'translate-x-1'} mt-1`}></div>
                          </div>
                        </div>
                      </label>

                      <label className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Autoriser les Inscriptions</span>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={appSettings.general.allowRegistration}
                            onChange={(e) => setAppSettings({
                              ...appSettings,
                              general: { ...appSettings.general, allowRegistration: e.target.checked }
                            })}
                            className="sr-only"
                          />
                          <div className={`w-10 h-6 rounded-full transition-colors ${appSettings.general.allowRegistration ? 'bg-green-500' : 'bg-gray-300'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${appSettings.general.allowRegistration ? 'translate-x-5' : 'translate-x-1'} mt-1`}></div>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={() => saveSettings('general', appSettings.general)}
                    disabled={saving}
                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Sauvegarde...' : 'Sauvegarder les Paramètres'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <div className="max-w-4xl">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Paramètres de Notifications</h3>
                <p className="text-gray-600">Gérez les notifications et les fournisseurs de services</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Bell className="w-4 h-4 mr-2 text-purple-600" />
                      Types de Notifications
                    </h4>
                    <div className="space-y-3">
                      {[
                        { key: 'emailEnabled', label: 'Notifications Email', color: 'blue' },
                        { key: 'smsEnabled', label: 'Notifications SMS', color: 'green' },
                        { key: 'pushEnabled', label: 'Notifications Push', color: 'purple' }
                      ].map((item) => (
                        <label key={item.key} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{item.label}</span>
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={appSettings.notifications[item.key as keyof typeof appSettings.notifications] as boolean}
                              onChange={(e) => setAppSettings({
                                ...appSettings,
                                notifications: { ...appSettings.notifications, [item.key]: e.target.checked }
                              })}
                              className="sr-only"
                            />
                            <div className={`w-10 h-6 rounded-full transition-colors ${(appSettings.notifications[item.key as keyof typeof appSettings.notifications] as boolean) ? `bg-${item.color}-500` : 'bg-gray-300'}`}>
                              <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${(appSettings.notifications[item.key as keyof typeof appSettings.notifications] as boolean) ? 'translate-x-5' : 'translate-x-1'} mt-1`}></div>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fournisseur Email</label>
                    <select
                      value={appSettings.notifications.emailProvider}
                      onChange={(e) => setAppSettings({
                        ...appSettings,
                        notifications: { ...appSettings.notifications, emailProvider: e.target.value }
                      })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                    >
                      <option value="sendgrid">SendGrid</option>
                      <option value="mailgun">Mailgun</option>
                      <option value="ses">Amazon SES</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fournisseur SMS</label>
                    <select
                      value={appSettings.notifications.smsProvider}
                      onChange={(e) => setAppSettings({
                        ...appSettings,
                        notifications: { ...appSettings.notifications, smsProvider: e.target.value }
                      })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                    >
                      <option value="twilio">Twilio</option>
                      <option value="nexmo">Nexmo</option>
                      <option value="aws-sns">AWS SNS</option>
                    </select>
                  </div>

                  <button
                    onClick={() => saveSettings('notifications', appSettings.notifications)}
                    disabled={saving}
                    className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-300 transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Sauvegarde...' : 'Sauvegarder les Notifications'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* System Info */}
          {activeTab === 'system' && (
            <div className="max-w-4xl">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Informations Système</h3>
                <p className="text-gray-600">État et statistiques du système</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">Base de Données</h4>
                    <Database className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Statut:</span>
                      <span className={`flex items-center ${systemInfo.database.status === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
                        {systemInfo.database.status === 'connected' ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                        {systemInfo.database.status === 'connected' ? 'Connectée' : 'Déconnectée'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Version:</span>
                      <span className="text-gray-900">{systemInfo.database.version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Taille:</span>
                      <span className="text-gray-900">{systemInfo.database.size}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">Cache</h4>
                    <Zap className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Statut:</span>
                      <span className={`flex items-center ${systemInfo.cache.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                        {systemInfo.cache.status === 'active' ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                        {systemInfo.cache.status === 'active' ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Taux de Hit:</span>
                      <span className="text-gray-900">{systemInfo.cache.hitRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Taille:</span>
                      <span className="text-gray-900">{systemInfo.cache.size}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">Stockage</h4>
                    <Database className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Utilisé:</span>
                      <span className="text-gray-900">{systemInfo.storage.used}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Disponible:</span>
                      <span className="text-gray-900">{systemInfo.storage.available}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total:</span>
                      <span className="text-gray-900">{systemInfo.storage.total}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Informations Générales</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Version:</span>
                    <span className="text-gray-900">{systemInfo.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Environnement:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${systemInfo.environment === 'production' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {systemInfo.environment}
                    </span>
                  </div>
                  <div className="flex justify-between md:col-span-2">
                    <span className="text-gray-600">Dernière Sauvegarde:</span>
                    <span className="text-gray-900">{formatDate(systemInfo.lastBackup)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Other tabs would be implemented similarly with modern design */}
          {activeTab !== 'general' && activeTab !== 'notifications' && activeTab !== 'system' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Section en Développement</h3>
              <p className="text-gray-600">Cette section sera bientôt disponible.</p>
            </div>
          )}
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Changer le Mot de Passe</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe actuel</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nouveau mot de passe</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirmer le nouveau mot de passe</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={changePassword}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Changer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 