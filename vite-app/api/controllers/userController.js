// vite-app/api/controllers/userController.js

const supabase = require('../config/supabase');

/**
 * Handles updating the profile for the currently authenticated user.
 */
const updateUserProfile = async (req, res, next) => {
  try {
    const { user } = req; // From the `authenticate` middleware
    const profileData = req.body;

    // Ensure the user can only update their own profile
    const { data, error } = await supabase
      .from('user_profiles')
      .update(profileData)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      // If RLS prevents the update, Supabase might return an error
      // or simply an empty data array. We handle both.
      if (error.code === 'PGRST204') { // No content, RLS might have blocked it
        return res.status(404).json({ error: 'Profile not found or permission denied.' });
      }
      throw error;
    }

    if (!data) {
      return res.status(404).json({ error: 'Profile not found for the current user.' });
    }

    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  updateUserProfile,
};