import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Star, 
  Send, 
  ThumbsUp, 
  MessageCircle, 
  Calendar,
  User,
  Shield,
  Award,
  TrendingUp,
  Filter,
  Search,
  MoreVertical,
  Flag,
  Edit,
  Trash2,
  CheckCircle
} from 'lucide-react';

const ReviewSystem = ({ targetId, targetType, showAddReview = true }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    comment: '',
    category: 'general'
  });
  const [submitting, setSubmitting] = useState(false);
  const [filterRating, setFilterRating] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, [targetId, targetType, filterRating, sortBy]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        targetId,
        targetType,
        ...(filterRating !== 'all' && { rating: filterRating }),
        sortBy,
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/reviews?${params}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/reviews/stats?targetId=${targetId}&targetType=${targetType}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching review stats:', error);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSubmitting(true);
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({
          ...newReview,
          targetId,
          targetType
        })
      });

      if (response.ok) {
        setNewReview({
          rating: 5,
          title: '',
          comment: '',
          category: 'general'
        });
        setShowAddForm(false);
        fetchReviews();
        fetchStats();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeReview = async (reviewId) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/reviews/${reviewId}/like`, {
        method: 'POST',
        headers: {
          'x-user-id': user.id
        }
      });

      if (response.ok) {
        fetchReviews();
      }
    } catch (error) {
      console.error('Error liking review:', error);
    }
  };

  const renderStarRating = (rating, interactive = false, size = 'w-5 h-5') => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${
              star <= rating 
                ? 'text-yellow-400 fill-current' 
                : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
            onClick={interactive ? () => setNewReview(prev => ({ ...prev, rating: star })) : undefined}
          />
        ))}
      </div>
    );
  };

  const renderStatsBar = () => {
    const { averageRating = 0, totalReviews = 0, ratingDistribution = {} } = stats;
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Overall Rating */}
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {averageRating.toFixed(1)}
            </div>
            {renderStarRating(Math.round(averageRating))}
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {totalReviews} évaluation{totalReviews > 1 ? 's' : ''}
            </p>
          </div>

          {/* Rating Distribution */}
          <div className="md:col-span-2">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Répartition des notes
            </h4>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = ratingDistribution[rating] || 0;
                const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                
                return (
                  <div key={rating} className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-8">
                      {rating}
                    </span>
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400 w-8">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFilters = () => {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher dans les avis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Filter by Rating */}
          <select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">Toutes les notes</option>
            <option value="5">5 étoiles</option>
            <option value="4">4 étoiles</option>
            <option value="3">3 étoiles</option>
            <option value="2">2 étoiles</option>
            <option value="1">1 étoile</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="recent">Plus récents</option>
            <option value="helpful">Plus utiles</option>
            <option value="rating_high">Note élevée</option>
            <option value="rating_low">Note faible</option>
          </select>
        </div>
      </div>
    );
  };

  const renderReviewCard = (review) => {
    const isOwnReview = user && review.userId === user.id;
    
    return (
      <div key={review.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-blue-500 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {review.user?.firstName || 'Utilisateur'}
                </h4>
                {review.user?.isVerified && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
              </div>
              <div className="flex items-center space-x-2 mt-1">
                {renderStarRating(review.rating, false, 'w-4 h-4')}
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          </div>
          
          <div className="relative">
            {isOwnReview && (
              <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <MoreVertical className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {review.title && (
          <h5 className="font-medium text-gray-900 dark:text-white mb-2">
            {review.title}
          </h5>
        )}

        <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
          {review.comment}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleLikeReview(review.id)}
              className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-sky-500 dark:hover:text-sky-400 transition-colors"
            >
              <ThumbsUp className="w-4 h-4" />
              <span className="text-sm">{review.likes || 0}</span>
            </button>
            
            <button className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-sky-500 dark:hover:text-sky-400 transition-colors">
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm">Répondre</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {review.category && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full">
                {review.category}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderAddReviewForm = () => {
    if (!showAddForm) return null;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Ajouter un avis
        </h3>
        
        <form onSubmit={handleSubmitReview} className="space-y-4">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Note générale
            </label>
            {renderStarRating(newReview.rating, true, 'w-8 h-8')}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Titre (optionnel)
            </label>
            <input
              type="text"
              value={newReview.title}
              onChange={(e) => setNewReview(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Résumez votre expérience..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Votre avis
            </label>
            <textarea
              value={newReview.comment}
              onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
              placeholder="Décrivez votre expérience en détail..."
              required
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Catégorie
            </label>
            <select
              value={newReview.category}
              onChange={(e) => setNewReview(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="general">Général</option>
              <option value="service">Service</option>
              <option value="delivery">Livraison</option>
              <option value="quality">Qualité</option>
              <option value="price">Prix</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting || !newReview.comment.trim()}
              className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Envoi...' : 'Publier l\'avis'}</span>
            </button>
          </div>
        </form>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 animate-pulse">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
              </div>
            </div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Système d'évaluations
      </h3>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <p className="text-gray-600 dark:text-gray-400">
          Composant système de reviews en développement...
        </p>
      </div>

      {/* Stats */}
      {renderStatsBar()}

      {/* Filters */}
      {renderFilters()}

      {/* Add Review Button */}
      {showAddReview && user && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 flex items-center space-x-2"
          >
            <Star className="w-4 h-4" />
            <span>Ajouter un avis</span>
          </button>
        </div>
      )}

      {/* Add Review Form */}
      {renderAddReviewForm()}

      {/* Reviews List */}
      <div>
        {reviews.map(renderReviewCard)}
        
        {reviews.length === 0 && (
          <div className="text-center py-12">
            <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Aucun avis pour le moment
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Soyez le premier à laisser un avis !
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewSystem; 