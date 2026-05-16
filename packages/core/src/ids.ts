let counter = 0;

/** Pure, cross-platform id generator (works in Node, Next, and React Native). */
export function newId(prefix: string): string {
  counter = (counter + 1) % 1_000_000;
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${rand}`;
}
