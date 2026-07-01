const fs = require('fs');
const path = require('path');

// 1. Fix UI and layout components
const uiDir = path.join(__dirname, 'src/components/ui');
const layoutDir = path.join(__dirname, 'src/components/layout');

function fixComponents(dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(file => {
    if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const p = path.join(dir, file);
      let c = fs.readFileSync(p, 'utf8');
      c = c.replace(/from '\.\.\/context/g, "from '../../context");
      c = c.replace(/from '\.\.\/theme/g, "from '../../theme");
      c = c.replace(/from '\.\.\/utils/g, "from '../../utils");
      fs.writeFileSync(p, c);
    }
  });
}
fixComponents(uiDir);
fixComponents(layoutDir);

// 2. Fix slices
function replaceInFile(filePath, replacements) {
  const p = path.join(__dirname, filePath);
  if (!fs.existsSync(p)) return;
  let c = fs.readFileSync(p, 'utf8');
  for (const [search, replace] of replacements) {
    c = c.split(search).join(replace);
  }
  fs.writeFileSync(p, c);
}

replaceInFile('src/features/auth/store/authSlice.ts', [
  ["from '../../../../services/secureStorage'", "from '../../../services/secureStorage'"],
  ["from '../../api/authService'", "from '../api/authService'"],
  ["from '../../schemas/auth.schema'", "from '../schemas/auth.schema'"]
]);

replaceInFile('src/features/comparison/store/comparisonSlice.ts', [
  ["from '../../api/comparisonService'", "from '../api/comparisonService'"],
  ["from '../../../auth/store/authSlice'", "from '../../auth/store/authSlice'"],
  ["from './store'", "from '../../../store/store'"]
]);

replaceInFile('src/features/documents/store/documentSlice.ts', [
  ["from '../../api/documentService'", "from '../api/documentService'"],
  ["from '../../../../services/prettify.service'", "from '../../../services/prettify.service'"],
  ["from '../../../folders/store/folderSlice'", "from '../../folders/store/folderSlice'"],
  ["from './store'", "from '../../../store/store'"]
]);

replaceInFile('src/features/folders/store/folderSlice.ts', [
  ["from '../../api/folderService'", "from '../api/folderService'"],
  ["from '../../../documents/api/documentService'", "from '../../documents/api/documentService'"]
]);

replaceInFile('src/features/comparison/screens/CompareScreen.tsx', [
  ["from '../../../store/comparisonSlice'", "from '../store/comparisonSlice'"]
]);

console.log("Paths fixed!");
