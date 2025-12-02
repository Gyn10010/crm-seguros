/**
 * Script to apply permissions column migration to profiles table
 * Run with: npm run tsx scripts/apply-permissions-migration.ts
 */

import { createClient } from '@supabase/supabase-js';

// Load environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Error: Missing Supabase environment variables');
    console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function applyMigration() {
    console.log('🔄 Applying permissions migration to profiles table...\n');

    try {
        // Execute the migration SQL
        const { error } = await supabase.rpc('exec_sql', {
            sql: `
        ALTER TABLE profiles 
        ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb;
        
        COMMENT ON COLUMN profiles.permissions 
        IS 'Array of page view permissions for the user. Example: ["Dashboard", "Clients", "Policies"]';
      `
        });

        if (error) {
            // If exec_sql doesn't exist, try direct query (will only work with service role key)
            console.log('⚠️  exec_sql function not available, trying direct SQL execution...\n');

            const { error: sqlError } = await supabase
                .from('profiles')
                .select('permissions')
                .limit(1);

            if (sqlError && sqlError.message.includes('column "permissions" does not exist')) {
                console.error('❌ Migration needed but cannot be applied automatically.');
                console.error('Please run this SQL manually in Supabase Dashboard:\n');
                console.error('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT \'[]\'::jsonb;\n');
                process.exit(1);
            } else if (!sqlError) {
                console.log('✅ Column already exists or migration already applied!');
                return;
            }

            throw error;
        }

        console.log('✅ Migration applied successfully!\n');
        console.log('The profiles table now has a permissions column.');

    } catch (err) {
        console.error('❌ Error applying migration:', err);
        console.error('\nPlease apply the migration manually in Supabase Dashboard:');
        console.error('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT \'[]\'::jsonb;\n');
        process.exit(1);
    }
}

// Run the migration
applyMigration()
    .then(() => {
        console.log('🎉 Migration process completed!');
        process.exit(0);
    })
    .catch((err) => {
        console.error('Unexpected error:', err);
        process.exit(1);
    });
