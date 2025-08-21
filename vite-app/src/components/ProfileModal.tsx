import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface ProfileModalProps {
  isOpen: boolean;
  userId: string;
  email?: string;
  onComplete: (profile: any) => void;
}

const provinces = [
  'Alberta',
  'British Columbia',
  'Manitoba',
  'New Brunswick',
  'Newfoundland and Labrador',
  'Nova Scotia',
  'Ontario',
  'Prince Edward Island',
  'Quebec',
  'Saskatchewan',
  'Northwest Territories',
  'Nunavut',
  'Yukon'
];
const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, userId, email, onComplete }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [closed, setClosed] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [postalError, setPostalError] = useState('');

  if (!isOpen || closed) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 relative">
        <h2 className="text-2xl font-bold mb-4 text-blue-700">Complete Your Profile</h2>
        <form
          onSubmit={async e => {
            e.preventDefault();
            // Phone validation: NNN-NNN-NNNN
            const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;
            // Canadian postal code: LNL NLN
            const postalRegex = /^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$/;
            let valid = true;
            if (!phoneRegex.test(phone)) {
              setPhoneError('Phone number must be in format 123-456-7890');
              valid = false;
            } else {
              setPhoneError('');
            }
            if (!postalRegex.test(postalCode)) {
              setPostalError('Postal code must be in format A1A 1A1');
              valid = false;
            } else {
              setPostalError('');
            }
            if (!valid) return;
            setLoading(true);
            await supabase.from('user_profiles').upsert({
              user_id: userId,
              name,
              email,
              phone,
              address,
              city,
              province,
              postal_code: postalCode
            });
            setLoading(false);
            onComplete({ name, email, phone, address, city, province, postalCode });
            setClosed(true);
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
            placeholder="123-456-7890"
            className={`border px-4 py-2 rounded w-full mb-2 ${phoneError ? 'border-red-500' : ''}`}
            value={phone}
            onChange={e => setPhone(e.target.value)}
            onBlur={() => {
              const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;
              setPhoneError(phone && !phoneRegex.test(phone) ? 'Phone number must be in format 123-456-7890' : '');
            }}
            required
          />
          {phoneError && <div className="text-red-600 text-sm mb-2">{phoneError}</div>}
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
          <select
            name="province"
            className="border px-4 py-2 rounded w-full mb-2"
            value={province}
            onChange={e => setProvince(e.target.value)}
            required
          >
            <option value="">Select Province</option>
            {provinces.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <input
            name="postalCode"
            type="text"
            placeholder="A1A 1A1"
            className={`border px-4 py-2 rounded w-full mb-4 ${postalError ? 'border-red-500' : ''}`}
            value={postalCode}
            onChange={e => setPostalCode(e.target.value)}
            onBlur={() => {
              const postalRegex = /^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$/;
              setPostalError(postalCode && !postalRegex.test(postalCode) ? 'Postal code must be in format A1A 1A1' : '');
            }}
            required
          />
          {postalError && <div className="text-red-600 text-sm mb-2">{postalError}</div>}
          <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold w-full" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;
