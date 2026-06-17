const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const output = path.join(root, "_site");

function resetDir(target) {
  fs.rmSync(target, { recursive: true, force: true });
  fs.mkdirSync(target, { recursive: true });
}

function copyDir(source, target) {
  fs.mkdirSync(target, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      copyDir(sourcePath, targetPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

resetDir(output);
copyDir(path.join(root, "site"), output);
copyDir(path.join(root, "docs"), path.join(output, "docs"));
copyDir(path.join(root, "data"), path.join(output, "data"));
fs.copyFileSync(path.join(root, "README.md"), path.join(output, "README.md"));
fs.writeFileSync(path.join(output, ".nojekyll"), "");

console.log(`Built GitHub Pages site at ${output}`);

