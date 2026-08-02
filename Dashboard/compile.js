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


function compileFile(srcPath) {
  const outPath = getOutPath(srcPath);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

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
      console.log(`✓ TS  ${path.relative(process.cwd(), srcPath)} → ${path.relative(process.cwd(), outPath)}`);
    } else if (srcPath.endsWith('.scss')) {
      execSync(
        `npx sass "${srcPath}" "${outPath}" --style=expanded --no-source-map`,
        { stdio: 'pipe' }
      );
      console.log(`✓ SCSS ${path.relative(process.cwd(), srcPath)} → ${path.relative(process.cwd(), outPath)}`);
    }
  } catch (err) {
    const stderr = err.stderr ? err.stderr.toString() : '';
    const stdout = err.stdout ? err.stdout.toString() : '';
    const output = stderr + stdout;

    const hasCompileError = /error TS\d+/.test(output);

    if (hasCompileError) {
      console.error(`✗ 失敗: ${srcPath}`);
      console.error(output.trim());
    } else {
      if (fs.existsSync(outPath)) {
        if (srcPath.endsWith('.ts')) {
          removeExportEmpty(outPath);
        }
        console.log(`✓ TS  ${path.relative(process.cwd(), srcPath)} → ${path.relative(process.cwd(), outPath)} (警告あり)`);
      } else {
        console.error(`✗ 失敗: ${srcPath}`);
        console.error(output.trim() || err.message);
      }
    }
  }
}

function compileAll() {
  const files = collectFiles(SRC_DIR);
  if (files.length === 0) {
    console.log('コンパイル対象のファイルが見つかりませんでした。');
    return;
  }
  console.log(`コンパイル開始 (${files.length} ファイル)...`);
  files.forEach(compileFile);
  console.log('完了');
}

const isWatch = process.argv[2] === 'watch';

if (isWatch) {
  console.log('Watch... (Ctrl+C で停止)');
  compileAll();

  const watcher = chokidar.watch(SRC_DIR, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    ignoreInitial: true,
  });

  watcher
    .on('add',    (p) => { if (/\.(ts|scss)$/.test(p)) compileFile(p); })
    .on('change', (p) => { if (/\.(ts|scss)$/.test(p)) compileFile(p); })
    .on('unlink', (p) => {
      const outPath = getOutPath(p);
      if (fs.existsSync(outPath)) {
        fs.unlinkSync(outPath);
        console.log(`削除: ${path.relative(process.cwd(), outPath)}`);
      }
    });
} else {
  compileAll();
}