/**
 * Script to import data from JSON files to Supabase
 * Run with: npx tsx scripts/import-data.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing environment variables');
    console.error('Make sure you updated .env.local with the NEW project credentials!');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Tables to import (in order of dependencies)
const TABLES = [
    'origins',
    'policy_types',
    'clients',
    'insurance_companies',
    'policies',
    'tasks',
    'renewals',
    'funnel_configurations',
    'funnel_stages',
    'funnel_activity_templates',
    'opportunities',
    'funnel_activities',
];

async function importTable(tableName: string) {
    try {
        const exportDir = path.join(process.cwd(), 'data-export');
        const filePath = path.join(exportDir, `${tableName}.json`);

        if (!fs.existsSync(filePath)) {
            console.log(`⏭️  Skipping ${tableName} (no data file found)`);
            return 0;
        }

        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const records = JSON.parse(fileContent);

        if (!Array.isArray(records) || records.length === 0) {
            console.log(`⏭️  Skipping ${tableName} (no records)`);
            return 0;
        }

        console.log(`📥 Importing ${records.length} records to ${tableName}...`);

        const { error } = await supabase
            .from(tableName)
            .insert(records);

        if (error) {
            console.error(`❌ Error importing ${tableName}:`, error);
            return 0;
        }

        console.log(`✅ Imported ${records.length} records to ${tableName}`);
        return records.length;
    } catch (err) {
        console.error(`❌ Error importing ${tableName}:`, err);
        return 0;
    }
}

async function importAllData() {
    console.log('🚀 Starting data import...');
    console.log(`📍 Target: ${SUPABASE_URL}\n`);

    let totalRecords = 0;

    for (const table of TABLES) {
        const count = await importTable(table);
        totalRecords += count;
    }

    console.log('\n✅ Import complete!');
    console.log(`📊 Total records imported: ${totalRecords}`);
}

importAllData().catch(console.error);
