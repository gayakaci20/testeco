import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import RoleBasedNavigation from '../components/RoleBasedNavigation';
import { 
  Sun, 
  Moon, 
  User, 
  Menu, 
  X,
  Search,
  Package,
  Car,
  Calendar,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Home,
  MessageCircle,
  LogOut,
  ChevronRight,
  Send,
  Truck,
  CreditCard
} from 'lucide-react';

export default function MatchesPage({ isDarkMode, toggleDarkMode }) {
  const [packages, setPackages] = useState([]);
  const [myMatches, setMyMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('available'); // 'available' or 'my-matches'
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    // For CARRIERS, show transport opportunities
    if (user.role === 'CARRIER' || user.userType === 'CARRIER') {
      if (view === 'available') {
        fetchAvailablePackages();
      } else {
        fetchMyMatches();
      }
    } 
    // For CUSTOMERS, show their matches/proposals
    else if (user.role === 'CUSTOMER') {
      fetchMyMatches();
    }
    // Redirect other roles
    else {
      router.push('/dashboard');
      return;
    }
  }, [user, view]);

  const fetchAvailablePackages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/packages?status=PENDING', {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des colis');
      }
      
      const data = await response.json();
      setPackages(data || []);
    } catch (error) {
      console.error('Error fetching packages:', error);
      setError('Erreur lors du chargement des colis disponibles');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyMatches = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/matches', {
        headers: {
          'x-user-id': user?.id || ''
        }
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des correspondances');
      }
      
      const data = await response.json();
      setMyMatches(data || []);
    } catch (error) {
      console.error('Error fetching matches:', error);
      setError('Erreur lors du chargement de vos propositions');
    } finally {
      setLoading(false);
    }
  };

  const proposeForPackage = async (packageId) => {
    try {
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          packageId: packageId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la proposition');
      }

      const result = await response.json();
      alert('Proposition envoyée avec succès ! Le client recevra une notification.');
      
      // Refresh the packages list
      fetchAvailablePackages();
    } catch (error) {
      console.error('Error proposing for package:', error);
      alert('Erreur: ' + error.message);
    }
  };

  const updateMatchStatus = async (matchId, newStatus) => {
    try {
      const response = await fetch('/api/matches', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || ''
        },
        body: JSON.stringify({
          id: matchId,
          status: newStatus
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour');
      }

      const updatedMatch = await response.json();
      
      // Update local state
      setMyMatches(prev => 
        prev.map(match => 
          match.id === matchId 
            ? updatedMatch
            : match
        )
      );
      
      alert('Statut mis à jour avec succès !');
    } catch (error) {
      console.error('Error updating match:', error);
      alert('Erreur lors de la mise à jour: ' + error.message);
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
      fetchMyMatches(); // Refresh the list
    } catch (error) {
      console.error('Error confirming delivery:', error);
      alert('Erreur: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PROPOSED': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'ACCEPTED_BY_SENDER': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'ACCEPTED_BY_CARRIER': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'CONFIRMED': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'REJECTED': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PROPOSED': return <AlertCircle className="w-4 h-4" />;
      case 'CONFIRMED': return <CheckCircle className="w-4 h-4" />;
      case 'REJECTED': return <XCircle className="w-4 h-4" />;
      case 'CANCELLED': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full border-4 border-sky-400 animate-spin border-t-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            {view === 'available' ? 'Chargement des colis disponibles...' : 'Chargement de vos propositions...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Head>
        <title>Colis à Transporter - ecodeli</title>
        <meta name="description" content="Trouvez des colis à transporter et gérez vos propositions" />
        <link rel="icon" href="/LOGO_.png" />
      </Head>

      <RoleBasedNavigation isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

      {/* Header Section */}
      <div className="px-6 py-12 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20">
        <div className="mx-auto max-w-6xl">
          <div className="flex gap-3 justify-center items-center mb-4">
            <div className="flex justify-center items-center w-12 h-12 bg-gradient-to-r from-sky-100 to-sky-200 rounded-full dark:from-sky-900 dark:to-sky-800">
              <Truck className="w-6 h-6 text-sky-600 dark:text-sky-400" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Colis à Transporter
            </h1>
          </div>
          <p className="mx-auto max-w-2xl text-lg text-center text-gray-600 dark:text-gray-300">
            Trouvez des colis à transporter et gérez vos propositions de transport
          </p>
        </div>
      </div>

      <div className="px-6 py-8 mx-auto max-w-7xl">
        {error && (
          <div className="p-4 mb-6 bg-red-50 rounded-lg border border-red-200 dark:bg-red-900/20 dark:border-red-800">
            <p className="text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* View Toggle - Only for CARRIERS */}
        {(user?.role === 'CARRIER' || user?.userType === 'CARRIER') && (
          <div className="mb-8">
            <div className="p-2 bg-white rounded-xl border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700">
              <nav className="flex flex-wrap gap-2">
                <button
                  onClick={() => setView('available')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-sm transition-all ${
                    view === 'available'
                      ? 'text-white bg-gradient-to-r from-sky-500 to-sky-600 shadow-lg shadow-sky-500/25'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  Colis Disponibles
                </button>
                <button
                  onClick={() => setView('my-matches')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-sm transition-all ${
                    view === 'my-matches'
                      ? 'text-white bg-gradient-to-r from-sky-500 to-sky-600 shadow-lg shadow-sky-500/25'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  Mes Propositions
                </button>
              </nav>
            </div>
          </div>
        )}

        {/* Header for CUSTOMERS */}
        {user?.role === 'CUSTOMER' && (
          <div className="mb-8">
            <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700">
              <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                Mes propositions de transport
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Gérez les propositions reçues pour vos colis et effectuez vos paiements
              </p>
            </div>
          </div>
        )}

        {/* Available Packages View */}
        {view === 'available' && (
          <div className="space-y-6">
            {packages.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-xl border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700">
                <div className="flex justify-center items-center mx-auto mb-6 w-16 h-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full dark:from-gray-800 dark:to-gray-700">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                  Aucun colis disponible
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Il n'y a actuellement aucun colis en attente de transport.
                </p>
              </div>
            ) : (
              packages.map((pkg) => (
                <div key={pkg.id} className="overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm transition-shadow hover:shadow-md dark:bg-gray-800 dark:border-gray-700">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {pkg.title}
                        </h3>
                        {pkg.price && (
                          <div className="flex gap-1 items-center px-3 py-1 bg-gradient-to-r from-green-100 to-green-200 rounded-full dark:from-green-900 dark:to-green-800">
                            <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <span className="text-lg font-bold text-green-600 dark:text-green-400">
                              €{pkg.price}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 items-center text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        {new Date(pkg.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {pkg.description && (
                      <p className="mb-4 text-gray-600 dark:text-gray-300">{pkg.description}</p>
                    )}

                    <div className="grid gap-4 mb-6 md:grid-cols-2">
                      <div className="space-y-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg dark:from-green-900/20 dark:to-emerald-900/20">
                        <div className="flex gap-2 items-start">
                          <div className="flex justify-center items-center w-6 h-6 bg-gradient-to-r from-green-100 to-green-200 rounded-full dark:from-green-900 dark:to-green-800">
                            <MapPin className="w-3 h-3 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">Point de départ</p>
                            <p className="text-gray-600 dark:text-gray-300">{pkg.pickupAddress}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 items-start">
                          <div className="flex justify-center items-center w-6 h-6 bg-gradient-to-r from-red-100 to-red-200 rounded-full dark:from-red-900 dark:to-red-800">
                            <MapPin className="w-3 h-3 text-red-600 dark:text-red-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">Destination</p>
                            <p className="text-gray-600 dark:text-gray-300">{pkg.deliveryAddress}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg dark:from-blue-900/20 dark:to-indigo-900/20">
                        {pkg.weight && (
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">Poids</p>
                            <p className="text-gray-600 dark:text-gray-300">{pkg.weight} kg</p>
                          </div>
                        )}
                        {pkg.sizeLabel && (
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">Taille</p>
                            <p className="text-gray-600 dark:text-gray-300">{pkg.sizeLabel}</p>
                          </div>
                        )}
                        {pkg.dimensions && (
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">Dimensions</p>
                            <p className="text-gray-600 dark:text-gray-300">{pkg.dimensions}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {pkg.user && (
                      <div className="p-4 mb-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg dark:from-gray-700 dark:to-gray-600">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          <strong>Expéditeur:</strong> {pkg.user.firstName} {pkg.user.lastName}
                        </p>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <button
                        onClick={() => proposeForPackage(pkg.id)}
                        className="flex gap-2 items-center px-6 py-3 font-medium text-white bg-gradient-to-r from-sky-500 to-sky-600 rounded-full shadow-lg transition-all transform hover:scale-105 hover:from-sky-600 hover:to-sky-700 shadow-sky-500/25"
                      >
                        <Send className="w-4 h-4" />
                        Se proposer pour ce colis
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* My Matches View */}
        {(view === 'my-matches' || user?.role === 'CUSTOMER') && (
          <div className="space-y-6">
            {myMatches.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-xl border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700">
                <div className="flex justify-center items-center mx-auto mb-6 w-16 h-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full dark:from-gray-800 dark:to-gray-700">
                  <Send className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                  {user?.role === 'CUSTOMER' ? 'Aucune proposition reçue' : 'Aucune proposition envoyée'}
                </h3>
                <p className="mb-6 text-gray-600 dark:text-gray-300">
                  {user?.role === 'CUSTOMER' 
                    ? 'Vous n\'avez pas encore reçu de propositions pour vos colis.' 
                    : 'Vous n\'avez pas encore envoyé de propositions. Consultez les colis disponibles !'}
                </p>
                {user?.role === 'CARRIER' && (
                  <button
                    onClick={() => setView('available')}
                    className="px-6 py-3 font-medium text-white bg-gradient-to-r from-sky-500 to-sky-600 rounded-full shadow-lg transition-all transform hover:scale-105 hover:from-sky-600 hover:to-sky-700 shadow-sky-500/25"
                  >
                    Voir les colis disponibles
                  </button>
                )}
              </div>
            ) : (
              myMatches.map((match) => (
                <div key={match.id} className="overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm transition-shadow hover:shadow-md dark:bg-gray-800 dark:border-gray-700">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3">
                        <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(match.status)}`}>
                          {getStatusIcon(match.status)}
                          {match.status === 'PROPOSED' ? 'En attente' :
                           match.status === 'ACCEPTED_BY_SENDER' ? 'Acceptée et payée' :
                           match.status === 'CONFIRMED' ? 'Livrée' :
                           match.status === 'REJECTED' ? 'Rejetée' :
                           match.status === 'CANCELLED' ? 'Annulée' : match.status}
                        </span>
                        {match.price && (
                          <div className="flex gap-1 items-center px-3 py-1 bg-gradient-to-r from-green-100 to-green-200 rounded-full dark:from-green-900 dark:to-green-800">
                            <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                              €{match.price}
                            </span>
                          </div>
                        )}
                        {match.payment && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            match.payment.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                            match.payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                          }`}>
                            {match.payment.status === 'COMPLETED' ? 'Payé' :
                             match.payment.status === 'PENDING' ? 'Paiement en cours' :
                             'Paiement échoué'}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1 items-center text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        {new Date(match.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-sky-50 to-blue-50 rounded-lg border border-sky-200 dark:border-sky-800 dark:from-sky-900/20 dark:to-blue-900/20">
                      <div className="flex gap-2 items-center mb-3">
                        <Package className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {match.package.description}
                        </h3>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex gap-2 items-start">
                          <div className="flex justify-center items-center w-4 h-4 bg-gradient-to-r from-green-100 to-green-200 rounded-full dark:from-green-900 dark:to-green-800">
                            <MapPin className="w-2 h-2 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <p><strong>Départ:</strong> {match.package.pickupAddress}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 items-start">
                          <div className="flex justify-center items-center w-4 h-4 bg-gradient-to-r from-red-100 to-red-200 rounded-full dark:from-red-900 dark:to-red-800">
                            <MapPin className="w-2 h-2 text-red-600 dark:text-red-400" />
                          </div>
                          <div>
                            <p><strong>Arrivée:</strong> {match.package.deliveryAddress}</p>
                          </div>
                        </div>
                        {match.package.weight && <p><strong>Poids:</strong> {match.package.weight}kg</p>}
                        {user?.role === 'CARRIER' && (
                          <p><strong>Client:</strong> {match.package.user.firstName} {match.package.user.lastName}</p>
                        )}
                        {user?.role === 'CUSTOMER' && (
                          <p><strong>Transporteur:</strong> {match.ride.user.firstName} {match.ride.user.lastName}</p>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3 mt-6">
                      {/* Actions for CUSTOMERS */}
                      {user?.role === 'CUSTOMER' && (
                        <>
                          {match.status === 'PROPOSED' && !match.payment && (
                            <button
                              onClick={() => handlePayForMatch(match.id)}
                              className="flex gap-2 items-center px-6 py-3 font-medium text-white bg-gradient-to-r from-green-500 to-green-600 rounded-full shadow-lg transition-all transform hover:scale-105 hover:from-green-600 hover:to-green-700 shadow-green-500/25"
                            >
                              <CreditCard className="w-4 h-4" />
                              Accepter et Payer
                            </button>
                          )}
                          
                          {match.status === 'PROPOSED' && (
                            <button
                              onClick={() => updateMatchStatus(match.id, 'REJECTED')}
                              className="flex gap-2 items-center px-4 py-3 font-medium text-red-600 rounded-full border border-red-600 transition-all hover:bg-red-50 dark:hover:bg-red-900/20 hover:shadow-md"
                            >
                              <XCircle className="w-4 h-4" />
                              Refuser
                            </button>
                          )}

                          {match.status === 'ACCEPTED_BY_SENDER' && match.payment?.status === 'COMPLETED' && (
                            <button
                              onClick={() => confirmDelivery(match.id)}
                              className="flex gap-2 items-center px-6 py-3 font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-lg transition-all transform hover:scale-105 hover:from-blue-600 hover:to-blue-700 shadow-blue-500/25"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Confirmer la livraison
                            </button>
                          )}

                          {(match.status === 'ACCEPTED_BY_SENDER' || match.status === 'CONFIRMED') && (
                            <Link
                              href="/messages"
                              className="flex gap-2 items-center px-4 py-3 font-medium text-sky-600 rounded-full border border-sky-600 transition-all hover:bg-sky-50 dark:hover:bg-sky-900/20 hover:shadow-md"
                            >
                              <MessageCircle className="w-4 h-4" />
                              Contacter le transporteur
                            </Link>
                          )}
                        </>
                      )}

                      {/* Actions for CARRIERS */}
                      {(user?.role === 'CARRIER' || user?.userType === 'CARRIER') && (
                        <>
                          {match.status === 'CONFIRMED' && (
                            <Link
                              href="/messages"
                              className="flex gap-2 items-center px-4 py-3 font-medium text-white bg-gradient-to-r from-sky-500 to-sky-600 rounded-full shadow-lg transition-all transform hover:scale-105 hover:from-sky-600 hover:to-sky-700 shadow-sky-500/25"
                            >
                              <MessageCircle className="w-4 h-4" />
                              Contacter le client
                            </Link>
                          )}
                          
                          {match.status === 'PROPOSED' && (
                            <div className="flex gap-2 items-center text-sm text-gray-600 dark:text-gray-400 px-3 py-2 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-full dark:from-yellow-900/20 dark:to-orange-900/20">
                              <Clock className="w-4 h-4" />
                              En attente de la réponse du client
                            </div>
                          )}

                          {match.status === 'ACCEPTED_BY_SENDER' && (
                            <div className="flex gap-2 items-center text-sm text-green-600 dark:text-green-400 px-3 py-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-full dark:from-green-900/20 dark:to-emerald-900/20">
                              <CheckCircle className="w-4 h-4" />
                              Commande acceptée et payée - Récupérez le colis
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Summary for My Matches */}
        {(view === 'my-matches' || user?.role === 'CUSTOMER') && myMatches.length > 0 && (
          <div className="p-6 mt-8 bg-white rounded-xl border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              {user?.role === 'CUSTOMER' ? 'Résumé de vos livraisons' : 'Résumé de vos propositions'}
            </h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="p-4 text-center bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 dark:from-green-900/20 dark:to-emerald-900/20 dark:border-green-800">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {myMatches.filter(m => m.status === 'CONFIRMED').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {user?.role === 'CUSTOMER' ? 'Livrées' : 'Confirmées'}
                </div>
              </div>
              <div className="p-4 text-center bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-800">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {myMatches.filter(m => m.status === 'ACCEPTED_BY_SENDER').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {user?.role === 'CUSTOMER' ? 'Payées' : 'Acceptées'}
                </div>
              </div>
              <div className="p-4 text-center bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200 dark:from-yellow-900/20 dark:to-orange-900/20 dark:border-yellow-800">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {myMatches.filter(m => m.status === 'PROPOSED').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">En attente</div>
              </div>
              <div className="p-4 text-center bg-gradient-to-r from-sky-50 to-blue-50 rounded-lg border border-sky-200 dark:from-sky-900/20 dark:to-blue-900/20 dark:border-sky-800">
                <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">
                  €{myMatches
                    .filter(m => user?.role === 'CUSTOMER' 
                      ? m.payment?.status === 'COMPLETED' 
                      : m.status === 'CONFIRMED')
                    .reduce((sum, m) => sum + (m.price || 0), 0)
                    .toFixed(2)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {user?.role === 'CUSTOMER' ? 'Total payé' : 'Revenus confirmés'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 