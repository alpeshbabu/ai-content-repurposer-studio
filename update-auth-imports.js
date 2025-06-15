const fs = require('fs');
const path = require('path');

// Files to update based on the build errors
const filesToUpdate = [
  'src/app/api/content/route.ts',
  'src/app/api/settings/route.ts',
  'src/app/api/subscription/route.ts',
  'src/app/api/team/invite/route.ts',
  'src/app/api/team/member/[memberId]/route.ts',
  'src/app/api/team/route.ts',
  'src/app/dashboard/new/page.tsx',
  'src/app/dashboard/page.tsx',
  'src/app/dashboard/settings/page.tsx',
  'src/app/dashboard/settings/subscription/page.tsx',
  'src/app/dashboard/settings/team/page.tsx',
];

// Patterns to match and replace
const patterns = [
  {
    // ../auth/[...nextauth]/route
    search: /from\s+['"]\.\.\/auth\/\[\.\.\.(nextauth|nextauth)]\/route['"]/g,
    replace: "from '@/lib/auth'"
  },
  {
    // ../../auth/[...nextauth]/route
    search: /from\s+['"]\.\.\/\.\.\/auth\/\[\.\.\.(nextauth|nextauth)]\/route['"]/g,
    replace: "from '@/lib/auth'"
  },
  {
    // ../../../auth/[...nextauth]/route
    search: /from\s+['"]\.\.\/\.\.\/\.\.\/auth\/\[\.\.\.(nextauth|nextauth)]\/route['"]/g,
    replace: "from '@/lib/auth'"
  },
  {
    // @/app/api/auth/[...nextauth]/route
    search: /from\s+['"]@\/app\/api\/auth\/\[\.\.\.(nextauth|nextauth)]\/route['"]/g,
    replace: "from '@/lib/auth'"
  }
];

// Process each file
filesToUpdate.forEach(filePath => {
  try {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      
      patterns.forEach(pattern => {
        if (pattern.search.test(content)) {
          content = content.replace(pattern.search, pattern.replace);
          modified = true;
        }
      });
      
      if (modified) {
        fs.writeFileSync(filePath, content);
        console.log(`Updated imports in ${filePath}`);
      } else {
        console.log(`No changes needed in ${filePath}`);
      }
    } else {
      console.log(`File not found: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
});

console.log('Import update completed'); 