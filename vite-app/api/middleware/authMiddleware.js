// /middleware/authMiddleware.js
/*
This file isolates all authentication and authorization logic. It's clean, 
reusable, and easy to update if your permission rules change.
*/
// /middleware/authMiddleware.js
const supabase = require('../config/supabase'); // <-- THE FIX

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
    const { data: { user }, error } = await supabase.auth.getUser(token);
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

module.exports = {
  authenticate,
  isAdmin,
};