// packages/frontend/src/main.tsx

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
  const { user, profile, profileIncomplete, refreshProfile, loading: authLoading } = useAuth();
  
  // THE FIX: This logic is now robust.
  // 1. We check if a profile exists and if the role is 'admin'.
  // 2. If it's an admin, userIdForQuery is `undefined` (fetch all).
  // 3. Otherwise, it's a regular user, so we MUST pass their `user.id`.
  const userIdForQuery = profile && profile.role === 'admin' ? undefined : user?.id;

  console.log('🔍 User authentication check:', {
    userId: user?.id,
    profileRole: profile?.role,
    isAdmin: profile?.role === 'admin',
    userIdForQuery: userIdForQuery,
    profileExists: !!profile
  });

  // THE SECOND FIX: We pass the user's ID as a dependency to the hook.
  // This tells React Query to re-run the query when the user logs in.
  const { requests, loading, error, refetch } = useRequestsQuery(userIdForQuery, user, { enabled: !authLoading && !!user });
  
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
      setShowProfileModal(true);
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
      {user && profileIncomplete && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-amber-800">
                  Welcome! To request a quote, please complete your profile first.
                </p>
              </div>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="bg-amber-50 px-3 py-2 rounded-md text-sm font-medium text-amber-800 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-amber-50 focus:ring-amber-600"
                >
                  Complete Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="relative pt-12 pb-20 text-white overflow-hidden">
        {/* Aurora Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/50 via-transparent to-purple-500/30"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-400/20 via-transparent to-transparent"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in-up">
            <h1 className="text-5xl font-bold leading-tight mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Professional Plumbing Services You Can Trust
            </h1>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              24/7 emergency service, licensed professionals, and guaranteed satisfaction. Serving your community for over 15 years.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <button
                className="group bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 hover:scale-105 hover:shadow-xl transition-all duration-300 text-lg shadow-lg"
                onClick={handleOpenQuoteModal}
              >
                <span className="group-hover:scale-105 transition-transform duration-300 inline-block">Request a Quote</span>
              </button>
              <a
                href="tel:555-123-4567"
                className="group border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 hover:scale-105 transition-all duration-300 text-lg flex items-center justify-center space-x-2 shadow-lg"
              >
                <Phone className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                <span>Call Now</span>
              </a>
            </div>
          </div>
          <div className="relative flex justify-center lg:justify-end animate-fade-in-up animation-delay-200">
            <div className="relative">
              <img
                src="/plumber.jpg"
                alt="Professional plumber at work"
                className="rounded-lg shadow-2xl w-full max-w-md object-cover hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute -bottom-8 left-8 bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 animate-bounce-in animation-delay-500">
                <div className="bg-green-100 p-3 rounded-full inline-flex items-center justify-center mb-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Licensed & Insured</div>
                  <div className="text-gray-600 text-sm">Fully certified professionals</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Custom CSS for animations */}
        <style>{`
          @keyframes fade-in-up {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes bounce-in {
            0% {
              opacity: 0;
              transform: scale(0.3);
            }
            50% {
              opacity: 1;
              transform: scale(1.05);
            }
            70% {
              transform: scale(0.9);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }
          .animate-fade-in-up {
            animation: fade-in-up 0.8s ease-out forwards;
          }
          .animation-delay-200 {
            animation-delay: 0.2s;
          }
          .animation-delay-500 {
            animation-delay: 0.5s;
          }
          .animate-bounce-in {
            animation: bounce-in 0.8s ease-out forwards;
          }
        `}</style>
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
                <UserMenu
                  onOpenProfile={() => setShowProfileModal(true)}
                  onNavigateToDashboard={() => {
                    console.log('🚀 Desktop UserMenu: Navigating to dashboard');
                    setRoute('#/dashboard');
                    console.log('✅ Desktop UserMenu: Route set to:', '#/dashboard');
                  }}
                />
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

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden fixed inset-0 z-30 bg-white flex flex-col items-center justify-center">
            <nav className="flex flex-col items-center space-y-6 text-xl">
              <a href="/#services" className="text-gray-700 hover:text-blue-600" onClick={() => setIsMenuOpen(false)}>Services</a>
              <a href="/#about" className="text-gray-700 hover:text-blue-600" onClick={() => setIsMenuOpen(false)}>About</a>
              <a href="/#testimonials" className="text-gray-700 hover:text-blue-600" onClick={() => setIsMenuOpen(false)}>Reviews</a>
              <a href="/#contact" className="text-gray-700 hover:text-blue-600" onClick={() => setIsMenuOpen(false)}>Contact</a>
              <a href="tel:555-123-4567" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center space-x-2" onClick={() => setIsMenuOpen(false)}>
                <Phone className="w-5 h-5" />
                <span>Call Now</span>
              </a>

              {/* Authentication Section */}
              <div className="pt-6 border-t border-gray-200 w-full flex flex-col items-center space-y-4">
                {user ? (
                  <div className="w-full max-w-xs">
                    <UserMenu
                      onOpenProfile={() => {
                        setShowProfileModal(true);
                        setIsMenuOpen(false);
                      }}
                      onNavigateToDashboard={() => {
                        console.log('🚀 UserMenu: Navigating to dashboard');
                        // Navigate to dashboard and close mobile menu
                        setRoute('#/dashboard');
                        setIsMenuOpen(false);
                        console.log('✅ UserMenu: Route set to:', '#/dashboard');
                      }}
                    />
                  </div>
                ) : (
                  <button
                    className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-700 flex items-center space-x-2 w-full max-w-xs justify-center"
                    onClick={() => {
                      setShowAuthModal(true);
                      setIsMenuOpen(false);
                    }}
                  >
                    <span>Sign In</span>
                  </button>
                )}
              </div>
            </nav>
          </div>
        )}

        <main className="pt-20 flex-grow">
          {(() => {
            console.log('🎯 Route check:', { route, isDashboard: route === '#/dashboard', userRole: profile?.role });
            return route === '#/dashboard' ? (
              // *** THE FIX: Dashboard now receives its data and functions as props. ***
              <Dashboard
                requests={requests}
                loading={loading}
                error={error}
                refreshRequests={refetch}
              />
            ) : renderHomePage();
          })()}
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

      {user && showProfileModal && (
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