import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface ProfileModalProps {
  isOpen: boolean;
  userId: string;
  email?: string;
  onComplete: (profile: any) => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, userId, onComplete }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 relative">
        <h2 className="text-2xl font-bold mb-4 text-blue-700">Complete Your Profile</h2>
        <form
          onSubmit={async e => {
            e.preventDefault();
            setLoading(true);
            await supabase.from('user_profiles').upsert({
              user_id: userId,
              name,
              email,
              phone,
              address,
              city,
              postal_code: postalCode
            });
            setLoading(false);
            onComplete({ name, email, phone, address, city, postalCode });
          }}
        >
          <input
            name="name"
            type="text"
            placeholder="Full Name"
            className="border px-4 py-2 rounded w-full mb-2"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            className="border px-4 py-2 rounded w-full mb-2"
            value={email || ''}
            disabled
          />
          <input
            name="phone"
            type="tel"
            placeholder="Phone Number"
            className="border px-4 py-2 rounded w-full mb-2"
            value={phone}
            onChange={e => setPhone(e.target.value)}
          />
          <input
            name="address"
            type="text"
            placeholder="Address"
            className="border px-4 py-2 rounded w-full mb-2"
            value={address}
            onChange={e => setAddress(e.target.value)}
          />
          <input
            name="city"
            type="text"
            placeholder="City"
            className="border px-4 py-2 rounded w-full mb-2"
            value={city}
            onChange={e => setCity(e.target.value)}
          />
          <input
            name="postalCode"
            type="text"
            placeholder="Postal Code"
            className="border px-4 py-2 rounded w-full mb-4"
            value={postalCode}
            onChange={e => setPostalCode(e.target.value)}
          />
          <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold w-full" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;
