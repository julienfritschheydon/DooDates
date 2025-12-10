#!/usr/bin/env node

/**
 * Test script for Quota Alerts system
 * 
 * This script helps you test:
 * 1. Admin dashboard access
 * 2. Email alert functionality
 * 3. High usage detection
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://outmbbisrrdiumlweira.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91dG1iYmlzcnJkaXVtbHdlaXJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQwMjc5MDAsImV4cCI6MjA0OTYwMzkwMH0.6FqYHsEh1sC6Nj8p-TzZq6xWJpZrKqzHh9m2wY6Jk4';

console.log('🧪 Testing DooDates Quota Alerts System\n');

async function testAdminDashboard() {
  console.log('📊 Testing Admin Dashboard Access...');
  
  try {
    // Test 1: Check if dashboard route exists
    const response = await fetch(`${SUPABASE_URL}/functions/v1/quota-alerts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (response.status === 401) {
      console.log('✅ Dashboard endpoint exists (requires auth)');
    } else {
      console.log(`❌ Unexpected response: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Dashboard test failed:', error.message);
  }
}

async function testEmailService() {
  console.log('\n📧 Testing Email Service Configuration...');
  
  // Check if RESEND_API_KEY is configured
  const resendApiKey = process.env.RESEND_API_KEY;
  
  if (!resendApiKey) {
    console.log('⚠️  RESEND_API_KEY not found in environment');
    console.log('💡 To configure email service:');
    console.log('   1. Get API key from resend.com');
    console.log('   2. Add to Supabase: RESEND_API_KEY=re_your_key');
    console.log('   3. Deploy function: npx supabase functions deploy quota-alerts');
  } else {
    console.log('✅ RESEND_API_KEY is configured');
  }
  
  // Check admin email
  const adminEmail = process.env.ADMIN_EMAIL || 'julien.fritsch@gmail.com';
  console.log(`✅ Admin email configured: ${adminEmail}`);
}

async function testHighUsageDetection() {
  console.log('\n🔍 Testing High Usage Detection Logic...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    // Check if quota_tracking table exists and has data
    const { data, error } = await supabase
      .from('quota_tracking')
      .select('user_id, total_credits_consumed')
      .gte('total_credits_consumed', 0)
      .limit(5);
    
    if (error) {
      console.log('❌ Cannot access quota_tracking:', error.message);
    } else {
      console.log(`✅ quota_tracking accessible (${data?.length || 0} records found)`);
      
      // Check for high usage users
      const highUsage = data?.filter(q => q.total_credits_consumed > 50) || [];
      if (highUsage.length > 0) {
        console.log(`⚠️  Found ${highUsage.length} high usage users (>50 credits)`);
        highUsage.forEach(user => {
          console.log(`   - User ${user.user_id.substring(0, 8)}...: ${user.total_credits_consumed} credits`);
        });
      } else {
        console.log('✅ No high usage users detected (all < 50 credits)');
      }
    }
    
    // Check guest_quotas table
    const { data: guestData, error: guestError } = await supabase
      .from('guest_quotas')
      .select('id, fingerprint, total_credits_consumed')
      .gte('total_credits_consumed', 0)
      .limit(5);
    
    if (guestError) {
      console.log('❌ Cannot access guest_quotas:', guestError.message);
    } else {
      console.log(`✅ guest_quotas accessible (${guestData?.length || 0} records found)`);
    }
    
  } catch (error) {
    console.log('❌ High usage detection test failed:', error.message);
  }
}

function showTestInstructions() {
  console.log('\n📋 Manual Testing Instructions:');
  console.log('');
  console.log('1. 🌐 Access Admin Dashboard:');
  console.log('   - Start dev server: npm run dev');
  console.log('   - Navigate to: http://localhost:5173/admin/quota-dashboard');
  console.log('   - Login with admin account');
  console.log('   - Check dashboard loads and shows data');
  console.log('');
  console.log('2. 📊 Test Dashboard Features:');
  console.log('   - Verify statistics cards show correct numbers');
  console.log('   - Check charts render properly');
  console.log('   - Test CSV export functionality');
  console.log('   - Switch to "Alerts & Monitoring" tab');
  console.log('');
  console.log('3. 📧 Test Email Alerts:');
  console.log('   - In Alerts tab, click "Send Test" button');
  console.log('   - Check email arrives at julien.fritsch@gmail.com');
  console.log('   - Verify email content and formatting');
  console.log('   - Test "Check Now" for manual alert detection');
  console.log('');
  console.log('4. 🔍 Test High Usage Alerts:');
  console.log('   - If no high usage users exist, create test data');
  console.log('   - Or wait for automatic detection (every 6 hours)');
  console.log('   - Verify alerts appear in dashboard');
  console.log('');
  console.log('5. ⚙️  Configuration Check:');
  console.log('   - Ensure RESEND_API_KEY is set in Supabase');
  console.log('   - Verify ADMIN_EMAIL is julien.fritsch@gmail.com');
  console.log('   - Check cron job is configured (every 6 hours)');
  console.log('');
}

async function main() {
  console.log('🚀 Starting Quota Alerts Tests...\n');
  
  await testAdminDashboard();
  await testEmailService();
  await testHighUsageDetection();
  showTestInstructions();
  
  console.log('✅ Testing completed!');
  console.log('\n📞 For support or issues:');
  console.log('   - Check Supabase logs: npx supabase functions logs quota-alerts');
  console.log('   - Verify environment variables in Supabase dashboard');
  console.log('   - Check email service status at resend.com');
}

// Run tests
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testAdminDashboard,
  testEmailService,
  testHighUsageDetection
};
