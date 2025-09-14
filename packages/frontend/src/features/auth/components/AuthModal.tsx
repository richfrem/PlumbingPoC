import React from 'react';
import { supabase } from '../../../lib/supabaseClient';
import ModalHeader from '../../requests/components/ModalHeader';
import { User, Mail, Lock } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isSignUp, setIsSignUp] = React.useState(false);
  const [name, setName] = React.useState('');
  const [message, setMessage] = React.useState<string | null>(null);
  const [messageType, setMessageType] = React.useState<'success' | 'error' | 'info'>('info');
  const [loading, setLoading] = React.useState(false);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-gray-50 rounded-xl shadow-2xl max-w-md w-full relative overflow-hidden">
        <ModalHeader title={isSignUp ? 'Create Your Account' : 'Sign In to Your Portal'} onClose={onClose} />
        <div className="p-8 space-y-6">
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

        {/* Divider with text */}
        <div className="relative flex py-5 items-center">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="flex-shrink mx-4 text-gray-500 text-sm">Or continue with</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <form
          className="mt-4"
          onSubmit={async e => {
            e.preventDefault();
            setLoading(true);
            setMessage(null);
            const email = (e.target as any).email.value;
            const password = (e.target as any).password.value;
            try {
              if (isSignUp) {
                const { data, error } = await supabase.auth.signUp({ email, password });
                if (error) {
                  setMessage(error.message || 'Sign up failed.');
                  setMessageType('error');
                } else if (data.user) {
                  await supabase.from('user_profiles').insert({ user_id: data.user.id, name });
                  setMessage('Sign up successful! Please check your email and click the confirmation link before signing in.');
                  setMessageType('success');
                }
              } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) {
                  setMessage(error.message || 'Sign in failed.');
                  setMessageType('error');
                } else {
                  setMessage('Sign in successful!');
                  setMessageType('success');
                  setTimeout(() => {
                    setMessage(null);
                    onClose();
                  }, 1200);
                }
              }
            } catch (err: any) {
              setMessage(err.message || 'An error occurred.');
              setMessageType('error');
            } finally {
              setLoading(false);
            }
          }}
        >
          {isSignUp && (
            <div className="relative mb-3">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                name="name"
                type="text"
                placeholder="Full Name"
                className="border border-gray-300 px-10 py-3 rounded-lg w-full shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
          )}
          <div className="relative mb-3">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              name="email"
              type="email"
              placeholder="Email"
              className="border border-gray-300 px-10 py-3 rounded-lg w-full shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              required
            />
          </div>
          <div className="relative mb-4">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              name="password"
              type="password"
              placeholder="Password"
              className="border border-gray-300 px-10 py-3 rounded-lg w-full shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              required
            />
          </div>
          <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold w-full" disabled={loading}>
            {loading ? (isSignUp ? 'Signing Up...' : 'Signing In...') : (isSignUp ? 'Sign Up with Email' : 'Sign In with Email')}
          </button>
        {message && (
          <div className={`mt-2 text-center text-sm ${messageType === 'success' ? 'text-green-600' : messageType === 'error' ? 'text-red-600' : 'text-gray-600'}`}>
            {message}
          </div>
        )}
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
    </div>
  );
};

export default AuthModal;
