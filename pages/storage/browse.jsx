import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import RoleBasedNavigation from '../../components/RoleBasedNavigation';
import { 
  Plus,
  MapPin,
  Calendar,
  Clock,
  Package,
  DollarSign,
  Eye,
  Edit3,
  Trash2,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Filter,
  Search,
  Star,
  Box,
  User,
  Menu,
  X,
  Bell,
  Grid,
  List,
  TrendingUp,
  Activity,
  Target,
  Store,
  Users,
  Home
} from 'lucide-react';

export default function StorageBrowse({ isDarkMode, toggleDarkMode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  
  const [storageBoxes, setStorageBoxes] = useState([]);
  const [filteredBoxes, setFilteredBoxes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBox, setSelectedBox] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Formulaire de création
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    size: 'SMALL',
    pricePerDay: '',
    description: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const sizeOptions = [
    { id: '', name: 'Toutes les tailles', icon: Box, color: 'gray' },
    { id: 'SMALL', name: 'Petite', icon: Box, color: 'blue' },
    { id: 'MEDIUM', name: 'Moyenne', icon: Box, color: 'yellow' },
    { id: 'LARGE', name: 'Grande', icon: Box, color: 'green' }
  ];

  const availabilityOptions = [
    { id: 'all', name: 'Tous', icon: Box, color: 'gray' },
    { id: 'available', name: 'Disponibles', icon: CheckCircle, color: 'green' },
    { id: 'occupied', name: 'Occupées', icon: XCircle, color: 'red' }
  ];

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Fetch storage boxes
  const fetchStorageBoxes = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/storage-boxes');
      if (response.ok) {
        const data = await response.json();
        setStorageBoxes(data);
        setFilteredBoxes(data);
      } else {
        setError('Erreur lors du chargement des boîtes de stockage');
      }
    } catch (error) {
      console.error('Error fetching storage boxes:', error);
      setError('Erreur lors du chargement des boîtes de stockage');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStorageBoxes();
    }
  }, [user]);

  const refreshData = async () => {
    setRefreshing(true);
    await fetchStorageBoxes();
    setRefreshing(false);
  };

  // Filtrer les boîtes
  useEffect(() => {
    let filtered = storageBoxes;

    if (searchTerm) {
      filtered = filtered.filter(box => 
        box.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        box.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        box.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedSize) {
      filtered = filtered.filter(box => box.size === selectedSize);
    }

    if (maxPrice) {
      filtered = filtered.filter(box => box.pricePerDay <= parseFloat(maxPrice));
    }

    if (showOnlyAvailable) {
      filtered = filtered.filter(box => box.available);
    }

    setFilteredBoxes(filtered);
  }, [storageBoxes, searchTerm, selectedSize, maxPrice, showOnlyAvailable]);

  // Gérer le formulaire de création
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/storage-boxes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Boîte de stockage créée avec succès');
        setShowCreateForm(false);
        setFormData({
          title: '',
          location: '',
          size: 'SMALL',
          pricePerDay: '',
          description: ''
        });
        await fetchStorageBoxes();
      } else {
        setError(data.error || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Error creating storage box:', error);
      setError('Erreur lors de la création');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDetailsModal = (box) => {
    setSelectedBox(box);
    setShowDetailsModal(true);
  };

  const handleRentBox = (box) => {
    // Rediriger vers la page de location ou ouvrir un modal de location
    router.push(`/storage/rent/${box.id}`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full border-4 border-sky-400 animate-spin border-t-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const canCreateStorageBox = user.role === 'PROVIDER' || user.role === 'SERVICE_PROVIDER';

  // Calculate statistics
  const stats = {
    totalBoxes: storageBoxes.length,
    availableBoxes: storageBoxes.filter(box => box.available).length,
    occupiedBoxes: storageBoxes.filter(box => !box.available).length,
    averagePrice: storageBoxes.length > 0 ? (storageBoxes.reduce((sum, box) => sum + box.pricePerDay, 0) / storageBoxes.length).toFixed(2) : 0
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Head>
        <title>Boîtes de Stockage - EcoDeli</title>
        <meta name="description" content="Trouvez et gérez vos espaces de stockage" />
      </Head>

      <RoleBasedNavigation 
        user={user} 
        isDarkMode={isDarkMode} 
        toggleDarkMode={toggleDarkMode} 
        logout={logout}
        currentPage="storage"
      />

      {/* Header Section */}
      <div className="px-6 py-8 bg-sky-50 dark:bg-sky-900/20">
        <div className="mx-auto max-w-7xl">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Boîtes de Stockage
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Trouvez et gérez vos espaces de stockage
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={refreshData}
                disabled={refreshing}
                className="flex items-center px-6 py-2 font-medium text-white bg-sky-500 rounded-full transition hover:bg-sky-600 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Actualisation...' : 'Actualiser'}
              </button>
              {canCreateStorageBox && (
                <button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="flex items-center px-6 py-2 font-medium text-white bg-emerald-500 rounded-full transition hover:bg-emerald-600"
                >
                  <Plus className="mr-2 w-4 h-4" />
                  Créer une boîte
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8 mx-auto max-w-7xl">
        {/* Stats Cards */}
        <div className="grid gap-6 mb-8 md:grid-cols-4">
          <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total boîtes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalBoxes}</p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-blue-100 rounded-full dark:bg-blue-900">
                <Box className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Disponibles</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.availableBoxes}</p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-green-100 rounded-full dark:bg-green-900">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Occupées</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.occupiedBoxes}</p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-red-100 rounded-full dark:bg-red-900">
                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Prix moyen</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.averagePrice}€</p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-yellow-100 rounded-full dark:bg-yellow-900">
                <DollarSign className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="p-4 mb-4 text-red-700 bg-red-50 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="p-4 mb-4 text-green-700 bg-green-50 rounded-lg border border-green-200">
            {successMessage}
          </div>
        )}

        {/* Create Form */}
        {showCreateForm && canCreateStorageBox && (
          <div className="p-6 mb-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
              Créer une nouvelle boîte de stockage
            </h2>
            
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Titre
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="p-2 w-full text-gray-900 bg-white rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                    placeholder="Nom de la boîte"
                    required
                  />
                </div>
                
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Localisation
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="p-2 w-full text-gray-900 bg-white rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                    placeholder="Adresse ou zone"
                    required
                  />
                </div>
                
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Taille
                  </label>
                  <select
                    value={formData.size}
                    onChange={(e) => setFormData({...formData, size: e.target.value})}
                    className="p-2 w-full text-gray-900 bg-white rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  >
                    <option value="SMALL">Petite</option>
                    <option value="MEDIUM">Moyenne</option>
                    <option value="LARGE">Grande</option>
                  </select>
                </div>
                
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Prix par jour (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.pricePerDay}
                    onChange={(e) => setFormData({...formData, pricePerDay: e.target.value})}
                    className="p-2 w-full text-gray-900 bg-white rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="p-2 w-full text-gray-900 bg-white rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  rows="3"
                  placeholder="Description détaillée"
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-white bg-emerald-500 rounded-lg transition hover:bg-emerald-600 disabled:opacity-50"
                >
                  {isSubmitting ? 'Création...' : 'Créer'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg transition hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 mb-6 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 w-5 h-5 text-gray-400 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par titre, localisation ou description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="py-3 pr-4 pl-10 w-full text-gray-900 bg-white rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-3 text-gray-900 rounded-lg border border-gray-200 transition-colors dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white"
            >
              <Filter className="mr-2 w-5 h-5" />
              Filtres
            </button>
            <div className="flex rounded-lg border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center px-3 py-3 rounded-l-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center px-3 py-3 rounded-r-lg transition-colors ${
                  viewMode === 'list' ? 'bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="p-6 mb-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">Taille</h3>
                <div className="flex flex-wrap gap-2">
                  {sizeOptions.map((size) => (
                    <button
                      key={size.id}
                      onClick={() => setSelectedSize(size.id)}
                      className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                        selectedSize === size.id
                          ? 'bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <size.icon className="w-4 h-4" />
                      {size.name}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">Prix maximum</h3>
                <input
                  type="number"
                  step="0.01"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="p-2 w-full text-gray-900 bg-white rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  placeholder="Prix maximum"
                />
              </div>
              
              <div>
                <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">Disponibilité</h3>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showOnlyAvailable}
                    onChange={(e) => setShowOnlyAvailable(e.target.checked)}
                    className="mr-2 text-sky-500 rounded border-gray-300 focus:ring-sky-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Disponibles seulement
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Storage Boxes List */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full border-4 border-sky-400 animate-spin border-t-transparent"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-300">Chargement des boîtes...</p>
              </div>
            </div>
          ) : filteredBoxes.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-lg shadow-sm dark:bg-gray-800">
              <Box className="mx-auto mb-4 w-16 h-16 text-gray-400" />
              <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                Aucune boîte de stockage trouvée
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm || selectedSize || maxPrice || showOnlyAvailable
                  ? 'Aucune boîte ne correspond à vos critères de recherche.'
                  : 'Aucune boîte de stockage disponible pour le moment.'}
              </p>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
              {filteredBoxes.map((box) => (
                <div 
                  key={box.id} 
                  className={`bg-white rounded-lg border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700 transition-all hover:shadow-md ${
                    viewMode === 'list' ? 'flex gap-6 p-6' : 'p-6'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <Box className="w-8 h-8 text-sky-500" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {box.title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Code: {box.code}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          box.available 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                        }`}>
                          {box.available ? (
                            <CheckCircle className="mr-1 w-4 h-4" />
                          ) : (
                            <XCircle className="mr-1 w-4 h-4" />
                          )}
                          {box.available ? 'Disponible' : 'Occupée'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <MapPin className="mr-2 w-4 h-4" />
                        <span>{box.location}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Box className="mr-2 w-4 h-4" />
                        <span>Taille: {box.size}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <DollarSign className="mr-2 w-4 h-4" />
                        <span>{box.pricePerDay}€/jour</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="mr-2 w-4 h-4" />
                        <span>Créé le: {formatDate(box.createdAt)}</span>
                      </div>
                    </div>

                    {box.description && (
                      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                        {box.description}
                      </p>
                    )}

                    {box.activeRentals && box.activeRentals.length > 0 && (
                      <div className="p-4 mb-4 bg-blue-50 rounded-lg dark:bg-blue-900/20">
                        <h4 className="mb-2 font-medium text-blue-900 dark:text-blue-300">
                          Locataire actuel
                        </h4>
                        <div className="flex items-center space-x-3">
                          <div className="flex justify-center items-center w-8 h-8 bg-blue-500 rounded-full">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {box.activeRentals[0].user.firstName} {box.activeRentals[0].user.lastName}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openDetailsModal(box)}
                          className="flex items-center px-4 py-2 text-sm text-white bg-sky-500 rounded-lg hover:bg-sky-600"
                        >
                          <Eye className="mr-2 w-4 h-4" />
                          Voir détails
                        </button>
                        
                        <button
                          onClick={() => box.available && handleRentBox(box)}
                          className={`flex items-center px-4 py-2 text-sm rounded-lg transition ${
                            box.available 
                              ? 'text-white bg-emerald-500 hover:bg-emerald-600' 
                              : 'text-gray-500 bg-gray-300 cursor-not-allowed'
                          }`}
                          disabled={!box.available}
                        >
                          {box.available ? 'Louer' : 'Indisponible'}
                        </button>
                      </div>
                      
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Mis à jour: {formatDate(box.updatedAt)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedBox && (
        <div className="flex overflow-y-auto fixed inset-0 z-50 justify-center items-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Détails - {selectedBox.title}
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Code:</span>
                      <div className="font-medium text-gray-900 dark:text-white">{selectedBox.code}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Taille:</span>
                      <div className="font-medium text-gray-900 dark:text-white">{selectedBox.size}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Prix par jour:</span>
                      <div className="font-medium text-gray-900 dark:text-white">{selectedBox.pricePerDay}€</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Statut:</span>
                      <div className={`font-medium ${selectedBox.available ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedBox.available ? 'Disponible' : 'Occupée'}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                    Localisation
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">{selectedBox.location}</p>
                </div>

                {selectedBox.description && (
                  <div>
                    <h4 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                      Description
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">{selectedBox.description}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
                  >
                    Fermer
                  </button>
                  <button
                    onClick={() => selectedBox.available && handleRentBox(selectedBox)}
                    className={`flex-1 px-4 py-2 rounded-lg transition ${
                      selectedBox.available 
                        ? 'text-white bg-emerald-500 hover:bg-emerald-600' 
                        : 'text-gray-500 bg-gray-300 cursor-not-allowed'
                    }`}
                    disabled={!selectedBox.available}
                  >
                    {selectedBox.available ? 'Louer cette boîte' : 'Indisponible'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
