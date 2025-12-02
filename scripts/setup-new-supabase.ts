/**
 * Script to apply all migrations to a new Supabase project
 * Run with: npx tsx scripts/setup-new-supabase.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// New Supabase credentials
const SUPABASE_URL = 'https://kcdgdgcswrcbuvtcnmbw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjZGdkZ2Nzd3JjYnV2dGNubWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2Nzg4MDUsImV4cCI6MjA4MDI1NDgwNX0.SviNuiTZhEyTlb8SbWjzaEwAY8KTBVviTlHsJp_KCYQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function getMigrationFiles(): Promise<string[]> {
    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
    const files = fs.readdirSync(migrationsDir);

    // Sort files by timestamp in filename
    return files
        .filter(f => f.endsWith('.sql'))
        .sort();
}

async function applyMigration(filename: string): Promise<boolean> {
    try {
        const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
        const filePath = path.join(migrationsDir, filename);
        const sql = fs.readFileSync(filePath, 'utf-8');

        console.log(`\n📝 Applying: ${filename}`);
        console.log(`   SQL length: ${sql.length} characters`);

        // Note: We can't execute arbitrary SQL with the anon key
        // This will show what needs to be done
        console.log(`⚠️  This SQL needs to be executed in Supabase Dashboard SQL Editor`);

        return true;
    } catch (error) {
        console.error(`❌ Error reading ${filename}:`, error);
        return false;
    }
}

async function generateCombinedMigration() {
    console.log('🚀 Setting up new Supabase project');
    console.log(`📍 Target: ${SUPABASE_URL}\n`);

    const files = await getMigrationFiles();
    console.log(`Found ${files.length} migration files\n`);

    // Combine all migrations into one file
    const outputPath = path.join(process.cwd(), 'setup-complete-schema.sql');
    let combinedSQL = `-- Combined migration for new Supabase project\n`;
    combinedSQL += `-- Generated: ${new Date().toISOString()}\n`;
    combinedSQL += `-- Target: ${SUPABASE_URL}\n\n`;

    for (const file of files) {
        const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf-8');

        combinedSQL += `\n-- ========================================\n`;
        combinedSQL += `-- Migration: ${file}\n`;
        combinedSQL += `-- ========================================\n\n`;
        combinedSQL += sql;
        combinedSQL += `\n\n`;

        console.log(`✅ Added ${file}`);
    }

    fs.writeFileSync(outputPath, combinedSQL);

    console.log(`\n✅ Combined migration file created: setup-complete-schema.sql`);
    console.log(`\n📋 Next steps:`);
    console.log(`   1. Open Supabase Dashboard: https://supabase.com/dashboard/project/kcdgdgcswrcbuvtcnmbw`);
    console.log(`   2. Go to SQL Editor`);
    console.log(`   3. Copy and paste the contents of setup-complete-schema.sql`);
    console.log(`   4. Click Run`);
    console.log(`   5. Update your .env.local file with the new credentials`);
}

generateCombinedMigration().catch(console.error);
