import React from 'react';
import { Droplets, Wrench, CheckCircle } from 'lucide-react';

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
  // ...add more services as needed
];

const ServicesSection: React.FC = () => (
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
);

export default ServicesSection;
