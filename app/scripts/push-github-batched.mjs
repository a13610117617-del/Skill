import { promises as fs } from "node:fs";
import path from "node:path";

const token = process.env.GITHUB_TOKEN;
const owner = process.env.GITHUB_OWNER || "a13610117617-del";
const repo = process.env.GITHUB_REPO || "Skill";
const branch = process.env.GITHUB_BRANCH || "main";
const root = path.resolve(process.env.PUSH_ROOT || process.cwd());
const prefix = (process.env.PUSH_PREFIX || "").replace(/^\/+|\/+$/g, "");
const batchSize = Number(process.env.PUSH_BATCH_SIZE || "30");

if (!token) {
  throw new Error("Missing GITHUB_TOKEN");
}

const apiBase = "https://api.github.com";
const headers = {
  Authorization: `Bearer ${token}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "codex-batched-push",
};

const excludedDirs = new Set([
  ".git",
  "node_modules",
  "node_modules.bak-20260703-164814",
  "dist",
  "release",
  "data",
  "logs",
  "outputs",
  "Downloads",
]);

const excludedFiles = new Set([
  "package-lock.tmp",
]);

async function request(method, urlPath, body, retries = 4) {
  let lastText = "";
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const response = await fetch(`${apiBase}${urlPath}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    lastText = text;
    if (response.ok) {
      return text ? JSON.parse(text) : null;
    }
    if ([502, 503, 504].includes(response.status) && attempt < retries) {
      await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
      continue;
    }
    throw new Error(`${method} ${urlPath} failed: ${response.status} ${text.slice(0, 500)}`);
  }
  throw new Error(`${method} ${urlPath} failed after retries: ${lastText.slice(0, 500)}`);
}

function toRepoPath(file) {
  const relative = path.relative(root, file).split(path.sep).join("/");
  return prefix ? `${prefix}/${relative}` : relative;
}

async function collectFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (excludedDirs.has(entry.name)) continue;
      files.push(...await collectFiles(full));
      continue;
    }
    if (!entry.isFile()) continue;
    if (excludedFiles.has(entry.name)) continue;
    files.push(full);
  }
  return files;
}

async function getBranchHead() {
  return request("GET", `/repos/${owner}/${repo}/git/ref/heads/${branch}`);
}

async function createBlob(file) {
  const content = await fs.readFile(file);
  const blob = await request("POST", `/repos/${owner}/${repo}/git/blobs`, {
    content: content.toString("base64"),
    encoding: "base64",
  });
  return {
    path: toRepoPath(file),
    mode: "100644",
    type: "blob",
    sha: blob.sha,
  };
}

async function pushBatch(files, baseCommitSha, index, total) {
  const baseCommit = await request("GET", `/repos/${owner}/${repo}/git/commits/${baseCommitSha}`);
  const treeEntries = [];
  for (const file of files) {
    treeEntries.push(await createBlob(file));
  }
  const tree = await request("POST", `/repos/${owner}/${repo}/git/trees`, {
    base_tree: baseCommit.tree.sha,
    tree: treeEntries,
  });
  const commit = await request("POST", `/repos/${owner}/${repo}/git/commits`, {
    message: `Sync randian skills (${index}/${total})`,
    tree: tree.sha,
    parents: [baseCommitSha],
  });
  await request("PATCH", `/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
    sha: commit.sha,
    force: false,
  });
  return commit.sha;
}

const files = (await collectFiles(root)).sort((a, b) => {
  const aLarge = a.includes(`${path.sep}merge-angle-library${path.sep}`);
  const bLarge = b.includes(`${path.sep}merge-angle-library${path.sep}`);
  if (aLarge !== bLarge) return aLarge ? 1 : -1;
  return toRepoPath(a).localeCompare(toRepoPath(b));
});

console.log(`Root: ${root}`);
console.log(`Repo: ${owner}/${repo}`);
console.log(`Branch: ${branch}`);
console.log(`Files: ${files.length}`);

let head = await getBranchHead();
let currentCommitSha = head.object.sha;
const batches = [];
for (let i = 0; i < files.length; i += batchSize) {
  batches.push(files.slice(i, i + batchSize));
}

for (let i = 0; i < batches.length; i += 1) {
  const batch = batches[i];
  console.log(`Uploading batch ${i + 1}/${batches.length}: ${batch.length} files`);
  currentCommitSha = await pushBatch(batch, currentCommitSha, i + 1, batches.length);
}

console.log(`Pushed ${files.length} files to ${owner}/${repo}@${branch}`);
console.log(`Head: ${currentCommitSha}`);
