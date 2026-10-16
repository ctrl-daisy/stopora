import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const envLocalPath = path.join(rootDir, '.env.local');
const envPath = path.join(rootDir, '.env');

const DEFAULT_ENV = `DATABASE_URL="postgresql://neondb_owner:npg_U5AlELsP7Mrq@ep-dry-bird-baa1wni4.c-8.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
ORS_API_KEY=""
GEO_PROVIDER=mock
FUEL_PRICE_NGN_PER_LITRE=1355
`;

if (!fs.existsSync(envLocalPath) && !fs.existsSync(envPath) && !process.env.DATABASE_URL) {
  console.log('[stopora] No .env.local detected. Creating default .env.local with shared Neon database and mock provider...');
  fs.writeFileSync(envLocalPath, DEFAULT_ENV, 'utf8');
}
