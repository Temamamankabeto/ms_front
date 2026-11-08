import QRCode from "./vendor";

/** Local-only QR rendering: never send bearer credentials to third-party QR services. */
export function qrSvgDataUrl(value: string): string {
  const qr = new QRCode(0, 1); // error correction L; 80-character secrets
  qr.addData(value);
  qr.make();
  const count = qr.getModuleCount();
  const paths: string[] = [];
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (qr.isDark(row, col)) paths.push(`M${col + 4} ${row + 4}h1v1h-1z`);
    }
  }
  const size = count + 8;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="white"/><path d="${paths.join('')}" fill="black"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
