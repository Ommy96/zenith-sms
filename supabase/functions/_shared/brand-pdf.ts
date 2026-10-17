// Exact Stepped Summit geometry, rendered locally without fetching SVG assets.
type FooterPage = {
  drawSvgPath: (path: string, options: Record<string, unknown>) => void;
  drawCircle: (options: Record<string, unknown>) => void;
};
export function drawZenithFooterMark(page: FooterPage, x: number, baseline: number) {
  const scale = 12 / 120;
  const color = { type: "RGB", red: 107 / 255, green: 114 / 255, blue: 128 / 255 };
  const origin = { x: x + 22 * scale, y: baseline + 10 - 22 * scale, scale, color };
  page.drawSvgPath("M8 76 L78 20 L78 28 L22 76 Z", { ...origin, opacity: 0.2 });
  for (const path of ["M0 68 L50 68 L58 76 L8 76 Z", "M14 44 L64 44 L72 52 L22 52 Z", "M28 20 L78 20 L78 28 L28 28 Z"]) page.drawSvgPath(path, origin);
  page.drawCircle({ x: origin.x + 76 * scale, y: origin.y - 24 * scale, size: 4 * scale, color });
}