/**
 * Utility to apply the permissions migration
 * This can be called from the browser console or integrated into the app
 */

import { supabase } from '@/integrations/supabase/client';

export async function applyPermissionsMigration() {
    console.log('🔄 Applying permissions migration...');

    try {
        // Try to check if the column already exists by querying it
        const { data, error: checkError } = await supabase
            .from('profiles')
            .select('permissions')
            .limit(1);

        if (!checkError) {
            console.log('✅ Permissions column already exists!');
            console.log('Migration not needed.');
            return { success: true, message: 'Column already exists' };
        }

        // Column doesn't exist - needs manual migration
        console.log('⚠️  Column does not exist.');
        console.error('\n⚠️  Please apply the migration manually in Supabase Dashboard SQL Editor:\n');
        console.error("ALTER TABLE profiles ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb;\n");
        return { success: false, error: checkError, needsMigration: true };

    } catch (error) {
        console.error('❌ Unexpected error:', error);
        console.error('\n⚠️  Please apply the migration manually in Supabase Dashboard:');
        console.error("ALTER TABLE profiles ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb;\n");
        return { success: false, error };
    }
}

// Make it available in the browser console
if (typeof window !== 'undefined') {
    (window as any).applyPermissionsMigration = applyPermissionsMigration;
}
