// capture_code_snapshot.js (v3.2)

const fs = require('fs');
const path = require('path');
const { encode } = require('gpt-tokenizer');

const projectRoot = __dirname;
const distilledOutputFile = path.join(projectRoot, 'all_markdown_and_code_snapshot_llm_distilled.txt');

// --- CONFIGURATION ---
const excludeDirNames = new Set([
    'node_modules', '.next', '.git', '.cache', '.turbo', '.vscode', 'dist', 'build', 'coverage', 'out', 'tmp', 'temp', 'logs', '.idea', '.parcel-cache', '.storybook', '.husky', '.pnpm', '.yarn', '.svelte-kit', '.vercel', '.firebase', '.expo', '.expo-shared',
    '__pycache__', '.ipynb_checkpoints', '.tox', '.eggs', 'eggs', '.venv', 'venv', 'env',
    '.svn', '.hg', '.bzr'
]);

const excludeRelativePaths = [
    '.github',
    '.env'
];

const alwaysExcludeFiles = new Set([
    'all_markdown_and_code_snapshot_llm_distilled.txt',
    '.gitignore',
    '.DS_Store',
    '.env', 
    'capture_code_snapshot.js'
]);

const allowedExtensions = ['.md', '.js', '.ts', '.tsx', '.py', '.sql', '.json', '.yaml', '.yml', '.sh', '.jsx', '.css', '.scss', '.html'];
// --- END CONFIGURATION ---

const fileSeparatorStart = '--- START OF FILE';
const fileSeparatorEnd = '--- END OF FILE';

function distillChronicle(chronicleContent) {
    console.log('[INFO] AI compression logic would run here.');
    const placeholder = `
This content represents an LLM-distilled code summary
(Original Token Count: ~${encode(chronicleContent).length.toLocaleString()})
`;
    return placeholder;
}

function appendFileContent(filePath, basePath, shouldDistill = false) {
    const relativePath = path.relative(basePath, filePath).replace(/\\/g, '/');
    let fileContent = '';
    try {
        fileContent = fs.readFileSync(filePath, 'utf8');
    } catch (readError) {
        fileContent = `[Content not captured due to read error: ${readError.message}.]`;
    }

    let output = `${fileSeparatorStart} ${relativePath} ---\n\n`;
    output += fileContent;
    output += `\n${fileSeparatorEnd} ${relativePath} ---\n\n`;
    return output;
}

console.log(`[INFO] Starting scan from project root: ${projectRoot}`);

try {
    // --- VARIABLE DECLARATIONS  ---
    const fileTreeLines = [];
    let distilledMarkdownContent = '';
    let filesCaptured = 0;
    let itemsSkipped = 0;

    function traverseAndCapture(currentPath) {
        const relativePath = path.relative(projectRoot, currentPath).replace(/\\/g, '/');
        const baseName = path.basename(currentPath);

        if (relativePath) {
            if (fs.statSync(currentPath).isDirectory() && excludeDirNames.has(baseName)) {
                console.log(`[SKIP-DIR] Skipping excluded directory name: '${baseName}' at path: ./${relativePath}`);
                itemsSkipped++;
                return;
            }
            for (const excludedPath of excludeRelativePaths) {
                if (relativePath.startsWith(excludedPath)) {
                    console.log(`[SKIP-PATH] Skipping excluded path: ./${relativePath}`);
                    itemsSkipped++;
                    return;
                }
            }
        }
        
        const stats = fs.statSync(currentPath);
        if (relativePath) {
            fileTreeLines.push(relativePath + (stats.isDirectory() ? '/' : ''));
        }

        if (stats.isDirectory()) {
            const items = fs.readdirSync(currentPath).sort();
            for (const item of items) {
                traverseAndCapture(path.join(currentPath, item));
            }
        } else if (stats.isFile()) {
            if (alwaysExcludeFiles.has(baseName) || !allowedExtensions.includes(path.extname(baseName).toLowerCase())) {
                itemsSkipped++;
                return;
            }
            distilledMarkdownContent += appendFileContent(currentPath, projectRoot, true);
            filesCaptured++;
        }
    }

    traverseAndCapture(projectRoot);
    
    const fileTreeContent = '# Directory Structure (relative to project root)\n' + fileTreeLines.map(line => '  ./' + line).join('\n') + '\n\n';


    // --- FORGE LLM-DISTILLED GENOME ---
    let distilledHeader = `# All Markdown Files Snapshot (LLM-Distilled)\n\nGenerated On: ${new Date().toISOString()}\n\n{TOKEN_COUNT_PLACEHOLDER}\n\n`;
    const distilledFinalContent = distilledHeader + fileTreeContent + distilledMarkdownContent;
    const distilledTokenCount = encode(distilledFinalContent).length;
    const finalDistilledContentWithToken = distilledFinalContent.replace('{TOKEN_COUNT_PLACEHOLDER}', `# Mnemonic Weight (Token Count): ~${distilledTokenCount.toLocaleString()} tokens`);
    fs.writeFileSync(distilledOutputFile, finalDistilledContentWithToken, 'utf8');
    console.log(`[SUCCESS] LLM-Distilled packaged to: ${distilledOutputFile}`);
    console.log(`[METRIC] LLM-Distilled Token Count: ~${distilledTokenCount.toLocaleString()} tokens`);
    
    console.log(`\n[STATS] Markdown Files Captured: ${filesCaptured} | Items Skipped/Excluded: ${itemsSkipped}`);

} catch (err) {
    console.error(`[FATAL] An error occurred during snapshot generation: ${err.message}`);
}

