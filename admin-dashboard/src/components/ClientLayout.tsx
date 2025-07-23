'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import AuthGuard from '@/components/AuthGuard'
import AdminHeader from '@/components/AdminHeader'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Don't apply AuthGuard to auth pages
  const isAuthPage = pathname?.startsWith('/auth')
  
  if (isAuthPage) {
    return <>{children}</>
  }
  
  return (
    <AuthGuard>
      <div className="flex h-screen bg-white">
        {/* Sidebar */}
        <div className="overflow-y-auto w-64 text-white bg-sky-700">
          <div className="p-4 mt-6 text-xl font-bold text-center">ecodeli Admin</div>
          <nav className="mt-6 space-y-1">
            {/* Core Management */}
            <div className="px-6 py-2 text-xs font-semibold tracking-wider text-sky-200 uppercase">
              Core Management
            </div>
            <Link href="/" className="block py-2.5 px-6 hover:bg-sky-500 rounded-md transition-all duration-300 ease-in-out hover:text-white">Dashboard</Link>
            <Link href="/users" className="block py-2.5 px-6 hover:bg-sky-500 rounded-md transition-all duration-300 ease-in-out hover:text-white">Users</Link>
            <Link href="/packages" className="block py-2.5 px-6 hover:bg-sky-500 rounded-md transition-all duration-300 ease-in-out hover:text-white">Packages</Link>
            <Link href="/rides" className="block py-2.5 px-6 hover:bg-sky-500 rounded-md transition-all duration-300 ease-in-out hover:text-white">Rides</Link>
            <Link href="/matches" className="block py-2.5 px-6 hover:bg-sky-500 rounded-md transition-all duration-300 ease-in-out hover:text-white">Matches</Link>
            
            {/* Business Features */}
            <div className="px-6 py-2 mt-4 text-xs font-semibold tracking-wider text-sky-200 uppercase">
              Business Features
            </div>
            <Link href="/services" className="block py-2.5 px-6 hover:bg-sky-500 rounded-md transition-all duration-300 ease-in-out hover:text-white">Services</Link>
            <Link href="/bookings" className="block py-2.5 px-6 hover:bg-sky-500 rounded-md transition-all duration-300 ease-in-out hover:text-white">Bookings</Link>
            <Link href="/contracts" className="block py-2.5 px-6 hover:bg-sky-500 rounded-md transition-all duration-300 ease-in-out hover:text-white">Contracts</Link>
            <Link href="/storage-boxes" className="block py-2.5 px-6 hover:bg-sky-500 rounded-md transition-all duration-300 ease-in-out hover:text-white">Storage Boxes</Link>
            <Link href="/box-rentals" className="block py-2.5 px-6 hover:bg-sky-500 rounded-md transition-all duration-300 ease-in-out hover:text-white">Box Rentals</Link>
            <Link href="/merchants" className="block py-2.5 px-6 hover:bg-sky-500 rounded-md transition-all duration-300 ease-in-out hover:text-white">Merchants</Link>
            
            {/* Financial */}
            <div className="px-6 py-2 mt-4 text-xs font-semibold tracking-wider text-sky-200 uppercase">
              Financial
            </div>
            <Link href="/payments" className="block py-2.5 px-6 hover:bg-sky-500 rounded-md transition-all duration-300 ease-in-out hover:text-white">Payments</Link>
            <Link href="/subscriptions" className="block py-2.5 px-6 hover:bg-sky-500 rounded-md transition-all duration-300 ease-in-out hover:text-white">Abonnements</Link>
            <Link href="/documents" className="block py-2.5 px-6 hover:bg-sky-500 rounded-md transition-all duration-300 ease-in-out hover:text-white">Documents</Link>
            <Link href="/analytics" className="block py-2.5 px-6 hover:bg-sky-500 rounded-md transition-all duration-300 ease-in-out hover:text-white">Analytics</Link>
            
            {/* Communication */}
            <div className="px-6 py-2 mt-4 text-xs font-semibold tracking-wider text-sky-200 uppercase">
              Communication
            </div>
            <Link href="/messages" className="block py-2.5 px-6 hover:bg-sky-500 rounded-md transition-all duration-300 ease-in-out hover:text-white">Messages</Link>
            <Link href="/notifications" className="block py-2.5 px-6 hover:bg-sky-500 rounded-md transition-all duration-300 ease-in-out hover:text-white">Push Notifications</Link>
            <Link href="/email-sms" className="block py-2.5 px-6 hover:bg-sky-500 rounded-md transition-all duration-300 ease-in-out hover:text-white">Email & SMS</Link>
            <Link href="/notification-test" className="block py-2.5 px-6 hover:bg-sky-500 rounded-md transition-all duration-300 ease-in-out hover:text-white">Notification Tests</Link>
            
            {/* Carrier Management */}
            <div className="px-6 py-2 mt-4 text-xs font-semibold tracking-wider text-sky-200 uppercase">
              Carrier Management
            </div>
            <Link href="/carriers" className="block py-2.5 px-6 hover:bg-sky-500 rounded-md transition-all duration-300 ease-in-out hover:text-white">Carriers Dashboard</Link>
            <Link href="/delivery-tracking" className="block py-2.5 px-6 hover:bg-sky-500 rounded-md transition-all duration-300 ease-in-out hover:text-white">Delivery Tracking</Link>
            <Link href="/route-optimization" className="block py-2.5 px-6 hover:bg-sky-500 rounded-md transition-all duration-300 ease-in-out hover:text-white">Route Optimization</Link>
            
            {/* System */}
            <div className="px-6 py-2 mt-4 text-xs font-semibold tracking-wider text-sky-200 uppercase">
              System
            </div>
            <Link href="/settings" className="block py-2.5 px-6 hover:bg-sky-500 rounded-md transition-all duration-300 ease-in-out hover:text-white">Settings</Link>
            <Link href="/logs" className="block py-2.5 px-6 hover:bg-sky-500 rounded-md transition-all duration-300 ease-in-out hover:text-white">System Logs</Link>
          </nav>
        </div>
        
        {/* Main Content */}
        <div className="flex overflow-hidden flex-col flex-1">
          <AdminHeader />
          <main className="overflow-y-auto relative flex-1 focus:outline-none">
            <div className="py-6">
              <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
} 