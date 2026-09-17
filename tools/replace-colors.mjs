import fs from 'fs/promises';
import path from 'path';

const SRC_DIR = './src';

const replacements = [
    { from: /#FFFDF9/ig, to: 'var(--color-background)' },
    { from: /#FFFFFF/ig, to: 'var(--color-surface)' },
    { from: /bg-white/g, to: 'bg-[var(--color-surface)]' },
    { from: /text-white/g, to: 'text-[var(--color-brown)]' }, // some white text might become brown in dark mode, but wait, white text is usually on dark buttons.
    { from: /bg-slate-950/g, to: 'bg-[var(--color-surface)]' }, // Wait, someone used slate-950 earlier, maybe I shouldn't mess with slate if I only care about the amber/brown/yellow scheme!
    { from: /#FAF4EC/ig, to: 'var(--color-surface-2)' },
    { from: /#F5EDE2/ig, to: 'var(--color-surface-2)' },
    { from: /#EADBCE/ig, to: 'var(--color-border)' },
    { from: /#2B1413/ig, to: 'var(--color-text)' }, // Note: may affect bg as well, so bg-[#2B1413] -> bg-[var(--color-text)] which is white in dark mode. Wait, a dark button in dark mode should probably be amber! Let's use var(--color-brown) which we can define to flip to amber in dark mode.
    { from: /#78483B/ig, to: 'var(--color-text-muted)' },
    { from: /#A88B77/ig, to: 'var(--color-text-subtle)' },
    { from: /#9C6C60/ig, to: 'var(--color-text-subtle)' },
    { from: /#442220/ig, to: 'var(--color-brown-light)' },
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

            // Specifically fix `bg-[var(--color-text)]` on primary buttons
            newContent = newContent.replace(/bg-\[var\(--color-text\)\]/g, 'bg-[var(--color-brown)]');

            if (content !== newContent) {
                await fs.writeFile(fullPath, newContent, 'utf8');
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

replaceInDir(SRC_DIR).catch(console.error);
