import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Loading from '../dashboard/loading';
import { Mail, MessageSquare } from 'lucide-react';

// Use dynamic import instead of direct import
const EmailSmsContent = dynamic(() => import('./EmailSmsContent'), {
  loading: () => <Loading />
});

export const metadata = {
  title: 'Email & SMS Management - Admin Dashboard',
  description: 'Manage email and SMS notifications',
};

export default function EmailSmsPage() {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <div className="flex items-center space-x-2">
              <Mail className="w-6 h-6 text-blue-600" />
              <MessageSquare className="w-6 h-6 text-cyan-600" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion Email & SMS</h1>
            <p className="mt-1 text-gray-600">Envoi groupé et gestion des notifications</p>
          </div>
        </div>
      </div>
      
      <EmailSmsContent />
    </div>
  );
} 