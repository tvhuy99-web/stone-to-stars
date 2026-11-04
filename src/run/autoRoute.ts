import { DungeonLayout, WALL_THICKNESS, BARRIER_THICKNESS } from './dungeonGen';

export interface Point { x: number; y: number }

/**
 * Find an obstacle-aware route for the accessibility auto-explore option.
 * The map is known when an expedition starts, so a small A* grid is enough.
 * A safety margin keeps the hero clear of the circular props and barrier sides.
 */
export function findAutoRoute(layout: DungeonLayout, start: Point, target: Point): Point[] | null {
  const step = 48;
  const safety = 30;
  const edge = WALL_THICKNESS + safety;
  const cols = Math.max(1, Math.floor((layout.width - edge * 2) / step) + 1);
  const rows = Math.max(1, Math.floor((layout.height - edge * 2) / step) + 1);
  const n = cols * rows;
  if (n > 30000) return null; // Avoid pathological allocations on unusual viewports.

  const point = (i: number): Point => ({ x: edge + (i % cols) * step, y: edge + Math.floor(i / cols) * step });
  const clear = (p: Point): boolean => {
    if (p.x < edge || p.y < edge || p.x > layout.width - edge || p.y > layout.height - edge) return false;
    for (const b of layout.barriers) {
      const across = b.axis === 'v' ? p.x : p.y;
      const along = b.axis === 'v' ? p.y : p.x;
      if (Math.abs(across - b.pos) < BARRIER_THICKNESS / 2 + safety &&
          (along < b.gap.start + safety || along > b.gap.end - safety)) return false;
    }
    return !layout.obstacles.some(o => Math.hypot(p.x - o.x, p.y - o.y) < o.r + safety);
  };
  const walkable = new Uint8Array(n);
  for (let i = 0; i < n; i++) walkable[i] = clear(point(i)) ? 1 : 0;

  const nearest = (p: Point): number => {
    let best = -1;
    let distance = Infinity;
    for (let i = 0; i < n; i++) {
      if (!walkable[i]) continue;
      const q = point(i), d = (q.x - p.x) ** 2 + (q.y - p.y) ** 2;
      if (d < distance) { distance = d; best = i; }
    }
    return best;
  };
  const begin = nearest(start), goal = nearest(target);
  if (begin < 0 || goal < 0) return null;
  if (begin === goal) return [point(goal)];

  const came = new Int32Array(n).fill(-1);
  const score = new Float64Array(n).fill(Infinity);
  score[begin] = 0;
  const open = new Set<number>([begin]);
  const closed = new Uint8Array(n);
  const h = (i: number): number => {
    const a = point(i), b = point(goal);
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  while (open.size) {
    let current = -1, best = Infinity;
    for (const i of open) {
      const candidate = score[i] + h(i);
      if (candidate < best) { best = candidate; current = i; }
    }
    if (current === goal) {
      const route: Point[] = [];
      let i = goal;
      while (i !== begin && i !== -1) { route.push(point(i)); i = came[i]; }
      route.reverse();
      return route;
    }
    open.delete(current);
    closed[current] = 1;
    const x = current % cols, y = Math.floor(current / cols);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
      const next = ny * cols + nx;
      if (!walkable[next] || closed[next]) continue;
      if (dx && dy && (!walkable[y * cols + nx] || !walkable[ny * cols + x])) continue;
      const candidate = score[current] + step * (dx && dy ? Math.SQRT2 : 1);
      if (candidate >= score[next]) continue;
      came[next] = current;
      score[next] = candidate;
      open.add(next);
    }
  }
  return null;
}
