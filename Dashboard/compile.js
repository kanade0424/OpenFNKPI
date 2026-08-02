const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chokidar = require('chokidar');

const SRC_DIR = path.resolve('./src-uncompile');
const OUT_DIR = path.resolve('./src');

const colors = {
  cyan:    (text) => `\x1b[36m${text}\x1b[0m`,
  magenta: (text) => `\x1b[35m${text}\x1b[0m`,
  yellow:  (text) => `\x1b[33m${text}\x1b[0m`,
  blue:    (text) => `\x1b[34m${text}\x1b[0m`,
};

function colorizePath(filePath) {
  if (filePath.endsWith('.ts'))   return colors.cyan(filePath);
  if (filePath.endsWith('.scss')) return colors.magenta(filePath);
  if (filePath.endsWith('.js'))   return colors.yellow(filePath);
  if (filePath.endsWith('.css'))  return colors.blue(filePath);
  return filePath;
}

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
 * @returns {{ messages: string, outPath: string }}
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

  return { messages, outPath };
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
    const rel = path.relative(process.cwd(), file);
    console.log(`- ${colorizePath(rel)}`);
  }
  console.log('');

  console.log('コンパイル');
  for (const file of files) {
    const { messages, outPath } = compileFile(file);
    const outRel = path.relative(process.cwd(), outPath);

    console.log(`- ${colorizePath(outRel)}`);

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
        console.log(`\n[追加] ${colorizePath(path.relative(process.cwd(), p))}`);
        const { messages, outPath } = compileFile(p);
        console.log(`- ${colorizePath(path.relative(process.cwd(), outPath))}`);
        if (messages) {
          console.log(messages.split('\n').map(l => `  ${l}`).join('\n'));
        }
      }
    })
    .on('change', (p) => {
      if (/\.(ts|scss)$/.test(p)) {
        console.log(`\n[変更] ${colorizePath(path.relative(process.cwd(), p))}`);
        const { messages, outPath } = compileFile(p);
        console.log(`- ${colorizePath(path.relative(process.cwd(), outPath))}`);
        if (messages) {
          console.log(messages.split('\n').map(l => `  ${l}`).join('\n'));
        }
      }
    })
    .on('unlink', (p) => {
      const outPath = getOutPath(p);
      if (fs.existsSync(outPath)) {
        fs.unlinkSync(outPath);
        console.log(`\n[削除] ${colorizePath(path.relative(process.cwd(), outPath))}`);
      }
    });
} else {
  compileAll();
}