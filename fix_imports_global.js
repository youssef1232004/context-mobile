const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

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

// Mapping from old exact paths (relative to src/) to new exact paths
// It's easier to resolve imports to absolute paths relative to src/, then re-relativize
const oldToNew = {
  'components/Button': 'components/ui/Button',
  'components/Input': 'components/ui/Input',
  'components/Badge': 'components/ui/Badge',
  'components/Card': 'components/ui/Card',
  'components/Dialogs': 'components/ui/Dialogs',
  'components/Toast': 'components/ui/Toast',
  'components/SkeletonLoader': 'components/ui/SkeletonLoader',
  'components/GradientLine': 'components/ui/GradientLine',
  'components/AnimatedPressable': 'components/ui/AnimatedPressable',
  'components/CognitiveLoadBadge': 'components/ui/CognitiveLoadBadge',
  'components/SectionLabel': 'components/ui/SectionLabel',
  'components/BulkActionBar': 'components/layout/BulkActionBar',
  
  'store/authSlice': 'features/auth/store/authSlice',
  'store/documentSlice': 'features/documents/store/documentSlice',
  'store/folderSlice': 'features/folders/store/folderSlice',
  'store/comparisonSlice': 'features/comparison/store/comparisonSlice',

  'features/users/screens/ProfileScreen': 'features/profile/screens/ProfileScreen',
  'features/users/screens/SettingsScreen': 'features/settings/screens/SettingsScreen',
  
  'features/users/api/userService': 'features/profile/api/userService',
  'features/users/api/settingsService': 'features/settings/api/settingsService',
};

// Also we need to fix relative imports *within* the moved files themselves!
// For example, authSlice.ts was in src/store/ now it's in src/features/auth/store/
// It imports secureStorage from '../services/secureStorage' -> now needs to be '../../../services/secureStorage'

function resolveAlias(filePath, importPath) {
  // If not relative, leave it
  if (!importPath.startsWith('.')) return importPath;
  
  const currentDir = path.dirname(filePath);
  const absoluteImportPath = path.resolve(currentDir, importPath);
  
  // get relative to src
  const srcRelative = path.relative(srcDir, absoluteImportPath).replace(/\\/g, '/');
  
  // check if it matches an old path (ignoring extension)
  const matchingKey = Object.keys(oldToNew).find(old => srcRelative === old || srcRelative.startsWith(old + '/'));
  
  if (matchingKey) {
    const newSrcRelative = srcRelative.replace(matchingKey, oldToNew[matchingKey]);
    const newAbsolute = path.resolve(srcDir, newSrcRelative);
    let newImport = path.relative(currentDir, newAbsolute).replace(/\\/g, '/');
    if (!newImport.startsWith('.')) newImport = './' + newImport;
    return newImport;
  }
  
  return importPath;
}

allFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let hasChanges = false;
  
  // Replace import statements: import { X } from '...'; or import X from '...';
  const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
  
  let newContent = content.replace(importRegex, (match, p1) => {
    const newP1 = resolveAlias(file, p1);
    if (p1 !== newP1) {
      hasChanges = true;
      return match.replace(p1, newP1);
    }
    return match;
  });

  if (hasChanges) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated imports in ${path.relative(srcDir, file)}`);
  }
});
