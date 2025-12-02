/**
 * Script to export all data from Supabase tables to JSON files
 * Run with: npx tsx scripts/export-data.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing environment variables');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Tables to export (in order of dependencies)
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

async function exportTable(tableName: string) {
    try {
        console.log(`📦 Exporting ${tableName}...`);

        const { data, error } = await supabase
            .from(tableName)
            .select('*');

        if (error) {
            console.error(`❌ Error exporting ${tableName}:`, error);
            return null;
        }

        const exportDir = path.join(process.cwd(), 'data-export');
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
        }

        const filePath = path.join(exportDir, `${tableName}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

        console.log(`✅ Exported ${data?.length || 0} records from ${tableName}`);
        return data;
    } catch (err) {
        console.error(`❌ Error exporting ${tableName}:`, err);
        return null;
    }
}

async function exportAllData() {
    console.log('🚀 Starting data export...\n');

    const results: Record<string, any> = {};

    for (const table of TABLES) {
        const data = await exportTable(table);
        results[table] = data;
    }

    // Create summary
    const summary = {
        exported_at: new Date().toISOString(),
        tables: Object.entries(results).map(([table, data]) => ({
            table,
            records: Array.isArray(data) ? data.length : 0
        })),
        supabase_url: SUPABASE_URL
    };

    const exportDir = path.join(process.cwd(), 'data-export');
    fs.writeFileSync(
        path.join(exportDir, '_summary.json'),
        JSON.stringify(summary, null, 2)
    );

    console.log('\n✅ Export complete!');
    console.log(`📁 Files saved to: ${exportDir}`);
    console.log('\nSummary:');
    summary.tables.forEach(({ table, records }) => {
        console.log(`  - ${table}: ${records} records`);
    });
}

exportAllData().catch(console.error);
