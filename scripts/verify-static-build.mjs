import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const config = JSON.parse(await readFile(path.join(root, 'wrangler.jsonc'), 'utf8'));
assert.equal(config.assets.directory, './dist');
assert.equal(config.assets.not_found_handling, 'single-page-application');
assert.equal(config.workers_dev, true);
assert.equal(config.preview_urls, false);
assert.deepEqual(Object.keys(config).sort(), ['$schema', 'assets', 'compatibility_date', 'name', 'preview_urls', 'workers_dev']);
assert.deepEqual(Object.keys(config.assets).sort(), ['directory', 'not_found_handling']);

async function listFiles(directory, prefix = '') {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = prefix + entry.name;
    assert(!entry.isSymbolicLink(), `Symbolic link requires review: ${relative}`);
    if (entry.isDirectory()) {
      files.push(...await listFiles(path.join(directory, entry.name), relative + '/'));
    } else {
      assert(entry.isFile(), `Unexpected asset type: ${relative}`);
      files.push(relative);
    }
  }
  return files;
}

const publicFiles = new Set(['fonts/NotoSans-Regular.ttf', 'fonts/OFL.txt', '_headers', 'THIRD_PARTY_NOTICES.txt']);
for (const name of await listFiles(path.join(root, 'public'))) {
  assert(publicFiles.has(name), `Review the new public file before publishing: ${name}`);
}

const assetsDirectory = path.join(root, 'dist');
const files = await listFiles(assetsDirectory);
assert(files.includes('index.html'), 'Run npm run build first.');
assert(files.includes('fonts/NotoSans-Regular.ttf'), 'The PDF font is missing.');
const notices = 'THIRD_PARTY_NOTICES.txt';
assert(files.includes(notices), 'Third-party license notice is missing.');
assert.deepEqual(await readFile(path.join(assetsDirectory, notices)), await readFile(path.join(root, 'public', notices)));
assert(files.length <= 20_000, 'The Cloudflare Free asset count limit is exceeded.');

let totalBytes = 0;
let largest = { file: '', bytes: 0 };
for (const name of files) {
  const generatedAsset = /^assets\/[\w.-]+-[\w-]{8}\.(js|css)$/.test(name);
  assert(name === 'index.html' || publicFiles.has(name) || generatedAsset,
    `Unexpected production file requires review: ${name}`);
  const data = await readFile(path.join(assetsDirectory, name));
  assert(data.length <= 25 * 1024 * 1024, `The 25 MiB asset limit is exceeded: ${name}`);
  totalBytes += data.length;
  if (data.length > largest.bytes) largest = { file: name, bytes: data.length };
}

console.log(JSON.stringify({
  result: 'PASS',
  staticOnly: true,
  files: files.length,
  totalBytes,
  largest,
  freeLimits: { files: 20_000, fileBytes: 25 * 1024 * 1024 },
}, null, 2));
