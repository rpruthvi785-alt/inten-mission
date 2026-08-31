/**
 * Helper to commit and push all updates to GitHub main branch
 */
const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..', '..');
const token = process.env.GITHUB_TOKEN || process.argv[2] || '';

async function pushUpdates() {
  if (!token) {
    console.error('\n[Error] Please provide your GitHub Personal Access Token:');
    console.error('Usage: node backend/scripts/push-to-github.js <YOUR_GITHUB_TOKEN>\n');
    process.exit(1);
  }

  console.log('[Git] Staging modified files...');
  const filesToStage = [
    'package.json',
    'render.yaml',
    'Procfile',
    '.gitignore',
    '.github/workflows/deploy.yml',
    'backend/src/server.js',
    'backend/src/app.js',
    'backend/src/services/match.service.js',
    'backend/src/config/matchingRules.config.js',
    'backend/src/controllers/document.controller.js',
    'backend/scripts/test-phase6-7.js',
    'backend/scripts/deploy-gh-pages.js',
    'frontend/lib/api.ts',
    'frontend/app/login/page.tsx',
    'frontend/app/settings/page.tsx',
    'frontend/components/Navbar.tsx',
    'frontend/components/StatusBanner.tsx',
  ];

  for (const f of filesToStage) {
    const full = path.join(rootDir, f);
    if (fs.existsSync(full)) {
      await git.add({ fs, dir: rootDir, filepath: f });
    }
  }

  console.log('[Git] Creating commit...');
  const sha = await git.commit({
    fs,
    dir: rootDir,
    author: { name: 'rpruthvi785', email: 'rpruthvi785@users.noreply.github.com' },
    message: 'fix: complete Three-Way Match Engine with production Render backend connectivity and multi-device portability',
  });
  console.log('[Git] Commit SHA:', sha);

  console.log('[Git] Pushing to origin main...');
  const pushRes = await git.push({
    fs,
    http,
    dir: rootDir,
    remote: 'origin',
    ref: 'main',
    onAuth: () => ({ username: token }),
  });

  console.log('\n======================================================');
  console.log('✅ Successfully pushed updates to GitHub repository!');
  console.log('GitHub Actions will now automatically build and publish to GitHub Pages.');
  console.log('======================================================\n');
}

pushUpdates().catch(console.error);
