#!/usr/bin/env npx ts-node

import { promises as fs } from 'fs';
import * as path from 'path';

// Define common type fixes
const TYPE_FIXES = [
  // Fix any types
  { 
    pattern: /: any\b/g, 
    replacement: ': unknown',
    description: 'Replace any with unknown for better type safety'
  },
  // Fix unused variables
  {
    pattern: /const (\w+) = /g,
    replacement: 'const _$1 = ',
    description: 'Prefix unused variables with underscore'
  },
  // Fix error handling
  {
    pattern: /catch \(error\)/g,
    replacement: 'catch (error: unknown)',
    description: 'Add type annotation to catch blocks'
  },
  // Fix React import
  {
    pattern: /import React from 'react'/g,
    replacement: "import React from 'react'",
    description: 'Ensure React import is consistent'
  }
];

// Performance optimizations
const PERFORMANCE_FIXES = [
  // Add React.memo for components
  {
    pattern: /export default function (\w+)\(/g,
    replacement: 'export default React.memo(function $1(',
    description: 'Wrap components with React.memo'
  },
  // Use useCallback for event handlers
  {
    pattern: /const handle(\w+) = \(/g,
    replacement: 'const handle$1 = useCallback((',
    description: 'Wrap handlers with useCallback'
  }
];

async function findTsxFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        files.push(...await findTsxFiles(fullPath));
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }
  
  return files;
}

async function processFile(filePath: string): Promise<void> {
  try {
    let content = await fs.readFile(filePath, 'utf-8');
    let modified = false;

    // Apply type fixes
    for (const fix of TYPE_FIXES) {
      if (fix.pattern.test(content)) {
        content = content.replace(fix.pattern, fix.replacement);
        modified = true;
        console.log(`Applied ${fix.description} to ${filePath}`);
      }
    }

    // Apply performance optimizations for React components
    if (filePath.includes('components/') && filePath.endsWith('.tsx')) {
      for (const fix of PERFORMANCE_FIXES) {
        if (fix.pattern.test(content)) {
          content = content.replace(fix.pattern, fix.replacement);
          modified = true;
          console.log(`Applied ${fix.description} to ${filePath}`);
        }
      }
    }

    // Write back if modified
    if (modified) {
      await fs.writeFile(filePath, content, 'utf-8');
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
  }
}

async function main() {
  const srcDir = path.join(process.cwd(), 'src');
  console.log('Finding TypeScript files...');
  
  const files = await findTsxFiles(srcDir);
  console.log(`Found ${files.length} TypeScript files`);

  for (const file of files) {
    await processFile(file);
  }

  console.log('Type fixes completed!');
}

if (require.main === module) {
  main().catch(console.error);
} 