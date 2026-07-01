const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const moves = [
  // UI Components
  { from: 'components/Button.tsx', to: 'components/ui/Button.tsx' },
  { from: 'components/Input.tsx', to: 'components/ui/Input.tsx' },
  { from: 'components/Badge.tsx', to: 'components/ui/Badge.tsx' },
  { from: 'components/Card.tsx', to: 'components/ui/Card.tsx' },
  { from: 'components/Dialogs.tsx', to: 'components/ui/Dialogs.tsx' },
  { from: 'components/Toast.tsx', to: 'components/ui/Toast.tsx' },
  { from: 'components/SkeletonLoader.tsx', to: 'components/ui/SkeletonLoader.tsx' },
  { from: 'components/GradientLine.tsx', to: 'components/ui/GradientLine.tsx' },
  { from: 'components/AnimatedPressable.tsx', to: 'components/ui/AnimatedPressable.tsx' },
  { from: 'components/CognitiveLoadBadge.tsx', to: 'components/ui/CognitiveLoadBadge.tsx' },
  { from: 'components/SectionLabel.tsx', to: 'components/ui/SectionLabel.tsx' },

  // Layout Components
  { from: 'components/BulkActionBar.tsx', to: 'components/layout/BulkActionBar.tsx' },

  // Redux Slices
  { from: 'store/authSlice.ts', to: 'features/auth/store/authSlice.ts' },
  { from: 'store/documentSlice.ts', to: 'features/documents/store/documentSlice.ts' },
  { from: 'store/folderSlice.ts', to: 'features/folders/store/folderSlice.ts' },
  { from: 'store/comparisonSlice.ts', to: 'features/comparison/store/comparisonSlice.ts' },

  // Split Users -> Profile
  { from: 'features/users/screens/ProfileScreen.tsx', to: 'features/profile/screens/ProfileScreen.tsx' },
  { from: 'features/users/api/userService.ts', to: 'features/profile/api/userService.ts' },

  // Split Users -> Settings
  { from: 'features/users/screens/SettingsScreen.tsx', to: 'features/settings/screens/SettingsScreen.tsx' },
  { from: 'features/users/api/settingsService.ts', to: 'features/settings/api/settingsService.ts' },
];

function ensureDir(filePath) {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
}

moves.forEach(m => {
  const fromPath = path.join(srcDir, m.from);
  const toPath = path.join(srcDir, m.to);
  if (fs.existsSync(fromPath)) {
    ensureDir(toPath);
    fs.renameSync(fromPath, toPath);
    console.log(`Moved: ${m.from} -> ${m.to}`);
  }
});

// Since rewriting all imports via Regex is highly error-prone in a full app,
// the safest way is to leave barrel files in the old locations that just re-export,
// OR systematically replace paths in all files.
// Let's create barrel files for components temporarily to avoid massive breakages,
// and rewrite the specific slice paths inside store.ts.
