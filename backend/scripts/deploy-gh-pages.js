/**
 * Direct GitHub Pages Publisher
 * Pushes static export to the gh-pages branch and configures GitHub Pages.
 */
const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const https = require('https');
const fs = require('fs');
const path = require('path');

const outDir = path.resolve(__dirname, '..', '..', 'frontend', 'out');
const token = process.env.GITHUB_TOKEN || process.env.GH_PAGES_TOKEN || '';
const remoteUrl = 'https://github.com/rpruthvi785-alt/inten-mission.git';
const owner = 'rpruthvi785-alt';
const repo = 'inten-mission';

async function deployGhPages() {
  console.log('[Deploy] Output directory:', outDir);

  if (!fs.existsSync(outDir)) {
    throw new Error('frontend/out directory does not exist. Run npm run build first.');
  }

  // 1. Clean and init git inside outDir
  const gitDir = path.join(outDir, '.git');
  if (fs.existsSync(gitDir)) {
    fs.rmSync(gitDir, { recursive: true, force: true });
  }

  console.log('[Deploy] Initializing git in out directory...');
  await git.init({ fs, dir: outDir, defaultBranch: 'gh-pages' });
  await git.addRemote({ fs, dir: outDir, remote: 'origin', url: remoteUrl });

  // 2. Scan all files
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

  // 3. Commit
  console.log('[Deploy] Committing to gh-pages branch...');
  const sha = await git.commit({
    fs,
    dir: outDir,
    author: { name: 'rpruthvi785', email: 'rpruthvi785@users.noreply.github.com' },
    message: 'deploy: publish Three-Way Match Engine frontend to GitHub Pages',
  });
  console.log('[Deploy] Commit created:', sha);

  // 4. Force Push to gh-pages
  console.log('[Deploy] Pushing directly to origin gh-pages...');
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
  console.log('[Deploy] Push result:', JSON.stringify(pushRes));

  // 5. Configure GitHub Pages API
  console.log('[Deploy] Updating GitHub Pages source configuration...');
  function apiReq(method, apiPath, body) {
    return new Promise((resolve, reject) => {
      const data = body ? JSON.stringify(body) : null;
      const req = https.request({
        hostname: 'api.github.com',
        path: apiPath,
        method: method,
        headers: {
          'Authorization': 'token ' + token,
          'User-Agent': 'node-publisher',
          'Accept': 'application/vnd.github.v3+json',
          ...(data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}),
        },
      }, res => {
        let buf = '';
        res.on('data', c => buf += c);
        res.on('end', () => resolve({ status: res.statusCode, body: buf }));
      });
      req.on('error', reject);
      if (data) req.write(data);
      req.end();
    });
  }

  const updatePages = await apiReq('PUT', '/repos/' + owner + '/' + repo + '/pages', {
    source: { branch: 'gh-pages', path: '/' },
  });
  console.log('[Deploy] Pages API response:', updatePages.status, updatePages.body);

  console.log('\n======================================================');
  console.log('🎉 WEBSITE SUCCESSFULLY PUBLISHED TO GITHUB PAGES!');
  console.log('URL: https://rpruthvi785-alt.github.io/inten-mission/');
  console.log('======================================================\n');
}

deployGhPages().catch(console.error);
