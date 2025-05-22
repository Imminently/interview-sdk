const fs = require('fs');
const path = require('path');

const stylesDir = path.join(__dirname, 'src');
const outputFile = path.join(__dirname, 'tailwind-safelist.js');

const classSet = new Set();

function isTailwindUtility(cls) {
  // Common quick filters — adjust based on your Tailwind setup
  if (cls.startsWith('dsdk-')) return false;
  if (cls === '') return false;

  return true; // Assume all classes are valid
  // Naively check if class matches known utilities
  const corePrefixes = [
    'bg-', 'text-', 'p-', 'px-', 'py-', 'pt-', 'pb-', 'pl-', 'pr-',
    'm-', 'mx-', 'ml-', 'mr-', 'my-', 'w-', 'h-', 'min-', 'max-', 'flex', 'grid',
    'items-', 'justify-', 'border', 'rounded', 'shadow', 'gap-', 'space-',
    'font-', 'leading-', 'tracking-', 'z-', 'overflow-', 'relative',
    'absolute', 'fixed', 'top-', 'bottom-', 'left-', 'right-',
    'transition', 'duration-', 'ease-', 'hover:', 'focus:', 'active:',
    'underline', 'cursor-pointer', 'inline-block', 'font-semibold', 'inline-', 'opacity-',
    'hover:', 'whitespace-', 'block', 'translate-', 'pointer-events-', 'sticky', 
  ];

  return corePrefixes.some(prefix => cls.startsWith(prefix));
}

function extractClassesFromString(str) {
  str.split(/\s+/).forEach((cls) => {
    if (cls && !cls.startsWith('dsdk-')) classSet.add(cls);
  });
}

function findStylesFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findStylesFiles(filePath));
    } else if (file.endsWith('Styles.ts')) {
      results.push(filePath);
    }
  });
  return results;
}

function extractClassStringsFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  console.log(content);
  // This regex matches: key: 'class1 class2 ...'
  const regex = /['"`]([a-zA-Z0-9\[\]\/\-\._\s:]+)['"`]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    extractClassesFromString(match[1]);
  }
}

const stylesFiles = findStylesFiles(stylesDir);
console.log(stylesFiles);
stylesFiles.forEach(extractClassStringsFromFile);

const sortedClasses = Array.from(classSet).sort();
const outputContent = `module.exports = ${JSON.stringify(sortedClasses, null, 2)};\n`;

fs.writeFileSync(outputFile, outputContent, 'utf8');
console.log(`✅ Safelist generated: ${outputFile}`);