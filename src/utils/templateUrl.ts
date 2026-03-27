/**
 * Returns the path to the bundled CMS-1500 PDF template relative to node_modules.
 *
 * Usage with common bundlers:
 *
 * **Next.js / CRA / Vite:**
 * Copy the file to your public directory, then use the default (no URL needed).
 *
 * **With copy-webpack-plugin or vite static assets:**
 * ```js
 * import { TEMPLATE_ASSET_PATH } from 'cms1500-react';
 * // TEMPLATE_ASSET_PATH = 'cms1500-react/assets/cms-1500-template.pdf'
 * ```
 */
export const TEMPLATE_ASSET_PATH = 'cms1500-react/assets/cms-1500-template.pdf';

/**
 * Returns the resolved path to the bundled template within node_modules.
 * Useful for build tools to know where to copy from.
 */
export const TEMPLATE_FILENAME = 'cms-1500-template.pdf';
