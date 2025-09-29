/**
 * =============================================================================
 * ServicesSection.tsx - Services Overview Component
 * =============================================================================
 *
 * WHAT IS THIS COMPONENT?
 * -----------------------
 * The ServicesSection component displays AquaFlow Plumbing's service offerings
 * in an attractive bento grid layout. It showcases the main plumbing services
 * with icons, descriptions, and key features to help customers understand
 * the range of services available.
 *
 * COMPONENT FEATURES:
 * -------------------
 * - Dynamic service data from servicesData.ts
 * - Bento grid layout with varying card sizes
 * - Icon mapping system for visual consistency
 * - Hover effects and smooth transitions
 * - Responsive design with mobile-first approach
 * - Feature lists with checkmark icons
 *
 * GRID LAYOUT STRUCTURE:
 * ---------------------
 * - Large featured service: 2x2 grid span (Leak Detection & Repair)
 * - Medium service: 2x1 grid span (Pipe Installation & Repiping)
 * - Small service cards: 1x1 grid (4 additional services)
 * - Total: 6 services displayed in asymmetric grid
 *
 * ICON MAPPING SYSTEM:
 * -------------------
 * Maps string names to Lucide React icon components:
 * - Droplets: Leak Detection & Repair
 * - Wrench: Pipe Installation & Repiping
 * - Wind: Drain Cleaning
 * - Thermometer: Water Heater Services
 * - ShowerHead: Fixture Repair & Installation
 * - Settings: Gas Line Services
 *
 * RESPONSIVE BEHAVIOR:
 * -------------------
 * - Desktop: 4-column bento grid with size variations
 * - Tablet: 2-column grid with adjusted spans
 * - Mobile: Single column stack
 *
 * DATA SOURCE:
 * -----------
 * - Imports service data from ../../../lib/servicesData.ts
 * - Each service includes: key, title, description, features array, icon name
 *
 * STYLING:
 * --------
 * - Light gray background (bg-gray-50)
 * - White service cards with rounded corners
 * - Blue icons and gradient hover effects
 * - Green checkmarks for features
 * - Scale and shadow animations on hover
 * - Gradient overlays for visual depth
 */

import React from 'react';
import { CheckCircle, Droplets, Wrench, Wind, Thermometer, ShowerHead, Settings } from 'lucide-react';
import { services } from '../../../lib/servicesData';

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
        <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Professional Plumbing Services</h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">From emergency repairs to complete installations, we provide comprehensive plumbing solutions for homes and businesses.</p>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-[200px]">
        {/* Large featured service - spans 2 columns and 2 rows */}
        {services[0] && (
          <div className="md:col-span-2 lg:col-span-2 lg:row-span-2 bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col group hover:scale-[1.02] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="mb-4">{iconComponents[services[0].icon]}</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{services[0].title}</h3>
              <p className="text-gray-600 mb-6 flex-grow">{services[0].description}</p>
              <ul className="space-y-3">
                {services[0].features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center text-base text-gray-700">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Medium service - spans 2 columns */}
        {services[1] && (
          <div className="md:col-span-2 lg:col-span-2 bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col group hover:scale-[1.02] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="mb-3">{iconComponents[services[1].icon]}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{services[1].title}</h3>
              <p className="text-gray-600 mb-4 text-sm flex-grow">{services[1].description}</p>
              <ul className="space-y-2">
                {services[1].features.slice(0, 2).map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Small service cards */}
        {services.slice(2, 6).map((service, index) => (
          <div key={service.key} className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col group hover:scale-[1.02] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="mb-3">{iconComponents[service.icon]}</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{service.title}</h3>
              <p className="text-gray-600 mb-4 text-sm flex-grow line-clamp-2">{service.description}</p>
              <ul className="space-y-1">
                {service.features.slice(0, 2).map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    <span className="truncate">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default ServicesSection;