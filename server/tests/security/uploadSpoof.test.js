'use strict';

const { verifyMagicBytes } = require('../../src/middleware/upload');

describe('Security — Magic Byte Verification', () => {
  // Create minimal valid file buffers
  const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
  const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const webpBuffer = Buffer.from([
    0x52, 0x49, 0x46, 0x46, // RIFF
    0x00, 0x00, 0x00, 0x00, // size
    0x57, 0x45, 0x42, 0x50, // WEBP
  ]);
  const fakeJpegBuffer = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00]);
  const pdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d]);

  test('accepts valid JPEG buffer', () => {
    expect(verifyMagicBytes(jpegBuffer, 'image/jpeg')).toBe(true);
  });

  test('accepts valid PNG buffer', () => {
    expect(verifyMagicBytes(pngBuffer, 'image/png')).toBe(true);
  });

  test('accepts valid WebP buffer', () => {
    expect(verifyMagicBytes(webpBuffer, 'image/webp')).toBe(true);
  });

  test('accepts valid PDF buffer', () => {
    expect(verifyMagicBytes(pdfBuffer, 'application/pdf')).toBe(true);
  });

  test('rejects JPEG mime with non-JPEG bytes (upload spoof)', () => {
    expect(verifyMagicBytes(fakeJpegBuffer, 'image/jpeg')).toBe(false);
  });

  test('rejects PNG mime with JPEG bytes', () => {
    expect(verifyMagicBytes(jpegBuffer, 'image/png')).toBe(false);
  });

  test('rejects WebP mime with PNG bytes', () => {
    expect(verifyMagicBytes(pngBuffer, 'image/webp')).toBe(false);
  });

  test('rejects empty buffer', () => {
    expect(verifyMagicBytes(Buffer.alloc(0), 'image/jpeg')).toBe(false);
  });

  test('rejects null buffer', () => {
    expect(verifyMagicBytes(null, 'image/jpeg')).toBe(false);
  });

  test('rejects short buffer (< 4 bytes)', () => {
    expect(verifyMagicBytes(Buffer.from([0xff, 0xd8]), 'image/jpeg')).toBe(false);
  });
});

