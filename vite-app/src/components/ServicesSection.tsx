import React from 'react';
import { CheckCircle, Droplets, Wrench, Wind, Thermometer, ShowerHead, Settings } from 'lucide-react';
import { services } from '../lib/servicesData';

// Create a mapping from the string name to the actual icon component
const iconComponents: { [key: string]: React.ReactElement } = {
  Droplets: <Droplets className="w-8 h-8 text-blue-600" />,
  Wrench: <Wrench className="w-8 h-8 text-blue-600" />,
  Wind: <Wind className="w-8 h-8 text-blue-600" />,
  Thermometer: <Thermometer className="w-8 h-8 text-blue-600" />,
  ShowerHead: <ShowerHead className="w-8 h-8 text-blue-600" />,
  Settings: <Settings className="w-8 h-8 text-blue-600" />,
};

const ServicesSection: React.FC = () => (
  <section id="services" className="py-20 bg-gray-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Plumbing Services</h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">From emergency repairs to complete installations, we provide comprehensive plumbing solutions for homes and businesses.</p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map((service) => (
          <div key={service.key} className="bg-white p-8 rounded-2xl shadow hover:shadow-lg transition-shadow duration-300 flex flex-col">
            {/* The component now looks up the correct icon based on the string from the data file */}
            <div className="mb-4">{iconComponents[service.icon]}</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{service.title}</h3>
            <p className="text-gray-600 mb-4 flex-grow">{service.description}</p>
            <ul className="space-y-2 mt-auto">
              {service.features.map((feature, featureIndex) => (
                <li key={featureIndex} className="flex items-center text-base text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default ServicesSection;