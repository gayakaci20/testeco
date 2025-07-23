'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';

interface DashboardData {
  users: any[];
  packages: any[];
  rides: any[];
  matches: any[];
  payments: any[];
  messages: any[];
  notifications: any[];
}

function formatDate(date: string) {
  return format(new Date(date), 'dd/MM/yyyy HH:mm');
}

// Fonction utilitaire pour tronquer le texte
function truncateText(text: string, maxLength: number = 30): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export default function DashboardContent() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/dashboard');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        const jsonData = await response.json();
        setData(jsonData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    };

    fetchDashboardData();
  }, []);

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const tabs = [
    { id: 'users', label: 'Utilisateurs' },
    { id: 'packages', label: 'Colis' },
    { id: 'rides', label: 'Trajets' },
    { id: 'matches', label: 'Correspondances' },
    { id: 'payments', label: 'Paiements' },
    { id: 'messages', label: 'Messages' },
    { id: 'notifications', label: 'Notifications' },
  ];

  const renderTable = () => {
    switch (activeTab) {
      case 'users':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Nom</th>
                  <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Email</th>
                  <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Téléphone</th>
                  <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Rôle</th>
                  <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Vérifié</th>
                  <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Créé le</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 max-w-xs">
                      <div className="truncate" title={user.name || `${user.firstName} ${user.lastName}`}>
                        {truncateText(user.name || `${user.firstName} ${user.lastName}`, 25)}
                      </div>
                    </td>
                    <td className="px-3 py-2 max-w-xs">
                      <div className="truncate" title={user.email}>
                        {truncateText(user.email, 25)}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs whitespace-nowrap">{user.phoneNumber || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center whitespace-nowrap">{user.isVerified ? '✅' : '❌'}</td>
                    <td className="px-3 py-2 text-xs whitespace-nowrap">{format(new Date(user.createdAt), 'dd/MM/yy')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'packages':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Description</th>
                  <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Expéditeur</th>
                  <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Destinataire</th>
                  <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Statut</th>
                  <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Poids</th>
                  <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.packages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 max-w-xs">
                      <div className="truncate" title={pkg.description}>
                        {truncateText(pkg.description, 20)}
                      </div>
                    </td>
                    <td className="px-3 py-2 max-w-xs">
                      <div className="truncate" title={pkg.senderName && pkg.senderName !== 'Sender' 
                        ? pkg.senderName 
                        : (pkg.user?.name || 
                           `${pkg.user?.firstName || ''} ${pkg.user?.lastName || ''}`.trim() || 
                           'Utilisateur')}>
                        {truncateText(
                          pkg.senderName && pkg.senderName !== 'Sender' 
                            ? pkg.senderName 
                            : (pkg.user?.name || 
                               `${pkg.user?.firstName || ''} ${pkg.user?.lastName || ''}`.trim() || 
                               'Utilisateur'), 
                          20
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 max-w-xs">
                      <div className="truncate" title={(() => {
                        // Si le recipientName existe et n'est pas "Recipient", l'utiliser
                        if (pkg.recipientName && pkg.recipientName !== 'Recipient') {
                          return pkg.recipientName;
                        }
                        
                        // Sinon, chercher le carrier dans les matches
                        const activeMatch = pkg.matches?.[0];
                        if (activeMatch?.ride?.user) {
                          const carrier = activeMatch.ride.user;
                          if (carrier.name) {
                            return `${carrier.name} (CARRIER)`;
                          }
                          const fullName = `${carrier.firstName || ''} ${carrier.lastName || ''}`.trim();
                          if (fullName) {
                            return `${fullName} (CARRIER)`;
                          }
                          if (carrier.email) {
                            return `${carrier.email.split('@')[0]} (CARRIER)`;
                          }
                        }
                        
                        return 'Aucun carrier assigné';
                      })()}>
                        {truncateText((() => {
                          // Si le recipientName existe et n'est pas "Recipient", l'utiliser
                          if (pkg.recipientName && pkg.recipientName !== 'Recipient') {
                            return pkg.recipientName;
                          }
                          
                          // Sinon, chercher le carrier dans les matches
                          const activeMatch = pkg.matches?.[0];
                          if (activeMatch?.ride?.user) {
                            const carrier = activeMatch.ride.user;
                            if (carrier.name) {
                              return `${carrier.name} (CARRIER)`;
                            }
                            const fullName = `${carrier.firstName || ''} ${carrier.lastName || ''}`.trim();
                            if (fullName) {
                              return `${fullName} (CARRIER)`;
                            }
                            if (carrier.email) {
                              return `${carrier.email.split('@')[0]} (CARRIER)`;
                            }
                          }
                          
                          return 'Aucun carrier assigné';
                        })(), 20)}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">
                        {pkg.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs whitespace-nowrap">{pkg.weight ? `${pkg.weight}kg` : '-'}</td>
                    <td className="px-3 py-2 text-xs whitespace-nowrap">{format(new Date(pkg.createdAt), 'dd/MM/yy')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'rides':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Conducteur</th>
                  <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Départ</th>
                  <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Arrivée</th>
                  <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Date départ</th>
                  <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Places</th>
                  <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Statut</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.rides.map((ride) => (
                  <tr key={ride.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 max-w-xs">
                      <div className="truncate" title={ride.user.name}>
                        {truncateText(ride.user.name, 20)}
                      </div>
                    </td>
                    <td className="px-3 py-2 max-w-xs">
                      <div className="truncate" title={ride.startLocation}>
                        {truncateText(ride.startLocation, 20)}
                      </div>
                    </td>
                    <td className="px-3 py-2 max-w-xs">
                      <div className="truncate" title={ride.endLocation}>
                        {truncateText(ride.endLocation, 20)}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs whitespace-nowrap">{format(new Date(ride.departureTime), 'dd/MM/yy HH:mm')}</td>
                    <td className="px-3 py-2 text-center whitespace-nowrap">{ride.availableSeats}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold text-purple-800 bg-purple-100 rounded-full">
                        {ride.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'matches':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Colis</th>
                  <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Trajet</th>
                  <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Statut</th>
                  <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Prix</th>
                  <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.matches.map((match) => (
                  <tr key={match.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 max-w-xs">
                      <div className="truncate" title={match.package.description}>
                        {truncateText(match.package.description, 20)}
                      </div>
                    </td>
                    <td className="px-3 py-2 max-w-xs">
                      <div className="truncate" title={`${match.ride.startLocation} → ${match.ride.endLocation}`}>
                        {truncateText(`${match.ride.startLocation} → ${match.ride.endLocation}`, 25)}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold text-orange-800 bg-orange-100 rounded-full">
                        {match.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-medium text-green-600 whitespace-nowrap">{match.price ? `€${match.price}` : '-'}</td>
                    <td className="px-3 py-2 text-xs whitespace-nowrap">{format(new Date(match.createdAt), 'dd/MM/yy')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'payments':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Utilisateur</th>
                  <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Montant</th>
                  <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Statut</th>
                  <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Méthode</th>
                  <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 max-w-xs">
                      <div className="truncate" title={payment.user.name}>
                        {truncateText(payment.user.name, 20)}
                      </div>
                    </td>
                    <td className="px-3 py-2 font-medium text-green-600 whitespace-nowrap">{`€${payment.amount}`}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded-full">
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs whitespace-nowrap">{payment.paymentMethod || '-'}</td>
                    <td className="px-3 py-2 text-xs whitespace-nowrap">{format(new Date(payment.createdAt), 'dd/MM/yy')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'messages':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">De</th>
                  <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">À</th>
                  <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Message</th>
                  <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Lu</th>
                  <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.messages.map((message) => (
                  <tr key={message.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 max-w-xs">
                      <div className="truncate" title={message.sender.name}>
                        {truncateText(message.sender.name, 15)}
                      </div>
                    </td>
                    <td className="px-3 py-2 max-w-xs">
                      <div className="truncate" title={message.receiver.name}>
                        {truncateText(message.receiver.name, 15)}
                      </div>
                    </td>
                    <td className="px-3 py-2 max-w-sm">
                      <div className="line-clamp-2" title={message.content}>
                        {truncateText(message.content, 50)}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center whitespace-nowrap">{message.read ? '✅' : '❌'}</td>
                    <td className="px-3 py-2 text-xs whitespace-nowrap">{format(new Date(message.createdAt), 'dd/MM/yy')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'notifications':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Utilisateur</th>
                  <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Type</th>
                  <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Message</th>
                  <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.notifications.map((notification) => (
                  <tr key={notification.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 max-w-xs">
                      <div className="truncate" title={notification.user.name}>
                        {truncateText(notification.user.name, 20)}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 rounded-full">
                        {notification.type}
                      </span>
                    </td>
                    <td className="px-3 py-2 max-w-sm">
                      <div className="line-clamp-2" title={notification.message}>
                        {truncateText(notification.message, 50)}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs whitespace-nowrap">{format(new Date(notification.createdAt), 'dd/MM/yy')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="bg-white rounded-lg shadow">
        {renderTable()}
      </div>
    </div>
  );
} 