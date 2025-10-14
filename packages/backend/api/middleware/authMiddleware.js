// packages/backend/api/middleware/authMiddleware.js
import { createClient } from '@supabase/supabase-js';
import { database as supabase } from '../config/supabase/index.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL or Anon Key is missing. Check environment variables.");
}

const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Middleware to verify a user's JWT token from the Authorization header.
 * Attaches the authenticated user object to the request.
 */
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing JWT token.' });
  }
  const token = authHeader.split(' ')[1];

  try {
    // This function uses the supabaseAuth client (initialized with SUPABASE_ANON_KEY)
    // for token validation. This is the correct and secure way to validate user tokens.
    const { data: { user }, error } = await supabaseAuth.auth.getUser(token);
    if (error || !user) {
      throw new Error('Unauthorized: Invalid token.');
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }
};

/**
 * Middleware to ensure the authenticated user has the 'admin' role.
 * Must be used AFTER the authenticate middleware.
 */
const isAdmin = async (req, res, next) => {
  // Ensure we have a user from the previous `authenticate` middleware
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    // This function uses the main supabase client (initialized with SUPABASE_SERVICE_ROLE_KEY)
    // to fetch the user's profile and check their role. This might be intended to bypass RLS
    // if necessary for role checking, as it has elevated privileges.
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', req.user.id)
      .single();

    if (error) {
        // This could happen if the profile doesn't exist yet, which is a valid state.
        // We treat it as non-admin.
        console.warn(`Could not fetch profile for user ${req.user.id}:`, error.message);
        return res.status(403).json({ error: 'Forbidden: Admin access required.' });
    }

    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required.' });
    }

    // User is an admin, proceed to the next handler
    next();
  } catch (error) {
      next(error); // Pass unexpected errors to the global handler
  }
};

export {
  authenticate,
  isAdmin,
};
