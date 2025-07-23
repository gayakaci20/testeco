import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import RoleBasedNavigation from '../../components/RoleBasedNavigation';
import TutorialOverlay from '../../components/TutorialOverlay';
import { useTutorial } from '../../components/useTutorial';
import { 
  Sun, 
  Moon, 
  User, 
  Menu, 
  X,
  Plus,
  FileText,
  DollarSign,
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  TrendingUp,
  Package,
  Eye,
  Store,
  ShoppingCart,
  Truck,
  Users,
  AlertCircle,
  Star,
  Search,
  Filter,
  Download,
  Upload,
  Edit3,
  Trash2,
  Archive,
  ExclamationTriangle,
  Shield,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

// Contract Signature Modal Component
function ContractSignatureModal({ contract, onClose, onContractSigned }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleSignContract = async () => {
    if (!agreed) {
      alert('Vous devez accepter les termes du contrat pour pouvoir le signer');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('🖊️ Tentative de signature du contrat:', {
        contractId: contract.id,
        status: 'SIGNED',
        signedAt: new Date().toISOString()
      });

      const response = await fetch('/api/contracts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          id: contract.id,
          status: 'SIGNED',
          signedAt: new Date().toISOString()
        })
      });

      console.log('📡 Réponse du serveur:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Contrat signé avec succès:', result);
        alert('Contrat signé avec succès ! Vous pouvez maintenant accéder à toutes les fonctionnalités.');
        onContractSigned();
        onClose();
      } else {
        const errorText = await response.text();
        console.error('❌ Erreur du serveur:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        
        let errorMessage = 'Erreur lors de la signature du contrat';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        
        alert(`Erreur lors de la signature: ${errorMessage}`);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la signature du contrat:', error);
      alert(`Erreur lors de la signature du contrat: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Shield className="mr-3 w-6 h-6 text-blue-600" />
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Signature du Contrat Requis
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Vous devez signer ce contrat pour accéder aux fonctionnalités
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h4 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              {contract.title}
            </h4>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Contrat créé le {new Date(contract.createdAt).toLocaleDateString('fr-FR')}
            </p>
          </div>

          <div className="overflow-y-auto p-4 mb-6 max-h-96 bg-gray-50 rounded-lg dark:bg-gray-700">
            <h5 className="mb-3 font-medium text-gray-900 dark:text-white">Contenu du contrat :</h5>
            <div className="max-w-none prose dark:prose-invert">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap dark:text-gray-300">
                {contract.content}
              </pre>
            </div>
          </div>

          {contract.terms && (
            <div className="overflow-y-auto p-4 mb-6 max-h-96 bg-blue-50 rounded-lg dark:bg-blue-900/20">
              <h5 className="mb-3 font-medium text-blue-900 dark:text-blue-100">Termes et conditions :</h5>
              <div className="max-w-none prose dark:prose-invert">
                <pre className="text-sm text-blue-800 whitespace-pre-wrap dark:text-blue-200">
                  {contract.terms}
                </pre>
              </div>
            </div>
          )}

          {contract.value && (
            <div className="p-4 mb-6 bg-green-50 rounded-lg dark:bg-green-900/20">
              <h5 className="mb-2 font-medium text-green-900 dark:text-green-100">Valeur du contrat :</h5>
              <p className="text-lg font-bold text-green-800 dark:text-green-200">
                {contract.value}€ {contract.currency}
              </p>
            </div>
          )}

          <div className="flex items-center mb-6">
            <input
              type="checkbox"
              id="agreeToContract"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mr-3 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="agreeToContract" className="text-sm text-gray-700 dark:text-gray-300">
              J'ai lu et j'accepte les termes et conditions de ce contrat. 
              Je comprends que cette signature est légalement contraignante.
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
              onClick={handleSignContract}
              disabled={isSubmitting || !agreed}
              className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Signature en cours...' : 'Signer le contrat'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Contract Warning Banner Component
function ContractWarningBanner({ contract, onSignContract }) {
  return (
    <div className="p-4 mb-6 bg-yellow-50 rounded-lg border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
      <div className="flex items-center">
        <AlertTriangle className="mr-3 w-6 h-6 text-yellow-600 dark:text-yellow-400" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
            Signature de contrat requise
          </h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            Vous devez signer le contrat "{contract.title}" pour accéder aux fonctionnalités de votre compte marchand.
          </p>
        </div>
        <button
          onClick={onSignContract}
          className="px-4 py-2 ml-4 text-white bg-yellow-600 rounded-lg transition-colors hover:bg-yellow-700"
        >
          Signer maintenant
        </button>
      </div>
    </div>
  );
}

// Blocked Feature Component
function BlockedFeature({ title, description, icon: Icon }) {
  return (
    <div className="p-8 text-center bg-gray-50 rounded-lg border-2 border-gray-300 border-dashed dark:bg-gray-800 dark:border-gray-600">
      <div className="flex justify-center mb-4">
        <div className="p-3 bg-gray-200 rounded-full dark:bg-gray-700">
          <Icon className="w-8 h-8 text-gray-500 dark:text-gray-400" />
        </div>
      </div>
      <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>
      <p className="mb-4 text-gray-600 dark:text-gray-400">
        {description}
      </p>
      <div className="flex justify-center items-center text-sm text-red-600 dark:text-red-400">
        <Shield className="mr-2 w-4 h-4" />
        Signature de contrat requise
      </div>
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
              id="isActiveEdit"
              checked={formData.isActive}
              onChange={(e) => handleInputChange('isActive', e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="isActiveEdit" className="text-sm text-gray-700 dark:text-gray-300">
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
              className="flex-1 px-4 py-2 text-white bg-sky-500 rounded-lg hover:bg-sky-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Création...' : 'Créer le produit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MerchantDashboard({ isDarkMode, toggleDarkMode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Debug pour surveiller les changements d'onglets
  const handleTabChange = (newTab) => {
    console.log(`🔄 Changement d'onglet: ${activeTab} → ${newTab}`);
    console.log('📊 Analytics avant changement:', {
      totalRevenue: analytics.totalRevenue,
      totalOrders: analytics.totalOrders,
      totalProducts: analytics.totalProducts,
      totalShipments: analytics.totalShipments
    });
    setActiveTab(newTab);
  };
  
  // Tutoriel
  const { showTutorial, completeTutorial, forceTutorial } = useTutorial(user?.role);
  const [contracts, setContracts] = useState([]);
  const [userContract, setUserContract] = useState(null);
  const [hasSignedContract, setHasSignedContract] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalProducts: 0,
    activeProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalShipments: 0,
    pendingShipments: 0,
    totalContracts: 0,
    activeContracts: 0,
    totalDocuments: 0,
    totalPayments: 0
  });
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  // Rating system state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedPackageForRating, setSelectedPackageForRating] = useState(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [deliveryProposals, setDeliveryProposals] = useState([]);

  // Move fetchDashboardData function definition here to avoid temporal dead zone
  const fetchDashboardData = async () => {
    // Protection contre les appels simultanés avec isFetching au lieu d'isLoading
    if (isFetching) {
      console.log('⚠️ Fetch déjà en cours, skip');
      return;
    }

    // PROTECTION CRITIQUE: Vérifier que l'utilisateur existe
    if (!user || !user.id) {
      console.error('❌ Pas d\'utilisateur disponible pour fetchDashboardData');
      console.log('📊 État utilisateur:', { hasUser: !!user, userId: user?.id, userEmail: user?.email });
      return;
    }

    console.log('📊 === DÉBUT FETCHDASHBOARDDATA ===');
    console.log('👤 Utilisateur confirmé:', { id: user.id, email: user.email, role: user.role });
    setIsFetching(true);

    // Sauvegarder les données actuelles comme backup
    const backupData = {
      orders: [...orders],
      payments: [...payments], 
      contracts: [...contracts],
      shipments: [...shipments],
      products: [...products]
    };

    try {
      // Ne mettre isLoading à true que s'il n'y a pas de données existantes
      if (orders.length === 0 && payments.length === 0) {
        setIsLoading(true);
      }
      
      const fetchStartTime = new Date().toISOString();
      
      console.log('📊 Récupération des données du dashboard...', fetchStartTime);
      console.log('📊 État actuel des commandes avant fetch:', {
        ordersCount: orders.length,
        firstOrder: orders[0]?.id || 'N/A'
      });
      
      // Fonction utilitaire pour gérer les erreurs API de manière gracieuse
      const handleApiError = (apiName, response, errorText) => {
        console.warn(`⚠️ API ${apiName} a échoué (${response.status}):`, errorText.substring(0, 200));
        console.log(`🔒 Conservation des données ${apiName} existantes`);
        // Ne rien faire - garder les données existantes
      };

      // Vérification d'authentification préalable avec gestion d'erreur améliorée
      console.log('🔐 Vérification préalable de l\'authentification...');
      let authData = null;
      try {
        const authCheckResponse = await fetch('/api/auth/me', {
          credentials: 'include'
        });
        
        if (authCheckResponse.ok) {
          authData = await authCheckResponse.json();
          console.log('✅ Auth préalable confirmée:', { id: authData.id, email: authData.email });
        } else {
          const authError = await authCheckResponse.text();
          console.warn('⚠️ Échec de vérification auth préalable:', authCheckResponse.status);
          console.warn('⚠️ Détails erreur auth:', authError.substring(0, 200));
          console.log('🔄 Continuons avec les données existantes...');
          // Ne pas return - continuer avec les données existantes
        }
      } catch (authNetworkError) {
        console.warn('⚠️ Erreur réseau auth:', authNetworkError.message);
        console.log('🔄 Continuons avec les données existantes...');
      }
      
      // Fetch merchant dashboard data from specialized API avec gestion d'erreur robuste
      let dashboardData = null;
      try {
        const dashboardResponse = await fetch('/api/dashboard/merchant', {
          headers: {
            'x-user-id': user.id,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        
        console.log('📡 Réponse API dashboard/merchant:', {
          status: dashboardResponse.status,
          statusText: dashboardResponse.statusText,
          contentType: dashboardResponse.headers.get('content-type')
        });
        
        if (dashboardResponse.ok) {
          try {
            dashboardData = await dashboardResponse.json();
            console.log('📋 Données dashboard récupérées:', dashboardData);
            console.log('📦 Commandes détaillées:', {
              count: dashboardData.orders?.length || 0,
              samples: dashboardData.orders?.slice(0, 2).map(o => ({
                id: o.id,
                customerName: o.customerName,
                total: o.total,
                status: o.status,
                hasItems: !!o.items,
                itemsCount: o.items?.length || 0
              }))
            });
            
            // Mettre à jour les states seulement si on a des données valides ET nouvelles
            if (Array.isArray(dashboardData.contracts)) {
              console.log('✅ Mise à jour des contrats:', dashboardData.contracts.length);
              setContracts(dashboardData.contracts);  
            }
            if (Array.isArray(dashboardData.payments)) {
              console.log('✅ Mise à jour des paiements:', dashboardData.payments.length);
              setPayments(dashboardData.payments);
            }
            if (Array.isArray(dashboardData.orders)) {
              console.log('✅ Mise à jour des commandes:', {
                from: orders.length,
                to: dashboardData.orders.length,
                newOrders: dashboardData.orders.map(o => ({ id: o.id, status: o.status }))
              });
              setOrders(dashboardData.orders);
            }
            if (Array.isArray(dashboardData.shipments)) {
              console.log('✅ Mise à jour des expéditions:', dashboardData.shipments.length);
              setShipments(dashboardData.shipments);
            }
            
            // Mettre à jour le timestamp de dernière récupération
            setLastFetchTime(fetchStartTime);
            
          } catch (parseError) {
            console.warn('⚠️ Erreur parsing JSON dashboard:', parseError);
            const rawText = await dashboardResponse.text();
            console.warn('⚠️ Réponse brute:', rawText.substring(0, 500));
            // Garder les données existantes
          }
        } else {
          const errorText = await dashboardResponse.text();
          handleApiError('dashboard/merchant', dashboardResponse, errorText);
        }
      } catch (dashNetworkError) {
        console.warn('⚠️ Erreur réseau dashboard:', dashNetworkError.message);
        console.log('🔒 Conservation des données dashboard existantes');
      }

      // Fetch merchant's products avec gestion d'erreur robuste
      let productsData = [];
      try {
        const productsResponse = await fetch('/api/merchants/products', {
          credentials: 'include'
        });
        
        console.log('📡 Réponse API merchants/products:', {
          status: productsResponse.status,
          statusText: productsResponse.statusText
        });
        
        if (productsResponse.ok) {
          productsData = await productsResponse.json();
          console.log('📦 Données produits récupérées:', productsData.length);
          setProducts(productsData);
        } else {
          const errorText = await productsResponse.text();
          console.warn('⚠️ Erreur lors de la récupération des produits:', {
            status: productsResponse.status,
            statusText: productsResponse.statusText,
            errorText: errorText.substring(0, 200)
          });
          console.log('🔒 Conservation des produits existants');
        }
      } catch (productError) {
        console.warn('⚠️ Erreur réseau produits:', productError.message);
        console.log('🔒 Conservation des produits existants');
      }

      // Fetch documents (non-bloquant) avec gestion d'erreur améliorée
      try {
        const documentsRes = await fetch('/api/documents', {
          credentials: 'include'
        });
        if (documentsRes.ok) {
          const documentsData = await documentsRes.json();
          setDocuments(documentsData);
          console.log('📄 Documents récupérés:', documentsData.length);
        } else {
          console.warn('⚠️ API documents échouée:', documentsRes.status);
          console.log('🔒 Conservation des documents existants');
        }
      } catch (docError) {
        console.warn('⚠️ Erreur réseau documents:', docError.message);
        console.log('🔒 Conservation des documents existants');
      }

      // Fetch notifications (non-bloquant) avec gestion d'erreur améliorée
      try {
        const notificationsRes = await fetch('/api/notifications?limit=5', {
          credentials: 'include'
        });
        if (notificationsRes.ok) {
          const notificationsData = await notificationsRes.json();
          setNotifications(notificationsData.notifications || []);
          console.log('🔔 Notifications récupérées:', notificationsData.notifications?.length || 0);
        } else {
          console.warn('⚠️ API notifications échouée:', notificationsRes.status);
          console.log('🔒 Conservation des notifications existantes');
        }
      } catch (notifError) {
        console.warn('⚠️ Erreur réseau notifications:', notifError.message);
        console.log('🔒 Conservation des notifications existantes');
      }

      // Fetch delivery proposals (non-bloquant) avec gestion d'erreur améliorée
      try {
        console.log('📞 Appel API merchant-delivery-proposals...');
        const proposalsRes = await fetch('/api/merchant-delivery-proposals', {
          credentials: 'include'
        });
        
        console.log('📡 Réponse API delivery proposals:', {
          status: proposalsRes.status,
          statusText: proposalsRes.statusText,
          headers: Object.fromEntries(proposalsRes.headers.entries())
        });
        
        if (proposalsRes.ok) {
          const proposalsData = await proposalsRes.json();
          console.log('📦 Données propositions récupérées:', {
            success: proposalsData.success,
            total: proposalsData.total,
            proposalsCount: proposalsData.proposals?.length || 0,
            firstProposal: proposalsData.proposals?.[0] || null
          });
          setDeliveryProposals(proposalsData.proposals || []);
          console.log('✅ Propositions de livraison mises à jour:', proposalsData.proposals?.length || 0);
        } else {
          const errorText = await proposalsRes.text();
          console.warn('⚠️ API delivery proposals échouée:', {
            status: proposalsRes.status,
            statusText: proposalsRes.statusText,
            errorText: errorText.substring(0, 200)
          });
          console.log('🔒 Conservation des propositions existantes');
        }
      } catch (proposalError) {
        console.warn('⚠️ Erreur réseau delivery proposals:', proposalError.message);
        console.log('🔒 Conservation des propositions existantes');
      }

      // Calculate analytics using the fresh data (seulement si on a de nouvelles données)
      if (dashboardData || productsData.length > 0) {
        // Utiliser les données actuelles ou nouvelles
        const paymentsData = dashboardData?.payments || payments;
        const ordersData = dashboardData?.orders || orders;
        const shipmentsData = dashboardData?.shipments || shipments;
        const contractsData = dashboardData?.contracts || contracts;
        const currentProductsData = productsData.length > 0 ? productsData : products;
        const currentDocumentsData = documents;
        
        const totalRevenue = paymentsData.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + p.amount, 0);
        const monthlyRevenue = paymentsData
          .filter(p => p.status === 'COMPLETED' && new Date(p.createdAt).getMonth() === new Date().getMonth())
          .reduce((sum, p) => sum + p.amount, 0);

        const newAnalytics = {
          totalRevenue,
          monthlyRevenue,
          totalProducts: currentProductsData.length,
          activeProducts: currentProductsData.filter(p => p.isActive).length,
          totalOrders: ordersData.length,
          pendingOrders: ordersData.filter(o => o.status === 'PENDING').length,
          completedOrders: ordersData.filter(o => o.status === 'DELIVERED').length,
          totalShipments: shipmentsData.length,
          pendingShipments: shipmentsData.filter(s => s.status === 'PENDING').length,
          totalContracts: contractsData.length,
          activeContracts: contractsData.filter(c => c.status === 'SIGNED').length,
          totalDocuments: currentDocumentsData.length,
          totalPayments: paymentsData.length
        };

        console.log('📊 Analytics calculées:', newAnalytics);
        setAnalytics(newAnalytics);
      } else {
        console.log('⚠️ Analytics conservées - aucune nouvelle donnée disponible');
      }

      console.log('✅ === FIN FETCHDASHBOARDDATA SUCCÈS ===');

    } catch (error) {
      console.warn('⚠️ Erreur générale dans fetchDashboardData:', error.message);
      console.log('🔒 Conservation de toutes les données existantes');
      
      // En cas d'erreur majeure, s'assurer que les données backup sont préservées
      if (orders.length === 0 && backupData.orders.length > 0) {
        console.log('🔄 Restauration des données backup');
        setOrders(backupData.orders);
        setPayments(backupData.payments);
        setContracts(backupData.contracts);
        setShipments(backupData.shipments);
        setProducts(backupData.products);
      }
      
      // Ne pas faire crash l'app - juste logger l'erreur
    } finally {
      setIsLoading(false);
      setIsFetching(false);
      
      console.log('📊 État final après fetch:', {
        ordersCount: orders.length,
        paymentsCount: payments.length,
        productsCount: products.length,
        contractsCount: contracts.length,
        shipmentsCount: shipments.length,
        timestamp: new Date().toISOString()
      });
      console.log('🔚 === FIN FETCHDASHBOARDDATA FINALLY ===');
    }
  };

  // Debug: Surveiller les changements de deliveryProposals
  useEffect(() => {
    console.log('🔍 État des propositions changé:', {
      count: deliveryProposals.length,
      proposals: deliveryProposals.map(p => ({
        id: p.id?.substring(0, 8) || 'N/A',
        orderShortId: p.orderShortId,
        carrierName: p.carrierName,
        customerName: p.customerName
      })),
      timestamp: new Date().toISOString()
    });
  }, [deliveryProposals]);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'MERCHANT')) {
      console.log('❌ Redirection: utilisateur non-marchand ou manquant', {
        loading,
        hasUser: !!user,
        userRole: user?.role
      });
      router.push('/login');
      return;
    }

    if (user) {
      console.log('🚀 Initialisation du dashboard pour:', user.email);
      fetchDashboardData();
      fetchUserContract();
    }
  }, [user, loading, router]);

  // Vérification d'authentification de secours
  useEffect(() => {
    const checkAuth = async () => {
      if (!user && !loading) {
        console.log('🔍 Vérification d\'authentification de secours...');
        try {
          const response = await fetch('/api/auth/me', {
            credentials: 'include'
          });
          
          if (!response.ok) {
            console.log('❌ Échec de vérification auth - redirection login');
            router.push('/login');
          }
        } catch (error) {
          console.error('❌ Erreur vérification auth:', error);
          router.push('/login');
        }
      }
    };

    // Vérifier après 3 secondes si on n'a toujours pas d'utilisateur
    const timeout = setTimeout(checkAuth, 3000);
    return () => clearTimeout(timeout);
  }, [user, loading, router]);

  // Auto-refresh des données toutes les 30 secondes si l'utilisateur est actif
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      console.log('🔄 Auto-refresh des données du dashboard');
      fetchDashboardData();
    }, 30000); // 30 secondes

    return () => clearInterval(interval);
  }, [user]);

  // Fonction de rafraîchissement manuel
  const refreshData = async () => {
    if (isRefreshing) {
      console.log('⚠️ Rafraîchissement déjà en cours, skip');
      return;
    }
    
    console.log('🔄 Rafraîchissement manuel des données');
    setIsRefreshing(true);
    await fetchDashboardData();
    setIsRefreshing(false);
  };

  // Timeout de sécurité pour éviter le chargement infini
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.error('⚠️ Timeout de chargement - forcer l\'arrêt du loading');
        setIsLoading(false);
      }
    }, 15000); // 15 secondes max

    return () => clearTimeout(timeout);
  }, [isLoading]);

  // Debug: Surveiller les changements d'analytics
  useEffect(() => {
    console.log('📊 Analytics mis à jour:', {
      totalRevenue: analytics.totalRevenue,
      totalOrders: analytics.totalOrders,
      totalProducts: analytics.totalProducts,
      totalShipments: analytics.totalShipments,
      activeTab: activeTab
    });
  }, [analytics, activeTab]);

  // Debug: Surveiller spécifiquement les changements des commandes
  useEffect(() => {
    console.log('🔍 État des commandes changé:', {
      count: orders.length,
      orderIds: orders.map(o => o.id),
      timestamp: new Date().toISOString(),
      activeTab: activeTab,
      samples: orders.slice(0, 3).map(o => ({
        id: o.id,
        status: o.status,
        customerName: o.customerName,
        total: o.total
      }))
    });
  }, [orders, activeTab]);

  // Debug: Surveiller les états critiques
  useEffect(() => {
    console.log('🔍 États critiques:', {
      loading,
      isLoading,
      isFetching,
      hasUser: !!user,
      userRole: user?.role,
      userEmail: user?.email,
      timestamp: new Date().toISOString()
    });
  }, [loading, isLoading, isFetching, user]);

  // Rafraîchissement automatique pour le suivi en temps réel des commandes
  useEffect(() => {
    let intervalId;
    
    if (user && activeTab === 'orders' && orders.some(order => 
      order.hasDelivery && ['CONFIRMED', 'PROCESSING', 'SHIPPED'].includes(order.status)
    )) {
      console.log('🔄 Démarrage du suivi temps réel des livraisons');
      
      // Rafraîchir toutes les 30 secondes quand on est sur l'onglet commandes avec des livraisons actives
      intervalId = setInterval(() => {
        console.log('⏰ Rafraîchissement automatique des commandes en cours de livraison');
        fetchDashboardData();
      }, 30000); // 30 secondes
    }

    return () => {
      if (intervalId) {
        console.log('🛑 Arrêt du suivi temps réel');
        clearInterval(intervalId);
      }
    };
  }, [activeTab, user, orders]);

  // Listener pour les mises à jour en temps réel des transporteurs
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'deliveryUpdate' && event.newValue && user) {
        try {
          const updateData = JSON.parse(event.newValue);
          console.log('📱 Mise à jour temps réel reçue du transporteur:', updateData);
          
          // Vérifier si cette mise à jour concerne une de nos commandes
          const concernsOurOrder = orders.some(order => 
            order.packages?.some(pkg => pkg.id === updateData.packageId) ||
            order.id === updateData.packageId
          );
          
          if (concernsOurOrder) {
            console.log('✅ Mise à jour concerne nos commandes - rafraîchissement des données');
            fetchDashboardData();
            
            // Afficher une notification visuelle
            if (updateData.status === 'DELIVERED') {
              // Créer une notification toast pour informer le marchand
              const notification = document.createElement('div');
              notification.className = 'fixed top-4 right-4 z-50 p-4 bg-green-500 text-white rounded-lg shadow-lg';
              notification.innerHTML = `
                <div class="flex items-center gap-2">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                  </svg>
                  <span>✅ Livraison terminée par ${updateData.carrierInfo?.name || 'le transporteur'}</span>
                </div>
              `;
              document.body.appendChild(notification);
              
              // Retirer la notification après 5 secondes
              setTimeout(() => {
                if (notification.parentNode) {
                  notification.parentNode.removeChild(notification);
                }
              }, 5000);
            }
          }
        } catch (error) {
          console.error('❌ Erreur lors du traitement de la mise à jour temps réel:', error);
        }
      }
    };

    // Ajouter le listener
    window.addEventListener('storage', handleStorageChange);
    
    // Nettoyer le listener
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user, orders, fetchDashboardData]);

  // Diagnostic complet au montage du composant
  useEffect(() => {
    const runDiagnostic = async () => {
      console.log('🏥 === DIAGNOSTIC COMPLET DASHBOARD MARCHAND ===');
      
      // 1. Vérifier les cookies
      const cookies = document.cookie;
      console.log('🍪 Cookies disponibles:', cookies);
      
      // 2. Tester l'API auth/me directement
      try {
        const authResponse = await fetch('/api/auth/me', {
          credentials: 'include'
        });
        console.log('👤 API auth/me status:', authResponse.status);
        
        if (authResponse.ok) {
          const authData = await authResponse.json();
          console.log('👤 Données auth/me:', {
            hasData: !!authData,
            userId: authData?.id,
            email: authData?.email,
            role: authData?.role
          });
        } else {
          const errorText = await authResponse.text();
          console.log('❌ Erreur auth/me:', errorText);
        }
      } catch (authError) {
        console.error('❌ Erreur réseau auth/me:', authError);
      }
      
      // 3. Tester l'API dashboard/merchant si on a un utilisateur
      if (user?.id) {
        try {
          const dashboardResponse = await fetch('/api/dashboard/merchant', {
            headers: {
              'x-user-id': user.id
            },
            credentials: 'include'
          });
          console.log('📊 API dashboard/merchant status:', dashboardResponse.status);
          
          if (dashboardResponse.ok) {
            const dashboardData = await dashboardResponse.json();
            console.log('📊 Données dashboard:', {
              hasOrders: !!dashboardData.orders,
              ordersCount: dashboardData.orders?.length || 0,
              hasPayments: !!dashboardData.payments,
              paymentsCount: dashboardData.payments?.length || 0,
              hasContracts: !!dashboardData.contracts,
              contractsCount: dashboardData.contracts?.length || 0
            });
          } else {
            const errorText = await dashboardResponse.text();
            console.log('❌ Erreur dashboard/merchant:', errorText);
          }
        } catch (dashboardError) {
          console.error('❌ Erreur réseau dashboard/merchant:', dashboardError);
        }
      }
      
      console.log('🏥 === FIN DIAGNOSTIC ===');
    };
    
    // Lancer le diagnostic après 2 secondes
    const diagnosticTimeout = setTimeout(runDiagnostic, 2000);
    return () => clearTimeout(diagnosticTimeout);
  }, [user]);

  const fetchUserContract = async () => {
    try {
      console.log('📞 Récupération des contrats pour l\'utilisateur:', {
        userId: user.id,
        email: user.email,
        role: user.role
      });

      const response = await fetch(`/api/contracts?merchantId=${user.id}`, {
        credentials: 'include'
      });
      
      console.log('📡 Réponse API contracts:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (response.ok) {
        const contractsData = await response.json();
        console.log('📋 Contrats récupérés:', contractsData);
        
        const userContracts = contractsData.filter(contract => contract.merchantId === user.id);
        console.log('📊 Contrats filtrés pour l\'utilisateur:', userContracts);
        
        if (userContracts.length > 0) {
          // Chercher un contrat signé
          const signedContract = userContracts.find(contract => contract.status === 'SIGNED');
          if (signedContract) {
            console.log('✅ Contrat signé trouvé:', {
              id: signedContract.id,
              title: signedContract.title,
              status: signedContract.status,
              signedAt: signedContract.signedAt
            });
            setUserContract(signedContract);
            setHasSignedContract(true);
          } else {
            // Chercher un contrat en attente de signature
            const pendingContract = userContracts.find(contract => contract.status === 'PENDING_SIGNATURE');
            if (pendingContract) {
              console.log('⏳ Contrat en attente de signature trouvé:', {
                id: pendingContract.id,
                title: pendingContract.title,
                status: pendingContract.status
              });
              setUserContract(pendingContract);
              setHasSignedContract(false);
            } else {
              console.log('❌ Aucun contrat signé ou en attente de signature trouvé');
            }
          }
        } else {
          console.log('❌ Aucun contrat trouvé pour cet utilisateur');
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Erreur lors de la récupération des contrats:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
      }
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des contrats:', error);
    }
  };

  const handleContractSigned = () => {
    setHasSignedContract(true);
    fetchUserContract();
    console.log('📝 Contrat signé - rafraîchissement des données dashboard');
    fetchDashboardData();
  };

  const handleCreateProduct = async (productData) => {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData)
      });

      if (response.ok) {
        console.log('📦 Nouveau produit créé - rafraîchissement des données');
        fetchDashboardData();
        setShowAddProduct(false);
        alert('Produit créé avec succès!');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Erreur lors de la création du produit');
    }
  };

  const handleCreateContract = () => {
    router.push('/contracts/create');
  };

  const handleGenerateInvoice = () => {
    router.push('/documents/create?type=invoice');
  };

  const handleViewOrder = (orderId) => {
    router.push(`/orders/${orderId}`);
  };

  const handleCreateShipment = (orderId) => {
    router.push(`/shipments/create?orderId=${orderId}`);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowEditProduct(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      return;
    }

    try {
      console.log('🗑️ Suppression du produit:', productId);
      const response = await fetch(`/api/merchants/products/${productId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        alert('Produit supprimé avec succès');
        console.log('✅ Produit supprimé - rafraîchissement des données');
        fetchDashboardData();
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Erreur lors de la suppression');
    }
  };

  // Rating system functions
  const checkIfCarrierCanBeRated = (pkg) => {
    return pkg.status === 'DELIVERED' && pkg.matches && pkg.matches.some(match => match.status === 'COMPLETED');
  };

  const hasCarrierBeenRated = (pkg) => {
    return pkg.matches && pkg.matches.some(match => match.carrierReview);
  };

  const openRatingModal = (pkg) => {
    setSelectedPackageForRating(pkg);
    setShowRatingModal(true);
    setRating(0);
    setReview('');
  };

  const closeRatingModal = () => {
    setShowRatingModal(false);
    setSelectedPackageForRating(null);
    setRating(0);
    setReview('');
  };

  const submitRating = async () => {
    if (!selectedPackageForRating || rating === 0) {
      alert('Veuillez sélectionner une note');
      return;
    }

    setSubmittingRating(true);
    try {
      const response = await fetch(`/api/packages/${selectedPackageForRating.id}/rate-carrier`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || ''
        },
        body: JSON.stringify({
          rating,
          review: review.trim()
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert('Évaluation envoyée avec succès !');
        closeRatingModal();
        fetchDashboardData();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Erreur lors de l'envoi de l'évaluation: ${errorData.error || 'Erreur inconnue'}`);
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Erreur réseau lors de l\'envoi de l\'évaluation');
    } finally {
      setSubmittingRating(false);
    }
  };

  // Amélioration: Ne montrer le loading que si on n'a vraiment aucune donnée
  const hasAnyData = orders.length > 0 || products.length > 0 || payments.length > 0;
  const shouldShowLoading = loading || (isLoading && !lastFetchTime && !hasAnyData);
  
  if (shouldShowLoading) {
    console.log('🔄 Affichage du loading:', {
      loading,
      isLoading,
      lastFetchTime: !!lastFetchTime,
      hasUser: !!user,
      hasAnyData,
      shouldShowLoading
    });
    return (
      <div className="flex justify-center items-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full border-4 border-sky-400 animate-spin border-t-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Chargement du tableau de bord...</p>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            État: {loading ? 'Auth en cours' : isLoading ? 'Données en cours' : 'En attente...'}
          </p>
          <button 
            onClick={() => {
              console.log('🔄 Forcer l\'arrêt du loading');
              setIsLoading(false);
            }}
            className="mt-4 px-4 py-2 text-sm text-gray-600 bg-gray-200 rounded hover:bg-gray-300"
          >
            Forcer le chargement
          </button>
        </div>
      </div>
    );
  }

  // Si pas d'utilisateur après le loading, rediriger
  if (!loading && !user) {
    console.log('❌ Pas d\'utilisateur après chargement - redirection');
    router.push('/login');
    return null;
  }

  const renderTabContent = () => {
    // Si le contrat n'est pas signé, bloquer l'accès à certaines fonctionnalités
    if (!hasSignedContract && userContract && ['products', 'orders', 'shipments'].includes(activeTab)) {
      return (
        <div className="space-y-6">
          <BlockedFeature
            title="Fonctionnalité bloquée"
            description={`Vous devez signer le contrat "${userContract.title}" pour accéder à cette fonctionnalité.`}
            icon={activeTab === 'products' ? Package : activeTab === 'orders' ? ShoppingCart : Truck}
          />
          <div className="text-center">
            <button
              onClick={() => setShowContractModal(true)}
              className="px-6 py-3 text-white bg-blue-600 rounded-lg transition-colors hover:bg-blue-700"
            >
              Signer le contrat maintenant
            </button>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Aperçu de votre activité</h3>
            
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h4 className="mb-4 font-medium text-gray-900 dark:text-white">Commandes récentes</h4>
                {orders.slice(0, 3).length > 0 ? (
                  <div className="space-y-3">
                    {orders.slice(0, 3).map((order) => (
                      <div key={order.id} className="flex justify-between items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">#{order.id}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{order.customerName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900 dark:text-white">€{order.total}</p>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            order.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                            order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                          }`}>
                            {order.status === 'COMPLETED' ? 'Terminé' :
                             order.status === 'PENDING' ? 'En attente' : order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">Aucune commande récente</p>
                )}
              </div>

              <div>
                <h4 className="mb-4 font-medium text-gray-900 dark:text-white">Produits populaires</h4>
                {products.slice(0, 3).length > 0 ? (
                  <div className="space-y-3">
                    {products.slice(0, 3).map((product) => (
                      <div key={product.id} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{product.category}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sky-600 dark:text-sky-400">€{product.price}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Stock: {product.stock || 0}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">Aucun produit</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'products':
        return (
          <div className="space-y-6 products-section">
            {/* Products Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion des produits</h2>
                <p className="text-gray-600 dark:text-gray-400">Gérez votre catalogue de produits</p>
              </div>
              <button
                onClick={() => setShowAddProduct(true)}
                className="flex items-center px-4 py-2 text-white bg-sky-500 rounded-lg transition hover:bg-sky-600"
              >
                <Plus className="mr-2 w-4 h-4" />
                Ajouter un produit
              </button>
            </div>

            {/* Products Filter */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 w-5 h-5 text-gray-400 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Rechercher des produits..."
                    className="py-2 pr-4 pl-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>
              </div>
              <button className="flex items-center px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                <Filter className="mr-2 w-4 h-4" />
                Filtres
              </button>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
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
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{product.name}</h3>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{product.category}</p>
                        <p className="mt-2 text-lg font-bold text-sky-600">€{product.price}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEditProduct(product)}
                          className="p-2 text-gray-400 hover:text-blue-600"
                          title="Modifier le produit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 text-gray-400 hover:text-red-600"
                          title="Supprimer le produit"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        product.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {product.isActive ? 'Actif' : 'Inactif'}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Stock: {product.stock || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'orders':
        console.log('🔍 Rendu onglet Orders:', {
          ordersCount: orders.length,
          ordersData: orders.slice(0, 2),
          hasSignedContract,
          userContract: !!userContract,
          activeTab
        });
        
        return (
          <div className="space-y-6 orders-section">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion des commandes</h2>
                  {/* Indicateur de suivi temps réel */}
                  {orders.some(order => order.hasDelivery && ['CONFIRMED', 'PROCESSING', 'SHIPPED'].includes(order.status)) && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                        Suivi temps réel actif
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-gray-600 dark:text-gray-400">Gérez les commandes de vos clients</p>
                  {lastFetchTime && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Dernière mise à jour: {new Date(lastFetchTime).toLocaleTimeString('fr-FR', { 
                        hour: '2-digit', 
                        minute: '2-digit', 
                        second: '2-digit' 
                      })}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300">
                  <Filter className="mr-2 w-4 h-4" />
                  Filtrer
                </button>
                <button className="flex items-center px-4 py-2 text-white bg-sky-500 rounded-lg hover:bg-sky-600">
                  <Download className="mr-2 w-4 h-4" />
                  Exporter
                </button>
                <button 
                  onClick={refreshData}
                  className="flex items-center px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
                >
                  <RefreshCw className={`mr-2 w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Actualiser
                </button>
              </div>
            </div>



            {/* Orders Cards */}
            {orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="p-6 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex gap-3 items-center mb-2">
                          <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                            Commande #{order.id}
                          </h4>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                            order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                            order.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                            order.status === 'PROCESSING' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' :
                            order.status === 'SHIPPED' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300' :
                            order.status === 'DELIVERED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                            order.status === 'CANCELLED' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                          }`}>
                            {order.status === 'PENDING' ? 'En attente' :
                             order.status === 'CONFIRMED' ? 'Confirmé' :
                             order.status === 'PROCESSING' ? 'En préparation' :
                             order.status === 'SHIPPED' ? 'Expédié' :
                             order.status === 'DELIVERED' ? 'Livré' :
                             order.status === 'CANCELLED' ? 'Annulé' : order.status}
                          </span>
                        </div>
                        
                        {/* Indicateur de progression pour les livraisons */}
                        {order.hasDelivery && order.deliveryAddress && ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status) && (
                          <div className="mb-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800">
                            <div className="flex justify-between items-center mb-3">
                              <h5 className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Suivi de livraison en temps réel</h5>
                              <span className="text-sm text-emerald-600 dark:text-emerald-400">
                                {order.status === 'CONFIRMED' ? '1/4' :
                                 order.status === 'PROCESSING' ? '2/4' :
                                 order.status === 'SHIPPED' ? '3/4' :
                                 order.status === 'DELIVERED' ? '4/4' : '0/4'}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {/* Étape 1: Confirmé */}
                              <div className="flex flex-col items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status)
                                    ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                                }`}>
                                  <CheckCircle className="w-4 h-4" />
                                </div>
                                <span className="mt-1 text-xs text-center text-gray-600 dark:text-gray-400">Confirmé</span>
                                {order.confirmedAt && (
                                  <span className="text-xs text-center text-gray-500 dark:text-gray-400">
                                    {new Date(order.confirmedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                              </div>
                              
                              {/* Ligne de progression */}
                              <div className={`flex-1 h-0.5 ${
                                ['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status)
                                  ? 'bg-purple-500' : 'bg-gray-200 dark:bg-gray-600'
                              }`}></div>
                              
                              {/* Étape 2: En préparation */}
                              <div className="flex flex-col items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  ['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status)
                                    ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                                }`}>
                                  <Clock className="w-4 h-4" />
                                </div>
                                <span className="mt-1 text-xs text-center text-gray-600 dark:text-gray-400">Préparation</span>
                                {order.processingAt && (
                                  <span className="text-xs text-center text-gray-500 dark:text-gray-400">
                                    {new Date(order.processingAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                              </div>
                              
                              {/* Ligne de progression */}
                              <div className={`flex-1 h-0.5 ${
                                ['SHIPPED', 'DELIVERED'].includes(order.status) ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-gray-600'
                              }`}></div>
                              
                              {/* Étape 3: Expédié */}
                              <div className="flex flex-col items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  ['SHIPPED', 'DELIVERED'].includes(order.status)
                                    ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                                }`}>
                                  <Truck className="w-4 h-4" />
                                </div>
                                <span className="mt-1 text-xs text-center text-gray-600 dark:text-gray-400">Expédié</span>
                                {order.shippedAt && (
                                  <span className="text-xs text-center text-gray-500 dark:text-gray-400">
                                    {new Date(order.shippedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                              </div>
                              
                              {/* Ligne de progression */}
                              <div className={`flex-1 h-0.5 ${
                                order.status === 'DELIVERED' ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600'
                              }`}></div>
                              
                              {/* Étape 4: Livré */}
                              <div className="flex flex-col items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  order.status === 'DELIVERED'
                                    ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                                }`}>
                                  <CheckCircle className="w-4 h-4" />
                                </div>
                                <span className="mt-1 text-xs text-center text-gray-600 dark:text-gray-400">Livré</span>
                                {order.deliveredAt && (
                                  <span className="text-xs text-center text-gray-500 dark:text-gray-400">
                                    {new Date(order.deliveredAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Informations sur le transporteur si disponible */}
                            {order.carrierInfo && (
                              <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-700">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                    <span className="text-sm text-emerald-700 dark:text-emerald-300">
                                      Transporteur: {order.carrierInfo.name}
                                    </span>
                                  </div>
                                  {order.carrierInfo.phone && (
                                    <a 
                                      href={`tel:${order.carrierInfo.phone}`}
                                      className="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                                    >
                                      📞 {order.carrierInfo.phone}
                                    </a>
                                  )}
                                </div>
                                {order.trackingCode && (
                                  <div className="mt-2">
                                    <span className="text-xs text-emerald-600 dark:text-emerald-400">
                                      Code de suivi: {order.trackingCode}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <strong>Client:</strong> {order.customerName || order.customer?.firstName + ' ' + order.customer?.lastName || 'Non défini'}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <strong>Email:</strong> {order.customerEmail || order.customer?.email || 'Non défini'}
                            </p>
                            {(order.customerPhone || order.customer?.phoneNumber) && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                <strong>Téléphone:</strong> {order.customerPhone || order.customer?.phoneNumber}
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <strong>Type:</strong> {order.hasDelivery ? 'Livraison' : 'Retrait en magasin'}
                            </p>
                            {order.hasDelivery && order.deliveryAddress && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                <strong>Adresse:</strong> {order.deliveryAddress}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          €{(order.total || order.totalAmount || 0).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {order.items?.length || 0} article(s)
                        </p>
                      </div>
                    </div>

                    {/* Articles de la commande */}
                    {order.items && order.items.length > 0 && (
                      <div className="mb-4">
                        <h5 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Articles commandés</h5>
                        <div className="space-y-2">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex justify-between items-center px-3 py-2 bg-gray-50 rounded dark:bg-gray-700">
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{item.productName || 'Produit'}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  €{(item.unitPrice || 0).toFixed(2)} × {item.quantity || 1}
                                </p>
                              </div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                €{(item.totalPrice || item.unitPrice * item.quantity || 0).toFixed(2)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Résumé des coûts */}
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Sous-total:</span>
                        <span className="text-gray-900 dark:text-white">€{(order.subtotal || order.total || 0).toFixed(2)}</span>
                      </div>
                      {(order.deliveryFee && order.deliveryFee > 0) && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Livraison:</span>
                          <span className="text-gray-900 dark:text-white">€{order.deliveryFee.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2 text-lg font-bold border-t border-gray-200 dark:border-gray-600">
                        <span className="text-gray-900 dark:text-white">Total:</span>
                        <span className="text-gray-900 dark:text-white">€{(order.total || order.totalAmount || 0).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                        {order.confirmedAt && (
                          <span>Confirmé le {new Date(order.confirmedAt).toLocaleDateString()}</span>
                        )}
                        {order.shippedAt && (
                          <span>Expédié le {new Date(order.shippedAt).toLocaleDateString()}</span>
                        )}
                        {order.deliveredAt && (
                          <span>Livré le {new Date(order.deliveredAt).toLocaleDateString()}</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewOrder(order.id)}
                          className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300"
                        >
                          <Eye className="w-4 h-4" />
                          Voir détails
                        </button>
                        {order.status === 'CONFIRMED' && (
                          <button
                            onClick={() => {
                              // Mettre à jour le statut à "PROCESSING"
                              // handleUpdateOrderStatus(order.id, 'PROCESSING');
                            }}
                            className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                          >
                            <Clock className="w-4 h-4" />
                            Préparer
                          </button>
                        )}
                        {order.status === 'PROCESSING' && (
                          <button
                            onClick={() => handleCreateShipment(order.id)}
                            className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                          >
                            <Truck className="w-4 h-4" />
                            Expédier
                          </button>
                        )}
                        {order.status === 'DELIVERED' && order.hasDelivery && checkIfCarrierCanBeRated(order) && !hasCarrierBeenRated(order) && (
                          <button 
                            onClick={() => openRatingModal(order)}
                            className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                          >
                            <Star className="w-4 h-4" />
                            Évaluer le livreur
                          </button>
                        )}
                        {order.status === 'DELIVERED' && order.hasDelivery && hasCarrierBeenRated(order) && (
                          <div className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-400">
                            <Star className="w-4 h-4" />
                            Livreur évalué
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <ShoppingCart className="mx-auto mb-4 w-12 h-12 text-gray-400" />
                <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                  {isLoading ? 'Chargement des commandes...' : 'Aucune commande'}
                </h3>
                <p className="mb-4 text-gray-600 dark:text-gray-400">
                  {isLoading ? 'Veuillez patienter...' : 'Les commandes de vos clients apparaîtront ici.'}
                </p>
                {!isLoading && (
                  <button
                    onClick={() => router.push('/pos-checkout')}
                    className="flex gap-2 items-center px-6 py-3 mx-auto font-medium text-white bg-sky-500 rounded-lg transition hover:bg-sky-600"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Utiliser la caisse POS
                  </button>
                )}
              </div>
            )}
          </div>
        );

      case 'contracts':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion des contrats</h2>
              {userContract ? (
                <div className="p-6 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{userContract.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400">{userContract.content?.substring(0, 100)}...</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        userContract.status === 'SIGNED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                        userContract.status === 'PENDING_SIGNATURE' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                      }`}>
                        {userContract.status === 'SIGNED' ? 'Signé' :
                         userContract.status === 'PENDING_SIGNATURE' ? 'En attente de signature' :
                         userContract.status}
                      </span>
                      {userContract.value && (
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          Valeur: {userContract.value}€
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">
                        <strong>Créé le:</strong> {new Date(userContract.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                      {userContract.signedAt && (
                        <p className="text-green-600 dark:text-green-400">
                          <strong>Signé le:</strong> {new Date(userContract.signedAt).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                    <div>
                      {userContract.expiresAt && (
                        <p className="text-gray-600 dark:text-gray-400">
                          <strong>Expire le:</strong> {new Date(userContract.expiresAt).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex mt-4 space-x-3">
                    <button 
                      onClick={() => setShowContractModal(true)}
                      className="flex items-center text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
                    >
                      <Eye className="mr-1 w-4 h-4" />
                      Voir le contrat
                    </button>
                    {userContract.status === 'PENDING_SIGNATURE' && (
                      <button 
                        onClick={() => setShowContractModal(true)}
                        className="flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <FileText className="mr-1 w-4 h-4" />
                        Signer maintenant
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <FileText className="mx-auto mb-4 w-12 h-12 text-gray-400" />
                  <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Aucun contrat</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Aucun contrat n'a été assigné à votre compte pour le moment.
                  </p>
                </div>
              )}

              {/* Autres contrats si nécessaire */}
              {contracts.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Historique des contrats</h3>
                  {contracts.map((contract) => (
                    <div key={contract.id} className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{contract.title}</h3>
                          <p className="text-gray-600 dark:text-gray-400">{contract.description}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          contract.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                          contract.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {contract.status}
                        </span>
                      </div>
                      <div className="flex mt-4 space-x-3">
                        <button className="flex items-center text-sky-600 hover:text-sky-700">
                          <Eye className="mr-1 w-4 h-4" />
                          Voir
                        </button>
                        <button className="flex items-center text-gray-600 hover:text-gray-700">
                          <FileText className="mr-1 w-4 h-4" />
                          Télécharger
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'shipments':
        // Filtrer les commandes avec livraison à domicile
        const deliveryOrders = orders.filter(order => order.hasDelivery && order.deliveryAddress);
        
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Gestion des expéditions</h3>
                  {/* Indicateur de suivi temps réel pour expéditions */}
                  {deliveryOrders.some(order => ['CONFIRMED', 'PROCESSING', 'SHIPPED'].includes(order.status)) && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-full border border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
                        Expéditions en cours
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-gray-600 dark:text-gray-400">Commandes nécessitant une livraison à domicile</p>
                  {lastFetchTime && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Dernière mise à jour: {new Date(lastFetchTime).toLocaleTimeString('fr-FR', { 
                        hour: '2-digit', 
                        minute: '2-digit', 
                        second: '2-digit' 
                      })}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={refreshData}
                  className="flex items-center px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
                >
                  <RefreshCw className={`mr-2 w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Actualiser
                </button>
                <button
                  onClick={() => router.push('/exp')}
                  className="flex items-center px-4 py-2 text-white bg-sky-500 rounded-lg hover:bg-sky-600"
                >
                  <Plus className="mr-2 w-4 h-4" />
                  Nouvelle expédition
                </button>
              </div>
            </div>

            {deliveryOrders.length > 0 ? (
              <div className="space-y-4">
                {deliveryOrders.map((order) => (
                  <div key={order.id} className="p-6 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex gap-3 items-center mb-2">
                          <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                            Commande #{order.id.substring(0, 8)}
                          </h4>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                            order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                            order.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                            order.status === 'PROCESSING' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' :
                            order.status === 'SHIPPED' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300' :
                            order.status === 'DELIVERED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                          }`}>
                            {order.status === 'PENDING' ? 'En attente' :
                             order.status === 'CONFIRMED' ? 'Confirmé' :
                             order.status === 'PROCESSING' ? 'En préparation' :
                             order.status === 'SHIPPED' ? 'Expédié' :
                             order.status === 'DELIVERED' ? 'Livré' : order.status}
                          </span>
                          {order.status === 'CONFIRMED' && (
                            <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full dark:bg-orange-900 dark:text-orange-300">
                              Nécessite livraison
                            </span>
                          )}
                        </div>
                        
                        {/* Indicateur de progression pour les expéditions */}
                        {['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status) && (
                          <div className="mb-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800">
                            <div className="flex justify-between items-center mb-3">
                              <h5 className="text-sm font-medium text-indigo-900 dark:text-indigo-100">Suivi d'expédition</h5>
                              <span className="text-sm text-indigo-600 dark:text-indigo-400">
                                {order.status === 'CONFIRMED' ? '1/4' :
                                 order.status === 'PROCESSING' ? '2/4' :
                                 order.status === 'SHIPPED' ? '3/4' :
                                 order.status === 'DELIVERED' ? '4/4' : '0/4'}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {/* Étape 1: Confirmé */}
                              <div className="flex flex-col items-center">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                  ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status)
                                    ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                                }`}>
                                  <CheckCircle className="w-3 h-3" />
                                </div>
                                <span className="mt-1 text-xs text-center text-gray-600 dark:text-gray-400">Confirmé</span>
                              </div>
                              
                              {/* Ligne de progression */}
                              <div className={`flex-1 h-0.5 ${
                                ['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status)
                                  ? 'bg-purple-500' : 'bg-gray-200 dark:bg-gray-600'
                              }`}></div>
                              
                              {/* Étape 2: En préparation */}
                              <div className="flex flex-col items-center">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                  ['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status)
                                    ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                                }`}>
                                  <Clock className="w-3 h-3" />
                                </div>
                                <span className="mt-1 text-xs text-center text-gray-600 dark:text-gray-400">Préparation</span>
                              </div>
                              
                              {/* Ligne de progression */}
                              <div className={`flex-1 h-0.5 ${
                                ['SHIPPED', 'DELIVERED'].includes(order.status) ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-gray-600'
                              }`}></div>
                              
                              {/* Étape 3: Expédié */}
                              <div className="flex flex-col items-center">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                  ['SHIPPED', 'DELIVERED'].includes(order.status)
                                    ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                                }`}>
                                  <Truck className="w-3 h-3" />
                                </div>
                                <span className="mt-1 text-xs text-center text-gray-600 dark:text-gray-400">Expédié</span>
                              </div>
                              
                              {/* Ligne de progression */}
                              <div className={`flex-1 h-0.5 ${
                                order.status === 'DELIVERED' ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600'
                              }`}></div>
                              
                              {/* Étape 4: Livré */}
                              <div className="flex flex-col items-center">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                  order.status === 'DELIVERED'
                                    ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                                }`}>
                                  <CheckCircle className="w-3 h-3" />
                                </div>
                                <span className="mt-1 text-xs text-center text-gray-600 dark:text-gray-400">Livré</span>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="grid gap-3 md:grid-cols-2">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <strong>Client:</strong> {order.customerName}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <strong>Email:</strong> {order.customerEmail || 'Non défini'}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <strong>Téléphone:</strong> {order.customerPhone || 'Non défini'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <strong>Adresse de livraison:</strong>
                            </p>
                            <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                              {order.deliveryAddress}
                            </p>
                            {order.deliveryTimeSlot && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                <strong>Créneau:</strong> {
                                  order.deliveryTimeSlot === 'morning' ? 'Matin (8h-12h)' :
                                  order.deliveryTimeSlot === 'afternoon' ? 'Après-midi (12h-18h)' :
                                  order.deliveryTimeSlot === 'evening' ? 'Soirée (18h-20h)' :
                                  order.deliveryTimeSlot
                                }
                              </p>
                            )}
                          </div>
                        </div>

                        {order.deliveryInstructions && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg dark:bg-blue-900/20">
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                              <strong>Instructions de livraison:</strong> {order.deliveryInstructions}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          €{order.total.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          dont livraison: €{order.deliveryFee.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {order.items?.length || 0} article(s)
                        </p>
                      </div>
                    </div>

                    {/* Articles de la commande */}
                    {order.items && order.items.length > 0 && (
                      <div className="mb-4">
                        <h5 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Articles à livrer</h5>
                        <div className="grid gap-2 md:grid-cols-2">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex justify-between items-center px-3 py-2 bg-gray-50 rounded dark:bg-gray-700">
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{item.productName}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  €{item.unitPrice.toFixed(2)} × {item.quantity}
                                </p>
                              </div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                €{item.totalPrice.toFixed(2)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>Créé le {new Date(order.createdAt).toLocaleDateString('fr-FR')}</span>
                        {order.confirmedAt && (
                          <span>Confirmé le {new Date(order.confirmedAt).toLocaleDateString('fr-FR')}</span>
                        )}
                        {order.shippedAt && (
                          <span>Expédié le {new Date(order.shippedAt).toLocaleDateString('fr-FR')}</span>
                        )}
                        {order.deliveredAt && (
                          <span>Livré le {new Date(order.deliveredAt).toLocaleDateString('fr-FR')}</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewOrder(order.id)}
                          className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300"
                        >
                          <Eye className="w-4 h-4" />
                          Voir détails
                        </button>
                        {order.status === 'CONFIRMED' && (
                          <button
                            onClick={() => {
                              // Créer un package/expédition pour cette commande
                              console.log('Créer expédition pour commande:', order.id);
                            }}
                            className="flex gap-1 items-center px-3 py-1 text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                          >
                            <Truck className="w-4 h-4" />
                            Créer expédition
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Truck className="mx-auto mb-4 w-12 h-12 text-gray-400" />
                <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Aucune commande à livrer</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Les commandes nécessitant une livraison à domicile apparaîtront ici
                </p>
              </div>
            )}
          </div>
        );

      case 'proposals':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Propositions de livraison</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Propositions reçues des transporteurs professionnels
                </p>
              </div>
              <button
                onClick={refreshData}
                disabled={isRefreshing}
                className={`flex items-center px-4 py-2 rounded-lg transition ${
                  isRefreshing
                    ? 'text-gray-500 bg-gray-300 cursor-not-allowed'
                    : 'text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                <RefreshCw className={`mr-2 w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
            </div>

            {deliveryProposals.length > 0 ? (
              <div className="space-y-4">
                {deliveryProposals.map((proposal) => (
                  <div key={proposal.id} className="p-6 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex gap-3 items-center mb-2">
                          <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                            Proposition pour commande #{proposal.orderShortId}
                          </h4>
                          <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900 dark:text-blue-300">
                            Nouveau
                          </span>
                        </div>
                        
                        <div className="grid gap-3 md:grid-cols-2 mb-4">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <strong>Client:</strong> {proposal.customerName}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <strong>Email client:</strong> {proposal.customerEmail || 'Non défini'}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <strong>Téléphone client:</strong> {proposal.customerPhone || 'Non défini'}
                            </p>
                          </div>
                                                     <div>
                             <p className="text-sm text-gray-600 dark:text-gray-400">
                               <strong>Transporteur:</strong> {proposal.carrierName}
                             </p>
                             {proposal.carrierEmail && (
                               <p className="text-sm text-gray-600 dark:text-gray-400">
                                 <strong>Email transporteur:</strong> {proposal.carrierEmail}
                               </p>
                             )}
                             {proposal.carrierPhone && (
                               <p className="text-sm text-gray-600 dark:text-gray-400">
                                 <strong>Téléphone transporteur:</strong> {proposal.carrierPhone}
                               </p>
                             )}
                             <p className="text-sm text-gray-600 dark:text-gray-400">
                               <strong>Proposition reçue le:</strong> {new Date(proposal.proposedAt).toLocaleDateString('fr-FR', {
                                 year: 'numeric',
                                 month: 'long',
                                 day: 'numeric',
                                 hour: '2-digit',
                                 minute: '2-digit'
                               })}
                             </p>
                           </div>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-lg mb-4 dark:bg-blue-900/20">
                          <h5 className="mb-2 text-sm font-medium text-blue-900 dark:text-blue-100">
                            Détails de la livraison
                          </h5>
                          <div className="grid gap-2 md:grid-cols-2">
                            <div>
                              <p className="text-sm text-blue-800 dark:text-blue-200">
                                <strong>Adresse:</strong> {proposal.deliveryAddress}
                              </p>
                              {proposal.deliveryTimeSlot && (
                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                  <strong>Créneau:</strong> {
                                    proposal.deliveryTimeSlot === 'morning' ? 'Matin (8h-12h)' :
                                    proposal.deliveryTimeSlot === 'afternoon' ? 'Après-midi (12h-18h)' :
                                    proposal.deliveryTimeSlot === 'evening' ? 'Soirée (18h-20h)' :
                                    proposal.deliveryTimeSlot
                                  }
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-sm text-blue-800 dark:text-blue-200">
                                <strong>Articles:</strong> {proposal.itemsCount} article(s)
                              </p>
                              <p className="text-sm text-blue-800 dark:text-blue-200">
                                <strong>Valeur commande:</strong> €{proposal.totalAmount.toFixed(2)}
                              </p>
                            </div>
                          </div>
                          {proposal.deliveryInstructions && (
                            <p className="mt-2 text-sm text-blue-800 dark:text-blue-200">
                              <strong>Instructions:</strong> {proposal.deliveryInstructions}
                            </p>
                          )}
                        </div>

                        {/* Message de la proposition */}
                        <div className="p-3 bg-gray-50 rounded-lg mb-4 dark:bg-gray-700">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            <strong>Message:</strong> {proposal.proposalMessage}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          €{proposal.deliveryFee?.toFixed(2) || '5.99'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Frais de livraison
                        </p>
                      </div>
                    </div>

                    {/* Articles de la commande */}
                    {proposal.items && proposal.items.length > 0 && (
                      <div className="mb-4">
                        <h5 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Articles à livrer</h5>
                        <div className="grid gap-2 md:grid-cols-2">
                          {proposal.items.map((item) => (
                            <div key={item.id} className="flex justify-between items-center px-3 py-2 bg-gray-50 rounded dark:bg-gray-700">
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{item.productName}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  €{item.unitPrice.toFixed(2)} × {item.quantity}
                                </p>
                              </div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                €{item.totalPrice.toFixed(2)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-600">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Commande #{proposal.orderShortId} • {proposal.itemsCount} article(s)
                      </div>
                                             <div className="flex gap-2">
                         <button
                           onClick={async () => {
                             if (!confirm('Êtes-vous sûr de vouloir refuser cette proposition de livraison ?')) {
                               return;
                             }
                             
                             try {
                               const response = await fetch('/api/merchant-proposal-response', {
                                 method: 'POST',
                                 headers: {
                                   'Content-Type': 'application/json',
                                 },
                                 credentials: 'include',
                                 body: JSON.stringify({
                                   proposalId: proposal.id,
                                   orderId: proposal.orderId,
                                   action: 'reject'
                                 })
                               });

                               if (response.ok) {
                                 const result = await response.json();
                                 alert('Proposition refusée avec succès');
                                 // Refresh the data to remove the rejected proposal
                                 fetchDashboardData();
                               } else {
                                 const error = await response.json();
                                 alert(`Erreur: ${error.error}`);
                               }
                             } catch (error) {
                               console.error('Error rejecting proposal:', error);
                               alert('Erreur lors du refus de la proposition');
                             }
                           }}
                           className="flex gap-1 items-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                         >
                           <X className="w-4 h-4" />
                           Refuser
                         </button>
                         <button
                           onClick={async () => {
                             if (!confirm(`Accepter la proposition de ${proposal.carrierName} pour livrer cette commande ?`)) {
                               return;
                             }
                             
                             try {
                               const response = await fetch('/api/merchant-proposal-response', {
                                 method: 'POST',
                                 headers: {
                                   'Content-Type': 'application/json',
                                 },
                                 credentials: 'include',
                                 body: JSON.stringify({
                                   proposalId: proposal.id,
                                   orderId: proposal.orderId,
                                   action: 'accept'
                                 })
                               });

                               if (response.ok) {
                                 const result = await response.json();
                                 alert(`Proposition acceptée ! ${result.carrierName} va maintenant s'occuper de la livraison.`);
                                 // Refresh the data to remove the accepted proposal and update order status
                                 fetchDashboardData();
                               } else {
                                 const error = await response.json();
                                 alert(`Erreur: ${error.error}`);
                               }
                             } catch (error) {
                               console.error('Error accepting proposal:', error);
                               alert('Erreur lors de l\'acceptation de la proposition');
                             }
                           }}
                           className="flex gap-1 items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                         >
                           <CheckCircle className="w-4 h-4" />
                           Accepter
                         </button>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <User className="mx-auto mb-4 w-12 h-12 text-gray-400" />
                <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Aucune proposition</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Les propositions de livraison des transporteurs professionnels apparaîtront ici
                </p>
              </div>
            )}
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-6 analytics-section">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Analytics & Rapports</h3>
            
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Revenus mensuels</h4>
                  <select 
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="px-2 py-1 text-sm rounded border border-gray-300 dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="week">Cette semaine</option>
                    <option value="month">Ce mois</option>
                    <option value="year">Cette année</option>
                  </select>
                </div>
                <div className="flex justify-center items-center h-48 rounded border border-gray-200 dark:border-gray-700">
                  <div className="text-center">
                    <BarChart3 className="mx-auto mb-2 w-12 h-12 text-gray-400" />
                    <p className="text-gray-500 dark:text-gray-400">Graphique des revenus</p>
                    <p className="text-sm text-gray-400">À implémenter avec Chart.js</p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
                <h4 className="mb-4 font-medium text-gray-900 dark:text-white">Produits les plus vendus</h4>
                <div className="space-y-3">
                  {products.slice(0, 5).map((product, index) => (
                    <div key={product.id} className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="mr-3 text-sm font-medium text-gray-500">#{index + 1}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{product.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">€{product.price}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{Math.floor(Math.random() * 50)} ventes</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
              <button className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                Tout marquer comme lu
              </button>
            </div>

            {notifications.length > 0 ? (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`p-4 rounded-lg border transition-colors ${
                      !notification.isRead 
                        ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' 
                        : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex flex-1 gap-3 items-start">
                        {!notification.isRead && (
                          <div className="mt-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {notification.title}
                          </h4>
                          <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(notification.createdAt).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Clock className="mx-auto mb-4 w-12 h-12 text-gray-400" />
                <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Aucune notification</h3>
                <p className="text-gray-600 dark:text-gray-400">Vos notifications apparaîtront ici</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Head>
        <title>Tableau de Bord Marchand - ecodeli</title>
        <meta name="description" content="Gérez vos produits, commandes et expéditions" />
        <link rel="icon" href="/LOGO_.png" />
      </Head>

      {/* Header avec RoleBasedNavigation */}
      <RoleBasedNavigation isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

      {/* Header Section */}
      <div className="px-6 py-8 bg-sky-50 dark:bg-sky-900/20">
        <div className="mx-auto max-w-7xl">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Bienvenue, {user?.firstName || user?.name || 'Marchand'}!
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Gérez votre boutique et vos ventes
              </p>
              {lastFetchTime && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Dernière mise à jour: {new Date(lastFetchTime).toLocaleTimeString('fr-FR')}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={refreshData}
                disabled={isRefreshing || isLoading}
                className={`flex gap-2 items-center px-4 py-2 font-medium rounded-full transition ${
                  isRefreshing || isLoading
                    ? 'text-gray-500 bg-gray-300 cursor-not-allowed'
                    : 'text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300'
                }`}
                title="Actualiser les données"
              >
                <RefreshCw className={`w-4 h-4 ${(isRefreshing || isLoading) ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Actualisation...' : 'Actualiser'}
              </button>
              <button
                onClick={() => setShowAddProduct(true)}
                disabled={!hasSignedContract}
                className={`flex gap-2 items-center px-6 py-2 font-medium rounded-full transition ${
                  hasSignedContract 
                    ? 'text-white bg-sky-400 hover:bg-sky-500'
                    : 'text-gray-500 bg-gray-300 cursor-not-allowed'
                }`}
              >
                <Plus className="w-4 h-4" />
                Ajouter produit
              </button>
            </div>
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



        {/* Stats Cards - Toujours visibles */}
        <div className="grid gap-6 mb-8 md:grid-cols-4 overview-section">
          <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenus totaux</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  €{(analytics.totalRevenue && typeof analytics.totalRevenue === 'number') ? 
                    analytics.totalRevenue.toFixed(2) : '0.00'}
                </p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-green-100 rounded-full dark:bg-green-900">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Commandes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.totalOrders ?? 0}
                </p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-sky-100 rounded-full dark:bg-sky-900">
                <ShoppingCart className="w-6 h-6 text-sky-600 dark:text-sky-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Produits</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.totalProducts ?? 0}
                </p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-purple-100 rounded-full dark:bg-purple-900">
                <Package className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Expéditions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.totalShipments ?? 0}
                </p>
              </div>
              <div className="flex justify-center items-center w-12 h-12 bg-orange-100 rounded-full dark:bg-orange-900">
                <Truck className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 bg-white rounded-lg shadow-sm dark:bg-gray-800">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex px-6 -mb-px space-x-8">
              {[
                { id: 'overview', name: 'Aperçu', icon: BarChart3 },
                { id: 'products', name: 'Produits', icon: Package, blocked: !hasSignedContract },
                { id: 'orders', name: 'Commandes', icon: ShoppingCart, blocked: !hasSignedContract },
                { id: 'shipments', name: 'Expéditions', icon: Truck, blocked: !hasSignedContract },
                { id: 'proposals', name: 'Propositions', icon: User, badge: deliveryProposals.length, blocked: !hasSignedContract },
                { id: 'contracts', name: 'Contrats', icon: FileText, badge: userContract && !hasSignedContract ? 1 : 0 },
                { id: 'analytics', name: 'Analytics', icon: TrendingUp },
                { id: 'notifications', name: 'Notifications', icon: Clock, badge: notifications.filter(n => !n.isRead).length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  disabled={tab.blocked}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition ${
                    activeTab === tab.id
                      ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                      : tab.blocked
                      ? 'border-transparent text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.name}
                  {tab.blocked && <Shield className="w-3 h-3 text-red-500" />}
                  {tab.badge > 0 && (
                    <span className="inline-flex justify-center items-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>

      {/* Contract Signature Modal */}
      {showContractModal && userContract && (
        <ContractSignatureModal 
          contract={userContract}
          onClose={() => setShowContractModal(false)}
          onContractSigned={handleContractSigned}
        />
      )}

      {/* Add Product Modal */}
      {showAddProduct && hasSignedContract && (
        <AddProductModal 
          onClose={() => setShowAddProduct(false)}
          onProductCreated={fetchDashboardData}
        />
      )}

      {/* Edit Product Modal */}
      {showEditProduct && editingProduct && hasSignedContract && (
        <EditProductModal 
          product={editingProduct}
          onClose={() => {
            setShowEditProduct(false);
            setEditingProduct(null);
          }}
          onProductUpdated={fetchDashboardData}
        />
      )}

      {/* Modal d'évaluation du livreur */}
      {showRatingModal && selectedPackageForRating && (
        <div className="overflow-y-auto fixed inset-0 z-50 flex justify-center items-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full dark:bg-gray-800">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Évaluer le livreur
                </h3>
                <button
                  onClick={closeRatingModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Commande #{selectedPackageForRating.id}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Livraison vers {selectedPackageForRating.deliveryAddress}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Note (obligatoire)
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className={`w-8 h-8 ${
                          star <= rating ? 'text-yellow-400' : 'text-gray-300'
                        } hover:text-yellow-400 transition-colors`}
                      >
                        <Star className="w-full h-full" fill="currentColor" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Commentaire (optionnel)
                  </label>
                  <textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Partagez votre expérience avec ce livreur..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={closeRatingModal}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={submitRating}
                    disabled={rating === 0 || submittingRating}
                    className="flex-1 px-4 py-2 text-white bg-sky-600 rounded-lg hover:bg-sky-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {submittingRating ? 'Envoi...' : 'Envoyer l\'évaluation'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bouton tutoriel dans l'interface utilisateur */}
      <div className="fixed right-4 bottom-4 z-30">
        <button
          onClick={forceTutorial}
          className="flex gap-2 items-center px-4 py-2 text-white bg-blue-500 rounded-full shadow-lg transition-all transform hover:bg-blue-600 hover:scale-105"
          title="Relancer le tutoriel"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Guide
        </button>
      </div>

      {/* Composant TutorialOverlay */}
      <TutorialOverlay
        userRole={user?.role}
        onComplete={completeTutorial}
        isVisible={showTutorial}
      />
    </div>
  );
} 