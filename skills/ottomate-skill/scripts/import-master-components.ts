/**
 * scripts/import-master-components.ts
 *
 * Bulk import master_components from a YAML batch file (CC-2.3 Path 3).
 *
 * Usage:
 *   tsx scripts/import-master-components.ts seed-batch.yaml
 *   tsx scripts/import-master-components.ts seed-batch.yaml --dry-run
 *   tsx scripts/import-master-components.ts seed-batch.yaml --skip-existing
 *
 * The YAML batch describes components; the script:
 *   1. Validates each entry against a schema
 *   2. Reads source code from `source_file` path (or `source_inline`)
 *   3. Writes source to /mnt/storage/ottomate/assets/components/<id>/<primary_file>
 *   4. Inserts master_components row pointing to filesystem path
 *   5. Reports summary (added / skipped / errors)
 *
 * Run on the server (where /mnt/storage/ottomate/assets/ is the asset dir).
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { z } from 'zod';
import yaml from 'js-yaml';
import Database from 'better-sqlite3';

// ============================================================================
// Configuration (override via env)
// ============================================================================

const DB_PATH = process.env.OTTOMATE_DB_PATH ?? '/app/data/ottomate.db';
const ASSET_ROOT = process.env.OTTOMATE_ASSET_ROOT ?? '/mnt/storage/ottomate/assets/components';

// ============================================================================
// Validation schema
// ============================================================================

const ComponentEntry = z.object({
  id: z.string().regex(/^mc-[a-z][a-z0-9-]+$/, 'id must match mc-<kebab-name>'),
  name: z.string().min(1).max(80),
  category: z.string().min(1),
  description: z.string().min(1).max(500),
  framework_tags: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  dependencies: z.array(z.string()).default([]),
  variants: z.array(z.string()).optional().default([]),
  preview_url: z.string().url().optional().nullable(),
  license: z.string().optional().nullable(),
  primary_file: z.string().default('react.tsx'),
  source_file: z.string().optional(), // path relative to YAML file
  source_inline: z.string().optional(), // inline source code
  additional_files: z
    .record(z.string(), z.string()) // filename → contents (or path)
    .optional()
    .default({}),
});

const Batch = z.object({
  version: z.literal(1),
  components: z.array(ComponentEntry).min(1),
});

type ComponentEntryT = z.infer<typeof ComponentEntry>;

// ============================================================================
// Main
// ============================================================================

function main() {
  const args = process.argv.slice(2);
  const yamlPath = args.find((a) => !a.startsWith('--'));
  const dryRun = args.includes('--dry-run');
  const skipExisting = args.includes('--skip-existing');

  if (!yamlPath) {
    console.error('Usage: tsx scripts/import-master-components.ts <seed-batch.yaml> [--dry-run] [--skip-existing]');
    process.exit(1);
  }

  const yamlAbsPath = resolve(yamlPath);
  const yamlContent = readFileSync(yamlAbsPath, 'utf8');
  const yamlDir = dirname(yamlAbsPath);

  // Parse + validate
  let parsed: unknown;
  try {
    parsed = yaml.load(yamlContent);
  } catch (e) {
    console.error('YAML parse failed:', (e as Error).message);
    process.exit(1);
  }

  const batch = Batch.parse(parsed);
  console.log(`Parsed ${batch.components.length} components from ${yamlPath}`);

  // Connect DB
  const db = dryRun ? null : new Database(DB_PATH);

  if (db && !dryRun) {
    // Sanity: confirm table exists with expected shape
    const tableCheck = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='master_components'",
      )
      .get();
    if (!tableCheck) {
      console.error('ERROR: master_components table not found. Run migrations first.');
      process.exit(1);
    }
  }

  // Iterate + import
  const summary = { added: 0, skipped: 0, errors: 0, errorsList: [] as string[] };

  for (const entry of batch.components) {
    try {
      const result = importOne(entry, yamlDir, db, dryRun, skipExisting);
      if (result === 'added') summary.added++;
      else if (result === 'skipped') summary.skipped++;
    } catch (e) {
      summary.errors++;
      summary.errorsList.push(`${entry.id}: ${(e as Error).message}`);
    }
  }

  // Summary
  console.log('\n--- Summary ---');
  console.log(`Added:   ${summary.added}`);
  console.log(`Skipped: ${summary.skipped}`);
  console.log(`Errors:  ${summary.errors}`);
  if (summary.errors > 0) {
    console.log('\nErrors:');
    for (const err of summary.errorsList) console.log(`  ${err}`);
  }
  if (dryRun) {
    console.log('\n[DRY RUN — no changes written]');
  }

  if (db) db.close();
  process.exit(summary.errors > 0 ? 1 : 0);
}

// ============================================================================
// Import one component
// ============================================================================

function importOne(
  entry: ComponentEntryT,
  yamlDir: string,
  db: Database.Database | null,
  dryRun: boolean,
  skipExisting: boolean,
): 'added' | 'skipped' {
  const compDir = join(ASSET_ROOT, entry.id);
  const primaryPath = join(compDir, entry.primary_file);

  // Existence check
  if (db) {
    const existing = db
      .prepare('SELECT id FROM master_components WHERE id = ?')
      .get(entry.id);
    if (existing) {
      if (skipExisting) {
        console.log(`[skip] ${entry.id} already exists`);
        return 'skipped';
      }
      throw new Error('already exists; use --skip-existing or remove from batch');
    }
  }

  // Resolve source code
  let sourceContent: string;
  if (entry.source_inline) {
    sourceContent = entry.source_inline;
  } else if (entry.source_file) {
    const srcPath = resolve(yamlDir, entry.source_file);
    if (!existsSync(srcPath)) {
      throw new Error(`source_file not found: ${srcPath}`);
    }
    sourceContent = readFileSync(srcPath, 'utf8');
  } else {
    throw new Error('must specify either source_file or source_inline');
  }

  if (sourceContent.trim().length === 0) {
    throw new Error('source content is empty');
  }

  // Write filesystem (unless dry-run)
  if (!dryRun) {
    mkdirSync(compDir, { recursive: true });
    writeFileSync(primaryPath, sourceContent, 'utf8');

    // Additional files (e.g., types.ts, README.md)
    for (const [filename, fileVal] of Object.entries(entry.additional_files)) {
      const additionalPath = join(compDir, filename);
      // fileVal could be path-relative or inline
      const content =
        fileVal.startsWith('./') || fileVal.startsWith('../')
          ? readFileSync(resolve(yamlDir, fileVal), 'utf8')
          : fileVal;
      writeFileSync(additionalPath, content, 'utf8');
    }
  }

  // Insert DB row
  if (!dryRun && db) {
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO master_components
       (id, name, category, description, source_code_path, primary_file,
        framework_tags, tags, dependencies, variants_json, preview_url,
        license_note, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      entry.id,
      entry.name,
      entry.category,
      entry.description,
      compDir + '/',
      entry.primary_file,
      JSON.stringify(entry.framework_tags),
      JSON.stringify(entry.tags),
      JSON.stringify(entry.dependencies),
      JSON.stringify(entry.variants),
      entry.preview_url ?? null,
      entry.license ?? null,
      now,
      now,
    );
  }

  console.log(`[${dryRun ? 'dry' : 'add'}] ${entry.id} (${entry.category}) → ${compDir}/`);
  return 'added';
}

main();

/**
 * Example seed-batch.yaml:
 *
 * version: 1
 * components:
 *   - id: mc-button-magnetic
 *     name: "Magnetic Button"
 *     category: buttons-actions
 *     description: "Cursor pulls the button toward it on hover. High user interest."
 *     framework_tags: [react, next]
 *     tags: [animated, modern, interactive]
 *     dependencies: ["framer-motion"]
 *     variants: ["primary", "ghost", "icon-only"]
 *     preview_url: "https://ui.aceternity.com/components/magnetic-button"
 *     license: "MIT (Aceternity UI)"
 *     primary_file: react.tsx
 *     source_file: ./sources/mc-button-magnetic/react.tsx
 *     additional_files:
 *       README.md: ./sources/mc-button-magnetic/README.md
 *
 *   - id: mc-stat-card-trending
 *     name: "Trending Stat Card"
 *     category: display
 *     description: "Animated number with up/down sparkline."
 *     framework_tags: [react]
 *     tags: [animated, modern]
 *     dependencies: ["recharts"]
 *     primary_file: react.tsx
 *     source_inline: |
 *       'use client';
 *       import { Sparkline } from 'recharts';
 *       export function TrendingStat({ ...props }) {
 *         // ... full component code ...
 *       }
 */
