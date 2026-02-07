#!/usr/bin/env node

import favicons from "favicons";
import sharp from "sharp";
import { copyFile, mkdir, writeFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = join(__dirname, "../vanity-mirror-favicon/original.png");
const OUTPUT_DIR = join(__dirname, "../vanity-mirror-favicon");
const PUBLIC_DIR = join(__dirname, "../public");

// Rounded corner radius as percentage of image size (50% = perfect circle)
const CORNER_RADIUS_PERCENT = 50;

const configuration = {
  path: "/",
  appName: "Vanity Mirror",
  appShortName: "Vanity Mirror",
  appDescription: "Personal analytics dashboard",
  developerName: "John Larkin",
  developerURL: "https://johnlarkin.me",
  background: "#000000",
  theme_color: "#f97316",
  display: "standalone",
  orientation: "portrait",
  start_url: "/",
  icons: {
    android: true,
    appleIcon: true,
    appleStartup: false,
    favicons: true,
    windows: false,
    yandex: false,
  },
};

/**
 * Create a rounded rectangle mask SVG
 */
function createRoundedMask(size, radiusPercent) {
  const radius = Math.round(size * (radiusPercent / 100));
  return Buffer.from(`
    <svg width="${size}" height="${size}">
      <rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="white"/>
    </svg>
  `);
}

/**
 * Apply rounded corners to an image buffer
 */
async function applyRoundedCorners(imageBuffer, radiusPercent) {
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const size = metadata.width;

  const mask = createRoundedMask(size, radiusPercent);

  return image
    .composite([
      {
        input: mask,
        blend: "dest-in",
      },
    ])
    .png()
    .toBuffer();
}

/**
 * Prepare a rounded source image for favicon generation
 */
async function prepareRoundedSource() {
  console.log("Preparing rounded source image...");

  // Read and resize source to a standard size, then apply rounded corners
  const sourceBuffer = await sharp(SOURCE)
    .resize(1024, 1024, { fit: "cover" })
    .png()
    .toBuffer();

  return applyRoundedCorners(sourceBuffer, CORNER_RADIUS_PERCENT);
}

async function generateFavicons() {
  console.log("Generating favicons from:", SOURCE);
  console.log(`Using ${CORNER_RADIUS_PERCENT}% corner radius for modern style`);

  try {
    // Create rounded source image
    const roundedSource = await prepareRoundedSource();

    // Generate favicons from the rounded source
    const response = await favicons(roundedSource, configuration);

    // Ensure output directories exist
    await mkdir(OUTPUT_DIR, { recursive: true });
    await mkdir(PUBLIC_DIR, { recursive: true });

    // Write images to vanity-mirror-favicon directory
    for (const image of response.images) {
      const outputPath = join(OUTPUT_DIR, image.name);
      await writeFile(outputPath, image.contents);
      console.log("Created:", image.name);
    }

    // Write files (manifest, etc.) to vanity-mirror-favicon directory
    for (const file of response.files) {
      const outputPath = join(OUTPUT_DIR, file.name);
      await writeFile(outputPath, file.contents);
      console.log("Created:", file.name);
    }

    // Copy all generated files to public directory for Next.js
    for (const image of response.images) {
      const publicPath = join(PUBLIC_DIR, image.name);
      await writeFile(publicPath, image.contents);
      console.log("Copied to public:", image.name);
    }

    for (const file of response.files) {
      const publicPath = join(PUBLIC_DIR, file.name);
      await writeFile(publicPath, file.contents);
      console.log("Copied to public:", file.name);
    }

    // Copy favicon.ico to src/app/ for Next.js App Router
    const appFaviconPath = join(__dirname, "../src/app/favicon.ico");
    await copyFile(join(PUBLIC_DIR, "favicon.ico"), appFaviconPath);
    console.log("Copied to src/app:", "favicon.ico");

    // Print HTML tags for reference
    console.log("\n--- HTML Tags (for reference) ---");
    response.html.forEach((tag) => console.log(tag));

    console.log("\nFavicons generated successfully with rounded corners!");
  } catch (error) {
    console.error("Error generating favicons:", error);
    process.exit(1);
  }
}

generateFavicons();
