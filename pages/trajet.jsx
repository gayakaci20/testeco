import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useTranslation } from '../contexts/TranslationContext'

// Import dynamique du composant Google Maps pour éviter les erreurs SSR
const GoogleMapComponent = dynamic(
  () => import('../components/GoogleMapWebComponent'),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center items-center w-full h-full bg-gray-100 dark:bg-gray-800">
        <div className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full border-4 border-sky-400 animate-spin border-t-transparent"></div>
          <p className="text-gray-600 dark:text-gray-300">{t ? t('loadingMap') : 'Chargement de la carte...'}</p>
        </div>
      </div>
    )
  }
)
import RoleBasedNavigation from '../components/RoleBasedNavigation'
import { MapPin, PlusCircle, ArrowUpDown, Filter, Trash2, ImageIcon } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

// --- Icônes remplacées par Lucide React ---
const LocationPinIcon = () => (
  <MapPin className="w-5 h-5 text-gray-400 dark:text-gray-500" />
)

const PlusCircleIcon = () => (
  <PlusCircle className="mr-1 w-5 h-5 text-sky-500 dark:text-sky-400" />
)

const SwapVerticalIcon = () => (
  <ArrowUpDown className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
)

const FilterIcon = () => (
  <Filter className="mr-1 w-4 h-4" />
)

const TrashIcon = () => (
  <Trash2 className="w-4 h-4 text-red-500" />
)

export default function Trajet({ isDarkMode, toggleDarkMode }) {
  const { user } = useAuth();
  const { t } = useTranslation();
  // Search settings
  const [searchType, setSearchType] = useState('my-trip')
  const [departureCity, setDepartureCity] = useState('')
  const [arrivalCity, setArrivalCity] = useState('')
  const [intermediateStops, setIntermediateStops] = useState([])
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  // Route tracking
  const [selectedRoute, setSelectedRoute] = useState(null)
  const [routeCoordinates, setRouteCoordinates] = useState(null)
  
  // Data states
  const [allPackages, setAllPackages] = useState([])
  const [filteredPackages, setFilteredPackages] = useState([])
  const [allRides, setAllRides] = useState([])
  const [filteredRides, setFilteredRides] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // View state - what to display (packages or rides)
  const [activeView, setActiveView] = useState('packages') // 'packages' or 'rides'
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    minWeight: '',
    maxWeight: '',
    status: '',
    urgent: false,
    fragile: false
  })

  // Fetch all packages and rides on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        let allPackagesData = [];
        
        // Fetch regular customer packages
        const packagesResponse = await fetch('/api/packages');
        let customerPackages = [];
        
        if (packagesResponse.ok) {
          const data = await packagesResponse.json();
          console.log('Data from /api/packages in trajet.jsx:', JSON.stringify(data, null, 2));
          
          if (Array.isArray(data)) {
            customerPackages = data;
          } else if (data.packages && Array.isArray(data.packages)) {
            customerPackages = data.packages;
          }
        }
        
        // Add customer packages to all packages
        allPackagesData = [...customerPackages];
        
        // If user is a professional carrier, also fetch merchant delivery orders
        if (user && user.role === 'CARRIER' && user.userType === 'PROFESSIONAL') {
          console.log('🚚 Professional carrier detected - fetching merchant delivery orders');
          
          try {
            const merchantOrdersResponse = await fetch('/api/merchant-delivery-orders');
            
            if (merchantOrdersResponse.ok) {
              const merchantOrders = await merchantOrdersResponse.json();
              console.log('📦 Merchant delivery orders:', merchantOrders.length);
              
              // Add merchant orders to packages data
              allPackagesData = [...allPackagesData, ...merchantOrders];
            } else {
              console.warn('⚠️ Failed to fetch merchant delivery orders:', merchantOrdersResponse.status);
            }
          } catch (merchantError) {
            console.warn('⚠️ Error fetching merchant delivery orders:', merchantError.message);
          }
        } else {
          console.log('👤 Regular/individual carrier - showing only customer packages');
        }
        
        // If no packages found, create a sample one
        if (allPackagesData.length === 0) {
          allPackagesData = [{
            id: 'sample1',
            description: 'Échantillon de colis',
            senderAddress: 'Paris, France',
            recipientAddress: 'Lyon, France',
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            weight: 5
          }];
        }
        
        console.log('📊 Total packages for display:', {
          customerPackages: customerPackages.length,
          totalPackages: allPackagesData.length,
          userType: user?.userType,
          userRole: user?.role
        });
        
        setAllPackages(allPackagesData);
        setFilteredPackages(allPackagesData);
        
        // Fetch rides
        const ridesResponse = await fetch('/api/rides?status=PENDING');
        let ridesData = [];
        
        if (ridesResponse.ok) {
          const rides = await ridesResponse.json();
          console.log('📊 Rides data received in trajet.jsx:', rides.length, 'rides');
          
          // Filter to only future rides and available statuses
          ridesData = rides.filter(ride => 
            ['PENDING', 'CONFIRMED'].includes(ride.status) &&
            new Date(ride.departureTime) > new Date()
          );
          
          console.log('✅ Filtered rides for trajet.jsx:', ridesData.length, 'future rides');
        } else {
          console.error('❌ Failed to fetch rides:', ridesResponse.status);
        }
        
        setAllRides(ridesData);
        setFilteredRides(ridesData);
        
      } catch (err) {
        setError(err.message);
        console.error("Fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]); // Depend on user to refetch when user data changes

  // Function to swap departure and arrival cities
  const swapCities = () => {
    setDepartureCity(arrivalCity);
    setArrivalCity(departureCity);
  };

  // Function to add an intermediate stop
  const addIntermediateStop = () => {
    setIntermediateStops([...intermediateStops, '']);
  };

  // Function to update an intermediate stop
  const updateIntermediateStop = (index, value) => {
    const updatedStops = [...intermediateStops];
    updatedStops[index] = value;
    setIntermediateStops(updatedStops);
  };

  // Function to remove an intermediate stop
  const removeIntermediateStop = (index) => {
    const updatedStops = intermediateStops.filter((_, i) => i !== index);
    setIntermediateStops(updatedStops);
  };

  // Function to update filters
  const updateFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Function to reset filters
  const resetFilters = () => {
    setFilters({
      minPrice: '',
      maxPrice: '',
      minWeight: '',
      maxWeight: '',
      status: '',
      urgent: false,
      fragile: false
    });
  };

  // Filter packages and rides based on search criteria and advanced filters
  const filterData = useCallback(() => {
    // Filter packages
    let filteredPkgs = [...allPackages];
    
    // Filter rides
    let filteredRds = [...allRides];
    
    // Apply location-based filtering first
    if (departureCity || arrivalCity) {
      // Helper function to check if a location matches search terms
      const locationMatches = (address, searchTerm) => {
        if (!searchTerm) return true; // If no search term, consider it a match
        return address.toLowerCase().includes(searchTerm.toLowerCase());
      };

      // Filter packages based on search type
      if (searchType === 'around') {
        // For 'around' mode, match packages with pickup or delivery near the specified city
        const searchCity = departureCity || arrivalCity;
        filteredPkgs = filteredPkgs.filter(pkg => 
          locationMatches(pkg.senderAddress, searchCity) || 
          locationMatches(pkg.recipientAddress, searchCity)
        );
        
        // Filter rides for 'around' mode - rides passing through the city
        filteredRds = filteredRds.filter(ride => 
          locationMatches(ride.origin, searchCity) || 
          locationMatches(ride.destination, searchCity)
        );
      } else {
        // For 'my-trip' mode, match packages along the route
        filteredPkgs = filteredPkgs.filter(pkg => {
          // All locations to check (departure, intermediate stops, arrival)
          const routeLocations = [
            departureCity, 
            ...intermediateStops, 
            arrivalCity
          ].filter(Boolean); // Remove empty values
          
          if (routeLocations.length === 0) return true; // If no locations specified, show all
          
          // Check if pickup or delivery matches any location in the route
          const pickupMatchesRoute = routeLocations.some(loc => 
            locationMatches(pkg.senderAddress, loc)
          );
          
          const deliveryMatchesRoute = routeLocations.some(loc => 
            locationMatches(pkg.recipientAddress, loc)
          );
          
          return pickupMatchesRoute || deliveryMatchesRoute;
        });
        
        // Filter rides for 'my-trip' mode - rides with similar route
        filteredRds = filteredRds.filter(ride => {
          if (!departureCity && !arrivalCity) return true;
          
          const departureMatches = departureCity ? locationMatches(ride.origin, departureCity) : true;
          const arrivalMatches = arrivalCity ? locationMatches(ride.destination, arrivalCity) : true;
          
          return departureMatches && arrivalMatches;
        });
      }
    }

    // Apply advanced filters to packages
    filteredPkgs = filteredPkgs.filter(pkg => {
      // Price filters
      if (filters.minPrice && pkg.price && pkg.price < parseFloat(filters.minPrice)) return false;
      if (filters.maxPrice && pkg.price && pkg.price > parseFloat(filters.maxPrice)) return false;
      
      // Weight filters
      if (filters.minWeight && pkg.weight && pkg.weight < parseFloat(filters.minWeight)) return false;
      if (filters.maxWeight && pkg.weight && pkg.weight > parseFloat(filters.maxWeight)) return false;
      
      // Status filter
      if (filters.status && pkg.status !== filters.status) return false;
      
      // Urgent filter
      if (filters.urgent && !pkg.urgent) return false;
      
      // Fragile filter
      if (filters.fragile && !pkg.fragile) return false;
      
      return true;
    });

    // Apply filters to rides (adapted for passenger transport)
    filteredRds = filteredRds.filter(ride => {
      // Price filters (price per person/trip)
      if (filters.minPrice && ride.pricePerKg && ride.pricePerKg < parseFloat(filters.minPrice)) return false;
      if (filters.maxPrice && ride.pricePerKg && ride.pricePerKg > parseFloat(filters.maxPrice)) return false;
      
      // Note: Weight filters don't apply to passenger transport
      // We could adapt this for number of available seats if needed
      
      // Status filter
      if (filters.status) {
        // Map ride status to package-like status for filtering
        const rideStatusMap = {
          'PENDING': 'PENDING',
          'CONFIRMED': 'CONFIRMED',
          'IN_PROGRESS': 'IN_TRANSIT',
          'COMPLETED': 'DELIVERED'
        };
        const mappedStatus = rideStatusMap[ride.status] || ride.status;
        if (mappedStatus !== filters.status) return false;
      }
      
      return true;
    });

    setFilteredPackages(filteredPkgs);
    setFilteredRides(filteredRds);
  }, [allPackages, allRides, searchType, departureCity, arrivalCity, intermediateStops, filters]);

  // Update filtered data when search criteria change
  useEffect(() => {
    filterData();
  }, [filterData]);

  // Update route coordinates when route changes
  useEffect(() => {
    if (departureCity && arrivalCity) {
      setRouteCoordinates({
        origin: departureCity,
        destination: arrivalCity,
        waypoints: intermediateStops.filter(Boolean).map(stop => ({ location: stop }))
      });
    } else {
      setRouteCoordinates(null);
    }
  }, [departureCity, arrivalCity, intermediateStops]);

  return (
    <div className="flex overflow-hidden flex-col h-screen bg-white dark:bg-gray-900">
      <Head>
        <title>Trouver un trajet - ecodeli</title>
        <meta name="description" content="Transportez des colis sur votre trajet ou autour de vous" />
        <link rel="icon" href="/LOGO_.png" />
      </Head>

      <RoleBasedNavigation isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

      {/* Main Layout (Sidebar + Map) */}
      <div className="flex overflow-hidden flex-grow">
        {/* Sidebar Gauche */}
        <aside className="flex overflow-y-auto flex-col w-full h-full bg-white border-r border-gray-200 md:w-1/3 lg:w-1/4 dark:bg-gray-900 dark:border-gray-700">
          {/* Sticky Header Part of Sidebar */}
          <div className="sticky top-0 z-10 flex-shrink-0 p-4 bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-700">
            <h1 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Transportez des colis sur votre trajet
            </h1>
            
            {/* Tabs pour basculer entre colis et trajets */}
            <div className="flex mb-4 bg-gray-100 rounded-lg dark:bg-gray-800">
              <button
                onClick={() => setActiveView('packages')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition ${
                  activeView === 'packages'
                    ? 'bg-white text-sky-600 shadow-sm dark:bg-gray-700 dark:text-sky-400'
                    : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                Colis ({filteredPackages.length})
              </button>
              <button
                onClick={() => setActiveView('rides')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition ${
                  activeView === 'rides'
                    ? 'bg-white text-sky-600 shadow-sm dark:bg-gray-700 dark:text-sky-400'
                    : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                Trajets ({filteredRides.length})
              </button>
            </div>
            {/* Radio buttons and inputs */}
            <div className="flex items-center mb-4 space-x-4">
              <label className="block mb-4 text-lg font-semibold text-gray-700 dark:text-gray-200">
                 <input 
                   type="radio" 
                   name="searchType" 
                   value="around" 
                   checked={searchType === 'around'} 
                   onChange={() => setSearchType('around')} 
                   className="mr-2 w-4 h-4 text-sky-600 border-gray-300 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:checked:bg-sky-500"
                 />
                 Autour de
               </label>
                <label className="block mb-4 text-lg font-semibold text-gray-700 dark:text-gray-200">
                 <input 
                   type="radio" 
                   name="searchType" 
                   value="my-trip" 
                   checked={searchType === 'my-trip'} 
                   onChange={() => setSearchType('my-trip')} 
                   className="mr-2 w-4 h-4 text-sky-600 border-gray-300 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:checked:bg-sky-500"
                 />
                 Sur mon trajet
               </label>
            </div>
            
            {/* Conditional inputs based on search type */}
            {searchType === 'around' ? (
              /* Mode "Autour de" - Un seul champ */
              <div className="relative mb-3">
                <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
                  <LocationPinIcon />
                </div>
                <input 
                  type="text" 
                  placeholder="Ville" 
                  value={departureCity}
                  onChange={(e) => setDepartureCity(e.target.value)}
                  className="py-2 pr-3 pl-10 w-full text-sm placeholder-gray-400 text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
                />
              </div>
            ) : (
              /* Mode "Sur mon trajet" - Champs départ/arrivée/étapes */
              <>
                {/* Departure city input */}
                <div className="relative mb-2">
                   <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
                     <LocationPinIcon />
                   </div>
                   <input 
                     type="text" 
                     placeholder="Ville de départ" 
                     value={departureCity}
                     onChange={(e) => setDepartureCity(e.target.value)}
                     className="py-2 pr-3 pl-10 w-full text-sm placeholder-gray-400 text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
                   />
                </div>
                
                {/* Intermediate stops */}
                {intermediateStops.map((stop, index) => (
                  <div key={`stop-${index}`} className="relative mb-2">
                    <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
                      <LocationPinIcon />
                    </div>
                    <input 
                      type="text" 
                      placeholder={`Étape ${index + 1}`}
                      value={stop}
                      onChange={(e) => updateIntermediateStop(index, e.target.value)}
                      className="py-2 pr-10 pl-10 w-full text-sm placeholder-gray-400 text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
                    />
                    <div className="flex absolute inset-y-0 right-0 items-center pr-3">
                      <button 
                        onClick={() => removeIntermediateStop(index)}
                        className="focus:outline-none"
                        aria-label="Supprimer cette étape"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                ))}
                
                {/* Arrival city input */}
                <div className="relative mb-3">
                   <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
                     <LocationPinIcon />
                   </div>
                   <input 
                     type="text" 
                     placeholder="Ville d'arrivée"
                     value={arrivalCity}
                     onChange={(e) => setArrivalCity(e.target.value)}
                     className="py-2 pr-10 pl-10 w-full text-sm placeholder-gray-400 text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
                   />
                   <div className="flex absolute inset-y-0 right-0 items-center pr-3">
                     <button 
                       onClick={swapCities}
                       className="focus:outline-none"
                       aria-label="Inverser les villes de départ et d'arrivée"
                     >
                       <SwapVerticalIcon />
                     </button>
                   </div>
                </div>
                
                {/* Add stop button */}
                <button 
                  onClick={addIntermediateStop}
                  className="flex items-center text-sm text-sky-500 hover:text-sky-600 dark:text-sky-400 dark:hover:text-sky-300 focus:outline-none"
                >
                   <PlusCircleIcon /> Ajouter une étape
                </button>
              </>
            )}
          </div>

          {/* Scrollable Trip List */}
          <div className="overflow-y-auto flex-grow p-4 space-y-4">
            {isLoading && <p className="text-center text-gray-500 dark:text-gray-400">Chargement...</p>}
            {error && <p className="text-center text-red-500 dark:text-red-400">Erreur: {error}</p>}
            
            {/* Affichage conditionnel basé sur activeView */}
            {activeView === 'packages' ? (
              /* Affichage des colis */
              <>
                {!isLoading && !error && filteredPackages.length === 0 && (
                  <p className="text-center text-gray-500 dark:text-gray-400">Aucun colis trouvé pour cette recherche.</p>
                )}
                {!isLoading && !error && filteredPackages.map((pkg) => {
                  const isMerchantDelivery = pkg.type === 'merchant_delivery';
                  
                  return (
                    <div
                      key={pkg.id}
                      className={`flex overflow-hidden rounded-lg border shadow-sm transition cursor-pointer hover:shadow-md ${
                        isMerchantDelivery 
                          ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' 
                          : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                      }`}
                      onClick={() => setSelectedRoute({
                        pickup: pkg.senderAddress,
                        delivery: pkg.recipientAddress,
                        id: pkg.id,
                        type: isMerchantDelivery ? 'merchant_delivery' : 'package',
                        price: pkg.price,
                        title: pkg.description || pkg.title,
                        weight: pkg.weight,
                        dimensions: pkg.dimensions,
                        status: pkg.status,
                        urgent: pkg.urgent,
                        fragile: pkg.fragile,
                        deliveryTimeSlot: pkg.deliveryTimeSlot,
                        deliveryInstructions: pkg.deliveryInstructions,
                        items: pkg.items
                      })}
                    >
                      {/* Image/Icon section */}
                      <div className="relative flex-shrink-0 w-1/4 aspect-square">
                        {!isMerchantDelivery && pkg.imageUrl ? (
                          <Image 
                            src={pkg.imageUrl} 
                            alt={`Image pour ${pkg.description}`} 
                            layout="fill"
                            objectFit="cover"
                            className="bg-gray-200 dark:bg-gray-700"
                          />
                        ) : (
                          <div className={`flex justify-center items-center w-full h-full ${
                            isMerchantDelivery 
                              ? 'bg-blue-100 dark:bg-blue-900/40' 
                              : 'bg-gray-200 dark:bg-gray-700'
                          }`}>
                            {isMerchantDelivery ? (
                              <svg className="w-8 h-8 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5l2.5 5M15 13l2.5 5" />
                              </svg>
                            ) : (
                              <ImageIcon className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                            )}
                          </div>
                        )}
                        {isMerchantDelivery && (
                          <div className="absolute top-1 right-1">
                            <span className="px-1 py-0.5 text-xs font-medium bg-blue-500 text-white rounded">
                              Marchand
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content section */}
                      <div className="flex flex-col flex-grow justify-between p-3">
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
                              {pkg.description || pkg.title}
                            </h3>
                            {isMerchantDelivery && pkg.items && (
                              <span className="text-xs text-blue-600 dark:text-blue-400">
                                ({pkg.items.length} articles)
                              </span>
                            )}
                          </div>
                          
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center mb-0.5">
                            <LocationPinIcon /> 
                            <span className="ml-1 truncate">
                              {isMerchantDelivery ? 'Récupérer: ' : 'De: '}{pkg.senderAddress}
                            </span>
                          </p>
                          <p className="flex items-center mb-1 text-xs text-gray-500 dark:text-gray-400">
                            <LocationPinIcon /> 
                            <span className="ml-1 truncate">
                              {isMerchantDelivery ? 'Livrer: ' : 'À: '}{pkg.recipientAddress}
                            </span>
                          </p>
                          
                          {isMerchantDelivery && pkg.deliveryTimeSlot && (
                            <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                              Créneau: {
                                pkg.deliveryTimeSlot === 'morning' ? 'Matin (8h-12h)' :
                                pkg.deliveryTimeSlot === 'afternoon' ? 'Après-midi (12h-18h)' :
                                pkg.deliveryTimeSlot === 'evening' ? 'Soirée (18h-20h)' :
                                pkg.deliveryTimeSlot
                              }
                            </p>
                          )}
                          
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Créé le: {new Date(pkg.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        
                        <div className="flex justify-between items-end mt-2">
                          <div className="flex items-center space-x-2">
                            <span className={`text-sm font-semibold ${
                              isMerchantDelivery 
                                ? 'text-blue-600 dark:text-blue-400' 
                                : 'text-sky-600 dark:text-sky-400'
                            }`}>
                              {pkg.price ? `€${pkg.price}` : 'Prix N/A'}
                            </span>
                            {isMerchantDelivery && (
                              <span className="text-xs text-blue-500 dark:text-blue-400">
                                (livraison)
                              </span>
                            )}
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {pkg.weight ? `${pkg.weight} ${isMerchantDelivery ? 'articles' : 'kg'}` : (pkg.dimensions || 'N/A')}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            {pkg.urgent && (
                              <span className="text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-1.5 py-0.5 rounded">Urgent</span>
                            )}
                            {pkg.fragile && (
                              <span className="text-xs font-medium bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-1.5 py-0.5 rounded">Fragile</span>
                            )}
                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                              pkg.status === 'CONFIRMED' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                              pkg.status === 'PROCESSING' ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200' :
                              pkg.status === 'SHIPPED' ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200' :
                              'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                            }`}>
                              {pkg.status === 'CONFIRMED' ? 'Confirmé' :
                               pkg.status === 'PROCESSING' ? 'En préparation' :
                               pkg.status === 'SHIPPED' ? 'Prêt' : pkg.status}
                            </span>
                          </div>
                        </div>
                        
                        {user && (user.role === 'CARRIER' || user.userType === 'CARRIER') && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                // Use different endpoint for merchant deliveries
                                const endpoint = isMerchantDelivery ? '/api/merchant-delivery-matches' : '/api/matches';
                                const body = isMerchantDelivery 
                                  ? { orderId: pkg.id, type: 'merchant_delivery' }
                                  : { packageId: pkg.id };
                                
                                const res = await fetch(endpoint, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify(body),
                                });
                                
                                if (res.ok) {
                                  alert(isMerchantDelivery ? 'Proposition de livraison envoyée !' : 'Proposition envoyée !');
                                } else {
                                  const err = await res.json();
                                  alert(err.error || 'Erreur lors de la proposition');
                                }
                              } catch (err) {
                                console.error(err);
                                alert('Erreur réseau');
                              }
                            }}
                            className={`mt-2 w-full text-xs font-medium text-white rounded-md py-1.5 transition ${
                              isMerchantDelivery 
                                ? 'bg-blue-500 hover:bg-blue-600' 
                                : 'bg-green-500 hover:bg-green-600'
                            }`}
                          >
                            {isMerchantDelivery ? 'Prendre cette livraison' : 'Prendre ce colis'}
                          </button>
                        )}
                        
                        {isMerchantDelivery && pkg.deliveryInstructions && (
                          <div className="mt-2 p-2 bg-blue-100 rounded text-xs text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
                            <strong>Instructions:</strong> {pkg.deliveryInstructions}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              /* Affichage des trajets */
              <>
                {!isLoading && !error && filteredRides.length === 0 && (
                  <p className="text-center text-gray-500 dark:text-gray-400">Aucun trajet trouvé pour cette recherche.</p>
                )}
                {!isLoading && !error && filteredRides.map((ride) => (
                  <div
                    key={ride.id}
                    className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm transition cursor-pointer hover:shadow-md dark:bg-gray-800 dark:border-gray-700"
                    onClick={() => setSelectedRoute({
                      pickup: ride.origin,
                      delivery: ride.destination,
                      id: ride.id,
                      type: 'ride',
                      price: ride.pricePerKg,
                      estimatedPrice: Math.round(80 * ride.pricePerKg), // Prix estimé pour 80km
                      title: `Trajet ${ride.origin} → ${ride.destination}`,
                      carrier: `${ride.user?.firstName || ''} ${ride.user?.lastName || ''}`.trim(),
                      vehicleType: ride.vehicleType,
                      availableSeats: ride.availableSpace,
                      departureTime: ride.departureTime,
                      description: ride.description
                    })}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex gap-2 items-center mb-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                            👤 {ride.user?.firstName} {ride.user?.lastName}
                          </span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            ride.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                            ride.status === 'CONFIRMED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                          }`}>
                            {ride.status === 'PENDING' ? 'Disponible' : ride.status === 'CONFIRMED' ? 'Confirmé' : ride.status}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <span className="mr-2 w-2 h-2 bg-green-500 rounded-full"></span>
                            <span className="font-medium">Départ:</span>
                            <span className="ml-1 truncate">{ride.origin}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <span className="mr-2 w-2 h-2 bg-red-500 rounded-full"></span>
                            <span className="font-medium">Arrivée:</span>
                            <span className="ml-1 truncate">{ride.destination}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <span className="mr-2 w-2 h-2 bg-blue-500 rounded-full"></span>
                            <span className="font-medium">Départ:</span>
                            <span className="ml-1">{new Date(ride.departureTime).toLocaleDateString('fr-FR', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 dark:text-gray-400">
                      {ride.vehicleType && (
                        <div>🚗 <span className="font-medium">Véhicule:</span> {ride.vehicleType}</div>
                      )}
                      <div>🪑 <span className="font-medium">Places:</span> {ride.availableSpace}</div>
                      <div>📅 <span className="font-medium">Départ:</span> {new Date(ride.departureTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    
                    {/* Prix affiché de manière plus proéminente */}
                    {ride.pricePerKg && (
                      <div className="flex justify-between items-center p-3 mt-3 bg-green-50 rounded-lg border border-green-200 dark:bg-green-900/20 dark:border-green-800">
                        <div>
                          <div className="text-sm font-medium text-green-800 dark:text-green-200">
                            💰 Prix par personne
                          </div>
                          <div className="text-xs text-green-600 dark:text-green-400">
                            Pour un trajet de ~80km
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-700 dark:text-green-300">
                            ≈ {Math.round(80 * ride.pricePerKg)}€
                          </div>
                          <div className="text-xs text-green-600 dark:text-green-400">
                            ({ride.pricePerKg}€/km)
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {ride.description && (
                      <div className="p-2 mt-3 text-xs text-gray-600 bg-gray-50 rounded dark:bg-gray-700 dark:text-gray-400">
                        {ride.description}
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center pt-3 mt-3 border-t border-gray-200 dark:border-gray-600">
                      <span className="text-xs text-gray-500">
                        Publié le {new Date(ride.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!user) {
                            alert('Vous devez être connecté pour commander une course');
                            return;
                          }
                          
                          try {
                            const res = await fetch('/api/ride-requests', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ 
                                rideId: ride.id,
                                passengerId: user.id,
                                pickupLocation: ride.origin,
                                dropoffLocation: ride.destination,
                                requestedSeats: 1,
                                message: `Demande de course de ${user.firstName} ${user.lastName}`
                              }),
                            });
                            
                            if (res.ok) {
                              alert('Demande de course envoyée ! Le transporteur sera notifié.');
                            } else {
                              const err = await res.json();
                              alert(err.error || 'Erreur lors de l\'envoi de la demande');
                            }
                          } catch (err) {
                            console.error(err);
                            alert('Erreur réseau');
                          }
                        }}
                        className="px-3 py-1 text-xs font-medium text-white bg-blue-500 rounded transition hover:bg-blue-600"
                      >
                        Commander la course
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="flex-shrink-0 p-4 bg-gray-50 border-t border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Filtres avancés</h3>
                  <button
                    onClick={resetFilters}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Réinitialiser
                  </button>
                </div>
                
                {/* Price Range */}
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Prix min (€)"
                    value={filters.minPrice}
                    onChange={(e) => updateFilter('minPrice', e.target.value)}
                    className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  />
                  <input
                    type="number"
                    placeholder="Prix max (€)"
                    value={filters.maxPrice}
                    onChange={(e) => updateFilter('maxPrice', e.target.value)}
                    className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
                
                {/* Weight Range */}
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Poids min (kg)"
                    value={filters.minWeight}
                    onChange={(e) => updateFilter('minWeight', e.target.value)}
                    className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  />
                  <input
                    type="number"
                    placeholder="Poids max (kg)"
                    value={filters.maxWeight}
                    onChange={(e) => updateFilter('maxWeight', e.target.value)}
                    className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
                
                {/* Status Filter */}
                <select
                  value={filters.status}
                  onChange={(e) => updateFilter('status', e.target.value)}
                  className="px-2 py-1 w-full text-xs rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="">Tous les statuts</option>
                  <option value="PENDING">En attente</option>
                  <option value="CONFIRMED">Confirmé</option>
                  <option value="IN_TRANSIT">En transit</option>
                  <option value="DELIVERED">Livré</option>
                  <option value="CANCELLED">Annulé</option>
                </select>
                
                {/* Checkboxes */}
                <div className="flex items-center space-x-4">
                  <label className="flex items-center text-xs">
                    <input
                      type="checkbox"
                      checked={filters.urgent}
                      onChange={(e) => updateFilter('urgent', e.target.checked)}
                      className="mr-1 w-3 h-3"
                    />
                    Urgent
                  </label>
                  <label className="flex items-center text-xs">
                    <input
                      type="checkbox"
                      checked={filters.fragile}
                      onChange={(e) => updateFilter('fragile', e.target.checked)}
                      className="mr-1 w-3 h-3"
                    />
                    Fragile
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Sticky Filters Button */}
          <div className="flex sticky bottom-0 z-10 flex-shrink-0 justify-center p-4 mt-auto bg-white border-t border-gray-200 dark:bg-gray-900 dark:border-gray-700">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-4 py-2 text-sm font-medium transition rounded-full ${
                showFilters 
                  ? 'text-sky-600 bg-sky-100 hover:bg-sky-200 dark:text-sky-400 dark:bg-sky-900 dark:hover:bg-sky-800' 
                  : 'text-white bg-sky-400 hover:bg-sky-500'
              }`}
            >
              <FilterIcon /> Filtres {showFilters ? '▲' : '▼'}
            </button>
          </div>
        </aside>

        {/* Map Droite - Basé sur Google Maps */}
        <main className="relative flex-grow h-full bg-gray-100 dark:bg-gray-800">
          {/* Le composant Google Maps occupe tout l'espace */}
          <GoogleMapComponent
            selectedRoute={selectedRoute}
            routeCoordinates={routeCoordinates}
            packages={activeView === 'packages' ? filteredPackages : []}
            rides={activeView === 'rides' ? filteredRides : []}
            onPackageClick={(pkg) => setSelectedRoute({
              pickup: pkg.senderAddress,
              delivery: pkg.recipientAddress,
              id: pkg.id,
              type: 'package',
              price: pkg.price,
              title: pkg.description,
              weight: pkg.weight,
              dimensions: pkg.dimensions,
              status: pkg.status,
              urgent: pkg.urgent,
              fragile: pkg.fragile
            })}
            onRideClick={(ride) => setSelectedRoute({
              pickup: ride.origin,
              delivery: ride.destination,
              id: ride.id,
              type: 'ride',
              price: ride.pricePerKg,
              estimatedPrice: Math.round(80 * ride.pricePerKg), // Prix estimé pour 80km
              title: `Trajet ${ride.origin} → ${ride.destination}`,
              carrier: `${ride.user?.firstName || ''} ${ride.user?.lastName || ''}`.trim(),
              vehicleType: ride.vehicleType,
              availableSeats: ride.availableSpace,
              departureTime: ride.departureTime,
              description: ride.description
            })}
          />
        </main>
      </div>
    </div>
  )
}
