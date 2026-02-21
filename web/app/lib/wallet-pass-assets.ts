const ONE_PIXEL_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/w8AAgMBgJf2N6QAAAAASUVORK5CYII=';

export const WALLET_PASS_ASSETS: Record<string, Buffer> = {
  'icon.png': Buffer.from(ONE_PIXEL_PNG_BASE64, 'base64'),
  'logo.png': Buffer.from(ONE_PIXEL_PNG_BASE64, 'base64'),
  'icon@2x.png': Buffer.from(ONE_PIXEL_PNG_BASE64, 'base64'),
  'logo@2x.png': Buffer.from(ONE_PIXEL_PNG_BASE64, 'base64'),
};
