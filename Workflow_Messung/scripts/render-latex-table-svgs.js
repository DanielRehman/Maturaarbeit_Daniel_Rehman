const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

function commandPath(command) {
  if (process.platform !== 'win32') return command;
  const localMiKTeX = path.join(process.env.LOCALAPPDATA || '', 'Programs', 'MiKTeX', 'miktex', 'bin', 'x64', `${command}.exe`);
  return fs.existsSync(localMiKTeX) ? localMiKTeX : command;
}

function latexDocument(tableSource) {
  return [
    '\\documentclass{article}',
    '\\usepackage[utf8]{inputenc}',
    '\\usepackage{booktabs}',
    '\\usepackage{rotating}',
    '\\pagestyle{empty}',
    '\\begin{document}',
    tableSource,
    '\\end{document}',
    '',
  ].join('\n');
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    if (entry.isFile() && entry.name.endsWith('.tex')) files.push(full);
  }
  return files;
}

function renderTex(texPath) {
  const latex = commandPath('latex');
  const dvisvgm = commandPath('dvisvgm');
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'matura-latex-svg-'));
  const tempTex = path.join(tempDir, 'table.tex');
  const svgPath = texPath.replace(/\.tex$/i, '.svg');

  try {
    fs.writeFileSync(tempTex, latexDocument(fs.readFileSync(texPath, 'utf8')), 'utf8');
    execFileSync(latex, ['-interaction=nonstopmode', '-halt-on-error', 'table.tex'], {
      cwd: tempDir,
      stdio: 'pipe',
      timeout: 120000,
    });
    execFileSync(dvisvgm, ['table.dvi', '-n', '-o', svgPath], {
      cwd: tempDir,
      stdio: 'pipe',
      timeout: 120000,
    });
    return { ok: true, svgPath };
  } catch (err) {
    return { ok: false, error: err.message || String(err) };
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

const target = path.resolve(process.argv[2] || path.join(__dirname, '..', 'output'));
if (!fs.existsSync(target)) {
  console.error(`Target not found: ${target}`);
  process.exit(1);
}

let ok = 0;
let failed = 0;
for (const texPath of walk(target)) {
  const result = renderTex(texPath);
  if (result.ok) {
    ok += 1;
    console.log(`OK  ${path.relative(target, result.svgPath)}`);
  } else {
    failed += 1;
    console.error(`ERR ${path.relative(target, texPath)}: ${result.error}`);
  }
}

console.log(`Rendered ${ok} SVG table(s), ${failed} failed.`);
process.exit(failed > 0 ? 1 : 0);
