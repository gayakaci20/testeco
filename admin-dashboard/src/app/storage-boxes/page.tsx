'use client';

import { useState, useEffect } from 'react';
import { Package, Search, Filter, MapPin, Plus, Eye, Edit, Trash2, RefreshCw, CheckCircle, XCircle, AlertCircle, Box } from 'lucide-react';

interface StorageBox {
  id: string;
  code: string;
  location: string;
  size: string;
  pricePerDay: number;
  isOccupied: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  rentals: BoxRental[];
}

interface BoxRental {
  id: string;
  startDate: string;
  endDate: string | null;
  totalCost: number | null;
  accessCode: string | null;
  isActive: boolean;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
  };
}

export default function StorageBoxesPage() {
  const [storageBoxes, setStorageBoxes] = useState<StorageBox[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedBox, setSelectedBox] = useState<StorageBox | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [newBox, setNewBox] = useState({
    code: '',
    location: '',
    size: 'MEDIUM',
    pricePerDay: 0
  });

  useEffect(() => {
    fetchStorageBoxes();
  }, []);

  const fetchStorageBoxes = async () => {
    try {
      const response = await fetch('/api/storage-boxes');
      if (response.ok) {
        const data = await response.json();
        setStorageBoxes(data);
      }
    } catch (error) {
      console.error('Error fetching storage boxes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBoxDetails = async (boxId: string) => {
    console.log('Fetching box details for ID:', boxId);
    console.log('Current storage boxes array:', storageBoxes);
    console.log('Storage boxes length:', storageBoxes.length);
    try {
      const response = await fetch(`/api/storage-boxes/${boxId}`);
      console.log('Response status:', response.status);
      if (response.ok) {
        const boxDetails = await response.json();
        console.log('Box details received:', boxDetails);
        setSelectedBox(boxDetails);
        setIsDetailsModalOpen(true);
      } else {
        console.error('Failed to fetch box details:', response.status);
        // Fallback: use the box from the list
        console.log('Looking for box with ID:', boxId, 'in boxes:', storageBoxes.map(b => b.id));
        const fallbackBox = storageBoxes.find(b => b.id === boxId);
        console.log('Fallback box found:', fallbackBox);
        if (fallbackBox) {
          console.log('Using fallback box data:', fallbackBox);
          setSelectedBox(fallbackBox);
          setIsDetailsModalOpen(true);
        } else {
          console.error('No fallback box found for ID:', boxId);
        }
      }
    } catch (error) {
      console.error('Error fetching box details:', error);
      // Fallback: use the box from the list
      console.log('Error fallback - Looking for box with ID:', boxId);
      const fallbackBox = storageBoxes.find(b => b.id === boxId);
      console.log('Error fallback box found:', fallbackBox);
      if (fallbackBox) {
        console.log('Using fallback box data after error:', fallbackBox);
        setSelectedBox(fallbackBox);
        setIsDetailsModalOpen(true);
      } else {
        console.error('No error fallback box found for ID:', boxId);
      }
    }
  };

  const addStorageBox = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/storage-boxes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newBox),
      });

      if (response.ok) {
        const addedBox = await response.json();
        setStorageBoxes([...storageBoxes, addedBox]);
        setNewBox({ code: '', location: '', size: 'MEDIUM', pricePerDay: 0 });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Error adding storage box:', error);
    }
  };

  const deleteStorageBox = async (boxId: string) => {
    if (!confirm('Are you sure you want to delete this storage box?')) return;
    
    try {
      const response = await fetch(`/api/storage-boxes/${boxId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setStorageBoxes(storageBoxes.filter(box => box.id !== boxId));
      }
    } catch (error) {
      console.error('Error deleting storage box:', error);
    }
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedBox(null);
  };

  const filteredBoxes = storageBoxes.filter(box => {
    const matchesFilter = filter === 'all' || 
      (filter === 'occupied' && box.isOccupied) ||
      (filter === 'available' && !box.isOccupied);
    
    const matchesSearch = box.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      box.size.toLowerCase().includes(searchTerm.toLowerCase()) ||
      box.code.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const getSizeColor = (size: string) => {
    const colors: Record<string, string> = {
      SMALL: 'bg-green-100 text-green-800',
      MEDIUM: 'bg-blue-100 text-blue-800',
      LARGE: 'bg-purple-100 text-purple-800',
      EXTRA_LARGE: 'bg-red-100 text-red-800',
    };
    return colors[size] || colors.MEDIUM;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateRentalDuration = (startDate: string, endDate: string | null) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Calculate stats
  const totalBoxes = storageBoxes.length;
  const occupiedBoxes = storageBoxes.filter(b => b.isOccupied).length;
  const availableBoxes = totalBoxes - occupiedBoxes;
  const totalRevenue = storageBoxes
    .flatMap(box => box.rentals)
    .filter(rental => rental.isActive)
    .reduce((sum, rental) => sum + (rental.totalCost || 0), 0);

  if (loading) {
    return (
      <div className="p-12 bg-white rounded-xl border shadow-sm">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full border-4 border-teal-600 animate-spin border-t-transparent"></div>
          <p className="mt-2 text-gray-500">Chargement des boîtes de stockage...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="p-6 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl border border-teal-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-teal-100 rounded-lg">
              <Box className="w-8 h-8 text-teal-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Boîtes de Stockage</h1>
              <p className="mt-1 text-gray-600">Gestion des boîtes de stockage et de leur disponibilité</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchStorageBoxes}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 font-medium text-white bg-gray-600 rounded-lg shadow-sm transition-all duration-200 hover:bg-gray-700 hover:shadow-md disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 font-medium text-white bg-teal-600 rounded-lg shadow-sm transition-all duration-200 hover:bg-teal-700 hover:shadow-md"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une Boîte
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Boîtes</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{totalBoxes}</p>
            </div>
            <div className="p-3 bg-teal-50 rounded-lg">
              <Box className="w-6 h-6 text-teal-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="font-medium text-teal-600">{availableBoxes}</span>
            <span className="ml-1 text-gray-500">disponibles</span>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Boîtes Occupées</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{occupiedBoxes}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="font-medium text-red-600">{((occupiedBoxes / totalBoxes) * 100 || 0).toFixed(1)}%</span>
            <span className="ml-1 text-gray-500">taux d'occupation</span>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Boîtes Disponibles</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{availableBoxes}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="font-medium text-green-600">{((availableBoxes / totalBoxes) * 100 || 0).toFixed(1)}%</span>
            <span className="ml-1 text-gray-500">disponibilité</span>
          </div>
        </div>

        <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenus Actifs</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">€{totalRevenue.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="font-medium text-blue-600">€{(totalRevenue / (occupiedBoxes || 1)).toFixed(2)}</span>
            <span className="ml-1 text-gray-500">par boîte</span>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="p-6 bg-white rounded-xl border shadow-sm">
        <div className="flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 w-4 h-4 text-gray-400 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par code, lieu, ou taille..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-2 pl-10 pr-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex space-x-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="all">Toutes les boîtes</option>
              <option value="available">Disponibles</option>
              <option value="occupied">Occupées</option>
            </select>
          </div>
        </div>
      </div>

      {/* Storage Boxes Grid */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Boîtes de Stockage ({filteredBoxes.length})
          </h2>
        </div>
        
        {filteredBoxes.length === 0 ? (
          <div className="p-12 text-center">
            <Box className="mx-auto w-12 h-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-500">Aucune boîte de stockage trouvée</p>
            <p className="text-sm text-gray-400">Essayez de modifier vos filtres de recherche</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredBoxes.map((box) => (
              <div key={box.id} className="p-6 border rounded-xl transition-all duration-200 hover:shadow-lg hover:border-teal-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{box.code}</h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <MapPin className="mr-1 w-3 h-3" />
                      {box.location}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => fetchBoxDetails(box.id)}
                      className="text-teal-600 hover:text-teal-900 transition-colors duration-150"
                      title="Voir les détails"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteStorageBox(box.id)}
                      className="text-red-600 hover:text-red-900 transition-colors duration-150"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Taille:</span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSizeColor(box.size)}`}>
                      {box.size}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Prix/jour:</span>
                    <span className="text-sm font-medium text-gray-900">€{box.pricePerDay.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Statut:</span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      box.isOccupied 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {box.isOccupied ? 'Occupée' : 'Disponible'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Locations:</span>
                    <span className="text-sm font-medium text-gray-900">{box.rentals.length}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Créée:</span>
                    <span className="text-sm text-gray-500">{formatDate(box.createdAt)}</span>
                  </div>
                </div>

                {box.rentals.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Locations Récentes</h4>
                    <div className="space-y-2">
                      {box.rentals.slice(0, 2).map((rental) => (
                        <div key={rental.id} className="flex justify-between items-center text-xs">
                          <span className="text-gray-600">
                            {rental.user.firstName} {rental.user.lastName}
                          </span>
                          <span className={`px-2 py-1 rounded-full ${
                            rental.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {rental.isActive ? 'Active' : 'Terminée'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Box Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Ajouter une Boîte</h2>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-150"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            <form onSubmit={addStorageBox} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code de la Boîte
                </label>
                <input
                  type="text"
                  required
                  value={newBox.code}
                  onChange={(e) => setNewBox({ ...newBox, code: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Ex: BOX-001"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lieu
                </label>
                <input
                  type="text"
                  required
                  value={newBox.location}
                  onChange={(e) => setNewBox({ ...newBox, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Ex: Entrepôt A - Niveau 1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Taille
                </label>
                <select
                  value={newBox.size}
                  onChange={(e) => setNewBox({ ...newBox, size: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="SMALL">Petite</option>
                  <option value="MEDIUM">Moyenne</option>
                  <option value="LARGE">Grande</option>
                  <option value="EXTRA_LARGE">Très Grande</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prix par Jour (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={newBox.pricePerDay}
                  onChange={(e) => setNewBox({ ...newBox, pricePerDay: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors duration-200"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Box Details Modal */}
      {isDetailsModalOpen && selectedBox && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Détails de la Boîte</h2>
                <button
                  onClick={closeDetailsModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-150"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Box Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Informations de la Boîte</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Code:</span>
                      <span className="text-sm font-medium">{selectedBox.code}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Lieu:</span>
                      <span className="text-sm font-medium">{selectedBox.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Taille:</span>
                      <span className={`text-sm font-medium px-2 py-1 rounded-full ${getSizeColor(selectedBox.size)}`}>
                        {selectedBox.size}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Prix/jour:</span>
                      <span className="text-sm font-medium">€{selectedBox.pricePerDay.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Statut:</span>
                      <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                        selectedBox.isOccupied 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {selectedBox.isOccupied ? 'Occupée' : 'Disponible'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Active:</span>
                      <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                        selectedBox.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedBox.isActive ? 'Oui' : 'Non'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rental History */}
              {selectedBox.rentals && selectedBox.rentals.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    Historique des Locations ({selectedBox.rentals.length})
                  </h3>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {selectedBox.rentals.map((rental) => (
                      <div key={rental.id} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {rental.user.firstName} {rental.user.lastName}
                            </div>
                            <div className="text-xs text-gray-500">{rental.user.email}</div>
                          </div>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            rental.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {rental.isActive ? 'Active' : 'Terminée'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                          <div>Début: {formatDate(rental.startDate)}</div>
                          <div>
                            {rental.endDate ? `Fin: ${formatDate(rental.endDate)}` : 'En cours'}
                          </div>
                          <div>
                            Durée: {calculateRentalDuration(rental.startDate, rental.endDate)} jours
                          </div>
                          <div>Coût: €{rental.totalCost?.toFixed(2) || '0.00'}</div>
                        </div>
                        {rental.accessCode && (
                          <div className="mt-2 text-xs">
                            <span className="text-gray-600">Code d'accès: </span>
                            <span className="font-mono bg-gray-200 px-1 rounded">{rental.accessCode}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 