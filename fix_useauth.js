const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

// 1. Fix inside useAuth.ts
function fixUseAuthContent() {
  const p = path.join(srcDir, 'features/auth/hooks/useAuth.ts');
  let c = fs.readFileSync(p, 'utf8');
  // It used to be in src/hooks/, so '../store/hooks' meant src/store/hooks
  // Now it's in src/features/auth/hooks/, so we need '../../../store/hooks'
  c = c.replace(/from '\.\.\/store\/hooks'/g, "from '../../../store/hooks'");
  c = c.replace(/from '\.\.\/features\/auth\/store\/authSlice'/g, "from '../store/authSlice'");
  c = c.replace(/from '\.\.\/store\/store'/g, "from '../../../store/store'");
  fs.writeFileSync(p, c);
}
fixUseAuthContent();

// 2. Fix across all files
const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        filelist.push(dirFile);
      }
    }
  });
  return filelist;
};

const allFiles = walkSync(srcDir);

allFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('useAuth')) {
    // If it's importing from '../../../hooks/useAuth' or similar, we need to fix it.
    // Instead of precise alias resolution, let's just use regex to replace imports of useAuth.
    // We can just rely on the IDE/tsc but since we want to fix it here:
    // It used to be in `hooks/useAuth`. Now it is in `features/auth/hooks/useAuth`.
    // It's safer to just let tsc tell us, or we can use a quick replace if we know the old path.
    const importRegex = /import\s+\{\s*useAuth\s*\}\s+from\s+['"]([^'"]+)['"]/g;
    let newContent = content.replace(importRegex, (match, p1) => {
      // If p1 ends with 'hooks/useAuth', we inject 'features/auth/' before it.
      // E.g., '../../hooks/useAuth' -> '../../features/auth/hooks/useAuth'
      // E.g., '../hooks/useAuth' -> '../features/auth/hooks/useAuth'
      if (p1.endsWith('hooks/useAuth') && !p1.includes('features')) {
        return match.replace('hooks/useAuth', 'features/auth/hooks/useAuth');
      }
      return match;
    });

    if (content !== newContent) {
      fs.writeFileSync(file, newContent, 'utf8');
      console.log(`Updated useAuth import in ${path.relative(srcDir, file)}`);
    }
  }
});
