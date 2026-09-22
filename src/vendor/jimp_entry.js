const { Jimp } = require('jimp');

async function processWatermarkWithJimp(baseBuffer, wmBuffer, mime = 'image/jpeg') {
  const [baseImage, watermark] = await Promise.all([
    Jimp.read(baseBuffer),
    Jimp.read(wmBuffer)
  ]);

  const baseW = baseImage.bitmap.width;
  const baseH = baseImage.bitmap.height;
  const diagonal = Math.hypot(baseW, baseH);
  const angle = (Math.atan2(baseH, baseW) * 180) / Math.PI;

  const targetWmWidth = Math.round(diagonal * 0.85);
  watermark.resize({ w: targetWmWidth });
  watermark.opacity(0.4);
  watermark.rotate(-angle);

  const posX = Math.round((baseW - watermark.bitmap.width) / 2);
  const posY = Math.round((baseH - watermark.bitmap.height) / 2);

  baseImage.composite(watermark, posX, posY);

  const outputMime = mime === 'image/png' ? 'image/png' : 'image/jpeg';
  return baseImage.getBuffer(outputMime, { quality: 85 });
}

module.exports = { processWatermarkWithJimp };
