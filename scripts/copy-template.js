#!/usr/bin/env node

/**
 * Copies the bundled CMS-1500 PDF template to your project's public directory.
 *
 * Usage:
 *   npx cms1500-copy-template [target-dir]
 *
 * Examples:
 *   npx cms1500-copy-template              → copies to ./public/cms-1500-template.pdf
 *   npx cms1500-copy-template public/forms  → copies to ./public/forms/cms-1500-template.pdf
 */

const fs = require('fs');
const path = require('path');

const templateSrc = path.resolve(__dirname, '..', 'assets', 'cms-1500-template.pdf');
const targetDir = process.argv[2] || 'public';
const targetPath = path.resolve(process.cwd(), targetDir, 'cms-1500-template.pdf');

// Ensure target directory exists
const dir = path.dirname(targetPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

fs.copyFileSync(templateSrc, targetPath);
console.log(`CMS-1500 template copied to: ${targetPath}`);
console.log(`\nUse it in your app:`);
console.log(`  <CMS1500Form data={data} pdfTemplateUrl="/${path.relative(path.resolve(process.cwd(), 'public'), targetPath)}" />`);
