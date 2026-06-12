const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

try {
  console.log('Running prisma generate...');
  execSync('prisma generate', { stdio: 'inherit' });
  
  const indexPath = path.join(__dirname, '../src/generated/client/index.ts');
  console.log(`Creating index.ts at ${indexPath}...`);
  fs.writeFileSync(indexPath, "export * from './client';\n");
  console.log('Postinstall completed successfully.');
} catch (error) {
  console.error('Postinstall script failed:', error);
  process.exit(1);
}
