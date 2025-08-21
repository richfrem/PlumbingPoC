import React from 'react';
import { supabase } from '../lib/supabaseClient';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isSignUp, setIsSignUp] = React.useState(false);
  const [name, setName] = React.useState('');
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 relative">
        <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-700" onClick={onClose}>
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-4 text-blue-700">{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
        <button
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold w-full mb-4"
          onClick={async () => {
            await supabase.auth.signInWithOAuth({ provider: 'google' });
          }}
        >
          Continue with Google
        </button>
        <button
          className="bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold w-full mb-4"
          onClick={async () => {
            await supabase.auth.signInWithOAuth({ provider: 'azure' });
          }}
        >
          Continue with Microsoft
        </button>
        <form
          onSubmit={async e => {
            e.preventDefault();
            const email = (e.target as any).email.value;
            const password = (e.target as any).password.value;
            if (isSignUp) {
              const { data, error } = await supabase.auth.signUp({ email, password });
              if (!error && data.user) {
                await supabase.from('user_profiles').insert({ user_id: data.user.id, name });
              }
            } else {
              await supabase.auth.signInWithPassword({ email, password });
            }
          }}
        >
          {isSignUp && (
            <input
              name="name"
              type="text"
              placeholder="Full Name"
              className="border px-4 py-2 rounded w-full mb-2"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          )}
          <input name="email" type="email" placeholder="Email" className="border px-4 py-2 rounded w-full mb-2" required />
          <input name="password" type="password" placeholder="Password" className="border px-4 py-2 rounded w-full mb-4" required />
          <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold w-full">{isSignUp ? 'Sign Up with Email' : 'Sign In with Email'}</button>
        </form>
        <div className="mt-4 text-center">
          {isSignUp ? (
            <span className="text-sm">Already have an account?{' '}
              <button className="text-blue-600 underline" onClick={() => setIsSignUp(false)}>Sign In</button>
            </span>
          ) : (
            <span className="text-sm">Don't have an account?{' '}
              <button className="text-blue-600 underline" onClick={() => setIsSignUp(true)}>Sign Up</button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
