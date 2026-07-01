const fs = require('fs');

function fixAuthSlice() {
  const p = 'src/features/auth/store/authSlice.ts';
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace(/from '\.\.\/services/g, "from '../../../../services");
  c = c.replace(/from '\.\.\/features\/auth\/api/g, "from '../../api");
  c = c.replace(/from '\.\.\/features\/auth\/schemas/g, "from '../../schemas");
  fs.writeFileSync(p, c);
}

function fixDocumentSlice() {
  const p = 'src/features/documents/store/documentSlice.ts';
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace(/from '\.\.\/features\/documents\/api/g, "from '../../api");
  c = c.replace(/from '\.\.\/services/g, "from '../../../../services");
  c = c.replace(/from '\.\.\/store\/store'/g, "from '../../../../store/store'");
  c = c.replace(/from '\.\.\/store\/folderSlice'/g, "from '../../../folders/store/folderSlice'");
  c = c.replace(/from '\.\/folderSlice'/g, "from '../../../folders/store/folderSlice'");
  fs.writeFileSync(p, c);
}

function fixFolderSlice() {
  const p = 'src/features/folders/store/folderSlice.ts';
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace(/from '\.\.\/features\/folders\/api/g, "from '../../api");
  c = c.replace(/from '\.\.\/features\/documents\/api/g, "from '../../../documents/api");
  fs.writeFileSync(p, c);
}

function fixComparisonSlice() {
  const p = 'src/features/comparison/store/comparisonSlice.ts';
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace(/from '\.\.\/features\/comparison\/api/g, "from '../../api");
  c = c.replace(/from '\.\.\/store\/store'/g, "from '../../../../store/store'");
  c = c.replace(/from '\.\.\/store\/authSlice'/g, "from '../../../auth/store/authSlice'");
  c = c.replace(/from '\.\/authSlice'/g, "from '../../../auth/store/authSlice'");
  fs.writeFileSync(p, c);
}

function fixProfileScreen() {
  const p = 'src/features/profile/screens/ProfileScreen.tsx';
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace(/from '\.\.\/api\/userService'/g, "from '../../profile/api/userService'");
  c = c.replace(/from '\.\.\/api\/userService'/g, "from '../api/userService'");
  fs.writeFileSync(p, c);
}

function fixSettingsScreen() {
  const p = 'src/features/settings/screens/SettingsScreen.tsx';
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace(/from '\.\.\/api\/settingsService'/g, "from '../../settings/api/settingsService'");
  c = c.replace(/from '\.\.\/api\/settingsService'/g, "from '../api/settingsService'");
  fs.writeFileSync(p, c);
}

function fixUserService() {
  const p = 'src/features/profile/api/userService.ts';
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace(/from '\.\.\/\.\.\/services/g, "from '../../../../services");
  c = c.replace(/from '\.\.\/auth/g, "from '../../../auth");
  fs.writeFileSync(p, c);
}

function fixSettingsService() {
  const p = 'src/features/settings/api/settingsService.ts';
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace(/from '\.\.\/\.\.\/services/g, "from '../../../../services");
  fs.writeFileSync(p, c);
}

try { fixAuthSlice(); } catch (e) {}
try { fixDocumentSlice(); } catch (e) {}
try { fixFolderSlice(); } catch (e) {}
try { fixComparisonSlice(); } catch (e) {}
try { fixProfileScreen(); } catch (e) {}
try { fixSettingsScreen(); } catch (e) {}
try { fixUserService(); } catch (e) {}
try { fixSettingsService(); } catch (e) {}

console.log("Internal imports fixed");
