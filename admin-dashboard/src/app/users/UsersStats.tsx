'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Clock, CheckCircle, AlertCircle, Users } from 'lucide-react';

interface UserStats {
  total: number;
  pending: number;
  completed: number;
  problems: number;
}

export default function UsersStats() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/users');
        
        if (!response.ok) {
          throw new Error('Failed to fetch user stats');
        }
        
        const users = await response.json();
        
        // Calculate stats from the users data
        const userStats = {
          total: users?.length || 0,
          pending: users?.filter((user: any) => user.isVerified === false).length || 0,
          completed: users?.filter((user: any) => user.isVerified === true).length || 0,
          problems: users?.filter((user: any) => user.isVerified === false).length || 0,
        };
        
        setStats(userStats);
      } catch (err) {
        console.error('Error fetching user stats:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        // Fallback to mock data in case of error
        setStats({
          total: 1247,
          pending: 23,
          completed: 1089,
          problems: 8
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-6 bg-white rounded-xl border shadow-sm animate-pulse">
            <div className="flex justify-between items-center">
              <div>
                <div className="mb-2 w-20 h-4 bg-gray-200 rounded"></div>
                <div className="w-16 h-8 bg-gray-200 rounded"></div>
              </div>
              <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="flex items-center mt-4">
              <div className="w-24 h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 bg-red-50 rounded-xl border border-red-200">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-800">Erreur lors du chargement des statistiques</p>
        </div>
      </div>
    );
  }

  const completionRate = stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : '0';

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
      <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Utilisateurs</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <div className="flex items-center mt-4 text-sm">
          <TrendingUp className="mr-1 w-4 h-4 text-green-500" />
          <span className="font-medium text-green-600">+12%</span>
          <span className="ml-1 text-gray-500">ce mois</span>
        </div>
      </div>

      <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-gray-600">En Attente</p>
            <p className="mt-1 text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg">
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
        </div>
        <div className="flex items-center mt-4 text-sm">
          <span className="text-gray-500">Nécessitent une attention</span>
        </div>
      </div>

      <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-gray-600">Livrés</p>
            <p className="mt-1 text-2xl font-bold text-green-600">{stats.completed}</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
        </div>
        <div className="flex items-center mt-4 text-sm">
          <span className="font-medium text-green-600">{completionRate}%</span>
          <span className="ml-1 text-gray-500">taux de réussite</span>
        </div>
      </div>

      <div className="p-6 bg-white rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-gray-600">Problèmes</p>
            <p className="mt-1 text-2xl font-bold text-red-600">{stats.problems}</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
        </div>
        <div className="flex items-center mt-4 text-sm">
          <span className="font-medium text-red-600">-2</span>
          <span className="ml-1 text-gray-500">vs mois dernier</span>
        </div>
      </div>
    </div>
  );
} 