import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { logger } from '../../lib/logger';
import { Session, User } from '@supabase/supabase-js';

// Define a more specific type for your profile data
export interface UserProfile {
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  profileIncomplete: boolean;
  refreshProfile: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileIncomplete, setProfileIncomplete] = useState(false);

  useEffect(() => {
    const getInitialSession = async () => {
      logger.log('🔐 AuthContext: Getting initial session...');
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        logger.error('❌ AuthContext: Session error:', error);
      } else {
        logger.log('✅ AuthContext: Session retrieved:', !!session, 'User:', !!session?.user);
      }

      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      logger.log('🔄 AuthContext: Auth state changed:', event, 'User ID:', session?.user?.id || 'null', 'Email:', session?.user?.email || 'null');
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (currentUser: User | null) => {
    if (currentUser) {
      logger.log('👤 AuthContext: Fetching profile for user:', currentUser.id);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        logger.error('❌ AuthContext: Error fetching profile:', error);
      } else if (error && error.code === 'PGRST116') {
        logger.log('ℹ️ AuthContext: No profile found for user (this is normal for new users)');
      } else {
        logger.log('✅ AuthContext: Profile loaded:', data ? 'complete' : 'null');
      }

      setProfile(data);
      // A profile is incomplete if it doesn't exist, or if the required 'name' field is missing.
      const incomplete = !data || !data.name;
      setProfileIncomplete(incomplete);
      logger.log('📊 AuthContext: Profile status - Complete:', !incomplete, 'Incomplete:', incomplete);
    } else {
      logger.log('👤 AuthContext: No user, clearing profile');
      setProfile(null);
      setProfileIncomplete(false);
    }
  };

  useEffect(() => {
    fetchProfile(user);
  }, [user]);

  const signOut = async () => {
    logger.log('🚪 AuthContext: Signing out user...');
    await supabase.auth.signOut();
    logger.log('✅ AuthContext: Sign out complete');
    setUser(null);
    setProfile(null);
    // Redirect to home page after sign out
    window.location.hash = '';
  };

  const refreshProfile = () => fetchProfile(user);

  return (
    <AuthContext.Provider value={{ user, profile, loading, profileIncomplete, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
