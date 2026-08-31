const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const https = require('https');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..', '..');
const outDir = path.resolve(rootDir, 'frontend', 'out');
const token = process.env.GITHUB_TOKEN || process.argv[2] || '';
const remoteUrl = 'https://github.com/rpruthvi785-alt/inten-mission.git';
const owner = 'rpruthvi785-alt';
const repo = 'inten-mission';

async function deployBoth() {
  console.log('=== STEP 1: PUBLISHING TO GH-PAGES BRANCH ===');
  
  const gitDir = path.join(outDir, '.git');
  if (fs.existsSync(gitDir)) {
    fs.rmSync(gitDir, { recursive: true, force: true });
  }

  // Ensure .nojekyll
  fs.writeFileSync(path.join(outDir, '.nojekyll'), '');

  console.log('[Deploy] Initializing git in out directory...');
  await git.init({ fs, dir: outDir, defaultBranch: 'gh-pages' });
  await git.addRemote({ fs, dir: outDir, remote: 'origin', url: remoteUrl });

  function getAllFiles(dir, base = '') {
    let results = [];
    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of list) {
      if (item.name === '.git') continue;
      const rel = base ? base + '/' + item.name : item.name;
      if (item.isDirectory()) {
        results = results.concat(getAllFiles(path.join(dir, item.name), rel));
      } else {
        results.push(rel);
      }
    }
    return results;
  }

  const files = getAllFiles(outDir);
  console.log(`[Deploy] Staging ${files.length} export files...`);
  for (const f of files) {
    await git.add({ fs, dir: outDir, filepath: f });
  }

  console.log('[Deploy] Committing to gh-pages branch...');
  const sha = await git.commit({
    fs,
    dir: outDir,
    author: { name: 'rpruthvi785', email: 'rpruthvi785@users.noreply.github.com' },
    message: 'deploy: production Three-Way Match Engine frontend with Render backend connection',
  });
  console.log('[Deploy] Commit created:', sha);

  console.log('[Deploy] Force pushing to origin gh-pages...');
  const pushRes = await git.push({
    fs,
    http,
    dir: outDir,
    remote: 'origin',
    ref: 'gh-pages',
    remoteRef: 'gh-pages',
    force: true,
    onAuth: () => ({ username: token }),
  });
  console.log('[Deploy] gh-pages push result:', JSON.stringify(pushRes));

  console.log('\n=== STEP 2: PUSHING SOURCE CODE TO MAIN BRANCH ===');
  try {
    console.log('[Source] Fetching origin main...');
    await git.fetch({
      fs,
      http,
      dir: rootDir,
      remote: 'origin',
      ref: 'main',
      depth: 5,
      onAuth: () => ({ username: token }),
    });
  } catch (e) {
    console.log('[Source] Fetch notice:', e.message);
  }

  const allSourceFiles = [
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

  for (const f of allSourceFiles) {
    const full = path.join(rootDir, f);
    if (fs.existsSync(full)) {
      await git.add({ fs, dir: rootDir, filepath: f });
    }
  }

  try {
    const commitSha = await git.commit({
      fs,
      dir: rootDir,
      author: { name: 'rpruthvi785', email: 'rpruthvi785@users.noreply.github.com' },
      message: 'fix: complete Three-Way Match Engine with production Render backend and multi-device portability',
    });
    console.log('[Source] Commit created:', commitSha);
  } catch (e) {
    console.log('[Source] Commit notice:', e.message);
  }

  try {
    console.log('[Source] Pushing to origin main...');
    const mainPush = await git.push({
      fs,
      http,
      dir: rootDir,
      remote: 'origin',
      ref: 'main',
      remoteRef: 'main',
      force: true,
      onAuth: () => ({ username: token }),
    });
    console.log('[Source] Main push result:', JSON.stringify(mainPush));
  } catch (e) {
    console.log('[Source] Push to main notice:', e.message);
  }

  console.log('\n======================================================');
  console.log('🎉 SUCCESSFULLY PUBLISHED DIRECTLY TO GITHUB PAGES!');
  console.log('Live URL: https://rpruthvi785-alt.github.io/inten-mission/');
  console.log('======================================================\n');
}

deployBoth().catch(console.error);
