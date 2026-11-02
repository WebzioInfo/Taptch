const fs = require('fs');
const path = require('path');

const skillsBase = 'D:\\Webzio\\Tapzio\\.agents\\skills';
const dirs = fs
  .readdirSync(skillsBase)
  .filter((d) => fs.statSync(path.join(skillsBase, d)).isDirectory());

const results = [];
const seenNames = new Set();
let hasErrors = false;

dirs.forEach((dirName) => {
  const skillFile = path.join(skillsBase, dirName, 'SKILL.md');
  if (!fs.existsSync(skillFile)) {
    results.push({
      dir: dirName,
      status: 'FAIL',
      reason: 'Missing SKILL.md',
    });
    hasErrors = true;
    return;
  }

  const content = fs.readFileSync(skillFile, 'utf-8');
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) {
    results.push({
      dir: dirName,
      status: 'FAIL',
      reason: 'Missing or invalid YAML frontmatter delimiters',
    });
    hasErrors = true;
    return;
  }

  const fmLines = fmMatch[1].split('\n');
  const nameLine = fmLines.find((l) => l.trim().startsWith('name:'));
  const descLine = fmLines.find((l) => l.trim().startsWith('description:'));

  if (!nameLine) {
    results.push({
      dir: dirName,
      status: 'FAIL',
      reason: 'Missing "name:" field in frontmatter',
    });
    hasErrors = true;
    return;
  }

  const nameVal = nameLine.replace(/^name:\s*/, '').trim();
  if (seenNames.has(nameVal)) {
    results.push({
      dir: dirName,
      status: 'FAIL',
      reason: `Duplicate skill name: "${nameVal}"`,
    });
    hasErrors = true;
    return;
  }
  seenNames.add(nameVal);

  if (!descLine) {
    results.push({
      dir: dirName,
      status: 'FAIL',
      reason: 'Missing "description:" field in frontmatter',
    });
    hasErrors = true;
    return;
  }

  const descVal = descLine.replace(/^description:\s*/, '').trim();
  if (!descVal || descVal.length < 10) {
    results.push({
      dir: dirName,
      status: 'FAIL',
      reason: 'Description is too short or empty',
    });
    hasErrors = true;
    return;
  }

  // Check unresolved variables
  if (content.includes('${CLAUDE_SKILL_DIR}')) {
    results.push({
      dir: dirName,
      status: 'FAIL',
      reason: 'Contains unresolved ${CLAUDE_SKILL_DIR}',
    });
    hasErrors = true;
    return;
  }

  results.push({
    dir: dirName,
    name: nameVal,
    status: 'PASS',
    descLength: descVal.length,
    fileSize: content.length,
  });
});

console.log(`Validated ${results.length} skills:`);
results.forEach((r) => {
  if (r.status === 'PASS') {
    console.log(` [PASS] ${r.dir} (name: "${r.name}")`);
  } else {
    console.error(` [FAIL] ${r.dir}: ${r.reason}`);
  }
});

if (hasErrors) {
  process.exit(1);
} else {
  console.log(`\nAll ${results.length} skills passed validation successfully!`);
}

