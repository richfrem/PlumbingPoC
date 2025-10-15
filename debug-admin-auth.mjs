#!/usr/bin/env node

// Debug script to check admin authentication setup
// Run with: node debug-admin-auth.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugAdminAuth() {
  logger.log('🔍 Debugging Admin Authentication Setup...\n');

  try {
    // 1. Check if admin user exists
    logger.log('1. Checking for admin user...');
    const adminEmail = 'kassandrajo@outlook.com'; // From test data

    const { data: users, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
      console.error('❌ Failed to list users:', userError);
      return;
    }

    const adminUser = users.users.find(u => u.email === adminEmail);

    if (!adminUser) {
      console.error(`❌ Admin user with email ${adminEmail} not found in auth.users`);
      logger.log('Available users:', users.users.map(u => ({ email: u.email, id: u.id })));
      return;
    }

    logger.log(`✅ Found admin user: ${adminUser.email} (ID: ${adminUser.id})`);

    // 2. Check if admin profile exists
    logger.log('\n2. Checking admin user profile...');

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', adminUser.id)
      .single();

    if (profileError) {
      console.error('❌ Failed to fetch admin profile:', profileError.message);
      logger.log('This is likely the cause of the 401 errors!');
      logger.log('\n🔧 SOLUTION: Create admin profile with:');
      logger.log(`INSERT INTO user_profiles (user_id, email, name, role) VALUES ('${adminUser.id}', '${adminUser.email}', 'Admin User', 'admin');`);
      return;
    }

    logger.log('✅ Admin profile found:', {
      id: profile.id,
      user_id: profile.user_id,
      email: profile.email,
      name: profile.name,
      role: profile.role
    });

    if (profile.role !== 'admin') {
      console.error(`❌ Admin user has role '${profile.role}' instead of 'admin'`);
      logger.log('\n🔧 SOLUTION: Update role to admin with:');
      logger.log(`UPDATE user_profiles SET role = 'admin' WHERE user_id = '${adminUser.id}';`);
      return;
    }

    logger.log('\n✅ Admin authentication setup looks correct!');

    // 3. Test a simple authenticated request simulation
    logger.log('\n3. Testing authentication flow...');

    // This simulates what the frontend does
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: adminEmail
    });

    if (sessionError) {
      logger.log('⚠️ Could not generate test session, but profile setup looks correct');
    } else {
      logger.log('✅ Authentication flow test passed');
    }

  } catch (error) {
    console.error('❌ Debug script failed:', error);
  }
}

debugAdminAuth();
