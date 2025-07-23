import { CheckCircle, AlertCircle, X } from 'lucide-react'

export default function MessageFeedback({ message, setMessage }) {
  if (!message.text) return null

  return (
    <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
      message.type === 'success' 
        ? 'bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300'
        : 'bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
    }`}>
      {message.type === 'success' ? (
        <CheckCircle className="w-5 h-5 flex-shrink-0" />
      ) : (
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
      )}
      <span className="flex-1">{message.text}</span>
      <button 
        onClick={() => setMessage({ type: '', text: '' })}
        className="text-current hover:opacity-70 transition-opacity"
        aria-label="Fermer le message"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
} 