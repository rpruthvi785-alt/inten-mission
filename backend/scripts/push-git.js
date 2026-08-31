/**
 * Pure Node.js Git Staging & Push Utility
 */
const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..', '..');
const remoteUrl = 'https://github.com/rpruthvi785-alt/inten-mission.git';

async function pushRepo() {
  console.log('[Git Push] Root directory:', rootDir);

  // 1. Init if needed
  const gitDir = path.join(rootDir, '.git');
  if (!fs.existsSync(gitDir)) {
    console.log('[Git Push] Initializing repository...');
    await git.init({ fs, dir: rootDir, defaultBranch: 'main' });
  }

  // 2. Add remote
  try {
    const remotes = await git.listRemotes({ fs, dir: rootDir });
    const hasOrigin = remotes.some(r => r.remote === 'origin');
    if (hasOrigin) {
      await git.deleteRemote({ fs, dir: rootDir, remote: 'origin' });
    }
    await git.addRemote({ fs, dir: rootDir, remote: 'origin', url: remoteUrl });
    console.log('[Git Push] Remote origin set to:', remoteUrl);
  } catch (err) {
    console.warn('[Git Push] Remote setup:', err.message);
  }

  // 3. Scan and stage files
  const ignoreDirs = new Set(['node_modules', '.next', '.git', 'dist', 'build', '.system_generated', 'coverage', '.gemini']);
  const ignoreFiles = new Set(['.env', '.env.local', '.env.production.local']);

  function getFiles(dir, base = '') {
    let files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const rel = base ? `${base}/${e.name}` : e.name;
      if (e.isDirectory()) {
        if (!ignoreDirs.has(e.name)) {
          files = files.concat(getFiles(path.join(dir, e.name), rel));
        }
      } else {
        if (!ignoreFiles.has(e.name) && !e.name.endsWith('.log')) {
          files.push(rel);
        }
      }
    }
    return files;
  }

  const allFiles = getFiles(rootDir);
  console.log(`[Git Push] Staging ${allFiles.length} files...`);

  for (const file of allFiles) {
    try {
      await git.add({ fs, dir: rootDir, filepath: file });
    } catch (e) {
      console.warn(`[Git Push] Skip ${file}: ${e.message}`);
    }
  }

  // 4. Commit
  console.log('[Git Push] Creating commit...');
  let sha;
  try {
    sha = await git.commit({
      fs,
      dir: rootDir,
      author: {
        name: 'rpruthvi785',
        email: 'rpruthvi785@users.noreply.github.com',
      },
      message: 'feat: complete Three-Way Match Engine with MongoDB, real document reconciliation, and tolerance rules',
    });
    console.log('[Git Push] Commit created:', sha);
  } catch (commitErr) {
    console.log('[Git Push] Commit note:', commitErr.message);
  }

  // Create main branch pointing to HEAD
  try {
    await git.branch({ fs, dir: rootDir, ref: 'main', checkout: true });
  } catch (e) {}

  // 5. Push to GitHub
  console.log('[Git Push] Pushing to origin main...');
  try {
    const pushResult = await git.push({
      fs,
      http,
      dir: rootDir,
      remote: 'origin',
      ref: 'main',
      remoteRef: 'main',
      force: true,
      onAuth: () => {
        const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
        if (token) {
          return { username: token };
        }
        return {};
      },
    });

    console.log('[Git Push] Push result:', JSON.stringify(pushResult));
    console.log('✅ CODE SUCCESSFULLY PUSHED TO https://github.com/rpruthvi785-alt/inten-mission.git');
  } catch (pushErr) {
    console.error('[Git Push] Push error:', pushErr.message);
  }
}

pushRepo().catch(console.error);
