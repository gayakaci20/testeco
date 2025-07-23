'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  Store, 
  Package, 
  User, 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  Search, 
  Filter,
  TrendingUp,
  DollarSign,
  Activity,
  AlertCircle,
  RefreshCw
} from 'lucide-react'

interface Merchant {
  id: string
  email: string
  firstName: string
  lastName: string
  companyName: string
  phoneNumber: string
  address: string
  isVerified: boolean
  createdAt: string
  _count: {
    products: number
  }
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  stock: number
  imageUrl: string
  weight: number
  dimensions: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  merchant: {
    firstName: string
    lastName: string
    companyName: string
  }
}

export default function MerchantsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [selectedMerchant, setSelectedMerchant] = useState<string | null>(null)
  const [merchantProducts, setMerchantProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [productsLoading, setProductsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated') {
      fetchMerchants()
    }
  }, [status, router])

  const fetchMerchants = async () => {
    try {
      setLoading(true)
      console.log('Merchants page: Fetching merchants...')
      console.log('Merchants page: Session status:', status)
      console.log('Merchants page: Session data:', session)
      
      const response = await fetch('/api/merchants', {
        credentials: 'include' // Ensure cookies are sent
      })
      
      console.log('Merchants page: Response status:', response.status)
      console.log('Merchants page: Response headers:', Object.fromEntries(response.headers.entries()))
      
      if (response.ok) {
        const data = await response.json()
        console.log('Merchants page: Success, found', data.merchants?.length || 0, 'merchants')
        setMerchants(data.merchants || [])
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Failed to fetch merchants:', response.statusText, errorData)
      }
    } catch (error) {
      console.error('Error fetching merchants:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMerchantProducts = async (merchantId: string) => {
    try {
      setProductsLoading(true)
      const response = await fetch(`/api/merchants/products?merchantId=${merchantId}`)
      
      if (response.ok) {
        const data = await response.json()
        setMerchantProducts(data)
      } else {
        console.error('Failed to fetch products:', response.statusText)
        setMerchantProducts([])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      setMerchantProducts([])
    } finally {
      setProductsLoading(false)
    }
  }

  const handleMerchantSelect = (merchantId: string) => {
    setSelectedMerchant(merchantId)
    fetchMerchantProducts(merchantId)
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      return
    }

    try {
      const response = await fetch(`/api/merchants/products/${productId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Refresh products for current merchant
        if (selectedMerchant) {
          fetchMerchantProducts(selectedMerchant)
        }
        alert('Produit supprimé avec succès')
      } else {
        alert('Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const filteredMerchants = merchants.filter(merchant => {
    const searchText = searchTerm.toLowerCase()
    return (
      merchant.firstName?.toLowerCase().includes(searchText) ||
      merchant.lastName?.toLowerCase().includes(searchText) ||
      merchant.companyName?.toLowerCase().includes(searchText) ||
      merchant.email?.toLowerCase().includes(searchText)
    )
  })

  const filteredProducts = merchantProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === '' || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categories = [...new Set(merchantProducts.map(p => p.category))]
  const totalProducts = merchantProducts.length
  const activeProducts = merchantProducts.filter(p => p.isActive).length
  const totalValue = merchantProducts.reduce((sum, p) => sum + (p.price * p.stock), 0)

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full border-4 border-blue-400 animate-spin border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Chargement des marchands...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Marchands</h1>
            <p className="text-gray-600 mt-2">Consultez et gérez les marchands et leurs produits</p>
          </div>
          <button
            onClick={fetchMerchants}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Marchands</p>
              <p className="text-2xl font-bold text-gray-900">{merchants.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Store className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Marchands vérifiés</p>
              <p className="text-2xl font-bold text-gray-900">
                {merchants.filter(m => m.isVerified).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Produits</p>
              <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Valeur totale</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalValue)}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Merchants List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Liste des Marchands</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher un marchand..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {filteredMerchants.length > 0 ? (
                filteredMerchants.map((merchant) => (
                  <div
                    key={merchant.id}
                    onClick={() => handleMerchantSelect(merchant.id)}
                    className={`p-4 border-b cursor-pointer transition-colors ${
                      selectedMerchant === merchant.id
                        ? 'bg-blue-50 border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {merchant.companyName || `${merchant.firstName} ${merchant.lastName}`}
                        </h3>
                        <p className="text-sm text-gray-600">{merchant.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {merchant._count.products} produit(s)
                          </span>
                          {merchant.isVerified && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              Vérifié
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Store className="w-4 h-4 text-blue-600" />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  Aucun marchand trouvé
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Products List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedMerchant ? 'Produits du marchand' : 'Sélectionnez un marchand'}
                </h2>
                {selectedMerchant && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {activeProducts} actif(s) / {totalProducts} total
                    </span>
                  </div>
                )}
              </div>
              
              {selectedMerchant && (
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Rechercher un produit..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Toutes les catégories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            <div className="p-6">
              {!selectedMerchant ? (
                <div className="text-center py-12">
                  <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Sélectionnez un marchand pour voir ses produits</p>
                </div>
              ) : productsLoading ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-8 h-8 rounded-full border-4 border-blue-400 animate-spin border-t-transparent"></div>
                  <p className="mt-4 text-gray-600">Chargement des produits...</p>
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{product.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{product.category}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-1 text-red-400 hover:text-red-600 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-lg font-bold text-green-600">{formatCurrency(product.price)}</p>
                        <p className="text-sm text-gray-600">Stock: {product.stock}</p>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          product.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.isActive ? 'Actif' : 'Inactif'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(product.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Aucun produit trouvé</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 