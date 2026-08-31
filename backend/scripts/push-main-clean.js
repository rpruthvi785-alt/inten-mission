const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..', '..');
const tempDir = path.resolve(rootDir, '.temp-main-push');
const token = process.env.GITHUB_TOKEN || process.argv[2] || '';
const remoteUrl = 'https://github.com/rpruthvi785-alt/inten-mission.git';

async function pushMainClean() {
  console.log('[Main Push] Preparing temp directory...');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });

  console.log('[Main Push] Cloning origin main (depth 1)...');
  await git.clone({
    fs,
    http,
    dir: tempDir,
    url: remoteUrl,
    ref: 'main',
    singleBranch: true,
    depth: 1,
    onAuth: () => ({ username: token }),
  });

  // Copy all workspace files into tempDir (except .git, node_modules, .temp-*, frontend/out, frontend/.next)
  function copyRepoFiles(src, dest) {
    const ignoreList = ['.git', '.github', 'node_modules', '.temp-main-push', '.temp-deploy', '.next', 'out', '.env', '.env.local'];
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      if (ignoreList.includes(entry.name)) continue;
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        copyRepoFiles(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  console.log('[Main Push] Copying all updated files...');
  copyRepoFiles(rootDir, tempDir);

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
  console.log(`[Main Push] Staging ${allFiles.length} files...`);
  for (const f of allFiles) {
    await git.add({ fs, dir: tempDir, filepath: f });
  }

  console.log('[Main Push] Creating commit...');
  const sha = await git.commit({
    fs,
    dir: tempDir,
    author: { name: 'rpruthvi785', email: 'rpruthvi785@users.noreply.github.com' },
    message: 'fix: complete Three-Way Match Engine backend for Render and MongoDB Atlas',
  });
  console.log('[Main Push] Commit created:', sha);

  console.log('[Main Push] Pushing to GitHub main branch...');
  const pushRes = await git.push({
    fs,
    http,
    dir: tempDir,
    remote: 'origin',
    ref: 'main',
    remoteRef: 'main',
    onAuth: () => ({ username: token }),
  });
  console.log('[Main Push] Push status:', JSON.stringify(pushRes));

  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  console.log('\n======================================================');
  console.log('✅ MAIN BRANCH SUCCESSFULLY UPDATED ON GITHUB!');
  console.log('Render will now automatically detect this and deploy.');
  console.log('======================================================\n');
}

pushMainClean().catch(console.error);
