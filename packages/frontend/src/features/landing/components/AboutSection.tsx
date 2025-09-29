/**
 * =============================================================================
 * AboutSection.tsx - About Section Component
 * =============================================================================
 *
 * WHAT IS THIS COMPONENT?
 * -----------------------
 * The AboutSection component displays information about AquaFlow Plumbing
 * company, including their experience, values, and key differentiators.
 * This is part of the landing page and helps build trust with potential customers.
 *
 * COMPONENT FEATURES:
 * -------------------
 * - Company overview with 15+ years experience
 * - Professional credentials (licensed, insured, 24/7 emergency)
 * - Quality guarantees and customer satisfaction metrics
 * - Responsive design with mobile-first approach
 * - Visual elements with icons and company photo
 *
 * LAYOUT STRUCTURE:
 * -----------------
 * - Left side: Company photo (hidden on mobile)
 * - Right side: Company description and feature grid
 * - Feature grid: 4 key value propositions with icons
 *
 * RESPONSIVE BEHAVIOR:
 * -------------------
 * - Desktop: 2-column grid with photo and content
 * - Mobile: Single column with content only
 *
 * ICONS USED:
 * -----------
 * - Shield: Licensed & Insured
 * - Clock: 24/7 Emergency Service
 * - CheckCircle: Quality Guarantee
 * - Star: 5-Star Rated
 *
 * STYLING:
 * --------
 * - Uses Tailwind CSS classes
 * - Blue color scheme matching brand
 * - Rounded corners and shadows for visual appeal
 * - Hover effects on interactive elements
 */

import React from 'react';
import { Shield, Clock, CheckCircle, Star } from 'lucide-react';

const AboutSection: React.FC = () => (
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
              <div className="text-gray-600">Proven customer satisfaction</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default AboutSection;