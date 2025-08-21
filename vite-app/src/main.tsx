import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import AuthModal from './components/AuthModal.tsx';
import UserMenu from './components/UserMenu.tsx';
import ProfileModal from './components/ProfileModal.tsx';
import {
  Phone,
  Mail,
  MapPin,
  Wrench,
  Droplets,
  Zap,
  Home,
  Shield,
  Clock,
  Star,
  CheckCircle,
  Menu,
  X
} from 'lucide-react';

const App: React.FC = () => {
  const { user, profileIncomplete, refreshProfile } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);
  // Guided quoting agent state
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    isEmergency: undefined,
    customerName: '',
    serviceAddress: '',
    contactInfo: '',
    problemCategory: '',
    problemDetails: { location: '', description: '' },
    propertyType: '',
    isHomeowner: undefined,
    preferredTiming: '',
    additionalNotes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  // Step questions
  const steps = [
    {
      label: 'Is this an emergency?',
      content: (
        <div className="space-y-4">
          <button
            className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold w-full"
            onClick={() => {
              setForm(f => ({ ...f, isEmergency: true }));
              setStep(s => s + 1);
            }}
          >
            Yes, water is leaking or flooding
          </button>
          <a
            href="tel:555-123-4567"
            className="block bg-red-100 text-red-700 px-6 py-3 rounded-lg font-semibold w-full text-center hover:bg-red-200 transition-colors"
            style={{ marginTop: '0.5rem' }}
          >
            <span>Call Emergency Line: (555) 123-4567</span>
          </a>
          <button
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold w-full"
            onClick={() => {
              setForm(f => ({ ...f, isEmergency: false }));
              setStep(s => s + 1);
            }}
          >
            No, it's not urgent
          </button>
        </div>
      )
    },
    {
      label: 'Your Name',
      content: (
        <input type="text" className="border px-4 py-2 rounded w-full" placeholder="Full Name" value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} onBlur={() => setStep(s => s + 1)} autoFocus />
      )
    },
    {
      label: 'Service Address',
      content: (
        <input type="text" className="border px-4 py-2 rounded w-full" placeholder="Address" value={form.serviceAddress} onChange={e => setForm(f => ({ ...f, serviceAddress: e.target.value }))} onBlur={() => setStep(s => s + 1)} />
      )
    },
    {
      label: 'Contact Info (phone or email)',
      content: (
        <input type="text" className="border px-4 py-2 rounded w-full" placeholder="Phone or Email" value={form.contactInfo} onChange={e => setForm(f => ({ ...f, contactInfo: e.target.value }))} onBlur={() => setStep(s => s + 1)} />
      )
    },
    {
      label: 'What type of problem?',
      content: (
        <div className="space-y-2">
          {['Leak', 'Clog', 'Installation', 'Repair', 'Inspection'].map(cat => (
            <button key={cat} className="bg-blue-100 text-blue-700 px-4 py-2 rounded w-full font-semibold" onClick={() => { setForm(f => ({ ...f, problemCategory: cat })); setStep(s => s + 1); }}>{cat}</button>
          ))}
        </div>
      )
    },
    {
      label: 'Describe the problem',
      content: (
        <>
          <input type="text" className="border px-4 py-2 rounded w-full mb-2" placeholder="Location (e.g. under sink, toilet, wall)" value={form.problemDetails.location} onChange={e => setForm(f => ({ ...f, problemDetails: { ...f.problemDetails, location: e.target.value } }))} />
          <textarea className="border px-4 py-2 rounded w-full" placeholder="Describe the issue" value={form.problemDetails.description} onChange={e => setForm(f => ({ ...f, problemDetails: { ...f.problemDetails, description: e.target.value } }))} />
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold mt-2" onClick={() => setStep(s => s + 1)}>Next</button>
        </>
      )
    },
    {
      label: 'Property Type',
      content: (
        <div className="space-y-2">
          {['House', 'Apartment/Condo', 'Other'].map(type => (
            <button key={type} className="bg-blue-100 text-blue-700 px-4 py-2 rounded w-full font-semibold" onClick={() => { setForm(f => ({ ...f, propertyType: type })); setStep(s => s + 1); }}>{type}</button>
          ))}
        </div>
      )
    },
    {
      label: 'Are you the homeowner?',
      content: (
        <div className="space-y-2">
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold w-full" onClick={() => { setForm(f => ({ ...f, isHomeowner: true })); setStep(s => s + 1); }}>Yes</button>
          <button className="bg-blue-100 text-blue-700 px-6 py-3 rounded-lg font-semibold w-full" onClick={() => { setForm(f => ({ ...f, isHomeowner: false })); setStep(s => s + 1); }}>No</button>
        </div>
      )
    },
    {
      label: 'Preferred Timing',
      content: (
        <input type="text" className="border px-4 py-2 rounded w-full" placeholder="e.g. ASAP, tomorrow, next week" value={form.preferredTiming} onChange={e => setForm(f => ({ ...f, preferredTiming: e.target.value }))} onBlur={() => setStep(s => s + 1)} />
      )
    },
    {
      label: 'Additional Notes',
      content: (
        <>
          <textarea className="border px-4 py-2 rounded w-full" placeholder="Anything else we should know?" value={form.additionalNotes} onChange={e => setForm(f => ({ ...f, additionalNotes: e.target.value }))} />
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold mt-2" onClick={() => setStep(s => s + 1)}>Finish</button>
        </>
      )
    },
    {
      label: 'Summary & Submit',
      content: (
        <div className="space-y-2">
          <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto">{JSON.stringify(form, null, 2)}</pre>
          <button
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold w-full"
            disabled={submitting}
            onClick={async () => {
              // Basic validation
              if (!form.customerName || !form.serviceAddress || !form.contactInfo || !form.problemCategory) {
                setConfirmation('Please fill in all required fields.');
                return;
              }
              setSubmitting(true);
              setConfirmation('');
              try {
                const res = await fetch('/api/request', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(form)
                });
                if (res.ok) {
                  setConfirmation('Your request has been received!');
                  setTimeout(() => {
                    setShowAgentModal(false);
                    setStep(0);
                    setConfirmation('');
                  }, 2000);
                } else {
                  setConfirmation('Submission failed. Please try again.');
                }
              } catch {
                setConfirmation('Submission failed. Please try again.');
              }
              setSubmitting(false);
            }}
          >
            {submitting ? 'Submitting...' : 'Submit & Close'}
          </button>
          {confirmation && (
            <div className="text-center text-green-700 font-semibold mt-2">{confirmation}</div>
          )}
        </div>
      )
    }
  ];

  const services = [
    {
      icon: <Droplets className="w-8 h-8" />,
      title: "Leak Detection & Repair",
      description: "Fast detection and repair of water leaks to prevent damage",
      features: ["Emergency leak repair", "Pipe inspection", "Water damage prevention"]
    },
    {
      icon: <Wrench className="w-8 h-8" />,
      title: "Pipe Installation",
      description: "Professional installation of new plumbing systems",
      features: ["New construction", "Pipe replacement", "System upgrades"]
    },
    {
      icon: <Home className="w-8 h-8" />,
      title: "Bathroom Renovation",
      description: "Complete bathroom plumbing for renovations",
      features: ["Fixture installation", "Shower & tub setup", "Vanity plumbing"]
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Water Heater Services",
      description: "Installation, repair, and maintenance of water heaters",
      features: ["Tank & tankless units", "Emergency repairs", "Annual maintenance"]
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Drain Cleaning",
      description: "Professional drain cleaning and unclogging services",
      features: ["Hydro jetting", "Snake services", "Preventive maintenance"]
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Emergency Services",
      description: "24/7 emergency plumbing services when you need us most",
      features: ["24/7 availability", "Rapid response", "Emergency repairs"]
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      rating: 5,
      text: "Excellent service! They fixed our leak quickly and professionally. Highly recommend!"
    },
    {
      name: "Mike Chen",
      rating: 5,
      text: "Great work on our bathroom renovation. Clean, efficient, and reasonably priced."
    },
    {
      name: "Lisa Rodriguez",
      rating: 5,
      text: "Emergency service was fantastic. They came out at 11 PM and fixed our burst pipe."
    }
  ];

  return (
    <React.Fragment>
      <div className="min-h-screen bg-white">
        {user && profileIncomplete && (
          <ProfileModal
            isOpen={true}
            userId={user.id}
            email={user.email}
            onComplete={() => refreshProfile()}
          />
        )}
        {/* Agent Modal */}
        {showAgentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-8 relative animate-fade-in">
              <button
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                onClick={() => { setShowAgentModal(false); setStep(0); }}
              >
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-bold mb-4 text-blue-700">Request a Quote</h2>
              <div className="mb-6 text-gray-700 font-semibold">{steps[step]?.label}</div>
              <div>{steps[step]?.content}</div>
            </div>
          </div>
        )}
        {/* Header */}
        <header className="bg-white shadow-sm fixed w-full top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-2">
                <Wrench className="w-8 h-8 text-blue-600" />
                <span className="text-2xl font-bold text-gray-900">AquaFlow Plumbing</span>
              </div>
              <nav className="hidden md:flex items-center space-x-8">
                <a href="#services" className="text-gray-700 hover:text-blue-600 transition-colors">Services</a>
                <a href="#about" className="text-gray-700 hover:text-blue-600 transition-colors">About</a>
                <a href="#testimonials" className="text-gray-700 hover:text-blue-600 transition-colors">Reviews</a>
                <a href="#contact" className="text-gray-700 hover:text-blue-600 transition-colors">Contact</a>
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  onClick={() => setShowAgentModal(true)}
                >
                  <Wrench className="w-4 h-4" />
                  <span>Request a Quote (AI Quote Agent)</span>
                </button>
                <a href="tel:555-123-4567" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>Call Now</span>
                </a>
                <UserMenu />
                <button
                  className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2 ml-2"
                  onClick={() => setShowAuthModal(true)}
                >
                  <span>Sign In</span>
                </button>
              </nav>
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 text-gray-700"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
            {isMenuOpen && (
              <div className="md:hidden py-4 border-t">
                <div className="flex flex-col space-y-4">
                  <a href="#services" className="text-gray-700 hover:text-blue-600 transition-colors">Services</a>
                  <a href="#about" className="text-gray-700 hover:text-blue-600 transition-colors">About</a>
                  <a href="#testimonials" className="text-gray-700 hover:text-blue-600 transition-colors">Reviews</a>
                  <a href="#contact" className="text-gray-700 hover:text-blue-600 transition-colors">Contact</a>
                  <a href="tel:555-123-4567" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 w-fit">
                    <Phone className="w-4 h-4" />
                    <span>Call Now</span>
                  </a>
                </div>
              </div>
            )}
          </div>
          <div className="border-t-4 border-blue-600" />
        </header>
        <main className="pt-24">
          {/* Hero Section */}
          <section className="pt-12 pb-20 bg-blue-600 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-5xl font-bold leading-tight mb-6">Professional Plumbing Services You Can Trust</h1>
                <p className="text-xl text-blue-100 mb-8">24/7 emergency service, licensed professionals, and guaranteed satisfaction. Serving your community for over 15 years.</p>
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <button
                    className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-lg shadow"
                    onClick={() => setShowAgentModal(true)}
                  >
                    <span>
                    Request a Quote<br/>AI Quote Agent
                    </span>
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
          {/* Services Section */}
          <section id="services" className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Plumbing Services</h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">From emergency repairs to complete installations, we provide comprehensive plumbing solutions for homes and businesses.</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {services.map((service, index) => (
                  <div key={index} className="bg-white p-8 rounded-2xl shadow hover:shadow-lg transition-shadow duration-300">
                    <div className="mb-4">{service.icon}</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{service.title}</h3>
                    <p className="text-gray-600 mb-4">{service.description}</p>
                    <ul className="space-y-2">
                      {service.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center text-base text-gray-700">
                          <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>
          {/* About Section */}
          <section id="about" className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
              <div className="hidden lg:block">
                <img src="/plumber.jpg" alt="Plumbing team" className="rounded-lg shadow-lg w-full h-64 object-cover" />
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">About AquaFlow Plumbing</h2>
                <p className="text-lg text-gray-600 mb-6">With over 15 years of experience serving our community, AquaFlow Plumbing has built a reputation for reliable, professional service and competitive pricing.</p>
                <p className="text-lg text-gray-600 mb-8">Our team of licensed professionals is committed to providing the highest quality workmanship and customer service. We use the latest tools and techniques to ensure your plumbing systems work perfectly.</p>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-6 h-6 text-blue-600 bg-blue-100 p-2 rounded-full" />
                    <div>
                      <div className="font-semibold text-gray-900">Licensed & Insured</div>
                      <div className="text-gray-600">Full coverage protection</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="w-6 h-6 text-blue-600 bg-blue-100 p-2 rounded-full" />
                    <div>
                      <div className="font-semibold text-gray-900">24/7 Emergency</div>
                      <div className="text-gray-600">Always available</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-6 h-6 text-blue-600 bg-blue-100 p-2 rounded-full" />
                    <div>
                      <div className="font-semibold text-gray-900">Quality Guarantee</div>
                      <div className="text-gray-600">100% satisfaction</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Star className="w-6 h-6 text-blue-600 bg-blue-100 p-2 rounded-full" />
                    <div>
                      <div className="font-semibold text-gray-900">5-Star Rated</div>
                      <div className="text-gray-600">Customer approved</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          {/* Testimonials Section */}
          <section id="testimonials" className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
                <p className="text-xl text-gray-600">Don't just take our word for it - see what our satisfied customers have to say.</p>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="bg-white p-8 rounded-2xl shadow hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-center mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-gray-700 mb-4 italic">"{testimonial.text}"</p>
                    <div className="font-bold text-gray-900">{testimonial.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
          {/* Contact Section */}
          <section id="contact" className="py-20 bg-gray-900 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Get In Touch</h2>
                <p className="text-xl text-gray-300 mb-8">Ready to solve your plumbing problems? Contact us today for fast, professional service.</p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-600 p-3 rounded-full">
                      <Phone className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-bold">Call or Text</div>
                      <div className="text-gray-300">(555) 123-4567</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-600 p-3 rounded-full">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-bold">Service Area</div>
                      <div className="text-gray-300">Greater Metro Area</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-600 p-3 rounded-full">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-bold">Email Us</div>
                      <div className="text-gray-300">info@aquaflowplumbing.com</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-600 p-3 rounded-full">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-bold">Business Hours</div>
                      <div className="text-gray-300">24/7 Emergency Service</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-800 p-6 rounded-xl">
                <h3 className="text-xl font-semibold mb-4">Emergency Service</h3>
                <p className="text-gray-300 mb-6">Plumbing emergencies don't wait for business hours. We're available 24/7 for urgent repairs.</p>
                <a 
                  href="tel:555-123-4567" 
                  className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors inline-flex items-center space-x-2 w-full justify-center"
                >
                  <Phone className="w-5 h-5" />
                  <span>Emergency Line</span>
                </a>
              </div>
            </div>
          </section>
        </main>
        {/* Footer */}
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
        {/* Fixed Emergency Call Button */}
        <a
          href="tel:555-123-4567"
          className="fixed bottom-6 right-6 z-50 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors inline-flex items-center space-x-2 shadow-lg"
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}
        >
          <Phone className="w-5 h-5" />
          <span>Emergency Line</span>
        </a>
      </div>
  <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
  </React.Fragment>
  );
};


// Mount the App to the DOM
const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
