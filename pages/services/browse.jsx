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
  Wrench,
  User,
  Menu,
  X,
  Bell,
  BookOpen,
  Timer,
  Grid,
  List,
  TrendingUp,
  Activity,
  Target,
  Store,
  Users,
  Home,
  Award,
  Phone,
  Mail
} from 'lucide-react';

export default function ServicesBrowse({ isDarkMode, toggleDarkMode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Formulaire de création
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'OTHER',
    price: '',
    duration: '',
    location: '',
    requirements: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { value: '', label: 'Toutes catégories', icon: Wrench, color: 'gray' },
    { value: 'OTHER', label: 'Autre', icon: Wrench, color: 'gray' },
    { value: 'CLEANING', label: 'Nettoyage', icon: Wrench, color: 'blue' },
    { value: 'MAINTENANCE', label: 'Maintenance', icon: Wrench, color: 'yellow' },
    { value: 'REPAIR', label: 'Réparation', icon: Wrench, color: 'red' },
    { value: 'INSTALLATION', label: 'Installation', icon: Wrench, color: 'green' },
    { value: 'CONSULTING', label: 'Conseil', icon: Wrench, color: 'purple' },
    { value: 'DELIVERY', label: 'Livraison', icon: Package, color: 'orange' },
    { value: 'GARDENING', label: 'Jardinage', icon: Wrench, color: 'green' },
    { value: 'MOVING', label: 'Déménagement', icon: Package, color: 'blue' },
    { value: 'HANDYMAN', label: 'Bricolage', icon: Wrench, color: 'yellow' }
  ];

  const sortOptions = [
    { id: 'newest', label: 'Plus récent', icon: Calendar },
    { id: 'oldest', label: 'Plus ancien', icon: Calendar },
    { id: 'price_asc', label: 'Prix croissant', icon: DollarSign },
    { id: 'price_desc', label: 'Prix décroissant', icon: DollarSign },
    { id: 'rating', label: 'Note', icon: Star }
  ];

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Fetch services
  const fetchServices = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/services');
      if (response.ok) {
        const data = await response.json();
        setServices(data);
        setFilteredServices(data);
      } else {
        setError('Erreur lors du chargement des services');
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      setError('Erreur lors du chargement des services');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchServices();
    }
  }, [user]);

  const refreshData = async () => {
    setRefreshing(true);
    await fetchServices();
    setRefreshing(false);
  };

  // Filtrer et trier les services
  useEffect(() => {
    let filtered = services;

    if (searchTerm) {
      filtered = filtered.filter(service => 
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.provider?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.provider?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(service => service.category === selectedCategory);
    }

    if (maxPrice) {
      filtered = filtered.filter(service => service.price <= parseFloat(maxPrice));
    }

    // Trier
    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'price_asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      filtered.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    }

    setFilteredServices(filtered);
  }, [services, searchTerm, selectedCategory, maxPrice, sortBy]);

  // Gérer le formulaire de création
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Service créé avec succès');
        setShowCreateForm(false);
        setFormData({
          name: '',
          description: '',
          category: 'OTHER',
          price: '',
          duration: '',
          location: '',
          requirements: ''
        });
        await fetchServices();
      } else {
        setError(data.error || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Error creating service:', error);
      setError('Erreur lors de la création');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryLabel = (category) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.label : category;
  };

  const renderStars = (rating) => {
    const stars = [];
    const roundedRating = Math.round(rating * 2) / 2;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= roundedRating) {
        stars.push(<Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />);
      } else if (i - 0.5 <= roundedRating) {
        stars.push(<Star key={i} className="w-4 h-4 text-yellow-400 opacity-50 fill-current" />);
      } else {
        stars.push(<Star key={i} className="w-4 h-4 text-gray-300" />);
      }
    }
    return stars;
  };

  const openDetailsModal = (service) => {
    setSelectedService(service);
    setShowDetailsModal(true);
  };

  const handleBookService = (service) => {
    // Rediriger vers la page de réservation ou ouvrir un modal de réservation
    router.push(`/services/book/${service.id}`);
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

  const canCreateService = user.role === 'PROVIDER' || user.role === 'SERVICE_PROVIDER';

  // Calculate statistics
  const stats = {
    totalServices: services.length,
    activeServices: services.filter(s => s.isActive).length,
    totalBookings: services.reduce((sum, s) => sum + (s.totalBookings || 0), 0),
    averageRating: services.length > 0 ? (services.reduce((sum, s) => sum + (s.averageRating || 0), 0) / services.length).toFixed(1) : 0
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Head>
        <title>Services - EcoDeli</title>
        <meta name="description" content="Découvrez et réservez des services près de chez vous" />
      </Head>

      <RoleBasedNavigation 
        user={user} 
        isDarkMode={isDarkMode} 
        toggleDarkMode={toggleDarkMode} 
        logout={logout}
        currentPage="services"
      />

      {/* Header Section */}
      <div className="px-6 py-8 bg-sky-50 dark:bg-sky-900/20">
        <div className="mx-auto max-w-7xl">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Services
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Découvrez et réservez des services près de chez vous
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
              {canCreateService && (
                <button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="flex items-center px-6 py-2 font-medium text-white bg-emerald-500 rounded-full transition hover:bg-emerald-600"
                >
                  <Plus className="mr-2 w-4 h-4" />
                  Créer un service
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total services</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalServices}</p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-blue-100 rounded-full dark:bg-blue-900">
                <Wrench className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Services actifs</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeServices}</p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-green-100 rounded-full dark:bg-green-900">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Réservations</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalBookings}</p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-orange-100 rounded-full dark:bg-orange-900">
                <BookOpen className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Note moyenne</p>
                <div className="flex gap-2 items-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.averageRating}</p>
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                </div>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-yellow-100 rounded-full dark:bg-yellow-900">
                <Star className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
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
        {showCreateForm && canCreateService && (
          <div className="p-6 mb-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
              Créer un nouveau service
            </h2>
            
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nom du service *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="p-2 w-full text-gray-900 bg-white rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                    placeholder="Nom du service"
                    required
                  />
                </div>
                
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Catégorie
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="p-2 w-full text-gray-900 bg-white rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  >
                    {categories.slice(1).map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Prix (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="p-2 w-full text-gray-900 bg-white rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                    placeholder="0.00"
                    required
                  />
                </div>
                
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Durée (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    className="p-2 w-full text-gray-900 bg-white rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                    placeholder="60"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Localisation
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="p-2 w-full text-gray-900 bg-white rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                    placeholder="Adresse ou zone de service"
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
                  placeholder="Décrivez votre service"
                />
              </div>
              
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Prérequis
                </label>
                <textarea
                  value={formData.requirements}
                  onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                  className="p-2 w-full text-gray-900 bg-white rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  rows="2"
                  placeholder="Matériel nécessaire, prérequis, etc."
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
              placeholder="Rechercher un service, prestataire ou localisation..."
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
            <div className="grid gap-6 md:grid-cols-4">
              <div>
                <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">Catégorie</h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.value}
                      onClick={() => setSelectedCategory(category.value)}
                      className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                        selectedCategory === category.value
                          ? 'bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <category.icon className="w-4 h-4" />
                      {category.label}
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
                <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">Trier par</h3>
                <div className="flex flex-wrap gap-2">
                  {sortOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSortBy(option.id)}
                      className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                        sortBy === option.id
                          ? 'bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <option.icon className="w-4 h-4" />
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">Actions</h3>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('');
                    setMaxPrice('');
                    setSortBy('newest');
                  }}
                  className="px-4 py-2 text-sm text-gray-600 bg-white rounded-lg border border-gray-200 transition-colors hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Services List */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full border-4 border-sky-400 animate-spin border-t-transparent"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-300">Chargement des services...</p>
              </div>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-lg shadow-sm dark:bg-gray-800">
              <Wrench className="mx-auto mb-4 w-16 h-16 text-gray-400" />
              <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                Aucun service trouvé
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm || selectedCategory || maxPrice
                  ? 'Aucun service ne correspond à vos critères de recherche.'
                  : 'Aucun service disponible pour le moment.'}
              </p>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
              {filteredServices.map((service) => (
                <div 
                  key={service.id} 
                  className={`bg-white rounded-lg border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700 transition-all hover:shadow-md ${
                    viewMode === 'list' ? 'flex gap-6 p-6' : 'p-6'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <Wrench className="w-8 h-8 text-sky-500" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {service.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {getCategoryLabel(service.category)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {service.price}€
                        </div>
                        {service.duration && (
                          <div className="flex gap-1 items-center text-sm text-gray-500">
                            <Timer className="w-3 h-3" />
                            {service.duration}min
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <User className="mr-2 w-4 h-4" />
                        <span>{service.provider.firstName} {service.provider.lastName}</span>
                      </div>
                      
                      {service.location && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <MapPin className="mr-2 w-4 h-4" />
                          <span>{service.location}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <BookOpen className="mr-2 w-4 h-4" />
                        <span>{service.totalBookings} réservation{service.totalBookings > 1 ? 's' : ''}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="mr-2 w-4 h-4" />
                        <span>Créé le: {formatDate(service.createdAt)}</span>
                      </div>
                    </div>

                    {service.averageRating > 0 && (
                      <div className="flex gap-2 items-center mb-4">
                        <div className="flex gap-1 items-center">
                          {renderStars(service.averageRating)}
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          ({service.averageRating})
                        </span>
                      </div>
                    )}

                    {service.description && (
                      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                        {service.description.length > 100 
                          ? `${service.description.substring(0, 100)}...` 
                          : service.description}
                      </p>
                    )}

                    {service.requirements && (
                      <div className="p-4 mb-4 bg-blue-50 rounded-lg dark:bg-blue-900/20">
                        <h4 className="mb-2 font-medium text-blue-900 dark:text-blue-300">
                          Prérequis:
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {service.requirements.length > 80 
                            ? `${service.requirements.substring(0, 80)}...` 
                            : service.requirements}
                        </p>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openDetailsModal(service)}
                          className="flex items-center px-4 py-2 text-sm text-white bg-sky-500 rounded-lg hover:bg-sky-600"
                        >
                          <Eye className="mr-2 w-4 h-4" />
                          Voir détails
                        </button>
                        
                        <button 
                          onClick={() => handleBookService(service)}
                          className="flex items-center px-4 py-2 text-sm text-white bg-emerald-500 rounded-lg hover:bg-emerald-600"
                        >
                          Réserver
                        </button>
                      </div>
                      
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Mis à jour: {formatDate(service.updatedAt)}
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
      {showDetailsModal && selectedService && (
        <div className="flex overflow-y-auto fixed inset-0 z-50 justify-center items-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Détails - {selectedService.name}
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
                      <span className="text-sm text-gray-600 dark:text-gray-400">Catégorie:</span>
                      <div className="font-medium text-gray-900 dark:text-white">{getCategoryLabel(selectedService.category)}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Prix:</span>
                      <div className="font-medium text-gray-900 dark:text-white">{selectedService.price}€</div>
                    </div>
                    {selectedService.duration && (
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Durée:</span>
                        <div className="font-medium text-gray-900 dark:text-white">{selectedService.duration} minutes</div>
                      </div>
                    )}
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Prestataire:</span>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {selectedService.provider.firstName} {selectedService.provider.lastName}
                      </div>
                    </div>
                  </div>
                </div>

                {selectedService.location && (
                  <div>
                    <h4 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                      Localisation
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">{selectedService.location}</p>
                  </div>
                )}

                {selectedService.description && (
                  <div>
                    <h4 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                      Description
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">{selectedService.description}</p>
                  </div>
                )}

                {selectedService.requirements && (
                  <div>
                    <h4 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                      Prérequis
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">{selectedService.requirements}</p>
                  </div>
                )}

                {selectedService.averageRating > 0 && (
                  <div>
                    <h4 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                      Évaluation
                    </h4>
                    <div className="flex gap-2 items-center">
                      <div className="flex gap-1 items-center">
                        {renderStars(selectedService.averageRating)}
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        ({selectedService.averageRating}) - {selectedService.totalBookings} réservations
                      </span>
                    </div>
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
                    onClick={() => handleBookService(selectedService)}
                    className="flex-1 px-4 py-2 text-white bg-emerald-500 rounded-lg hover:bg-emerald-600"
                  >
                    Réserver ce service
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
