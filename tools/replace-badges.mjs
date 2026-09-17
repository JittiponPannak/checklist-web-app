import fs from 'fs/promises';
import path from 'path';

const SRC_DIR = './src';

const replacements = [
    // Badges usually look like bg-amber-100 ... border-amber-300
    { from: /bg-amber-100/g, to: 'bg-[var(--color-amber-glow)]' },
    { from: /border-amber-300/g, to: 'border-[var(--color-amber)]' },
    { from: /text-amber-900/g, to: 'text-[var(--color-amber)]' },
    { from: /text-amber-800/g, to: 'text-[var(--color-amber)]' },
    { from: /bg-amber-50/g, to: 'bg-[var(--color-amber-glow)]' },
    { from: /border-amber-200/g, to: 'border-[var(--color-amber)]' },
    { from: /bg-amber-200/g, to: 'bg-[var(--color-amber-glow)]' },

    // Specific issue where there is `text-[var(--color-text)]` on a background that used to be amber-100
    // text-[var(--color-text)] on glow would just be whatever color text is. But if it was text-amber-whatever, we changed it.
];

async function replaceInDir(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            await replaceInDir(fullPath);
        } else if (entry.isFile() && fullPath.endsWith('.tsx')) {
            let content = await fs.readFile(fullPath, 'utf8');
            let newContent = content;

            for (const { from, to } of replacements) {
                newContent = newContent.replace(from, to);
            }

            if (content !== newContent) {
                await fs.writeFile(fullPath, newContent, 'utf8');
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

replaceInDir(SRC_DIR).catch(console.error);
