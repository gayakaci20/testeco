import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import RoleBasedNavigation from '../components/RoleBasedNavigation';
import { 
  Plus, 
  Search, 
  Filter, 
  Package, 
  Edit3, 
  Trash2, 
  Eye,
  Star,
  DollarSign,
  Activity,
  AlertTriangle,
  X,
  Shield,
  FileText
} from 'lucide-react';

// Copy ContractSignatureModal from merchant.jsx
function ContractSignatureModal({ contract, onClose, onContractSigned }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!contract.signature) {
      alert('Veuillez signer le contrat pour le valider.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/contracts/${contract.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: 'SIGNED' })
      });

      if (response.ok) {
        alert('Contrat signé avec succès !');
        onContractSigned();
        onClose();
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error}`);
      }
    } catch (error) {
      console.error('Error signing contract:', error);
      alert('Erreur lors de la signature du contrat');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Signature du contrat
            </h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Titre du contrat
              </label>
              <input
                type="text"
                value={contract.title}
                className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                disabled
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Date de signature
              </label>
              <input
                type="text"
                value={new Date(contract.signedAt).toLocaleDateString()}
                className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                disabled
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Signature
              </label>
              <textarea
                value={contract.signature || ''}
                onChange={(e) => {}} // Read-only
                className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                rows="5"
                disabled
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActiveEditProducts"
              checked={contract.status === 'SIGNED'}
              onChange={(e) => {}} // Read-only
              className="mr-2"
            />
            <label htmlFor="isActiveEditProducts" className="text-sm text-gray-700 dark:text-gray-300">
              Contrat signé
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-white bg-green-500 rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Signature...' : 'Signer le contrat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Copy ContractWarningBanner from merchant.jsx
function ContractWarningBanner({ contract, onSignContract }) {
  return (
    <div className="bg-yellow-100 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded relative" role="alert">
      <strong className="font-bold">Attention !</strong>
      <span className="block sm:inline"> Vous devez signer le contrat pour accéder à cette fonctionnalité.</span>
      <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
        <button
          onClick={onSignContract}
          className="text-yellow-800 dark:text-yellow-200 hover:text-yellow-900 dark:hover:text-yellow-300"
        >
          <Shield className="w-5 h-5" />
        </button>
      </span>
    </div>
  );
}

// Copy BlockedFeature from merchant.jsx
function BlockedFeature({ title, description, icon: Icon }) {
  return (
    <div className="p-12 text-center bg-white rounded-lg shadow-sm dark:bg-gray-800">
      <Icon className="mx-auto mb-4 w-16 h-16 text-gray-400" />
      <h3 className="mb-2 text-xl font-medium text-gray-900 dark:text-white">{title}</h3>
      <p className="mb-6 text-gray-600 dark:text-gray-400">{description}</p>
      <p className="text-gray-600 dark:text-gray-400">
        Veuillez signer le contrat pour activer cette fonctionnalité.
      </p>
    </div>
  );
}

// Edit Product Modal Component
function EditProductModal({ product, onClose, onProductUpdated }) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    category: product?.category || '',
    stock: product?.stock || '',
    imageUrl: product?.imageUrl || '',
    weight: product?.weight || '',
    dimensions: product?.dimensions || '',
    isActive: product?.isActive !== undefined ? product.isActive : true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    'Vêtements', 'Alimentation', 'Électronique', 'Livres', 
    'Beauté', 'Sport', 'Maison', 'Jardin', 'Autre'
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.category) {
      alert('Nom, prix et catégorie sont obligatoires');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/merchants/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('Produit modifié avec succès !');
        onProductUpdated();
        onClose();
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Erreur lors de la modification du produit');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Modifier le produit
            </h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Nom du produit *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="Nom du produit"
                required
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Prix (€) *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Catégorie *
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Stock
              </label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => handleInputChange('stock', e.target.value)}
                className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Poids (kg)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.weight}
                onChange={(e) => handleInputChange('weight', e.target.value)}
                className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="0.0"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Dimensions (L×l×H cm)
              </label>
              <input
                type="text"
                value={formData.dimensions}
                onChange={(e) => handleInputChange('dimensions', e.target.value)}
                className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="30×20×10"
              />
            </div>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              rows="3"
              placeholder="Description du produit..."
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              URL de l'image
            </label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => handleInputChange('imageUrl', e.target.value)}
              className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActiveEditProducts"
              checked={formData.isActive}
              onChange={(e) => handleInputChange('isActive', e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="isActiveEditProducts" className="text-sm text-gray-700 dark:text-gray-300">
              Produit actif (visible dans le catalogue)
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Modification...' : 'Modifier le produit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Add Product Modal Component
function AddProductModal({ onClose, onProductCreated }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    imageUrl: '',
    weight: '',
    dimensions: '',
    isActive: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    'Vêtements', 'Alimentation', 'Électronique', 'Livres', 
    'Beauté', 'Sport', 'Maison', 'Jardin', 'Autre'
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.category) {
      alert('Nom, prix et catégorie sont obligatoires');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/merchants/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('Produit créé avec succès !');
        onProductCreated();
        onClose();
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Erreur lors de la création du produit');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Ajouter un produit
            </h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Nom du produit *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="Nom du produit"
                required
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Prix (€) *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Catégorie *
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Stock
              </label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => handleInputChange('stock', e.target.value)}
                className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Poids (kg)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.weight}
                onChange={(e) => handleInputChange('weight', e.target.value)}
                className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="0.0"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Dimensions (L×l×H cm)
              </label>
              <input
                type="text"
                value={formData.dimensions}
                onChange={(e) => handleInputChange('dimensions', e.target.value)}
                className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="30×20×10"
              />
            </div>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              rows="3"
              placeholder="Description du produit..."
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              URL de l'image
            </label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => handleInputChange('imageUrl', e.target.value)}
              className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => handleInputChange('isActive', e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
              Produit actif (visible dans le catalogue)
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-white bg-green-500 rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Création...' : 'Créer le produit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Products({ isDarkMode, toggleDarkMode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  // Add contract states
  const [userContract, setUserContract] = useState(null);
  const [hasSignedContract, setHasSignedContract] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [activeTab, setActiveTab] = useState('products'); // Add tab state to mimic merchant

  const categories = [
    'Vêtements', 'Alimentation', 'Électronique', 'Livres', 
    'Beauté', 'Sport', 'Maison', 'Jardin', 'Autre'
  ];

  useEffect(() => {
    if (!loading && (!user || user.role !== 'MERCHANT')) {
      router.push('/login');
      return;
    }
    
    if (user && user.role === 'MERCHANT') {
      fetchUserContract();
      fetchProducts();
    }
  }, [user, loading, router]);

  // Copy fetchUserContract from merchant.jsx
  const fetchUserContract = async () => {
    try {
      const response = await fetch(`/api/contracts?merchantId=${user.id}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const contractsData = await response.json();
        const userContracts = contractsData.filter(contract => contract.merchantId === user.id);
        
        if (userContracts.length > 0) {
          const signedContract = userContracts.find(contract => contract.status === 'SIGNED');
          if (signedContract) {
            setUserContract(signedContract);
            setHasSignedContract(true);
          } else {
            const pendingContract = userContracts.find(contract => contract.status === 'PENDING_SIGNATURE');
            if (pendingContract) {
              setUserContract(pendingContract);
              setHasSignedContract(false);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching contract:', error);
    }
  };

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedCategory]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/merchants/products', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Products fetched:', data);
        setProducts(data);
      } else {
        const error = await response.json();
        console.error('Error fetching products:', error);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;
    
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedCategory) {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    
    setFilteredProducts(filtered);
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/merchants/products/${productId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        alert('Produit supprimé avec succès');
        fetchProducts();
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const toggleProductStatus = async (productId, currentStatus) => {
    try {
      const response = await fetch(`/api/merchants/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (response.ok) {
        fetchProducts();
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error}`);
      }
    } catch (error) {
      console.error('Error toggling product status:', error);
      alert('Erreur lors de la modification');
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowEditModal(true);
  };

  // Calculate statistics
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.isActive).length;
  const lowStock = products.filter(p => p.stock < 10).length;
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);

  if (loading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full border-4 border-green-400 animate-spin border-t-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Chargement des produits...</p>
        </div>
      </div>
    );
  }

  // Add contract blocking logic
  if (!hasSignedContract && userContract) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Head>
          <title>Gestion des produits - ecodeli</title>
          <meta name="description" content="Gérez vos produits et votre catalogue" />
          <link rel="icon" href="/LOGO_.png" />
        </Head>

        <RoleBasedNavigation isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

        <div className="px-6 py-8 bg-gradient-to-r from-green-400 to-green-600 text-white">
          <div className="mx-auto max-w-7xl">
            <h1 className="text-3xl font-bold">Gestion des produits</h1>
          </div>
        </div>

        <div className="px-6 py-8 mx-auto max-w-7xl">
          <ContractWarningBanner 
            contract={userContract} 
            onSignContract={() => setShowContractModal(true)}
          />
          <BlockedFeature
            title="Gestion des produits bloquée"
            description={`Vous devez signer le contrat "${userContract.title}" pour gérer vos produits.`}
            icon={Package}
          />
        </div>

        {showContractModal && userContract && (
          <ContractSignatureModal 
            contract={userContract}
            onClose={() => setShowContractModal(false)}
            onContractSigned={() => {
              setHasSignedContract(true);
              fetchUserContract();
              fetchProducts();
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Head>
        <title>Gestion des produits - ecodeli</title>
        <meta name="description" content="Gérez vos produits et votre catalogue" />
        <link rel="icon" href="/LOGO_.png" />
      </Head>

      <RoleBasedNavigation isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

      {/* Copy header from merchant */}
      <div className="px-6 py-8 bg-sky-50 dark:bg-sky-900/20">
        <div className="mx-auto max-w-7xl">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Gestion des produits
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Gérez votre catalogue de produits
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center px-6 py-3 bg-white text-sky-600 rounded-lg hover:bg-sky-50 transition-colors dark:bg-gray-800 dark:text-sky-400 dark:hover:bg-gray-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Ajouter un produit
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-8 mx-auto max-w-7xl">
        {/* Contract Warning Banner */}
        {userContract && !hasSignedContract && (
          <ContractWarningBanner 
            contract={userContract} 
            onSignContract={() => setShowContractModal(true)}
          />
        )}

        {/* Stats Cards (copied and adapted from merchant) */}
        <div className="grid gap-6 mb-8 md:grid-cols-4">
          <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total produits</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalProducts}</p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-green-100 rounded-full dark:bg-green-900">
                <Package className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Produits actifs</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeProducts}</p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-blue-100 rounded-full dark:bg-blue-900">
                <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Stock faible</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{lowStock}</p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-orange-100 rounded-full dark:bg-orange-900">
                <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Valeur totale</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">€{totalValue.toFixed(2)}</p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-purple-100 rounded-full dark:bg-purple-900">
                <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation (optional, to mimic merchant; here single tab) */}
        <div className="mb-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex px-6 -mb-px space-x-8">
              <button
                className="flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm border-sky-500 text-sky-600 dark:text-sky-400"
              >
                <Package className="w-4 h-4" />
                Produits
              </button>
            </nav>
          </div>
        </div>

        {/* Filters (existing, but styled to match) */}
        <div className="mb-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
          <div className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 w-5 h-5 text-gray-400 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Rechercher des produits..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="py-2 pr-4 pl-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:w-64"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Toutes les catégories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-green-100 text-green-600' : 'text-gray-400'}`}
                >
                  <Package className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-green-100 text-green-600' : 'text-gray-400'}`}
                >
                  <Filter className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid/List (existing) */}
        {filteredProducts.length > 0 ? (
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {filteredProducts.map((product) => (
              <div key={product.id} className="overflow-hidden bg-white rounded-lg shadow-sm dark:bg-gray-800">
                <div className="bg-gray-200 aspect-w-16 aspect-h-9 dark:bg-gray-700">
                  {product.imageUrl ? (
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className="object-cover w-full h-48"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : (
                    <div className="flex justify-center items-center h-48">
                      <Package className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <div className="flex justify-center items-center h-48" style={{ display: 'none' }}>
                    <Package className="w-12 h-12 text-gray-400" />
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {product.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {product.category}
                      </p>
                      {product.description && (
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      <div className="flex justify-between items-center mt-3">
                        <p className="text-xl font-bold text-green-600 dark:text-green-400">
                          €{product.price}
                        </p>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Stock: {product.stock || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-4">
                    <button
                      onClick={() => toggleProductStatus(product.id, product.isActive)}
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        product.isActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                      }`}
                    >
                      {product.isActive ? 'Actif' : 'Inactif'}
                    </button>
                    
                    <div className="flex space-x-2">
                      <button 
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                        title="Voir"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEditProduct(product)}
                        className="p-2 text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400"
                        title="Modifier"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(product.id)}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <Package className="mx-auto mb-4 w-16 h-16 text-gray-400" />
            <h3 className="mb-2 text-xl font-medium text-gray-900 dark:text-white">
              {searchTerm || selectedCategory ? 'Aucun produit trouvé' : 'Aucun produit'}
            </h3>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              {searchTerm || selectedCategory 
                ? 'Essayez de modifier vos filtres de recherche'
                : 'Commencez par ajouter votre premier produit à votre catalogue'
              }
            </p>
            {!searchTerm && !selectedCategory && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center px-6 py-3 mx-auto text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Ajouter un produit
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <AddProductModal 
          onClose={() => setShowAddModal(false)}
          onProductCreated={fetchProducts}
        />
      )}

      {/* Edit Product Modal */}
      {showEditModal && editingProduct && (
        <EditProductModal 
          product={editingProduct}
          onClose={() => {
            setShowEditModal(false);
            setEditingProduct(null);
          }}
          onProductUpdated={fetchProducts}
        />
      )}
    </div>
  );
} 