const fs = require('fs');
const files = [
  'src/features/home/screens/HomeScreen.tsx',
  'src/features/users/screens/ProfileScreen.tsx',
  'src/features/users/screens/SettingsScreen.tsx',
  'src/features/auth/screens/LoginScreen.tsx',
  'src/features/auth/screens/RegisterScreen.tsx'
];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/from '\.\.\/(context|components|store|features|theme|hooks)/g, "from '../../../$1");
  fs.writeFileSync(f, content);
});
