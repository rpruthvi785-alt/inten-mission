const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..', '..');
const outDir = path.resolve(rootDir, 'frontend', 'out');
const tempDir = path.resolve(rootDir, 'frontend', '.temp-deploy');
const token = process.env.GITHUB_TOKEN || process.argv[2] || '';
const remoteUrl = 'https://github.com/rpruthvi785-alt/inten-mission.git';

async function deployViaClone() {
  console.log('[Deploy] Preparing clean deploy directory...');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });

  console.log('[Deploy] Cloning gh-pages branch (depth 1)...');
  try {
    await git.clone({
      fs,
      http,
      dir: tempDir,
      url: remoteUrl,
      ref: 'gh-pages',
      singleBranch: true,
      depth: 1,
      onAuth: () => ({ username: token }),
    });
  } catch (err) {
    console.log('[Deploy] Branch clone notice (init new):', err.message);
    await git.init({ fs, dir: tempDir, defaultBranch: 'gh-pages' });
    await git.addRemote({ fs, dir: tempDir, remote: 'origin', url: remoteUrl });
  }

  // Remove old files in tempDir except .git
  const existingFiles = fs.readdirSync(tempDir);
  for (const f of existingFiles) {
    if (f !== '.git') {
      fs.rmSync(path.join(tempDir, f), { recursive: true, force: true });
    }
  }

  // Copy all files from outDir to tempDir
  function copyRecursive(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === '.git') continue;
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        copyRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  console.log('[Deploy] Copying fresh static export to deploy folder...');
  copyRecursive(outDir, tempDir);
  fs.writeFileSync(path.join(tempDir, '.nojekyll'), '');

  // Add all files
  function getAllRelativeFiles(dir, base = '') {
    let results = [];
    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of list) {
      if (item.name === '.git') continue;
      const rel = base ? base + '/' + item.name : item.name;
      if (item.isDirectory()) {
        results = results.concat(getAllRelativeFiles(path.join(dir, item.name), rel));
      } else {
        results.push(rel);
      }
    }
    return results;
  }

  const allFiles = getAllRelativeFiles(tempDir);
  console.log(`[Deploy] Staging ${allFiles.length} files...`);
  for (const f of allFiles) {
    await git.add({ fs, dir: tempDir, filepath: f });
  }

  console.log('[Deploy] Committing production release...');
  const sha = await git.commit({
    fs,
    dir: tempDir,
    author: { name: 'rpruthvi785', email: 'rpruthvi785@users.noreply.github.com' },
    message: 'deploy: production release with Render backend integration and mobile responsiveness',
  });
  console.log('[Deploy] Commit created:', sha);

  console.log('[Deploy] Pushing to GitHub gh-pages branch...');
  const pushRes = await git.push({
    fs,
    http,
    dir: tempDir,
    remote: 'origin',
    ref: 'gh-pages',
    remoteRef: 'gh-pages',
    onAuth: () => ({ username: token }),
  });
  console.log('[Deploy] Push status:', JSON.stringify(pushRes));

  // Cleanup temp dir
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  console.log('\n======================================================');
  console.log('🎉 SUCCESSFULLY PUBLISHED LIVE TO GITHUB PAGES!');
  console.log('Live App URL: https://rpruthvi785-alt.github.io/inten-mission/');
  console.log('Backend URL:  https://inten-mission.onrender.com');
  console.log('======================================================\n');
}

deployViaClone().catch(console.error);
