import React, { useEffect, useRef, useState } from 'react';
import Script from 'next/script'; // Pour charger le script Google Maps

export default function GoogleMapWebComponent({ selectedRoute, routeCoordinates, packages = [], onPackageClick }) {
  const mapRef = useRef(null);
  const placePickerRef = useRef(null); // Garder pour la recherche
  const isApiLoaded = useRef(false); // Pour savoir si l'API est chargée
  const isInitialized = useRef(false); // Pour savoir si la carte et les écouteurs sont prêts
  const directionsRendererRef = useRef(null); // Pour stocker le DirectionsRenderer
  const mapInitRetries = useRef(0); // Pour compter les tentatives d'initialisation
  
  // State for script status
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(null);

  // Refs pour garder la trace des objets map ajoutés dynamiquement
  const routeElementsRef = useRef({ pickupMarker: null, deliveryMarker: null, routePolyline: null });
  const packageMarkersRef = useRef([]); // Pour stocker les marqueurs des colis

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  // Fonction pour nettoyer les marqueurs/polyline précédents
  const clearRouteElements = () => {
    if (routeElementsRef.current.pickupMarker) {
      routeElementsRef.current.pickupMarker.setMap(null);
      routeElementsRef.current.pickupMarker = null;
    }
    if (routeElementsRef.current.deliveryMarker) {
      routeElementsRef.current.deliveryMarker.setMap(null);
      routeElementsRef.current.deliveryMarker = null;
    }
    if (routeElementsRef.current.routePolyline) {
      routeElementsRef.current.routePolyline.setMap(null);
      routeElementsRef.current.routePolyline = null;
    }
    // Clear directions renderer if it exists
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
    }
  };

  // Fonction pour nettoyer les marqueurs des colis
  const clearPackageMarkers = () => {
    packageMarkersRef.current.forEach(marker => {
      marker.setMap(null);
    });
    packageMarkersRef.current = [];
  };

  // Initialize map after script is loaded
  useEffect(() => {
    if (!scriptLoaded || scriptError || !window.google?.maps) {
      return;
    }
    
    console.log("Google Maps API loaded. Initializing map...");
    
    // Wait for DOM elements to be fully rendered
    setTimeout(() => {
      try {
        // Create map instance directly
        const mapDiv = document.getElementById('map-container');
        if (!mapDiv) {
          console.error("Map container not found");
          return;
        }
        
        // Create the map instance
        const map = new google.maps.Map(mapDiv, {
          center: { lat: 46.603354, lng: 1.888334 }, // Center on France
          zoom: 6,
          mapTypeControl: false,
        });
        
        // Store map instance
        mapRef.current = { innerMap: map };
        
        // Initialize place autocomplete
        const inputElement = document.getElementById('place-search-input');
        if (inputElement) {
          const autocomplete = new google.maps.places.Autocomplete(inputElement);
          autocomplete.bindTo('bounds', map);
          
          // Add place_changed listener
          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (!place.geometry || !place.geometry.location) {
              console.warn("No details available for place:", place.name);
              return;
            }
            
            // If the place has a geometry, present it on the map
            if (place.geometry.viewport) {
              map.fitBounds(place.geometry.viewport);
            } else {
              map.setCenter(place.geometry.location);
              map.setZoom(17);
            }
            
            // Create a marker for the place
            const marker = new google.maps.Marker({
              position: place.geometry.location,
              map: map,
              title: place.name,
            });
            
            // Show place info
            const infowindow = new google.maps.InfoWindow({
              content: `<strong>${place.name}</strong><br>${place.formatted_address || ''}`
            });
            infowindow.open(map, marker);
          });
          
          placePickerRef.current = { autocomplete };
        }
        
        isInitialized.current = true;
        console.log("Map initialized successfully");
        
        // Créer les marqueurs des colis si on en a déjà
        if (packages.length > 0) {
          console.log('🗺️ Map initialized, creating package markers immediately');
          setTimeout(() => createPackageMarkers(), 1000); // Petit délai pour s'assurer que la carte est prête
        }
        
      } catch (error) {
        console.error("Error initializing map:", error);
      }
    }, 500);
  }, [scriptLoaded, scriptError]);

  // Fonction pour créer les marqueurs des colis
  const createPackageMarkers = async () => {
    console.log('🔍 createPackageMarkers called with:', {
      isInitialized: isInitialized.current,
      hasMap: !!mapRef.current?.innerMap,
      packagesLength: packages.length,
      packages: packages
    });
    
    if (!isInitialized.current || !mapRef.current?.innerMap || !packages.length) {
      console.log('❌ Conditions not met for creating markers');
      return;
    }

    const geocoder = new google.maps.Geocoder();
    const mapInstance = mapRef.current.innerMap;

    // Nettoyer les anciens marqueurs
    clearPackageMarkers();

    // Créer les marqueurs pour chaque colis
    for (const pkg of packages) {
      try {
        // Géocoder l'adresse de départ
        const pickupResult = await new Promise((resolve, reject) => {
          geocoder.geocode({ address: pkg.senderAddress }, (results, status) => {
            if (status === 'OK' && results[0]) {
              resolve(results[0].geometry.location);
            } else {
              reject(`Geocode error for ${pkg.senderAddress}: ${status}`);
            }
          });
        });

        // Utiliser les vraies données de prix et de taille
        const price = pkg.price || Math.floor(Math.random() * 200) + 10; // Prix aléatoire si pas défini
        const sizeLabel = pkg.size || 'M'; // Taille par défaut si pas définie

        // Créer le marqueur personnalisé avec bulle de prix
        const pickupMarker = new google.maps.Marker({
          position: pickupResult,
          map: mapInstance,
          title: `${pkg.description} - ${price}€ ${sizeLabel}`,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="80" height="40" viewBox="0 0 80 40" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <style>
                    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&amp;display=swap');
                  </style>
                </defs>
                <!-- Bulle principale -->
                <rect x="2" y="2" width="76" height="28" rx="14" ry="14" fill="white" stroke="#e5e7eb" stroke-width="1"/>
                <!-- Ombre -->
                <rect x="3" y="3" width="76" height="28" rx="14" ry="14" fill="#f9fafb" opacity="0.5"/>
                <!-- Contenu -->
                <rect x="2" y="2" width="76" height="28" rx="14" ry="14" fill="white" stroke="#d1d5db" stroke-width="1"/>
                <!-- Prix -->
                <text x="25" y="20" text-anchor="middle" fill="#1f2937" font-size="12" font-family="Poppins, sans-serif" font-weight="600">${price}€</text>
                <!-- Taille -->
                <text x="55" y="20" text-anchor="middle" fill="#6b7280" font-size="10" font-family="Poppins, sans-serif" font-weight="500">${sizeLabel}</text>
                <!-- Petite flèche en bas -->
                <polygon points="35,30 40,36 45,30" fill="white" stroke="#d1d5db" stroke-width="1"/>
              </svg>
            `),
            scaledSize: new google.maps.Size(80, 40),
            anchor: new google.maps.Point(40, 36)
          }
        });

        // Créer l'info window
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="max-width: 220px; font-family: 'Poppins', sans-serif;">
              <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; font-family: 'Poppins', sans-serif;">${pkg.description}</h3>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="font-size: 16px; font-weight: 600; color: #0ea5e9; font-family: 'Poppins', sans-serif;">${price}€</span>
                <span style="font-size: 12px; background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: 'Poppins', sans-serif; font-weight: 500;">${sizeLabel}</span>
              </div>
              <p style="margin: 4px 0; font-size: 12px; font-family: 'Poppins', sans-serif;"><strong>Départ:</strong> ${pkg.senderAddress}</p>
              <p style="margin: 4px 0; font-size: 12px; font-family: 'Poppins', sans-serif;"><strong>Arrivée:</strong> ${pkg.recipientAddress}</p>
              <p style="margin: 4px 0; font-size: 12px; font-family: 'Poppins', sans-serif;"><strong>Poids:</strong> ${pkg.weight ? pkg.weight + ' kg' : 'N/A'}</p>
              <p style="margin: 4px 0; font-size: 12px; font-family: 'Poppins', sans-serif;"><strong>Statut:</strong> ${pkg.status}</p>
              <button onclick="window.showPackageRoute('${pkg.id}')" style="
                background: #0ea5e9; 
                color: white; 
                border: none; 
                padding: 6px 12px; 
                border-radius: 6px; 
                cursor: pointer; 
                font-size: 12px;
                font-family: 'Poppins', sans-serif;
                font-weight: 500;
                margin-top: 8px;
                width: 100%;
                transition: background-color 0.2s ease;
              " onmouseover="this.style.background='#0284c7'" onmouseout="this.style.background='#0ea5e9'">Voir le trajet</button>
            </div>
          `
        });

        // Ajouter l'événement de clic
        pickupMarker.addListener('click', () => {
          infoWindow.open(mapInstance, pickupMarker);
        });

        packageMarkersRef.current.push(pickupMarker);

      } catch (error) {
        console.error(`Error creating marker for package ${pkg.id}:`, error);
      }
    }
  };

  // Effet pour afficher les marqueurs des colis
  useEffect(() => {
    console.log('📍 useEffect for package markers triggered:', {
      isInitialized: isInitialized.current,
      packagesLength: packages.length,
      packages: packages
    });
    
    if (isInitialized.current && packages.length > 0) {
      console.log('✅ Calling createPackageMarkers');
      createPackageMarkers();
    } else {
      console.log('❌ Not calling createPackageMarkers - conditions not met');
    }
  }, [packages, isInitialized.current]);

  // Fonction globale pour afficher le trajet d'un colis
  useEffect(() => {
    window.showPackageRoute = (packageId) => {
      const pkg = packages.find(p => p.id === packageId);
      if (pkg && onPackageClick) {
        onPackageClick(pkg);
      }
    };

    return () => {
      delete window.showPackageRoute;
    };
  }, [packages, onPackageClick]);

  // --- Effet pour afficher le trajet sélectionné --- 
  useEffect(() => {
    if (!isInitialized.current || !selectedRoute || !mapRef.current?.innerMap) {
      // Si pas initialisé ou pas de route sélectionnée, nettoyer et sortir
      if (!routeCoordinates) clearRouteElements(); // Only clear if no routeCoordinates to display
      // recentrer la carte si on désélectionne un trajet et qu'il n'y a pas de routeCoordinates
      if (!selectedRoute && !routeCoordinates && mapRef.current?.innerMap) {
        mapRef.current.innerMap.setCenter({ lat: 46.603354, lng: 1.888334 });
        mapRef.current.innerMap.setZoom(6);
        // Réafficher les marqueurs des colis quand aucun trajet n'est sélectionné
        createPackageMarkers();
      }
      return;
    }

    // Skip if routeCoordinates is active
    if (routeCoordinates) {
      return;
    }

    // Assurer que google.maps et le geocoder sont disponibles
    if (typeof window.google === 'undefined' || !window.google.maps || !window.google.maps.Geocoder) {
        console.error("Google Maps API or Geocoder not ready.");
        return;
    }

    const geocoder = new google.maps.Geocoder();
    const mapInstance = mapRef.current.innerMap;

    Promise.all([
      new Promise((resolve, reject) => geocoder.geocode({ address: selectedRoute.pickup }, (results, status) => {
        if (status === 'OK' && results[0]) {
          resolve(results[0].geometry.location);
        } else {
          reject(`Geocode error for pickup (${selectedRoute.pickup}): ${status}`);
        }
      })),
      new Promise((resolve, reject) => geocoder.geocode({ address: selectedRoute.delivery }, (results, status) => {
        if (status === 'OK' && results[0]) {
          resolve(results[0].geometry.location);
        } else {
          reject(`Geocode error for delivery (${selectedRoute.delivery}): ${status}`);
        }
      }))
    ]).then(([pickupLocation, deliveryLocation]) => {
      clearRouteElements(); // Nettoyer les anciens éléments
      clearPackageMarkers(); // Masquer les marqueurs des colis pendant l'affichage du trajet

      // Vérifie encore une fois que la carte est toujours disponible
      if (!mapRef.current || !mapRef.current.innerMap) {
        console.error("Map no longer available after geocoding");
        return;
      }

      // Créer les nouveaux marqueurs
      routeElementsRef.current.pickupMarker = new google.maps.Marker({
        position: pickupLocation,
        map: mapInstance,
        title: `Départ: ${selectedRoute.pickup}`,
      });

      routeElementsRef.current.deliveryMarker = new google.maps.Marker({
        position: deliveryLocation,
        map: mapInstance,
        title: `Arrivée: ${selectedRoute.delivery}`,
      });

      routeElementsRef.current.routePolyline = new google.maps.Polyline({
        path: [pickupLocation, deliveryLocation],
        geodesic: true,
        strokeColor: '#FF0000', // Rouge
        strokeOpacity: 1.0,
        strokeWeight: 2,
        map: mapInstance
      });

      // --- Adjust bounds --- 
      if (pickupLocation && deliveryLocation) {
          try {
              const bounds = new google.maps.LatLngBounds();
              bounds.extend(pickupLocation);
              bounds.extend(deliveryLocation);
              
              mapInstance.fitBounds(bounds);
              
              // Adjust zoom if too close
              google.maps.event.addListenerOnce(mapInstance, 'idle', () => {
                  if (mapInstance.getZoom() > 16) {
                      mapInstance.setZoom(16);
                  }
              });
          } catch (error) {
              console.error("Error adjusting bounds:", error);
          }
      }
    }).catch(error => {
      console.error("Error displaying route:", error);
      window.alert(`Impossible d'afficher le trajet : ${error}`);
      clearRouteElements();
    });

  }, [selectedRoute, routeCoordinates]);

  // --- New effect for handling route with waypoints ---
  useEffect(() => {
    // Skip if not initialized or no routeCoordinates provided
    if (!isInitialized.current || !routeCoordinates || !routeCoordinates.origin || !routeCoordinates.destination || !mapRef.current?.innerMap) {
      return;
    }

    // Clear previous route elements
    clearRouteElements();

    // Skip if Google Maps API is not available
    if (typeof window.google === 'undefined' || !window.google.maps || !window.google.maps.DirectionsService) {
      console.error("Google Maps API or DirectionsService not ready.");
      return;
    }

    const mapInstance = mapRef.current.innerMap;
    const directionsService = new google.maps.DirectionsService();
    
    // Create directions renderer if it doesn't exist
    if (!directionsRendererRef.current) {
      directionsRendererRef.current = new google.maps.DirectionsRenderer({
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: '#4285F4', // Google blue
          strokeWeight: 5,
          strokeOpacity: 0.8
        }
      });
    }
    
    // Set the map for the renderer
    directionsRendererRef.current.setMap(mapInstance);

    // Prepare waypoints if any
    const waypoints = routeCoordinates.waypoints || [];
    
    // Create the directions request
    const request = {
      origin: routeCoordinates.origin,
      destination: routeCoordinates.destination,
      waypoints: waypoints,
      optimizeWaypoints: true,
      travelMode: google.maps.TravelMode.DRIVING
    };

    // Request directions
    directionsService.route(request, (response, status) => {
      if (status === 'OK') {
        // Display the route
        directionsRendererRef.current.setDirections(response);
        
        // Fit the map to the route bounds
        const bounds = new google.maps.LatLngBounds();
        const route = response.routes[0];
        
        // Add route points to bounds
        if (route && route.legs) {
          route.legs.forEach(leg => {
            if (leg.start_location) bounds.extend(leg.start_location);
            if (leg.end_location) bounds.extend(leg.end_location);
            
            // Include any waypoints in the bounds
            if (leg.via_waypoints) {
              leg.via_waypoints.forEach(waypoint => {
                bounds.extend(waypoint);
              });
            }
          });
          
          // Adjust the map view
          mapInstance.fitBounds(bounds);
          
          // Optional: Adjust zoom if too close
          google.maps.event.addListenerOnce(mapInstance, 'idle', () => {
            if (mapInstance.getZoom() > 16) {
              mapInstance.setZoom(16);
            }
          });
        }
      } else {
        console.error('Directions request failed due to', status);
        window.alert(`Impossible de calculer l'itinéraire : ${status}`);
      }
    });

    // Cleanup function
    return () => {
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
    };
    
  }, [routeCoordinates]);

  if (!apiKey) {
    console.error("Google Maps API key is missing.");
    return <div className="flex justify-center items-center w-full h-full text-red-700 bg-red-100">Clé API Google Maps manquante.</div>;
  }

  const handleScriptLoad = () => {
    console.log("Google Maps Script loaded successfully");
    setScriptLoaded(true);
  };

  const handleScriptError = () => {
    console.error("Google Maps script failed to load");
    setScriptError("Failed to load Google Maps API");
  };

  return (
    <div className="relative w-full h-full">
      <Script
        id="google-maps-script"
        src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geocoding&v=weekly`}
        onLoad={handleScriptLoad}
        onError={handleScriptError}
        strategy="afterInteractive"
      />

      <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 1, background: 'white', padding: '5px', width: '300px', borderRadius: '10px' }}>
        <input
          id="place-search-input"
          type="text"
          placeholder="Rechercher un lieu"
          className="p-2 w-full rounded border border-gray-300"
          aria-label="Recherche d'adresses"
        />
      </div>

      <div 
        id="map-container"
        style={{ 
          display: 'block', 
          height: '100%', 
          width: '100%', 
          backgroundColor: '#f0f0f0' 
        }}
      >
        {!scriptLoaded && !scriptError && (
          <div className="flex justify-center items-center w-full h-full">
            <div className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full border-4 border-sky-400 animate-spin border-t-transparent"></div>
              <p>Chargement de Google Maps...</p>
            </div>
          </div>
        )}
        
        {scriptError && (
          <div className="flex justify-center items-center w-full h-full text-red-700 bg-red-100">
            <p>Erreur de chargement de Google Maps: {scriptError}</p>
          </div>
        )}
      </div>
    </div>
  );
} 