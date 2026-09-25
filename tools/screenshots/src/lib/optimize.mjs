// Turns a raw Chrome screenshot into the small file that is committed.
//
// PNG is written lossless first (screenshots of the flat, dark panel compress very well, and a lossless file
// changes only where the screen changed). When that is over the limit (the login page has a photo), a palette
// PNG without dithering is used. WebP is available for shots whose manifest entry asks for `"format": "webp"`.
import sharp from 'sharp';

/** The size every committed image should stay under (bytes). */
export const MAX_BYTES = 200 * 1024;

/**
 * @param {Buffer} png raw screenshot
 * @param {'png'|'webp'} format
 * @returns {Promise<{ bytes: Buffer, width: number, height: number }>}
 */
export async function optimize(png, format) {
  const image = sharp(png);
  const { width, height } = await image.metadata();
  if (format === 'webp') {
    return { bytes: await image.webp({ quality: 88, effort: 6, smartSubsample: true }).toBuffer(), width, height };
  }
  let bytes = await image.png({ compressionLevel: 9, effort: 10 }).toBuffer();
  if (bytes.length > MAX_BYTES) {
    bytes = await sharp(png).png({ palette: true, quality: 92, colours: 256, effort: 10, compressionLevel: 9, dither: 0 }).toBuffer();
  }
  return { bytes, width, height };
}

/**
 * True when two images of the same size only differ by rendering jitter: at most `maxPixels` pixels that differ
 * by more than `tolerance` levels in a channel, plus up to `maxHeaderPixels` in the page header of a full-page
 * shot (the logo and the avatar sit on fractional pixel positions and Chrome anti-aliases their edges
 * differently from one start to the next). The script keeps the committed file in that case, so a re-run changes
 * no file without a reason. A real change of the UI moves far more pixels than this.
 */
export async function nearlyEqual(a, b, { maxPixels = 60, maxHeaderPixels = 600, tolerance = 12 } = {}) {
  const [x, y] = await Promise.all([
    sharp(a).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
    sharp(b).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
  ]);
  const { width, height } = x.info;
  if (width !== y.info.width || height !== y.info.height) return false;
  // The panel header is the top 140 CSS px of a 1440 px wide (or 780 px wide, at 2x) screenshot.
  const headerRows = width === 1440 ? 140 : width === 780 ? 280 : 0;
  let differing = 0;
  let header = 0;
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const i = (row * width + col) * 4;
      if (
        Math.abs(x.data[i] - y.data[i]) > tolerance ||
        Math.abs(x.data[i + 1] - y.data[i + 1]) > tolerance ||
        Math.abs(x.data[i + 2] - y.data[i + 2]) > tolerance
      ) {
        if (row < headerRows) header++;
        else differing++;
        if (differing > maxPixels || header > maxHeaderPixels) return false;
      }
    }
  }
  return true;
}
