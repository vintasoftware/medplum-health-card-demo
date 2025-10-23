/* global console */
/* global process */
/* eslint no-console: "off" */
/*eslint no-process-exit: "off"*/

import botLayer from '@medplum/bot-layer/package.json' with { type: 'json' };
import esbuild from 'esbuild';
import fastGlob from 'fast-glob';

// Find all TypeScript files in your source directory, but exclude scripts and app
const entryPoints = fastGlob.sync('./src/**/*.ts').filter((file) =>
  !file.endsWith('test.ts') &&
  !file.includes('/scripts/') && // Exclude scripts directory
  !file.includes('/app/') // Exclude app workspace directory
);

console.log('Entry points:', entryPoints); // Debug: see what files are being included

const botLayerDeps = Object.keys(botLayer.dependencies);

// Define the esbuild options
const esbuildOptions = {
  entryPoints: entryPoints,
  bundle: true, // Bundle imported functions
  outdir: './dist', // Output directory for compiled files
  platform: 'node', // or 'node', depending on your target platform
  loader: {
    '.ts': 'ts', // Load TypeScript files
  },
  resolveExtensions: ['.ts', '.js'],
  external: botLayerDeps,
  format: 'cjs', // CommonJS for Medplum Bot Layer
  target: 'ES2022', // Set the target ECMAScript version
  tsconfig: 'tsconfig.json',
};

// Build using esbuild
esbuild
  .build(esbuildOptions)
  .then(() => {
    console.log('Build completed successfully!');
  })
  .catch((error) => {
    console.error('Build failed:', JSON.stringify(error, null, 2));
    process.exit(1);
  });
