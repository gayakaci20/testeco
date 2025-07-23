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

export default function MyDeliveriesPage() {
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader className="mx-auto mb-4 w-8 h-8 text-green-600 animate-spin" />
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
      <div className="bg-white shadow-sm dark:bg-gray-800">
        <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <ArrowLeft className="mr-2 w-5 h-5" />
                Retour au tableau de bord
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex justify-center items-center w-8 h-8 bg-green-100 rounded-full">
                <User className="w-5 h-5 text-green-600" />
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                {user?.firstName} {user?.lastName}
              </span>
            </div>
          </div>
          
          <div className="mt-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Mes Livraisons et Paiements
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Gérez vos colis, acceptez les propositions et effectuez vos paiements
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {error && (
          <div className="p-4 mb-6 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center">
              <AlertCircle className="mr-2 w-5 h-5 text-red-500" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {myPackages.length === 0 ? (
          <div className="py-16 text-center">
            <div className="flex justify-center items-center mx-auto mb-6 w-24 h-24 bg-gray-100 rounded-full dark:bg-gray-800">
              <Package className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
              Aucun colis trouvé
            </h3>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              Vous n'avez pas encore créé de colis à livrer.
            </p>
            <Link
              href="/dashboard"
              className="px-6 py-2 text-white bg-green-600 rounded-lg transition-colors hover:bg-green-700"
            >
              Créer un colis
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {myPackages.map((pkg) => (
              <div key={pkg.id} className="overflow-hidden bg-white rounded-lg border shadow-sm dark:bg-gray-800">
                <div className="p-6">
                  {/* Package Header */}
                  <div className="flex justify-between items-start mb-4">
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
                        pkg.status === 'PAID_AWAITING_CARRIER' ? 'bg-green-100 text-green-800' :
                        pkg.status === 'MATCHED' ? 'bg-blue-100 text-blue-800' :
                        pkg.status === 'IN_TRANSIT' ? 'bg-orange-100 text-orange-800' :
                        pkg.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {pkg.status === 'PENDING' ? 'En attente' :
                         pkg.status === 'PAID_AWAITING_CARRIER' ? '💰 Payé - Recherche transporteur' :
                         pkg.status === 'MATCHED' ? 'Accepté' :
                         pkg.status === 'IN_TRANSIT' ? 'En transit' :
                         pkg.status === 'DELIVERED' ? 'Livré' : pkg.status}
                      </span>
                      <div className="mt-1 text-sm text-gray-500">
                        {new Date(pkg.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Package Details */}
                  <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2">
                    <div className="space-y-3">
                      <div className="flex gap-2 items-start">
                        <MapPin className="mt-1 w-4 h-4 text-green-600" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Récupération</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{pkg.pickupAddress}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 items-start">
                        <MapPin className="mt-1 w-4 h-4 text-red-600" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Livraison</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{pkg.deliveryAddress}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {pkg.price && (
                        <div className="flex gap-2 items-center">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            Prix: {pkg.price}€
                          </span>
                        </div>
                      )}
                      {pkg.sizeLabel && (
                        <div>
                          <span className="px-2 py-1 text-xs text-gray-800 bg-gray-100 rounded dark:bg-gray-700 dark:text-gray-300">
                            Taille: {pkg.sizeLabel}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Matches/Proposals */}
                  {pkg.matches && pkg.matches.length > 0 && (
                    <div className="pt-6 border-t">
                      <h4 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
                        Propositions de transport ({pkg.matches.length})
                      </h4>
                      
                      <div className="space-y-4">
                        {pkg.matches.map((match) => (
                          <div key={match.id} className="p-4 bg-gray-50 rounded-lg border dark:bg-gray-700">
                            <div className="flex justify-between items-start mb-3">
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
                                <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                                  match.status === 'PROPOSED' ? 'bg-yellow-100 text-yellow-800' :
                                  match.status === 'ACCEPTED_BY_SENDER' ? 'bg-blue-100 text-blue-800' :
                                  match.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                                  match.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {match.status === 'PROPOSED' ? '⏳ En attente' :
                                   match.status === 'ACCEPTED_BY_SENDER' ? '✓ Acceptée et payée' :
                                   match.status === 'CONFIRMED' ? '✅ Livrée' :
                                   match.status === 'REJECTED' ? '❌ Rejetée' : match.status}
                                </span>
                                
                                {match.price && (
                                  <div className="flex gap-1 items-center">
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
                                    className="flex gap-2 items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg transition-colors hover:bg-green-700"
                                  >
                                    <CreditCard className="w-4 h-4" />
                                    Accepter et Payer
                                  </button>
                                  
                                  <button
                                    onClick={() => rejectMatch(match.id)}
                                    className="flex gap-2 items-center px-4 py-2 text-sm text-red-600 rounded-lg border border-red-600 transition-colors hover:bg-red-50"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    Refuser
                                  </button>
                                </>
                              )}

                              {match.status === 'ACCEPTED_BY_SENDER' && match.payment?.status === 'COMPLETED' && (
                                <button
                                  onClick={() => confirmDelivery(match.id)}
                                  className="flex gap-2 items-center px-4 py-2 text-sm text-white bg-blue-600 rounded-lg transition-colors hover:bg-blue-700"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Confirmer la livraison
                                </button>
                              )}

                              {(match.status === 'ACCEPTED_BY_SENDER' || match.status === 'CONFIRMED') && (
                                <Link
                                  href="/messages"
                                  className="flex gap-2 items-center px-4 py-2 text-sm text-blue-600 rounded-lg border border-blue-600 transition-colors hover:bg-blue-50"
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

                  {/* No Matches and PENDING */}
                  {(!pkg.matches || pkg.matches.length === 0) && pkg.status === 'PENDING' && (
                    <div className="pt-6 border-t">
                      <div className="py-8 text-center">
                        <Clock className="mx-auto mb-3 w-12 h-12 text-gray-400" />
                        <p className="text-gray-600 dark:text-gray-400">
                          En attente de propositions de transport...
                        </p>
                        <p className="mt-2 text-sm text-gray-500">
                          Les transporteurs vont bientôt proposer leurs services pour votre colis.
                        </p>
                        
                        {/* Direct Payment Option */}
                        {pkg.price && pkg.price > 0 && (
                          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <h5 className="font-medium text-blue-900 mb-2">
                              💡 Vous voulez une livraison plus rapide ?
                            </h5>
                            <p className="text-sm text-blue-700 mb-4">
                              Payez maintenant {pkg.price}€ pour obtenir une priorité et un transporteur sera assigné rapidement.
                            </p>
                            <button
                              onClick={() => router.push(`/payments/process?packageId=${pkg.id}&type=direct`)}
                              className="flex gap-2 items-center px-4 py-2 mx-auto text-white bg-blue-600 rounded-lg transition-colors hover:bg-blue-700"
                            >
                              <CreditCard className="w-4 h-4" />
                              Payer maintenant - {pkg.price}€
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Paid Awaiting Carrier */}
                  {pkg.status === 'PAID_AWAITING_CARRIER' && (
                    <div className="pt-6 border-t">
                      <div className="py-8 text-center">
                        <CheckCircle className="mx-auto mb-3 w-12 h-12 text-green-500" />
                        <p className="text-green-700 font-medium">
                          ✅ Colis payé avec succès !
                        </p>
                        <p className="mt-2 text-sm text-gray-600">
                          Votre paiement a été confirmé. Un transporteur prioritaire vous sera assigné sous peu.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Stats */}
        {myPackages.length > 0 && (
          <div className="p-6 mt-8 bg-white rounded-lg border shadow-sm dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Résumé de vos livraisons
            </h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="p-4 text-center bg-green-50 rounded-lg dark:bg-green-900/20">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {myPackages.filter(pkg => pkg.status === 'DELIVERED').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Livrés</div>
              </div>
                              <div className="p-4 text-center bg-blue-50 rounded-lg dark:bg-blue-900/20">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {myPackages.filter(pkg => pkg.status === 'MATCHED' || pkg.status === 'IN_TRANSIT' || pkg.status === 'PAID_AWAITING_CARRIER').length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">En cours</div>
                </div>
              <div className="p-4 text-center bg-yellow-50 rounded-lg dark:bg-yellow-900/20">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {myPackages.filter(pkg => pkg.status === 'PENDING').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">En attente</div>
              </div>
              <div className="p-4 text-center bg-sky-50 rounded-lg dark:bg-sky-900/20">
                <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">
                  €{myPackages
                    .flatMap(pkg => pkg.matches || [])
                    .filter(match => match.payment?.status === 'COMPLETED')
                    .reduce((sum, match) => sum + (match.price || 0), 0)
                    .toFixed(2)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Total payé</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 