// Quick script to help identify and fix return type issues
const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/controllers/PortfolioController.ts',
  'src/controllers/TradingController.ts'
];

filesToFix.forEach(file => {
  const filePath = path.join(__dirname, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix patterns where we have res.status().json() without return
  content = content.replace(
    /(\s+)(res\.status\(\d+\)\.json\([^)]+\);)(\s*})/g,
    '$1$2$1return;$3'
  );
  
  fs.writeFileSync(filePath, content);
  console.log(`Fixed ${file}`);
});