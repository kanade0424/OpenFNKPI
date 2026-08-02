const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chokidar = require('chokidar');

const SRC_DIR = path.resolve('./src-uncompile');
const OUT_DIR = path.resolve('./src');

function collectFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(fullPath, files);
    } else if (/\.(ts|scss)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function getOutPath(srcPath) {
  const relative = path.relative(SRC_DIR, srcPath);
  const outRelative = relative
    .replace(/\.ts$/, '.js')
    .replace(/\.scss$/, '.css');
  return path.join(OUT_DIR, outRelative);
}


function removeExportEmpty(outPath) {
  if (!fs.existsSync(outPath)) return;
  let code = fs.readFileSync(outPath, 'utf8');
  code = code.replace(/\s*export\s*\{\s*\}\s*;?\s*$/, '\n');
  fs.writeFileSync(outPath, code, 'utf8');
}

/**
 * @returns {{ messages: string }}
 */
function compileFile(srcPath) {
  const outPath = getOutPath(srcPath);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  let messages = '';

  try {
    if (srcPath.endsWith('.ts')) {
      execSync(
        `npx tsc "${srcPath}" ` +
        `--rootDir "${SRC_DIR}" ` +
        `--outDir "${OUT_DIR}" ` +
        `--target ESNext ` +
        `--module ESNext ` +
        `--moduleResolution Bundler ` +
        `--moduleDetection force ` +
        `--esModuleInterop ` +
        `--skipLibCheck ` +
        `--declaration false ` +
        `--alwaysStrict false ` +
        `--noEmit false`,
        { stdio: 'pipe' }
      );
      removeExportEmpty(outPath);
    } else if (srcPath.endsWith('.scss')) {
      execSync(
        `npx sass "${srcPath}" "${outPath}" --style=expanded --no-source-map`,
        { stdio: 'pipe' }
      );
    }
  } catch (err) {
    const stderr = err.stderr ? err.stderr.toString() : '';
    const stdout = err.stdout ? err.stdout.toString() : '';
    messages = (stderr + stdout).trim();

    if (srcPath.endsWith('.ts') && fs.existsSync(outPath)) {
      removeExportEmpty(outPath);
    }
  }

  return { messages };
}

function compileAll() {
  let files = collectFiles(SRC_DIR);

  files.sort((a, b) => {
    const aIsTs = a.endsWith('.ts') ? 0 : 1;
    const bIsTs = b.endsWith('.ts') ? 0 : 1;
    return aIsTs - bIsTs || a.localeCompare(b);
  });

  if (files.length === 0) {
    console.log('コンパイル対象のファイルはありません。');
    return;
  }

  console.log('コンパイル対象のファイル');
  for (const file of files) {
    console.log(`- ${path.relative(process.cwd(), file)}`);
  }
  console.log('');

  console.log('コンパイル');
  for (const file of files) {
    const relativePath = path.relative(process.cwd(), file);
    const { messages } = compileFile(file);

    console.log(`- ${relativePath}`);
    if (messages) {
      const indented = messages
        .split('\n')
        .map(line => `  ${line}`)
        .join('\n');
      console.log(indented);
    }
  }
}

const isWatch = process.argv[2] === 'watch';

if (isWatch) {
  console.log('Watch... (Ctrl+C で停止)\n');
  compileAll();

  const watcher = chokidar.watch(SRC_DIR, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    ignoreInitial: true,
  });

  watcher
    .on('add', (p) => {
      if (/\.(ts|scss)$/.test(p)) {
        console.log(`\n[追加] ${path.relative(process.cwd(), p)}`);
        const { messages } = compileFile(p);
        console.log(`- ${path.relative(process.cwd(), p)}`);
        if (messages) {
          console.log(messages.split('\n').map(l => `  ${l}`).join('\n'));
        }
      }
    })
    .on('change', (p) => {
      if (/\.(ts|scss)$/.test(p)) {
        console.log(`\n[変更] ${path.relative(process.cwd(), p)}`);
        const { messages } = compileFile(p);
        console.log(`- ${path.relative(process.cwd(), p)}`);
        if (messages) {
          console.log(messages.split('\n').map(l => `  ${l}`).join('\n'));
        }
      }
    })
    .on('unlink', (p) => {
      const outPath = getOutPath(p);
      if (fs.existsSync(outPath)) {
        fs.unlinkSync(outPath);
        console.log(`\n[削除] ${path.relative(process.cwd(), outPath)}`);
      }
    });
} else {
  compileAll();
}