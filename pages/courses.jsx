import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import RoleBasedNavigation from '../components/RoleBasedNavigation';
import { 
  Store,
  Package,
  MapPin,
  Clock,
  Star,
  Users,
  Search,
  Filter,
  ChevronRight,
  ShoppingBag,
  Heart,
  Eye,
  Calendar,
  Truck,
  X,
  Plus,
  Trash2,
  Minus,
  ShoppingCart,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  WifiOff,
  TrendingUp,
  UserCheck,
  ArrowLeft
} from 'lucide-react';

export default function Courses({ isDarkMode, toggleDarkMode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [merchants, setMerchants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [merchantProducts, setMerchantProducts] = useState([]);
  const [showMerchantModal, setShowMerchantModal] = useState(false);
  
  // Advanced filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [minRating, setMinRating] = useState(0);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sortBy, setSortBy] = useState('name'); // name, rating, distance, products
  
  // Cart state
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  
  // UI state
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [productLoading, setProductLoading] = useState(false);
  const [addingToCart, setAddingToCart] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSync, setLastSync] = useState(null);
  
  // Favorites state
  const [favorites, setFavorites] = useState([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const categories = [
    { id: 'all', label: 'Tous les marchands', icon: Store },
    { id: 'food', label: 'Alimentation', icon: Package },
    { id: 'clothes', label: 'Vêtements', icon: Package },
    { id: 'electronics', label: 'Électronique', icon: Package },
    { id: 'beauty', label: 'Beauté & Cosmétiques', icon: Package },
    { id: 'sports', label: 'Sport & Loisirs', icon: Package },
    { id: 'books', label: 'Livres & Culture', icon: Package },
    { id: 'home', label: 'Maison & Décoration', icon: Package },
    { id: 'automotive', label: 'Automobile', icon: Package },
    { id: 'health', label: 'Santé & Pharmacie', icon: Package }
  ];

  const sortOptions = [
    { id: 'name', label: 'Nom (A-Z)' },
    { id: 'products', label: 'Nombre de produits' },
    { id: 'rating', label: 'Note (élevée)' },
    { id: 'recent', label: 'Récemment ajoutés' }
  ];

  useEffect(() => {
    fetchMerchants();
    loadCartFromStorage();
    loadFavoritesFromStorage();
    
    // Connection monitoring
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Connexion rétablie - Actualisation des données...', 'success');
      fetchMerchants();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Connexion perdue - Mode hors ligne activé', 'error');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial connection check
    setIsOnline(navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Toast notification effect
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  const loadFavoritesFromStorage = () => {
    try {
      const savedFavorites = localStorage.getItem('ecodeli_favorites');
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }
    } catch (error) {
      console.error('Error loading favorites from storage:', error);
      localStorage.removeItem('ecodeli_favorites');
    }
  };

  const toggleFavorite = (merchant) => {
    const isFavorite = favorites.some(fav => fav.id === merchant.id);
    let newFavorites;
    
    if (isFavorite) {
      newFavorites = favorites.filter(fav => fav.id !== merchant.id);
      showToast(`${merchant.name} retiré des favoris`);
    } else {
      newFavorites = [...favorites, {
        id: merchant.id,
        name: merchant.name,
        address: merchant.address,
        productCount: merchant.productCount,
        addedAt: Date.now()
      }];
      showToast(`${merchant.name} ajouté aux favoris`);
    }
    
    setFavorites(newFavorites);
    localStorage.setItem('ecodeli_favorites', JSON.stringify(newFavorites));
  };

  const isFavorite = (merchantId) => {
    return favorites.some(fav => fav.id === merchantId);
  };

  const loadCartFromStorage = () => {
    try {
      const savedCart = localStorage.getItem('ecodeli_cart');
      const savedMerchant = localStorage.getItem('ecodeli_merchant');
      const cartTimestamp = localStorage.getItem('ecodeli_cart_timestamp');
      
      if (savedCart && savedMerchant) {
        const cart = JSON.parse(savedCart);
        const merchant = JSON.parse(savedMerchant);
        const timestamp = cartTimestamp ? parseInt(cartTimestamp) : Date.now();
        
        // Check if cart is older than 24 hours
        const isExpired = Date.now() - timestamp > 24 * 60 * 60 * 1000;
        
        if (isExpired) {
          localStorage.removeItem('ecodeli_cart');
          localStorage.removeItem('ecodeli_merchant');
          localStorage.removeItem('ecodeli_cart_timestamp');
          showToast('Votre panier a expiré et a été vidé', 'info');
          return;
        }
        
        setCart(cart);
        if (cart.length > 0) {
          showToast(`Panier restauré: ${cart.length} article${cart.length > 1 ? 's' : ''} de ${merchant.name}`);
        }
      }
    } catch (error) {
      console.error('Error loading cart from storage:', error);
      // Clear corrupted cart data
      localStorage.removeItem('ecodeli_cart');
      localStorage.removeItem('ecodeli_merchant');
      localStorage.removeItem('ecodeli_cart_timestamp');
    }
  };

  const fetchMerchants = async (retryCount = 0) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/merchants', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Marchands récupérés:', data.length);
        setMerchants(data);
        setLastSync(new Date());
        if (retryCount > 0) {
          showToast('Marchands rechargés avec succès!');
        }
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch merchants:', response.status, errorData);
        showError(`Erreur lors du chargement des marchands: ${errorData.error || 'Erreur serveur'}`);
      }
    } catch (error) {
      console.error('Error fetching merchants:', error);
      if (retryCount < 2) {
        setTimeout(() => fetchMerchants(retryCount + 1), 2000);
        showError('Connexion instable, nouvelle tentative...');
      } else {
        showError('Impossible de charger les marchands. Vérifiez votre connexion.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMerchantProducts = async (merchantId) => {
    try {
      setProductLoading(true);
      const response = await fetch(`/api/merchants/products?merchantId=${merchantId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const products = await response.json();
        console.log(`Produits pour marchand ${merchantId}:`, products.length);
        setMerchantProducts(products);
      } else {
        const errorData = await response.json();
        console.error('Error fetching merchant products:', response.status, errorData);
        setMerchantProducts([]);
        showError('Erreur lors du chargement des produits');
      }
    } catch (error) {
      console.error('Error fetching merchant products:', error);
      setMerchantProducts([]);
      showError('Impossible de charger les produits');
    } finally {
      setProductLoading(false);
    }
  };

  const handleViewMerchant = async (merchant) => {
    setSelectedMerchant(merchant);
    setShowMerchantModal(true);
    await fetchMerchantProducts(merchant.id);
  };

  const filteredMerchants = merchants
    .filter(merchant => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        merchant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (merchant.address && merchant.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (merchant.companyName && merchant.companyName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Category filter - for now, show all categories as we'd need merchant specialties in the schema
      const matchesCategory = selectedCategory === 'all' || true;
      
      // Product count filter
      const hasProducts = !onlyAvailable || merchant.productCount > 0;
      
      // Rating filter (using mock rating for now)
      const merchantRating = 4.8; // Mock rating - you'd get this from reviews
      const matchesRating = merchantRating >= minRating;
      
      // Favorites filter
      const matchesFavorites = !showFavoritesOnly || isFavorite(merchant.id);
      
      return matchesSearch && matchesCategory && hasProducts && matchesRating && matchesFavorites;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'products':
          return b.productCount - a.productCount;
        case 'rating':
          return 4.8 - 4.8; // Mock - would sort by actual ratings
        case 'recent':
          return new Date(b.joinedAt) - new Date(a.joinedAt);
        default:
          return 0;
      }
    });

  const handleOrderFromMerchant = (merchant) => {
    // Redirect to checkout with current cart
    if (cart.length > 0) {
      localStorage.setItem('ecodeli_merchant', JSON.stringify(merchant));
      router.push('/checkout');
    } else {
      alert('Votre panier est vide');
    }
  };

  // Cart management functions
  const addToCart = async (product, merchant) => {
    try {
      setAddingToCart(product.id);
      
      // Check online status for real-time stock validation
      if (!isOnline) {
        showToast('Mode hors ligne - L\'article sera ajouté au panier mais le stock ne peut pas être vérifié', 'info');
      }
      
      // Check if this is from a different merchant
      const currentMerchant = localStorage.getItem('ecodeli_merchant');
      if (currentMerchant && cart.length > 0) {
        const parsedMerchant = JSON.parse(currentMerchant);
        if (parsedMerchant.id !== merchant.id) {
          const confirmSwitch = confirm(
            `Votre panier contient des articles de ${parsedMerchant.name}. Voulez-vous vider le panier et ajouter cet article de ${merchant.name} ?`
          );
          if (!confirmSwitch) {
            setAddingToCart(null);
            return;
          }
          setCart([]);
          localStorage.removeItem('ecodeli_cart');
          showToast('Panier vidé et nouveau marchand sélectionné', 'info');
        }
      }

      // Check stock availability
      if (product.stock <= 0) {
        showError('Produit en rupture de stock');
        setAddingToCart(null);
        return;
      }

      // Store merchant info
      localStorage.setItem('ecodeli_merchant', JSON.stringify(merchant));

      const existingItem = cart.find(item => item.id === product.id);
      let newCart;

      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          showError('Stock insuffisant pour cette quantité');
          setAddingToCart(null);
          return;
        }
        newCart = cart.map(item =>
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        showToast(`Quantité mise à jour: ${product.name}`);
      } else {
        newCart = [...cart, { ...product, quantity: 1 }];
        showToast(`Ajouté au panier: ${product.name}`);
      }

      setCart(newCart);
      localStorage.setItem('ecodeli_cart', JSON.stringify(newCart));
      localStorage.setItem('ecodeli_cart_timestamp', Date.now().toString());
      
      // Simulate loading for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      showError('Erreur lors de l\'ajout au panier');
    } finally {
      setAddingToCart(null);
    }
  };

  const updateCartQuantity = (productId, newQuantity) => {
    if (newQuantity === 0) {
      removeFromCart(productId);
      return;
    }

    const item = cart.find(item => item.id === productId);
    if (item && newQuantity > item.stock) {
      showError(`Stock maximum atteint (${item.stock} disponible${item.stock > 1 ? 's' : ''})`);
      return;
    }

    const newCart = cart.map(item =>
      item.id === productId 
        ? { ...item, quantity: newQuantity }
        : item
    );
    
    setCart(newCart);
    localStorage.setItem('ecodeli_cart', JSON.stringify(newCart));
    localStorage.setItem('ecodeli_cart_timestamp', Date.now().toString());
    
    if (newQuantity > (item?.quantity || 0)) {
      showToast(`Quantité augmentée: ${item?.name}`);
    } else {
      showToast(`Quantité diminuée: ${item?.name}`);
    }
  };

  const removeFromCart = (productId) => {
    const itemToRemove = cart.find(item => item.id === productId);
    const newCart = cart.filter(item => item.id !== productId);
    
    setCart(newCart);
    
    if (newCart.length === 0) {
      localStorage.removeItem('ecodeli_cart');
      localStorage.removeItem('ecodeli_merchant');
      localStorage.removeItem('ecodeli_cart_timestamp');
      showToast('Panier vidé', 'info');
    } else {
      localStorage.setItem('ecodeli_cart', JSON.stringify(newCart));
      localStorage.setItem('ecodeli_cart_timestamp', Date.now().toString());
      showToast(`${itemToRemove?.name} retiré du panier`);
    }
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('ecodeli_cart');
    localStorage.removeItem('ecodeli_merchant');
    localStorage.removeItem('ecodeli_cart_timestamp');
    showToast('Panier vidé', 'info');
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
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

  // Calculate statistics
  const stats = {
    totalMerchants: merchants.length,
    totalProducts: merchants.reduce((sum, m) => sum + m.productCount, 0),
    activeMerchants: merchants.filter(m => m.productCount > 0).length,
    averageRating: 4.8, // Mock data - would calculate from actual reviews
    favoriteCount: favorites.length
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Head>
        <title>Marchands Partenaires - ecodeli</title>
        <meta name="description" content="Découvrez tous nos marchands partenaires et commandez avec livraison à domicile" />
        <link rel="icon" href="/LOGO_.png" />
      </Head>

      <RoleBasedNavigation isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

      {/* Header Section */}
      <div className="px-6 py-8 bg-sky-50 dark:bg-sky-900/20">
        <div className="mx-auto max-w-7xl">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Marchands Partenaires
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Découvrez nos commerçants locaux et profitez de la livraison à domicile avec choix de créneaux horaires
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/register"
                className="flex gap-2 items-center px-6 py-2 font-medium text-white bg-sky-500 rounded-full transition hover:bg-sky-600"
              >
                <UserCheck className="w-4 h-4" />
                Devenir partenaire
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Connection Status Banner */}
      {!isOnline && (
        <div className="px-4 py-2 text-white bg-yellow-500">
          <div className="container flex justify-center items-center mx-auto">
            <WifiOff className="mr-2 w-4 h-4" />
            <span className="text-sm font-medium">
              Mode hors ligne - Certaines fonctionnalités peuvent être limitées
            </span>
          </div>
        </div>
      )}

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <div className="fixed right-6 bottom-6 z-50">
          <button
            onClick={() => setShowCart(true)}
            className="flex items-center px-4 py-3 text-white bg-sky-500 rounded-full shadow-lg transition-all duration-300 transform hover:bg-sky-600 hover:scale-105"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="ml-2 font-medium">{getCartItemCount()}</span>
            <span className="ml-2">€{getCartTotal().toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Toast Notifications */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 duration-300 animate-in slide-in-from-top-2">
          <div className={`flex items-center px-4 py-3 rounded-lg shadow-lg ${
            toast.type === 'success' ? 'bg-green-500 text-white' : 
            toast.type === 'error' ? 'bg-red-500 text-white' : 
            'bg-blue-500 text-white'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle className="mr-2 w-5 h-5" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="mr-2 w-5 h-5" />
            ) : (
              <WifiOff className="mr-2 w-5 h-5" />
            )}
            <span className="font-medium">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="p-1 ml-3 rounded hover:bg-black hover:bg-opacity-20"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="fixed top-4 left-1/2 z-50 mx-4 w-full max-w-md transform -translate-x-1/2">
          <div className="flex justify-between items-center px-4 py-3 text-white bg-red-500 rounded-lg shadow-lg">
            <div className="flex items-center">
              <AlertCircle className="mr-2 w-5 h-5" />
              <span className="font-medium">{error}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => fetchMerchants()}
                className="p-1 rounded transition-colors hover:bg-red-600"
                title="Réessayer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setError(null)}
                className="p-1 rounded transition-colors hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="px-6 py-8 mx-auto max-w-7xl">
        {/* Stats Cards */}
        <div className="grid gap-6 mb-8 md:grid-cols-4">
          <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total marchands</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalMerchants}</p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-sky-100 rounded-full dark:bg-sky-900">
                <Store className="w-6 h-6 text-sky-600 dark:text-sky-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Produits disponibles</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalProducts}</p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-green-100 rounded-full dark:bg-green-900">
                <Package className="w-6 h-6 text-green-600 dark:text-green-400" />
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

          <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Mes favoris</p>
                <div className="flex gap-2 items-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.favoriteCount}</p>
                  <Heart className="w-5 h-5 text-red-400 fill-current" />
                </div>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-red-100 rounded-full dark:bg-red-900">
                <Heart className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col gap-4">
            {/* Main Search Row */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              {/* Search */}
              <div className="flex-1 max-w-lg">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 w-5 h-5 text-gray-400 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Rechercher un marchand, une localisation ou un produit..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="py-3 pr-4 pl-10 w-full text-gray-900 bg-white rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Sort and Advanced Filters */}
              <div className="flex gap-3 items-center">
                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 text-gray-900 bg-white rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                >
                  {sortOptions.map(option => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>

                {/* Advanced Filters Toggle */}
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                    showAdvancedFilters || minRating > 0 || onlyAvailable || showFavoritesOnly
                      ? 'bg-sky-500 text-white border-sky-500'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700'
                  }`}
                >
                  <Filter className="mr-2 w-4 h-4" />
                  Filtres
                  {(minRating > 0 || onlyAvailable || showFavoritesOnly) && (
                    <span className="px-2 py-1 ml-2 text-xs bg-white bg-opacity-20 rounded-full">
                      {[minRating > 0, onlyAvailable, showFavoritesOnly].filter(Boolean).length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center px-3 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
                    selectedCategory === category.id
                      ? 'bg-sky-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  <category.icon className="mr-1 w-4 h-4" />
                  {category.label}
                </button>
              ))}
            </div>

            {/* Advanced Filters Panel */}
            {showAdvancedFilters && (
              <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 duration-300 dark:bg-gray-800 dark:border-gray-700 animate-in slide-in-from-top-2">
                <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">Filtres avancés</h3>
                
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  {/* Rating Filter */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Note minimum
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="range"
                        min="0"
                        max="5"
                        step="0.5"
                        value={minRating}
                        onChange={(e) => setMinRating(parseFloat(e.target.value))}
                        className="flex-1"
                      />
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Star className="mr-1 w-4 h-4 text-yellow-500" />
                        {minRating}/5
                      </div>
                    </div>
                  </div>

                  {/* Availability Filter */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Disponibilité & Favoris
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={onlyAvailable}
                          onChange={(e) => setOnlyAvailable(e.target.checked)}
                          className="mr-2 text-sky-500 rounded border-gray-300 focus:ring-sky-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Seulement avec produits
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={showFavoritesOnly}
                          onChange={(e) => setShowFavoritesOnly(e.target.checked)}
                          className="mr-2 text-red-500 rounded border-gray-300 focus:ring-red-500"
                        />
                        <span className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                          <Heart className="mr-1 w-4 h-4 text-red-500" />
                          Mes favoris ({favorites.length})
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Reset Filters */}
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setMinRating(0);
                        setOnlyAvailable(false);
                        setShowFavoritesOnly(false);
                        setSelectedCategory('all');
                        setSearchTerm('');
                        setSortBy('name');
                        showToast('Filtres réinitialisés');
                      }}
                      className="px-4 py-2 text-sm text-gray-600 bg-white rounded-lg border border-gray-200 transition-colors hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-600"
                    >
                      Réinitialiser les filtres
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {isLoading ? (
              <span>Chargement...</span>
            ) : (
              <span>
                {filteredMerchants.length} marchand{filteredMerchants.length !== 1 ? 's' : ''} trouvé{filteredMerchants.length !== 1 ? 's' : ''}
                {showFavoritesOnly && (
                  <span className="ml-1 text-red-500 dark:text-red-400">
                    <Heart className="inline mr-1 w-4 h-4" />
                    (favoris uniquement)
                  </span>
                )}
                {!showFavoritesOnly && (searchTerm || selectedCategory !== 'all' || minRating > 0 || onlyAvailable) && (
                  <span className="ml-1 text-sky-600 dark:text-sky-400">
                    (avec filtres actifs)
                  </span>
                )}
              </span>
            )}
          </div>
          {filteredMerchants.length > 0 && !isLoading && (
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Triés par: {sortOptions.find(opt => opt.id === sortBy)?.label}</span>
              {lastSync && (
                <span className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-1 ${isOnline ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  Dernière sync: {lastSync.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Merchants Grid */}
        {isLoading ? (
          <div className="py-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-full border-4 border-sky-400 animate-spin border-t-transparent"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Chargement des marchands...</p>
          </div>
        ) : filteredMerchants.length === 0 ? (
          <div className="py-12 text-center">
            <Store className="mx-auto mb-4 w-16 h-16 text-gray-400" />
            <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
              Aucun marchand trouvé
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Essayez de modifier votre recherche ou vos filtres
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredMerchants.map((merchant) => (
              <div key={merchant.id} className="overflow-hidden bg-white rounded-lg shadow-sm transition-all duration-200 hover:shadow-md hover:scale-105 dark:bg-gray-800">
                {/* Merchant Image */}
                <div className="relative h-48 bg-gradient-to-br from-sky-400 to-blue-500">
                  {merchant.image ? (
                    <Image
                      src={merchant.image}
                      alt={merchant.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex justify-center items-center h-full">
                      <Store className="w-16 h-16 text-white opacity-80" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4">
                    <div className="px-3 py-1 text-sm font-medium text-sky-800 bg-white bg-opacity-90 rounded-full">
                      <Package className="inline mr-1 w-4 h-4" />
                      {merchant.productCount} produits
                    </div>
                  </div>
                </div>

                {/* Merchant Info */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
                        {merchant.name}
                      </h3>
                      {merchant.address && (
                        <p className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <MapPin className="mr-1 w-4 h-4" />
                          {merchant.address}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center px-2 py-1 text-xs text-green-800 bg-green-100 rounded-full dark:bg-green-900 dark:text-green-200">
                      <div className="mr-1 w-2 h-2 bg-green-500 rounded-full"></div>
                      Ouvert
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center">
                      <Calendar className="mr-1 w-4 h-4" />
                      Membre depuis {new Date(merchant.joinedAt).getFullYear()}
                    </div>
                    <div className="flex items-center">
                      <Star className="mr-1 w-4 h-4 text-yellow-500" />
                      4.8 (127 avis)
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewMerchant(merchant)}
                      className="flex flex-1 justify-center items-center px-4 py-2 text-white bg-sky-500 rounded-lg transition-all duration-200 hover:bg-sky-600 hover:scale-105"
                    >
                      <Eye className="mr-2 w-4 h-4" />
                      Voir produits
                    </button>
                    <button 
                      onClick={() => toggleFavorite(merchant)}
                      className={`p-2 rounded-lg border transition-all duration-200 ${
                        isFavorite(merchant.id)
                          ? 'border-red-300 bg-red-50 hover:bg-red-100 dark:border-red-600 dark:bg-red-900 dark:hover:bg-red-800'
                          : 'border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700'
                      }`}
                      title={isFavorite(merchant.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    >
                      <Heart className={`w-4 h-4 transition-colors ${
                        isFavorite(merchant.id) 
                          ? 'text-red-500 fill-current' 
                          : 'text-gray-600 dark:text-gray-400'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Merchant Products Modal */}
        {showMerchantModal && selectedMerchant && (
          <div className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedMerchant.name}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      {merchantProducts.length} produits disponibles
                    </p>
                  </div>
                  <button
                    onClick={() => setShowMerchantModal(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {productLoading ? (
                  <div className="py-8 text-center">
                    <RefreshCw className="mx-auto mb-4 w-12 h-12 text-sky-500 animate-spin" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Chargement des produits...
                    </p>
                  </div>
                ) : merchantProducts.length === 0 ? (
                  <div className="py-8 text-center">
                    <Package className="mx-auto mb-4 w-12 h-12 text-gray-400" />
                    <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                      Aucun produit disponible
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Ce marchand n'a pas encore de produits disponibles
                    </p>
                    <button
                      onClick={() => fetchMerchantProducts(selectedMerchant.id)}
                      className="px-4 py-2 mt-4 text-sky-600 bg-white rounded-lg border border-sky-600 transition-colors hover:bg-sky-50 dark:bg-gray-700 dark:hover:bg-gray-600"
                    >
                      <RefreshCw className="inline mr-2 w-4 h-4" />
                      Actualiser
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {merchantProducts.map((product) => (
                      <div key={product.id} className={`p-4 rounded-lg border transition-all duration-200 ${
                        product.stock <= 0 
                          ? 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800 opacity-60' 
                          : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 hover:shadow-md hover:border-sky-300'
                      }`}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">{product.name}</h4>
                            <p className="text-sm text-gray-500">{product.category}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-bold text-sky-600">€{product.price}</span>
                            {product.stock <= 5 && product.stock > 0 && (
                              <p className="text-xs text-orange-500">Plus que {product.stock}</p>
                            )}
                          </div>
                        </div>
                        {product.description && (
                          <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                            {product.description}
                          </p>
                        )}
                        <div className="flex justify-between items-center">
                          <span className={`text-sm ${
                            product.stock <= 0 ? 'text-red-500' : 
                            product.stock <= 5 ? 'text-orange-500' : 'text-green-500'
                          }`}>
                            {product.stock <= 0 ? 'Rupture de stock' : `Stock: ${product.stock}`}
                          </span>
                          <button 
                            onClick={() => addToCart(product, selectedMerchant)}
                            disabled={product.stock <= 0 || addingToCart === product.id}
                            className={`flex items-center px-3 py-1 text-sm font-medium rounded transition-all duration-200 ${
                              product.stock <= 0 
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : addingToCart === product.id
                                ? 'bg-sky-400 text-white cursor-wait'
                                : 'bg-sky-500 text-white hover:bg-sky-600 hover:scale-105'
                            }`}
                          >
                            {addingToCart === product.id ? (
                              <RefreshCw className="mr-1 w-3 h-3 animate-spin" />
                            ) : (
                              <Plus className="mr-1 w-3 h-3" />
                            )}
                            {addingToCart === product.id ? 'Ajout...' : 'Ajouter'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowMerchantModal(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
                  >
                    Fermer
                  </button>
                  <button
                    onClick={() => handleOrderFromMerchant(selectedMerchant)}
                    className="flex-1 px-4 py-2 text-white bg-sky-500 rounded-lg hover:bg-sky-600"
                  >
                    <ShoppingBag className="inline mr-2 w-4 h-4" />
                    Passer commande
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="p-8 text-white bg-gradient-to-r from-sky-500 to-blue-600 rounded-2xl">
            <h2 className="mb-4 text-3xl font-bold">
              Vous êtes commerçant ?
            </h2>
            <p className="mb-6 text-xl opacity-90">
              Rejoignez notre réseau de marchands partenaires et proposez la livraison à domicile à vos clients
            </p>
            <Link href="/register">
              <button className="px-8 py-3 font-semibold text-sky-600 bg-white rounded-lg transition-all duration-200 hover:bg-gray-100 hover:scale-105">
                Devenir partenaire
              </button>
            </Link>
          </div>
        </div>

        {/* Cart Modal */}
        {showCart && (
          <div className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden">
              {/* Cart Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      <ShoppingCart className="inline mr-2 w-5 h-5" />
                      Mon panier ({getCartItemCount()})
                    </h2>
                    {cart.length > 0 && (
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Total: €{getCartTotal().toFixed(2)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {cart.length > 0 && (
                      <button
                        onClick={clearCart}
                        className="p-2 text-red-500 rounded-lg transition-colors hover:bg-red-50 dark:hover:bg-red-900"
                        title="Vider le panier"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setShowCart(false)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Cart Content */}
              <div className="p-6 overflow-y-auto max-h-[50vh]">
                {cart.length === 0 ? (
                  <div className="py-8 text-center">
                    <ShoppingCart className="mx-auto mb-4 w-12 h-12 text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400">Votre panier est vide</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200 transition-colors dark:bg-gray-700 dark:border-gray-600 hover:border-sky-300">
                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate dark:text-white">{item.name}</h4>
                          <div className="flex justify-between items-center mt-1">
                            <div className="text-sm text-gray-500">
                              €{item.price.toFixed(2)} × {item.quantity}
                            </div>
                            <div className="text-sm font-medium text-sky-600">
                              €{(item.price * item.quantity).toFixed(2)}
                            </div>
                          </div>
                          {item.stock <= 5 && (
                            <p className="mt-1 text-xs text-orange-500">
                              Stock faible ({item.stock} restant{item.stock > 1 ? 's' : ''})
                            </p>
                          )}
                        </div>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center ml-4 space-x-3">
                          <div className="flex items-center space-x-2 bg-gray-200 rounded-lg dark:bg-gray-600">
                            <button
                              onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                              className="p-2 text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-sm font-medium text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                              className="p-2 text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={item.quantity >= item.stock}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          
                          {/* Remove Button */}
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-2 text-red-500 rounded-lg transition-colors hover:bg-red-50 dark:hover:bg-red-900"
                            title="Retirer du panier"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cart Footer */}
              {cart.length > 0 && (
                <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">Total</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">€{getCartTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowCart(false)}
                      className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
                    >
                      Continuer mes achats
                    </button>
                    <button
                      onClick={() => {
                        setShowCart(false);
                        router.push('/checkout');
                      }}
                      className="flex-1 px-4 py-2 text-white bg-sky-500 rounded-lg hover:bg-sky-600"
                    >
                      <ShoppingBag className="inline mr-2 w-4 h-4" />
                      Commander
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
