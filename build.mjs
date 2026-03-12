import * as esbuild from 'esbuild';
import { execSync } from 'child_process';

const isWatch = process.argv.includes('--watch');

// Build the plugin code (sandbox)
const codeBuild = {
  entryPoints: ['src/code.ts'],
  bundle: true,
  outfile: 'dist/code.js',
  target: 'es2020',
  format: 'iife',
  logLevel: 'info',
};

async function buildUI() {
  console.log('Building UI with Vite...');
  execSync('npx vite build', { stdio: 'inherit' });
  console.log('UI built');
}

async function build() {
  try {
    await esbuild.build(codeBuild);
    buildUI();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

if (isWatch) {
  const ctx = await esbuild.context(codeBuild);
  await ctx.watch();
  console.log('Watching plugin code for changes...');
  const { spawn } = await import('child_process');
  spawn('npx', ['vite', 'build', '--watch'], { stdio: 'inherit', shell: true });
} else {
  await build();
}
