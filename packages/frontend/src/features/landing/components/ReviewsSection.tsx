import React from 'react';
import { Star } from 'lucide-react';

const testimonials = [
  { name: "Jane D.", rating: 5, text: "Fast, friendly, and fixed my leak in no time!" },
  { name: "Mike R.", rating: 5, text: "Professional team, great price, highly recommend." },
  { name: "Sara L.", rating: 5, text: "Emergency call at 2am, they showed up and saved my basement!" }
];

const ReviewsSection: React.FC = () => (
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
);

export default ReviewsSection;
