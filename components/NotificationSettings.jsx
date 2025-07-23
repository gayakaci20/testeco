import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const NotificationSettings = () => {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [preferences, setPreferences] = useState({
    bookings: true,
    payments: true,
    messages: true,
    matches: true,
    reminders: true,
    marketing: false
  });

  useEffect(() => {
    checkSubscriptionStatus();
    loadPreferences();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      if (typeof window !== 'undefined' && window.OneSignal) {
        const OneSignal = (await import('react-onesignal')).default;
        const subscribed = await OneSignal.isPushNotificationsEnabled();
        setIsSubscribed(subscribed);
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/notifications/preferences');
      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences || preferences);
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  };

  const enableNotifications = async () => {
    try {
      if (typeof window !== 'undefined' && window.OneSignal) {
        const OneSignal = (await import('react-onesignal')).default;
        
        // Demander la permission
        await OneSignal.showSlidedownPrompt();
        
        // Vérifier le statut après la demande
        setTimeout(async () => {
          const subscribed = await OneSignal.isPushNotificationsEnabled();
          setIsSubscribed(subscribed);
          
          if (subscribed && user?.id) {
            // Associer l'utilisateur
            await OneSignal.setExternalUserId(user.id.toString());
            
            // Mettre à jour les tags
            await OneSignal.sendTags({
              user_type: user.role,
              user_id: user.id.toString(),
              email: user.email
            });
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
    }
  };

  const disableNotifications = async () => {
    try {
      if (typeof window !== 'undefined' && window.OneSignal) {
        const OneSignal = (await import('react-onesignal')).default;
        await OneSignal.setSubscription(false);
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error('Error disabling notifications:', error);
    }
  };

  const updatePreferences = async (newPreferences) => {
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences: newPreferences }),
      });

      if (response.ok) {
        setPreferences(newPreferences);
        
        // Mettre à jour les tags OneSignal
        if (typeof window !== 'undefined' && window.OneSignal && isSubscribed) {
          const OneSignal = (await import('react-onesignal')).default;
          await OneSignal.sendTags({
            notifications_bookings: newPreferences.bookings,
            notifications_payments: newPreferences.payments,
            notifications_messages: newPreferences.messages,
            notifications_matches: newPreferences.matches,
            notifications_reminders: newPreferences.reminders,
            notifications_marketing: newPreferences.marketing
          });
        }
      } else {
        throw new Error('Failed to update preferences');
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      alert('Failed to update notification preferences');
    }
  };

  const handlePreferenceChange = (key, value) => {
    const newPreferences = {
      ...preferences,
      [key]: value
    };
    updatePreferences(newPreferences);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Notification Settings</h3>
        <p className="text-sm text-gray-600 mt-1">
          Manage how you receive notifications from EcoDeli
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Push Notifications Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Push Notifications</h4>
            <p className="text-sm text-gray-500">
              Receive real-time notifications on your device
            </p>
          </div>
          <div className="flex items-center">
            {isSubscribed ? (
              <button
                onClick={disableNotifications}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Disable
              </button>
            ) : (
              <button
                onClick={enableNotifications}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                Enable
              </button>
            )}
          </div>
        </div>

        {/* Notification Preferences */}
        {isSubscribed && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Notification Types</h4>
            
            <div className="space-y-3">
              {[
                {
                  key: 'bookings',
                  title: 'Booking Updates',
                  description: 'Confirmations, cancellations, and status changes'
                },
                {
                  key: 'payments',
                  title: 'Payment Notifications',
                  description: 'Payment confirmations and failed transactions'
                },
                {
                  key: 'messages',
                  title: 'New Messages',
                  description: 'When you receive new messages'
                },
                {
                  key: 'matches',
                  title: 'Match Notifications',
                  description: 'When we find matches for your packages or rides'
                },
                {
                  key: 'reminders',
                  title: 'Reminders',
                  description: 'Appointment reminders and storage expiry alerts'
                },
                {
                  key: 'marketing',
                  title: 'Promotional Offers',
                  description: 'Special offers and marketing updates'
                }
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <div className="flex-1">
                    <h5 className="text-sm font-medium text-gray-900">{item.title}</h5>
                    <p className="text-xs text-gray-500">{item.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences[item.key]}
                      onChange={(e) => handlePreferenceChange(item.key, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test Notification */}
        {isSubscribed && (
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={async () => {
                try {
                  const response = await fetch('/api/notifications/test', {
                    method: 'POST',
                  });
                  if (response.ok) {
                    alert('Test notification sent!');
                  }
                } catch (error) {
                  console.error('Error sending test notification:', error);
                }
              }}
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              Send Test Notification
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationSettings; 