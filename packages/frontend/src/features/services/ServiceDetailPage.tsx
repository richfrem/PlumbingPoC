import React from 'react';
import { services, ServiceDefinition } from '../../lib/serviceDefinitions';
import { ArrowLeft } from 'lucide-react';

interface ServiceDetailPageProps {
  serviceKey: string;
}

const ServiceDetailPage: React.FC<ServiceDetailPageProps> = ({ serviceKey }) => {
  const service = services.find(s => s.key === serviceKey);

  if (!service) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold">Service Not Found</h2>
        <a href="/#" className="text-blue-600 hover:underline mt-4 inline-block">← Back to Home</a>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <a href="/#" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6">
        <ArrowLeft size={18} />
        Back to All Services
      </a>
      <h1 className="text-4xl font-bold text-gray-900 mb-4">{service.title}</h1>
      <p className="text-lg text-gray-600 mb-8">{service.description}</p>

      {/* Placeholder for more content */}
      <div className="bg-gray-100 p-6 rounded-lg">
        <h3 className="text-2xl font-semibold mb-4">More Details Coming Soon</h3>
        <p>This page will include project photos, customer testimonials for this specific service, and a detailed breakdown of our process.</p>
        <button
            onClick={() => {/* This will need to be wired up to open the quote modal */}}
            className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
            Request a Quote for {service.title}
        </button>
      </div>
    </div>
  );
};

export default ServiceDetailPage;