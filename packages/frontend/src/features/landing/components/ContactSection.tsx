/**
 * =============================================================================
 * ContactSection.tsx - Contact Information Component
 * =============================================================================
 *
 * WHAT IS THIS COMPONENT?
 * -----------------------
 * The ContactSection component provides all contact information for AquaFlow
 * Plumbing, including phone numbers, service areas, email, and business hours.
 * It also prominently features emergency service availability.
 *
 * COMPONENT FEATURES:
 * -------------------
 * - Contact information grid with icons
 * - Emergency service call-to-action
 * - Direct phone number links (tel: protocol)
 * - Responsive layout (2-column on desktop, stacked on mobile)
 * - Dark theme matching footer styling
 *
 * CONTACT INFORMATION DISPLAYED:
 * -----------------------------
 * - Phone: (555) 123-4567 (call or text)
 * - Service Area: Greater Metro Area
 * - Email: info@aquaflowplumbing.com
 * - Business Hours: 24/7 Emergency Service
 *
 * LAYOUT STRUCTURE:
 * -----------------
 * - Left side (2/3 width): Main contact info grid
 * - Right side (1/3 width): Emergency service callout box
 * - Emergency box: Red CTA button with phone icon
 *
 * RESPONSIVE BEHAVIOR:
 * -------------------
 * - Desktop: 3-column grid (2 for contact info, 1 for emergency)
 * - Tablet: 2-column contact grid, stacked emergency box
 * - Mobile: Single column stack
 *
 * ICONS USED:
 * -----------
 * - Phone: Phone number contact
 * - MapPin: Service area coverage
 * - Mail: Email contact
 * - Clock: Business hours
 *
 * STYLING:
 * --------
 * - Dark background (bg-gray-900) with white text
 * - Blue accent color for icons and backgrounds
 * - Red emergency button for high visibility
 * - Rounded corners and proper spacing
 * - Hover effects on interactive elements
 */

import React from 'react';
import { Phone, MapPin, Mail, Clock } from 'lucide-react';

const ContactSection: React.FC = () => (
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
);

export default ContactSection;
