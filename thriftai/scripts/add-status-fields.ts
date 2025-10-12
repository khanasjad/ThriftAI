/**
 * Add status fields to data-sources/page.tsx
 */

import fs from 'fs';
import path from 'path';

const filePath = path.join(__dirname, '../src/app/data-sources/page.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Sources that need status added (all except Database and Amazon which already have it)
const sources = [
  'Keepa API',
  'Sustainalytics ESG API',
  'Alpha Vantage API',
  'eBay Browse API',
  'CDP (Carbon Disclosure Project)',
  'Clearbit Company API',
  'Open Supply Hub',
  'Walmart Open API',
  'EWG Skin Deep Database',
  'EPEAT Registry',
  'ReviewMeta',
  'Google Trends API',
  'ENERGY STAR API',
  'Consumer Reports',
  'CPSC Recall Database',
  'Trustpilot API',
  'Fair Trade Certified',
  'B Corp Directory',
  'UPC Item Database'
];

// For each source, add status field before the closing brace
sources.forEach(sourceName => {
  // Find the source by name and add status field
  const regex = new RegExp(
    `(name: '${sourceName.replace(/[()]/g, '\\$&')}',[\\s\\S]*?highlights: \\[[\\s\\S]*?\\])(\\s*})`,
    'g'
  );

  content = content.replace(regex, (match, p1, p2) => {
    // Check if status already exists
    if (p1.includes('status:')) {
      return match;
    }
    return `${p1},\n    status: 'Not Implemented' as const,\n    statusNote: 'Not yet integrated'${p2}`;
  });
});

fs.writeFileSync(filePath, content);
console.log('✅ Successfully added status fields to all data sources');
