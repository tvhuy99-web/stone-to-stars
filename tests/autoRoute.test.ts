import { describe, expect, it } from 'vitest';
import { findAutoRoute } from '../src/run/autoRoute';
import { DungeonLayout, BARRIER_THICKNESS, WALL_THICKNESS } from '../src/run/dungeonGen';

function sampleLayout(): DungeonLayout {
  return {
    width: 1200, height: 780, start: { x: 190, y: 350 },
    barriers: [{ axis: 'v', pos: 600, gap: { start: 180, end: 450 }, kind: 'river' }],
    obstacles: [{ x: 340, y: 340, r: 52 }],
  };
}

describe('accessible exploration pathfinding', () => {
  it('finds a route across a river through the bridge opening', () => {
    const map = sampleLayout();
    const route = findAutoRoute(map, map.start, { x: 1010, y: 370 });
    expect(route).not.toBeNull();
    expect(route!.length).toBeGreaterThan(0);
    for (const p of route!) {
      expect(p.x).toBeGreaterThanOrEqual(WALL_THICKNESS + 30);
      expect(p.y).toBeGreaterThanOrEqual(WALL_THICKNESS + 30);
      expect(Math.hypot(p.x - 340, p.y - 340)).toBeGreaterThanOrEqual(52 + 30);
      if (Math.abs(p.x - 600) < BARRIER_THICKNESS / 2 + 30) {
        expect(p.y).toBeGreaterThanOrEqual(180 + 30);
        expect(p.y).toBeLessThanOrEqual(450 - 30);
      }
    }
  });

  it('returns no route if the only gate is too narrow', () => {
    const map = sampleLayout();
    map.barriers[0].gap = { start: 310, end: 345 };
    expect(findAutoRoute(map, map.start, { x: 1010, y: 370 })).toBeNull();
  });

  it('finds a local route without a barrier', () => {
    const map = sampleLayout();
    map.barriers = [];
    const route = findAutoRoute(map, { x: 190, y: 220 }, { x: 550, y: 200 });
    expect(route).not.toBeNull();
    expect(route!.length).toBeGreaterThan(0);
  });
});
