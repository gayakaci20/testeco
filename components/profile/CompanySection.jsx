import { Building, Edit, Save, XCircle, Globe, Loader2 } from 'lucide-react'

export default function CompanySection({ 
  user,
  isEditing, 
  setIsEditing, 
  formData, 
  setFormData, 
  errors, 
  handleSave, 
  handleCancel,
  isLoading 
}) {
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Afficher seulement pour les merchants et providers
  if (!['MERCHANT', 'SERVICE_PROVIDER', 'PROVIDER'].includes(user.userType)) {
    return null
  }

  return (
    <div className="overflow-hidden bg-white rounded-lg shadow dark:bg-gray-800">
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <Building className="w-5 h-5 text-gray-500" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Informations d'entreprise</h2>
        </div>
        {!isEditing.company && (
          <button
            onClick={() => setIsEditing(prev => ({ ...prev, company: true }))}
            className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
          >
            <Edit className="w-4 h-4" />
            Modifier
          </button>
        )}
      </div>
      
      <div className="px-6 py-6">
        {isEditing.company ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nom de l'entreprise
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Nom de votre entreprise"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Adresse de l'entreprise
              </label>
              <textarea
                value={formData.companyAddress}
                onChange={(e) => handleInputChange('companyAddress', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Adresse complète de l'entreprise"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Globe className="w-4 h-4 inline mr-2" />
                Site web
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="https://votre-site.com"
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => handleSave('company')}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Sauvegarder
              </button>
              <button
                onClick={() => handleCancel('company')}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <XCircle className="w-4 h-4" />
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <dl className="grid grid-cols-1 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Nom de l'entreprise</dt>
              <dd className="mt-1 text-gray-900 dark:text-white">{user.companyName || 'Non renseigné'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Adresse de l'entreprise</dt>
              <dd className="mt-1 text-gray-900 dark:text-white">{user.companyAddress || 'Non renseignée'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Site web</dt>
              <dd className="mt-1 text-gray-900 dark:text-white">
                {user.website ? (
                  <a 
                    href={user.website} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
                  >
                    {user.website}
                  </a>
                ) : (
                  'Non renseigné'
                )}
              </dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  )
} 