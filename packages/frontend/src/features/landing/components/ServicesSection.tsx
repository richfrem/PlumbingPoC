import React from 'react';
import { ArrowRight, CheckCircle, Droplets, Wrench, Wind, Thermometer, ShowerHead, Settings } from 'lucide-react';
import { services as allServices, ServiceDefinition } from '../../../lib/serviceDefinitions';

const iconComponents: { [key: string]: React.ReactElement } = {
  Droplets: <Droplets className="w-8 h-8 text-blue-700" />,
  Wrench: <Wrench className="w-8 h-8 text-blue-700" />,
  Wind: <Wind className="w-8 h-8 text-blue-700" />,
  Thermometer: <Thermometer className="w-8 h-8 text-blue-700" />,
  ShowerHead: <ShowerHead className="w-8 h-8 text-blue-700" />,
  Settings: <Settings className="w-8 h-8 text-blue-700" />,
};

// Display all 8 services in the correct order
const mainServiceKeys = ["leak_repair", "pipe_installation", "drain_cleaning", "water_heater", "fixture_install", "gas_line_services", "perimeter_drains", "other"];
const displayServices = allServices.filter(s => mainServiceKeys.includes(s.key))
  .sort((a, b) => mainServiceKeys.indexOf(a.key) - mainServiceKeys.indexOf(b.key));

interface ServicesSectionProps {
  onServiceSelect: (service: ServiceDefinition) => void;
}

const ServicesSection: React.FC<ServicesSectionProps> = ({ onServiceSelect }) => (
  <section id="services" className="py-20 bg-gray-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">Professional Plumbing Services in Victoria, BC</h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">From emergency repairs to complete installations, we provide comprehensive plumbing solutions for homes and businesses.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayServices.map((service) => (
          <button key={service.key} onClick={() => onServiceSelect(service)} className="text-left bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col group hover:scale-105 relative overflow-hidden">
            <div className="relative z-10 flex flex-col h-full">
              <div className="bg-blue-100 p-3 rounded-full inline-flex mb-4 w-min">
                {iconComponents[service.icon]}
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-bold text-gray-900">{service.title}</h3>
                {(service.key === 'leak_repair' || service.key === 'water_heater') && (
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">Emergency</span>
                )}
              </div>
              <p className="text-gray-600 mb-4 text-sm flex-grow line-clamp-3">{service.description}</p>
              <div className="absolute bottom-6 right-6 bg-blue-600 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110">
                <ArrowRight className="text-white w-5 h-5" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  </section>
);

export default ServicesSection;
