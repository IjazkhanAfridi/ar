import dotenv from 'dotenv';
dotenv.config();
import { db } from './src/config/database.js';
import { experiences } from './src/models/schema.js';
import { saveExperienceHtml, saveMultipleImageExperienceHtml } from './src/utils/experienceGenerator.js';
import { eq } from 'drizzle-orm';

// Simple script to regenerate all experience HTML files with updated transformation logic.
// Usage: node regenerate-experiences.js
// Optional env vars (see experienceGenerator.js): AR_POSITION_SCALE, AR_FLATTEN_IMAGES, etc.

async function run() {
  console.log('🔄 Regenerating AR experience HTML files...');
  const all = await db.select().from(experiences);
  let success = 0;
  for (const exp of all) {
    try {
      if (exp.targetsConfig && exp.targetsConfig.length) {
        saveMultipleImageExperienceHtml(exp);
      } else {
        saveExperienceHtml(exp);
      }
      success++;
      console.log(`✅ Regenerated experience ${exp.id} (${exp.title})`);
    } catch (e) {
      console.error(`❌ Failed to regenerate ${exp.id}:`, e.message);
    }
  }
  console.log(`Done. ${success}/${all.length} regenerated.`);
  process.exit(0);
}

run().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
