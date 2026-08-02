const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const sass = require('sass');
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


function compileFile(srcPath) {
  const outPath = getOutPath(srcPath);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  try {
    if (srcPath.endsWith('.ts')) {
      const source = fs.readFileSync(srcPath, 'utf8');
      const result = ts.transpileModule(source, {
        compilerOptions: {
          target: "ESNext",
          module: "ESNext",
          moduleResolution: "NodeNext",
          esModuleInterop: true,
          strict: true,
          skipLibCheck: true,
        },
        fileName: srcPath,
      });
      fs.writeFileSync(outPath, result.outputText, 'utf8');
      console.log(`✓ TS  ${path.relative(process.cwd(), srcPath)} → ${path.relative(process.cwd(), outPath)}`);
    } else if (srcPath.endsWith('.scss')) {
      const result = sass.compile(srcPath, {
        style: 'expanded',
        sourceMap: false,
      });
      fs.writeFileSync(outPath, result.css, 'utf8');
      console.log(`✓ SCSS ${path.relative(process.cwd(), srcPath)} → ${path.relative(process.cwd(), outPath)}`);
    }
  } catch (err) {
    console.error(`✗ 失敗: ${srcPath}`);
    console.error(err.message || err);
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

// メイン処理
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