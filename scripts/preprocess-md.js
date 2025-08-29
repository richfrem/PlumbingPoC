const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../vite-app/.env') }); // Load .env from vite-app

const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL;

const filesToProcess = [
  'TASKS.md',
  'agents/README.md',
  'agents/frontend-developer-mcp.md',
  'agents/ui-designer-mcp.md',
  'vite-app/SUPABASE_DATABASE_AND_AUTH_SETUP.md',
];

filesToProcess.forEach(filePath => {
  const fullPath = path.resolve(__dirname, '..', filePath);
  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    content = content.replace(/\{\{FRONTEND_BASE_URL\}\} /g, FRONTEND_BASE_URL);
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Processed: ${filePath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
});

console.log('Markdown pre-processing complete.');