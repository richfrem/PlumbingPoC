// vite-app/src/main.tsx

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import AuthModal from './features/auth/components/AuthModal';
import QuoteAgentModal from './features/requests/components/QuoteAgentModal';
import ServicesSection from './features/landing/components/ServicesSection';
import ReviewsSection from './features/landing/components/ReviewsSection';
import AboutSection from './features/landing/components/AboutSection';
import ContactSection from './features/landing/components/ContactSection';
import UserMenu from './features/auth/components/UserMenu';
import ProfileModal from './features/profile/components/ProfileModal';
import Dashboard from './features/requests/components/Dashboard';
import MyRequests from './features/requests/components/MyRequests';
import { QuoteRequest } from './features/requests/types';
import { useRequestsQuery } from './features/requests/hooks/useRequestsQuery'; // Import the new hook
import {
  Phone,
  Wrench,
  CheckCircle,
  Menu,
  X
} from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, profile, profileIncomplete, refreshProfile } = useAuth();
  
  // *** THE FIX: Data fetching is "lifted up" to this central component. ***
  const { requests, loading, error, refetch } = useRequestsQuery(profile?.role === 'admin' ? undefined : user?.id);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [route, setRoute] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleOpenQuoteModal = () => {
    if (!user) {
      setShowAuthModal(true);
    } else if (profileIncomplete) {
      // Profile modal is shown automatically
    } else {
      setShowAgentModal(true);
    }
  };

  // *** THE FIX: This callback now has access to the central refresh function. ***
  const handleNewRequestSuccess = () => {
    console.log("New request submitted. Triggering a manual refresh.");
    refetch();
  };

  const renderHomePage = () => (
    <>
      <section className="pt-12 pb-20 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl font-bold leading-tight mb-6">Professional Plumbing Services You Can Trust</h1>
            <p className="text-xl text-blue-100 mb-8">24/7 emergency service, licensed professionals, and guaranteed satisfaction. Serving your community for over 15 years.</p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <button
                className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-lg shadow"
                onClick={handleOpenQuoteModal}
              >
                <span>Request a Quote</span>
              </button>
              <a href="tel:555-123-4567" className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors text-lg flex items-center justify-center space-x-2 shadow">
                <Phone className="w-5 h-5" />
                <span>Call Now</span>
              </a>
            </div>
          </div>
          <div className="relative flex justify-center lg:justify-end">
            <img src="/plumber.jpg" alt="Professional plumber at work" className="rounded-lg shadow-2xl w-full max-w-md object-cover" />
            <div className="absolute -bottom-8 left-8 bg-white p-6 rounded-xl shadow-lg flex items-center space-x-4">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Licensed & Insured</div>
                <div className="text-gray-600">Fully certified professionals</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {user && !profileIncomplete && profile?.role !== 'admin' && (
        // *** THE FIX: MyRequests now receives its data and functions as props. ***
        <MyRequests
          requests={requests}
          loading={loading}
          error={error}
          refreshRequests={refetch}
        />
      )}
      
      <ServicesSection />
      <AboutSection />
      <ReviewsSection />
      <ContactSection />
    </>
  );

  return (
    <React.Fragment>
      <div className="min-h-screen flex flex-col bg-gray-100">
        <header className="fixed top-0 left-0 w-full bg-white shadow z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
            <a href="/#" className="flex items-center space-x-4">
              <Wrench className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">AquaFlow Plumbing</span>
            </a>
            <nav className="hidden md:flex items-center space-x-6">
              <a href="/#services" className="text-gray-700 hover:text-blue-600 transition-colors">Services</a>
              <a href="/#about" className="text-gray-700 hover:text-blue-600 transition-colors">About</a>
              <a href="/#testimonials" className="text-gray-700 hover:text-blue-600 transition-colors">Reviews</a>
              <a href="/#contact" className="text-gray-700 hover:text-blue-600 transition-colors">Contact</a>
              <a href="tel:555-123-4567" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>Call Now</span>
              </a>
              {user ? (
                <UserMenu onOpenProfile={() => setShowProfileModal(true)} />
              ) : (
                <button
                  className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2 ml-2"
                  onClick={() => setShowAuthModal(true)}
                >
                  <span>Sign In</span>
                </button>
              )}
            </nav>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-700"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </header>
        
        <main className="pt-20 flex-grow">
          {route === '#/dashboard' ? (
            // *** THE FIX: Dashboard now receives its data and functions as props. ***
            <Dashboard
              requests={requests}
              loading={loading}
              error={error}
              refreshRequests={refetch}
            />
          ) : renderHomePage()}
        </main>

        {user && !profileIncomplete && (
          <QuoteAgentModal
            isOpen={showAgentModal}
            onClose={() => setShowAgentModal(false)}
            onSubmissionSuccess={handleNewRequestSuccess}
          />
        )}
        
        <footer className="bg-black text-white py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Wrench className="w-6 h-6 text-blue-400" />
              <span className="text-xl font-bold">AquaFlow Plumbing</span>
            </div>
            <div className="text-gray-400 text-center md:text-right">
              <p>&copy; 2025 AquaFlow Plumbing. All rights reserved.</p>
              <p className="text-sm">Licensed • Insured • Trusted</p>
            </div>
          </div>
        </footer>
        
        {route !== '#/dashboard' && (
            <a
                href="tel:555-123-4567"
                className="fixed bottom-6 right-6 z-50 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors inline-flex items-center space-x-2 shadow-lg"
            >
                <Phone className="w-5 h-5" />
                <span>Emergency Line</span>
            </a>
        )}
      </div>

      {!user && <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />}
      
      {user && profileIncomplete && (
        <ProfileModal
          onComplete={refreshProfile}
        />
      )}

      {user && !profileIncomplete && showProfileModal && (
        <ProfileModal
          isClosable={true}
          onClose={() => setShowProfileModal(false)}
          onComplete={() => {
            refreshProfile();
            setShowProfileModal(false);
          }}
        />
      )}
    </React.Fragment>
  );
};

const queryClient = new QueryClient();

const App: React.FC = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </QueryClientProvider>
    )
}

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(<App />);
}