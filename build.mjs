import { build, context } from 'esbuild';
import { copyFileSync, mkdirSync } from 'node:fs';

const watch = process.argv.includes('--watch');

mkdirSync('dist', { recursive: true });

const entries = [
  { in: 'src/platform/chrome/background.ts',       out: 'dist/background.js', format: 'esm'  },
  { in: 'src/platform/chrome/content.ts',          out: 'dist/content.js',    format: 'iife' },
  { in: 'src/platform/chrome/options/options.ts',  out: 'dist/options.js',    format: 'iife' },
];

const common = {
  bundle: true,
  target: 'chrome120',
  sourcemap: 'inline',
  logLevel: 'info',
  minify: false,
};

function copyStatic() {
  copyFileSync('manifest.json', 'dist/manifest.json');
  copyFileSync('src/platform/chrome/options/options.html', 'dist/options.html');
}

if (watch) {
  for (const e of entries) {
    const ctx = await context({
      ...common,
      entryPoints: [e.in],
      outfile: e.out,
      format: e.format,
      plugins: [{
        name: 'copy-static',
        setup(b) {
          b.onEnd(() => copyStatic());
        },
      }],
    });
    await ctx.watch();
  }
  console.log('SearchPin: watching for changes...');
} else {
  await Promise.all(entries.map(e => build({
    ...common,
    entryPoints: [e.in],
    outfile: e.out,
    format: e.format,
  })));
  copyStatic();
  console.log('SearchPin: build complete -> dist/');
}
