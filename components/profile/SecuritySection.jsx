import { Lock, Edit, Save, XCircle, Loader2 } from 'lucide-react'

export default function SecuritySection({ 
  isEditing, 
  setIsEditing, 
  passwordData, 
  setPasswordData, 
  errors, 
  handleSave, 
  handleCancel,
  isLoading 
}) {
  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="overflow-hidden bg-white rounded-lg shadow dark:bg-gray-800">
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-3 items-center">
          <Lock className="w-5 h-5 text-gray-500" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Sécurité</h2>
        </div>
        {!isEditing.password && (
          <button
            onClick={() => setIsEditing(prev => ({ ...prev, password: true }))}
            className="flex gap-2 items-center px-3 py-2 text-sm text-blue-600 rounded-md transition-colors hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
          >
            <Edit className="w-4 h-4" />
            Changer le mot de passe
          </button>
        )}
      </div>
      
      <div className="px-6 py-6">
        {isEditing.password ? (
          <div className="space-y-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Mot de passe actuel *
              </label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.currentPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Votre mot de passe actuel"
              />
              {errors.currentPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
              )}
            </div>
            
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Nouveau mot de passe *
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.newPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Votre nouveau mot de passe"
              />
              {errors.newPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Le mot de passe doit contenir au moins 6 caractères
              </p>
            </div>
            
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirmer le nouveau mot de passe *
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Confirmez votre nouveau mot de passe"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>
            
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => handleSave('password')}
                disabled={isLoading}
                className="flex gap-2 items-center px-4 py-2 text-white bg-blue-600 rounded-md transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Changer le mot de passe
              </button>
              <button
                onClick={() => handleCancel('password')}
                disabled={isLoading}
                className="flex gap-2 items-center px-4 py-2 text-gray-700 rounded-md border border-gray-300 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <XCircle className="w-4 h-4" />
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-gray-600 dark:text-gray-400">
              Votre mot de passe a été défini. Cliquez sur "Changer le mot de passe" pour le modifier.
            </p>
            <div className="p-3 mt-4 bg-blue-50 rounded-md dark:bg-blue-900/20">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Conseil de sécurité :</strong> Utilisez un mot de passe fort avec au moins 8 caractères, incluant des lettres majuscules, minuscules, des chiffres et des caractères spéciaux.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 