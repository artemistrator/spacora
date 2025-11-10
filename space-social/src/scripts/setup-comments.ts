import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Comments Setup Script');
console.log('====================');

console.log('\nTo set up the comments functionality, please run the following SQL in your Supabase dashboard:\n');

try {
  const migrationPath = join(__dirname, 'migrations', '001_create_post_comments_table.sql');
  const sqlContent = readFileSync(migrationPath, 'utf8');
  console.log(sqlContent);
} catch (error) {
  console.error('Error reading migration file:', error);
  console.log('\nPlease check the file: src/scripts/migrations/001_create_post_comments_table.sql');
}

console.log('\nAfter running this SQL, the comments feature will be enabled in your application.');