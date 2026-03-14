import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const envPath = path.join(projectRoot, 'server', '.env');

if (!fs.existsSync(envPath)) {
  const envContent = 'JWT_SECRET=dev_jwt_secret_change_me\nPORT=5000\n# DATABASE_URL=postgresql://nextgen_user:password@localhost:5432/nextgen\n';
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('Created server/.env with default development values.');
} else {
  console.log('server/.env already exists.');
}
