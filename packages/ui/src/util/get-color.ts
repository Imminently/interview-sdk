/**
 * Deterministically generate a color from a seed string.
 * Returns an HSL color string suitable for CSS.
 */
export function getColor(seed: string | undefined | null): string {
  const input = (seed ?? "").toString();
  if (input.length === 0) {
    return "hsl(210, 50%, 80%)"; // default soft blue
  }

  // Simple string hash (deterministic)
  let hash = 0;
  for (let index = 0; index < input.length; index++) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0; // Convert to 32bit integer
  }

  // Map hash to HSL components
  const hue = Math.abs(hash) % 360;
  const saturation = 65; // 0-100
  const lightness = 80; // 0-100 (lighter for backgrounds/borders)

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}


