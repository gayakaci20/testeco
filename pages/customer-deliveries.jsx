import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import RoleBasedNavigation from '../components/RoleBasedNavigation';
import { 
  CreditCard,
  Package,
  MapPin,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  MessageCircle,
  Truck,
  ArrowLeft,
  User,
  Loader
} from 'lucide-react';

export default function CustomerDeliveriesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [myPackages, setMyPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (user.role !== 'CUSTOMER') {
      router.push('/dashboard');
      return;
    }

    fetchMyPackagesWithMatches();
  }, [user]);

  const fetchMyPackagesWithMatches = async () => {
    try {
      setLoading(true);
      
      // Fetch packages that belong to the user
      const packagesResponse = await fetch('/api/packages', {
        headers: {
          'x-user-id': user?.id || ''
        }
      });

      if (!packagesResponse.ok) {
        throw new Error('Erreur lors du chargement des colis');
      }

      const packages = await packagesResponse.json();
      
      // For each package, fetch its matches
      const packagesWithMatches = await Promise.all(
        packages.map(async (pkg) => {
          try {
            const matchesResponse = await fetch(`/api/packages/${pkg.id}/matches`, {
              headers: {
                'x-user-id': user?.id || ''
              }
            });
            
            if (matchesResponse.ok) {
              const matches = await matchesResponse.json();
              return { ...pkg, matches: matches || [] };
            } else {
              return { ...pkg, matches: [] };
            }
          } catch (error) {
            console.error(`Error fetching matches for package ${pkg.id}:`, error);
            return { ...pkg, matches: [] };
          }
        })
      );

      setMyPackages(packagesWithMatches);
    } catch (error) {
      console.error('Error fetching packages:', error);
      setError('Erreur lors du chargement de vos colis');
    } finally {
      setLoading(false);
    }
  };

  const handlePayForMatch = (matchId) => {
    router.push(`/payments/process?matchId=${matchId}`);
  };

  const confirmDelivery = async (matchId) => {
    try {
      const response = await fetch('/api/match-payments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || ''
        },
        body: JSON.stringify({
          matchId: matchId,
          action: 'confirm_delivery'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la confirmation');
      }

      alert('Livraison confirmée ! Le transporteur sera payé.');
      fetchMyPackagesWithMatches(); // Refresh the list
    } catch (error) {
      console.error('Error confirming delivery:', error);
      alert('Erreur: ' + error.message);
    }
  };

  const rejectMatch = async (matchId) => {
    try {
      const response = await fetch('/api/matches', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || ''
        },
        body: JSON.stringify({
          id: matchId,
          status: 'REJECTED'
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors du rejet');
      }

      alert('Proposition rejetée.');
      fetchMyPackagesWithMatches(); // Refresh the list
    } catch (error) {
      console.error('Error rejecting match:', error);
      alert('Erreur: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PROPOSED': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'ACCEPTED_BY_SENDER': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'CONFIRMED': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'REJECTED': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PROPOSED': return <AlertCircle className="w-4 h-4" />;
      case 'ACCEPTED_BY_SENDER': return <CheckCircle className="w-4 h-4" />;
      case 'CONFIRMED': return <CheckCircle className="w-4 h-4" />;
      case 'REJECTED': return <XCircle className="w-4 h-4" />;
      case 'CANCELLED': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-600">Chargement de vos livraisons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Head>
        <title>Mes Livraisons - EcoDeli</title>
      </Head>

      {/* Global Navigation */}
      <RoleBasedNavigation isDarkMode={true} toggleDarkMode={() => {}} />

      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Retour au tableau de bord
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-gray-900 dark:text-white font-medium">
                {user?.firstName} {user?.lastName}
              </span>
            </div>
          </div>
          
          <div className="mt-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Mes Livraisons
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gérez vos colis et les propositions de transport
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {myPackages.length === 0 ? (
          <div className="py-16 text-center">
            <div className="flex items-center justify-center w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full dark:bg-gray-800">
              <Package className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
              Aucun colis trouvé
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Vous n'avez pas encore créé de colis à livrer.
            </p>
            <Link
              href="/dashboard"
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Créer un colis
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {myPackages.map((pkg) => (
              <div key={pkg.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border overflow-hidden">
                <div className="p-6">
                  {/* Package Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Package className="w-6 h-6 text-green-600" />
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {pkg.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">{pkg.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        pkg.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        pkg.status === 'MATCHED' ? 'bg-blue-100 text-blue-800' :
                        pkg.status === 'IN_TRANSIT' ? 'bg-orange-100 text-orange-800' :
                        pkg.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {pkg.status === 'PENDING' ? 'En attente' :
                         pkg.status === 'MATCHED' ? 'Accepté' :
                         pkg.status === 'IN_TRANSIT' ? 'En transit' :
                         pkg.status === 'DELIVERED' ? 'Livré' : pkg.status}
                      </span>
                      <div className="text-sm text-gray-500 mt-1">
                        {new Date(pkg.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Package Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-1 text-green-600" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Récupération</p>
                          <p className="text-gray-600 dark:text-gray-300 text-sm">{pkg.pickupAddress}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-1 text-red-600" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Livraison</p>
                          <p className="text-gray-600 dark:text-gray-300 text-sm">{pkg.deliveryAddress}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {pkg.price && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            Prix: {pkg.price}€
                          </span>
                        </div>
                      )}
                      {pkg.sizeLabel && (
                        <div>
                          <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded dark:bg-gray-700 dark:text-gray-300">
                            Taille: {pkg.sizeLabel}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Matches/Proposals */}
                  {pkg.matches && pkg.matches.length > 0 && (
                    <div className="border-t pt-6">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        Propositions de transport ({pkg.matches.length})
                      </h4>
                      
                      <div className="space-y-4">
                        {pkg.matches.map((match) => (
                          <div key={match.id} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <Truck className="w-5 h-5 text-blue-600" />
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {match.ride?.user?.firstName} {match.ride?.user?.lastName}
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Transporteur
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-3">
                                <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(match.status)}`}>
                                  {getStatusIcon(match.status)}
                                  {match.status === 'PROPOSED' ? 'En attente' :
                                   match.status === 'ACCEPTED_BY_SENDER' ? 'Acceptée et payée' :
                                   match.status === 'CONFIRMED' ? 'Livrée' :
                                   match.status === 'REJECTED' ? 'Rejetée' : match.status}
                                </span>
                                
                                {match.price && (
                                  <div className="flex items-center gap-1">
                                    <DollarSign className="w-4 h-4 text-green-600" />
                                    <span className="font-medium text-green-600">
                                      {match.price}€
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Payment Status */}
                            {match.payment && (
                              <div className="mb-3">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  match.payment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                  match.payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {match.payment.status === 'COMPLETED' ? '✓ Payé' :
                                   match.payment.status === 'PENDING' ? '⏳ Paiement en cours' :
                                   '✗ Paiement échoué'}
                                </span>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-2">
                              {match.status === 'PROPOSED' && !match.payment && (
                                <>
                                  <button
                                    onClick={() => handlePayForMatch(match.id)}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                                  >
                                    <CreditCard className="w-4 h-4" />
                                    Accepter et Payer
                                  </button>
                                  
                                  <button
                                    onClick={() => rejectMatch(match.id)}
                                    className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    Refuser
                                  </button>
                                </>
                              )}

                              {match.status === 'ACCEPTED_BY_SENDER' && match.payment?.status === 'COMPLETED' && (
                                <button
                                  onClick={() => confirmDelivery(match.id)}
                                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Confirmer la livraison
                                </button>
                              )}

                              {(match.status === 'ACCEPTED_BY_SENDER' || match.status === 'CONFIRMED') && (
                                <Link
                                  href="/messages"
                                  className="flex items-center gap-2 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                  Contacter
                                </Link>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Matches */}
                  {(!pkg.matches || pkg.matches.length === 0) && pkg.status === 'PENDING' && (
                    <div className="border-t pt-6">
                      <div className="text-center py-8">
                        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 dark:text-gray-400">
                          En attente de propositions de transport...
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 