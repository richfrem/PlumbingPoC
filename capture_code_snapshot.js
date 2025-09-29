// capture_code_snapshot.js (v4.1 - Standardized Path Output)
// This version is updated to correctly handle the new NPM workspace structure
// and recognizes the `.cjs` file extension for our CommonJS backend files.
// The primary change is to ensure all captured file paths in the headers
// are consistently prefixed with './' for easier parsing and consistency.

const fs = require('fs');
const path = require('path');
const { encode } = require('gpt-tokenizer');

const projectRoot = __dirname;
const distilledOutputFile = path.join(projectRoot, 'all_markdown_and_code_snapshot_llm_distilled.txt');

// --- CONFIGURATION ---
const excludeDirNames = new Set([
    'node_modules', '.next', '.git', '.cache', '.turbo', '.vscode', 'dist', 'build', 'coverage', 'out', 'tmp', 'temp', 'logs', '.idea', '.parcel-cache', '.storybook', '.husky', '.pnpm', '.yarn', '.svelte-kit', '.vercel', '.firebase', '.expo', '.expo-shared',
    '__pycache__', '.ipynb_checkpoints', '.tox', '.eggs', 'eggs', '.venv', 'venv', 'env',
    '.svn', '.hg', '.bzr', 'agents/feedback', 'agents/screenshots', 'playwright-report', 'test-results', 'supabase/.temp'
]);

// Exclude relative paths from the project root.
const excludeRelativePaths = [
    // No top-level paths need to be excluded by default in this project structure.
    // '.github' would be a good example if you had it.
];

const alwaysExcludeFiles = new Set([
    'all_markdown_and_code_snapshot_llm_distilled.txt',
    '.gitignore',
    '.DS_Store',
    'capture_code_snapshot.js',
    'package-lock.json', // Exclude lock files as they are very large and machine-generated
    'pnpm-lock.yaml',
    'yarn.lock'
]);

// THE FIX: Added '.cjs' to the list of allowed extensions.
const allowedExtensions = ['.md', '.js', '.ts', '.tsx', '.sh', '.sql', '.cjs', '.mjs', '.json', '.toml', '.yml', '.yaml'];
// --- END CONFIGURATION ---

const fileSeparatorStart = '--- START OF FILE';
const fileSeparatorEnd = '--- END OF FILE';

function appendFileContent(filePath, basePath) {
    // Ensure relativePath always starts with ./
    const relativePath = './' + path.relative(basePath, filePath).replace(/\\/g, '/');
    let fileContent = '';
    try {
        fileContent = fs.readFileSync(filePath, 'utf8');
    } catch (readError) {
        fileContent = `[Content not captured due to read error: ${readError.message}.]`;
    }

    // Use the standardized relativePath with ./ prefix in the separator
    let output = `${fileSeparatorStart} ${relativePath} ---\n\n`;
    output += fileContent;
    output += `\n${fileSeparatorEnd} ---\n\n`;
    return output;
}

console.log(`[INFO] Starting project scan from root: ${projectRoot}`);
console.log(`[INFO] Script version: v4.1 (Standardized Path Output)`);

try {
    const fileTreeLines = [];
    let distilledContent = '';
    let filesCaptured = 0;
    let itemsSkipped = 0;

    function traverseAndCapture(currentPath) {
        const baseName = path.basename(currentPath);
        const relativePath = path.relative(projectRoot, currentPath).replace(/\\/g, '/');

        // Rule 1: Exclude entire directories by name (e.g., node_modules)
        if (fs.statSync(currentPath).isDirectory() && excludeDirNames.has(baseName)) {
            itemsSkipped++;
            return;
        }

        // Rule 2: Exclude specific relative paths (e.g., .github)
        for (const excludedPath of excludeRelativePaths) {
            if (relativePath.startsWith(excludedPath)) {
                itemsSkipped++;
                return;
            }
        }
        
        // Add item to the directory tree structure, also prefixed with ./
        if (relativePath) { // Don't add the root itself to the tree list
            fileTreeLines.push('./' + relativePath + (fs.statSync(currentPath).isDirectory() ? '/' : ''));
        }

        if (fs.statSync(currentPath).isDirectory()) {
            const items = fs.readdirSync(currentPath).sort();
            for (const item of items) {
                traverseAndCapture(path.join(currentPath, item));
            }
        } else if (fs.statSync(currentPath).isFile()) {
            // Rule 3: Exclude specific filenames (e.g., .DS_Store)
            if (alwaysExcludeFiles.has(baseName)) {
                itemsSkipped++;
                return;
            }

            // Rule 4: Handle special .env file logic
            if (baseName.startsWith('.env') && baseName !== '.env.example') {
                itemsSkipped++;
                return;
            }

            // Rule 5: Only include files with allowed extensions
            if (!allowedExtensions.includes(path.extname(baseName).toLowerCase())) {
                itemsSkipped++;
                return;
            }

            // If all checks pass, capture the file content
            distilledContent += appendFileContent(currentPath, projectRoot);
            filesCaptured++;
        }
    }

    traverseAndCapture(projectRoot);
    
    // The file tree already includes './' from the traverseAndCapture function
    const fileTreeContent = '# Directory Structure (relative to project root)\n' + fileTreeLines.map(line => '  ' + line).join('\n') + '\n\n';

    // --- Forge the final output file ---
    let header = `# All Markdown Files Snapshot (LLM-Distilled)\n\nGenerated On: ${new Date().toISOString()}\n\n{TOKEN_COUNT_PLACEHOLDER}\n\n`;
    const finalContent = header + fileTreeContent + distilledContent;
    const tokenCount = encode(finalContent).length;
    const finalContentWithToken = finalContent.replace('{TOKEN_COUNT_PLACEHOLDER}', `# Mnemonic Weight (Token Count): ~${tokenCount.toLocaleString()} tokens`);
    
    fs.writeFileSync(distilledOutputFile, finalContentWithToken, 'utf8');
    
    console.log(`\n[SUCCESS] Snapshot successfully generated: ${distilledOutputFile}`);
    console.log(`[METRIC] Total Token Count: ~${tokenCount.toLocaleString()} tokens`);
    console.log(`[STATS] Files Captured: ${filesCaptured} | Directories/Files Skipped: ${itemsSkipped}`);

} catch (err) {
    console.error(`[FATAL] An error occurred during snapshot generation: ${err.message}`);
    console.error(err.stack);
}