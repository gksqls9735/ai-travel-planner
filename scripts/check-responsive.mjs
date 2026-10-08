import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'src/features/layout/responsive.ts',
  '.codex/harness/responsive-ui.md',
];

const missing = requiredFiles.filter((file) => !fs.existsSync(path.join(root, file)));
if (missing.length) {
  console.error(`Responsive harness files are missing:\n${missing.join('\n')}`);
  process.exit(1);
}

const harness = fs.readFileSync(path.join(root, '.codex/harness/responsive-ui.md'), 'utf8');
for (const width of [320, 360, 375, 390, 412, 430, 768, 1024]) {
  if (!harness.includes(`${width}px`)) {
    console.error(`Responsive harness does not include the ${width}px viewport.`);
    process.exit(1);
  }
}

const preferences = fs.readFileSync(path.join(root, 'src/app/preferences.tsx'), 'utf8');
const sourceChecks = [
  [preferences.includes("flexWrap: 'wrap'"), 'Preference option grids must use flexWrap.'],
  [preferences.includes('minWidth: 0'), 'Fluid preference rows must include minWidth: 0.'],
  [!preferences.includes('<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.people'), 'Required companion choices must not use a horizontal ScrollView.'],
];

for (const [passed, message] of sourceChecks) {
  if (!passed) {
    console.error(message);
    process.exit(1);
  }
}

console.log('Responsive harness and required adaptive option-grid rules are present.');
