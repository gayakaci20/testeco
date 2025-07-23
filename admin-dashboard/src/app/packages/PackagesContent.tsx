'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Search, Filter, RefreshCw, Edit3, Trash2, MapPin, User, Package, Calendar, Weight } from 'lucide-react';
import ExportCSVButton from '@/components/ExportCSVButton'

interface Package {
  id: string;
  description: string;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  weight: number | null;
  dimensions: string | null;
  fragile: boolean;
  urgent: boolean;
  trackingNumber: string;
  status: 'PENDING' | 'MATCHED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  price: number | null;
  size: string | null;
  imageUrl: string | null;
  createdAt: string;
  user: {
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  matches: Array<{
    id: string;
    status: string;
    ride: {
      id: string;
      user: {
        name: string | null;
        firstName: string | null;
        lastName: string | null;
        email: string;
        role: string;
      };
    };
  }>;
}

export default function PackagesContent() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/packages?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch packages');
      
      const data = await response.json();
      setPackages(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleFilter = () => {
    fetchPackages();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'En Attente' },
      MATCHED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Associé' },
      IN_TRANSIT: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'En Transit' },
      DELIVERED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Livré' },
      CANCELLED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Annulé' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">Erreur lors du chargement des colis: {error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Filters Section */}
      <div className="mb-6">
        <div className="bg-gray-50 rounded-lg p-4 border">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 inline mr-1" />
                Rechercher
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par description ou adresse..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div className="w-full md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-1" />
                Statut
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tous les statuts</option>
                <option value="PENDING">En Attente</option>
                <option value="MATCHED">Associé</option>
                <option value="IN_TRANSIT">En Transit</option>
                <option value="DELIVERED">Livré</option>
                <option value="CANCELLED">Annulé</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleFilter}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtrer
              </button>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                  fetchPackages();
                }}
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Réinitialiser
              </button>
              <ExportCSVButton data={packages} fileName="packages.csv" className="bg-green-600 hover:bg-green-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Packages Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <Package className="w-4 h-4 inline mr-1" />
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <User className="w-4 h-4 inline mr-1" />
                Expéditeur
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <User className="w-4 h-4 inline mr-1" />
                Destinataire
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <MapPin className="w-4 h-4 inline mr-1" />
                Adresses
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <Weight className="w-4 h-4 inline mr-1" />
                Poids
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <Calendar className="w-4 h-4 inline mr-1" />
                Créé le
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-2 text-gray-500">Chargement des colis...</p>
                  </div>
                </td>
              </tr>
            ) : packages.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <Package className="w-12 h-12 text-gray-400 mb-4" />
                    <p className="text-gray-500 text-lg font-medium">Aucun colis trouvé</p>
                    <p className="text-gray-400 text-sm">Essayez de modifier vos critères de recherche</p>
                  </div>
                </td>
              </tr>
            ) : (
              packages.map((pkg) => (
                <tr key={pkg.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900">{pkg.description}</div>
                      <div className="text-xs text-gray-400 font-mono mt-1">#{pkg.trackingNumber}</div>
                      <div className="text-xs text-gray-400 font-mono">ID: {pkg.id.slice(0, 8)}...</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900">
                        {(() => {
                          console.log('Package sender debug:', {
                            packageId: pkg.id,
                            senderName: pkg.senderName,
                            userName: pkg.user?.name,
                            userFirstName: pkg.user?.firstName,
                            userLastName: pkg.user?.lastName,
                            userEmail: pkg.user?.email
                          });
                          
                          if (pkg.senderName && pkg.senderName !== 'Sender') {
                            return pkg.senderName;
                          }
                          
                          if (pkg.user?.name) {
                            return pkg.user.name;
                          }
                          
                          const fullName = `${pkg.user?.firstName || ''} ${pkg.user?.lastName || ''}`.trim();
                          if (fullName) {
                            return fullName;
                          }
                          
                          return pkg.user?.email ? pkg.user.email.split('@')[0] : 'Utilisateur';
                        })()}
                      </div>
                      <div className="text-sm text-gray-500">{pkg.senderPhone}</div>
                      <div className="text-xs text-gray-400 truncate max-w-xs">{pkg.senderAddress}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900">
                        {(() => {
                          console.log('🔍 Package recipient debug:', {
                            packageId: pkg.id,
                            recipientName: pkg.recipientName,
                            recipientPhone: pkg.recipientPhone,
                            recipientAddress: pkg.recipientAddress,
                            matchesLength: pkg.matches?.length,
                            allMatches: pkg.matches,
                            firstMatch: pkg.matches?.[0]
                          });
                          
                          // Si le recipientName existe et n'est pas "Recipient", l'utiliser
                          if (pkg.recipientName && pkg.recipientName !== 'Recipient') {
                            console.log('✅ Using recipientName:', pkg.recipientName);
                            return pkg.recipientName;
                          }
                          
                          // Débugger tous les matches pour voir ce qu'on a
                          if (pkg.matches && pkg.matches.length > 0) {
                            console.log('🔍 Found matches:', pkg.matches.length);
                            pkg.matches.forEach((match, index) => {
                              console.log(`Match ${index}:`, {
                                id: match.id,
                                status: match.status,
                                ride: match.ride,
                                hasUser: !!match.ride?.user,
                                userDetails: match.ride?.user
                              });
                            });
                          } else {
                            console.log('❌ No matches found');
                          }
                          
                          // Chercher le carrier dans TOUS les matches (pas seulement le premier)
                          for (const match of pkg.matches || []) {
                            console.log('🔍 Checking match:', match.status, match.ride?.user);
                            if (match.ride?.user) {
                              const carrier = match.ride.user;
                              console.log('✅ Found carrier:', carrier);
                              
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
                          }
                          
                          console.log('❌ No carrier found, showing fallback');
                          return 'Aucun carrier assigné';
                        })()}
                      </div>
                      <div className="text-sm text-gray-500">{pkg.recipientPhone}</div>
                      <div className="text-xs text-gray-400 truncate max-w-xs">{pkg.recipientAddress}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-start">
                        <span className="text-xs text-green-600 font-medium mr-1">De:</span>
                        <span className="text-sm text-gray-900 max-w-xs truncate">{pkg.senderAddress}</span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-xs text-red-600 font-medium mr-1">À:</span>
                        <span className="text-sm text-gray-900 max-w-xs truncate">{pkg.recipientAddress}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      <div className="text-sm text-gray-900">
                        {pkg.weight ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {pkg.weight}kg
                          </span>
                        ) : (
                          <span className="text-gray-400">Non renseigné</span>
                        )}
                      </div>
                      <div className="flex space-x-1">
                        {pkg.fragile && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            Fragile
                          </span>
                        )}
                        {pkg.urgent && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            Urgent
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(pkg.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(pkg.createdAt), 'dd/MM/yyyy')}
                    <div className="text-xs text-gray-500">
                      {format(new Date(pkg.createdAt), 'HH:mm')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="inline-flex items-center px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors duration-150">
                        <Edit3 className="w-3 h-3 mr-1" />
                        Modifier
                      </button>
                      <button className="inline-flex items-center px-3 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors duration-150">
                        <Trash2 className="w-3 h-3 mr-1" />
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {packages.length > 0 && (
          <div className="bg-white px-6 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex items-center text-sm text-gray-700">
              <span className="font-medium">{packages.length}</span>
              <span className="ml-1">résultat{packages.length > 1 ? 's' : ''} trouvé{packages.length > 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 border border-gray-300 rounded-md bg-white text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors duration-150">
                Précédent
              </button>
              <span className="px-3 py-1 text-sm text-gray-700">Page 1</span>
              <button className="px-3 py-1 border border-gray-300 rounded-md bg-white text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors duration-150">
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 