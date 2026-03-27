import * as fs from 'fs';
import * as path from 'path';

/**
 * Resolves the path to the bundled CMS-1500 PDF template.
 * Use this to get the file path for serving or copying the template.
 */
export function getTemplatePath(): string {
  return path.resolve(__dirname, '..', '..', 'assets', 'cms-1500-template.pdf');
}

/**
 * Loads the bundled CMS-1500 PDF template as a Uint8Array.
 * Works in Node.js environments (build scripts, API routes, SSR).
 *
 * @returns The PDF template bytes
 */
export function loadTemplate(): Uint8Array {
  const templatePath = getTemplatePath();
  return new Uint8Array(fs.readFileSync(templatePath));
}

/**
 * Loads the bundled CMS-1500 PDF template as a Uint8Array (async).
 * Works in Node.js environments (build scripts, API routes, SSR).
 *
 * @returns The PDF template bytes
 */
export async function loadTemplateAsync(): Promise<Uint8Array> {
  const templatePath = getTemplatePath();
  const buffer = await fs.promises.readFile(templatePath);
  return new Uint8Array(buffer);
}
