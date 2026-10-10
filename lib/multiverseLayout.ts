import { CatmullRomCurve3, Vector3 } from "three";
import { Entry } from "./timeline";

/**
 * Geometry for the 3D "multiverse highway": the watch order becomes a helix
 * that spirals away from the camera down -z.  Each phase gets a gap with a
 * giant gate ring, and the finale (Doomsday) sits dead-centre in a portal at
 * the end of the road.
 */

export const STEP = 8; // z distance between consecutive movies
export const GATE_GAP = 12; // extra z spacing where a phase begins
export const FINALE_GAP = 16; // extra z spacing before the Doomsday portal
export const GATE_RADIUS = 10.5;

export interface NodeLayout {
  entry: Entry;
  index: number;
  pos: Vector3;
}

export interface GateLayout {
  phase: number;
  /** index of the first movie of the phase */
  firstIndex: number;
  /** index of the last movie of the phase */
  lastIndex: number;
  pos: Vector3;
}

export interface MultiverseLayout {
  nodes: NodeLayout[];
  gates: GateLayout[];
  curve: CatmullRomCurve3;
  /** z of the finale node (portal centre) */
  finaleZ: number;
  startZ: number;
}

export function buildLayout(entries: Entry[], showPhases: boolean, finaleId?: string): MultiverseLayout {
  const nodes: NodeLayout[] = [];
  const gates: GateLayout[] = [];
  let z = 0;
  let prevPhase: number | undefined;

  entries.forEach((entry, i) => {
    const isFinale = entry.id === finaleId && i === entries.length - 1;
    if (showPhases && entry.phase !== undefined && entry.phase !== prevPhase) {
      if (gates.length) gates[gates.length - 1].lastIndex = i - 1;
      if (i > 0) z -= GATE_GAP;
      gates.push({ phase: entry.phase, firstIndex: i, lastIndex: i, pos: new Vector3(0, 0, z + GATE_GAP * 0.55) });
      prevPhase = entry.phase;
    }
    if (isFinale) z -= FINALE_GAP;

    // helix with a breathing radius so the road never feels mechanical
    const a = i * 0.74;
    const r = isFinale ? 0 : 5.4 + Math.sin(i * 0.45) * 1.5;
    const pos = new Vector3(
      Math.cos(a) * r,
      Math.sin(a) * r * 0.58 + (isFinale ? 0 : Math.sin(i * 0.21) * 1.1),
      z,
    );
    nodes.push({ entry, index: i, pos });
    z -= STEP;
  });
  if (gates.length) gates[gates.length - 1].lastIndex = entries.length - 1;

  const pts = nodes.map((n) => n.pos.clone());
  // a curve needs 2+ points
  if (pts.length === 1) pts.push(pts[0].clone().add(new Vector3(0, 0, -1)));
  const curve = new CatmullRomCurve3(pts, false, "centripetal", 0.5);

  return {
    nodes,
    gates,
    curve,
    finaleZ: nodes.length ? nodes[nodes.length - 1].pos.z : 0,
    startZ: 0,
  };
}

/** point on the road at a (fractional) movie index */
export function pointAtIndex(curve: CatmullRomCurve3, count: number, index: number, target = new Vector3()) {
  if (count < 2) return target.copy(curve.points[0]);
  const t = Math.min(1, Math.max(0, index / (count - 1)));
  return curve.getPoint(t, target);
}

/** deterministic PRNG so nebulae don't reshuffle on every render */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
