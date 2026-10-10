"use client";

import { Billboard, Html, Sparkles, Stars, useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { MutableRefObject, useEffect, useMemo, useRef, useState } from "react";
import {
  AdditiveBlending,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  FogExp2,
  Group,
  Mesh,
  MeshBasicMaterial,
  ShaderMaterial,
  Texture,
  TubeGeometry,
  Vector3,
} from "three";
import { buildLayout, GATE_RADIUS, GateLayout, mulberry32, NodeLayout, pointAtIndex } from "@/lib/multiverseLayout";
import { Entry, PHASE_BOSSES, PHASE_COLORS, PHASE_LABELS } from "@/lib/timeline";
import Wordmark from "../Wordmark";

/** mutable navigation state shared between the DOM HUD and the render loop */
export interface NavState {
  /** fractional movie index the camera is heading for (driven by scroll) */
  target: number;
  /** eased index the camera is actually at */
  focus: number;
  /** pulled-back overview of the whole multiverse */
  map: boolean;
  /** node under the pointer (map mode labels) */
  hovered: number | null;
}

export interface SceneProps {
  entries: Entry[];
  watched: Record<string, number>;
  upNextId: string | null;
  showPhases: boolean;
  finaleId: string;
  doomGlow: number;
  nav: MutableRefObject<NavState>;
  lowPower: boolean;
  onSelect: (entry: Entry) => void;
  onFly: (index: number) => void;
}

const GREEN = new Color("#35e06a");
const DOOM = new Color("#3dff6e");
const tmpA = new Vector3();
const tmpB = new Vector3();

/* ------------------------------------------------------------------ */
/* shared textures                                                     */
/* ------------------------------------------------------------------ */

let glowTex: Texture | null = null;
/** soft radial blob used for nebulae, halos and the up-next beacon */
function getGlowTexture() {
  if (glowTex) return glowTex;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,255,255,0.55)");
  g.addColorStop(0.6, "rgba(255,255,255,0.12)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  glowTex = new CanvasTexture(c);
  return glowTex;
}

/* ------------------------------------------------------------------ */
/* camera rig                                                          */
/* ------------------------------------------------------------------ */

function CameraRig({
  curve,
  count,
  nav,
  span,
  fogColors,
}: {
  curve: CatmullRomCurve3;
  count: number;
  nav: MutableRefObject<NavState>;
  span: { minZ: number; maxZ: number };
  fogColors: (focus: number) => Color;
}) {
  const { camera, scene } = useThree();
  const look = useRef(new Vector3(0, 0, -20));
  const desired = useRef(new Vector3());
  const desiredLook = useRef(new Vector3());

  useEffect(() => {
    // start far out so the first frame is a fly-in
    camera.position.set(40, 30, 60);
    scene.fog = new FogExp2("#05040a", 0.0125);
    scene.background = new Color("#030308");
  }, [camera, scene]);

  useFrame((state, dt) => {
    const n = nav.current;
    const k = Math.min(1, dt * 3.2);
    n.focus += (n.target - n.focus) * k;

    if (n.map) {
      const midZ = (span.minZ + span.maxZ) / 2;
      const len = span.maxZ - span.minZ;
      desired.current.set(len * 0.3, len * 0.2, midZ + len * 0.1);
      desiredLook.current.set(0, 0, midZ);
    } else {
      const p = pointAtIndex(curve, count, n.focus, tmpA);
      const ahead = pointAtIndex(curve, count, n.focus + 0.6, tmpB);
      // ride just behind and above the focused world, slightly toward the axis
      // pull back for the finale so the whole portal fits
      const finale = Math.max(0, Math.min(1, n.focus - (count - 2)));
      desired.current.set(p.x * 0.45, p.y * 0.45 + 1.8 + finale * 2, p.z + 10.5 + finale * 14);
      desiredLook.current.set(ahead.x * 0.75, ahead.y * 0.75, ahead.z - 2);
      // gentle hand-held sway
      const t = state.clock.elapsedTime;
      desired.current.x += Math.sin(t * 0.35) * 0.35;
      desired.current.y += Math.cos(t * 0.29) * 0.25;
    }

    const ck = Math.min(1, dt * (n.map ? 1.6 : 2.6));
    camera.position.lerp(desired.current, ck);
    look.current.lerp(desiredLook.current, ck);
    camera.lookAt(look.current);

    const fog = scene.fog as FogExp2 | null;
    if (fog) {
      fog.color.lerp(fogColors(n.focus), Math.min(1, dt * 1.5));
      fog.density += ((n.map ? 0.0022 : 0.0125) - fog.density) * Math.min(1, dt * 2);
      (scene.background as Color).copy(fog.color).multiplyScalar(0.6);
    }
  });
  return null;
}

/** stars + dust that travel with the camera so space never runs out */
function SpaceDust({ lowPower }: { lowPower: boolean }) {
  const ref = useRef<Group>(null);
  const { camera } = useThree();
  useFrame(() => {
    ref.current?.position.copy(camera.position);
  });
  return (
    <group ref={ref}>
      <Stars radius={140} depth={90} count={lowPower ? 2500 : 7000} factor={5} saturation={0.4} fade speed={0.6} />
      <Sparkles count={lowPower ? 40 : 120} scale={[36, 22, 46]} size={2.2} speed={0.35} opacity={0.55} color="#ffe6b8" />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* the road                                                            */
/* ------------------------------------------------------------------ */

function TrailSegment({ curve, count, i, done }: { curve: CatmullRomCurve3; count: number; i: number; done: boolean }) {
  const geom = useMemo(() => {
    const pts: Vector3[] = [];
    for (let s = 0; s <= 14; s++) pts.push(pointAtIndex(curve, count, i + s / 14));
    return new TubeGeometry(new CatmullRomCurve3(pts), 28, done ? 0.075 : 0.035, 6, false);
  }, [curve, count, i, done]);
  useEffect(() => () => geom.dispose(), [geom]);
  const matRef = useRef<MeshBasicMaterial>(null);
  // freshly-completed segments flash in hot then settle
  const born = useRef(0);
  useEffect(() => {
    born.current = performance.now();
  }, [done]);
  useFrame(() => {
    const m = matRef.current;
    if (!m || !done) return;
    const age = (performance.now() - born.current) / 1000;
    const boost = age < 1.2 ? 1 + (1.2 - age) * 3 : 1;
    m.color.copy(GREEN).multiplyScalar(1.6 * boost);
  });
  return (
    <mesh geometry={geom}>
      <meshBasicMaterial
        ref={matRef}
        color={done ? GREEN.clone().multiplyScalar(1.6) : "#8890b0"}
        transparent
        opacity={done ? 0.95 : 0.22}
        toneMapped={false}
        depthWrite={false}
      />
    </mesh>
  );
}

/** a spark that races along the completed stretch of the road */
function EnergyPulse({ curve, count, upTo }: { curve: CatmullRomCurve3; count: number; upTo: number }) {
  const ref = useRef<Group>(null);
  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    if (upTo <= 0) {
      g.visible = false;
      return;
    }
    g.visible = true;
    const speed = 2.4; // movies per second
    const t = (state.clock.elapsedTime * speed) % (upTo + 1.5);
    pointAtIndex(curve, count, Math.min(t, upTo), g.position);
    g.scale.setScalar(t > upTo ? Math.max(0.01, 1 - (t - upTo)) : 1);
  });
  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[0.16, 12, 12]} />
        <meshBasicMaterial color={GREEN.clone().multiplyScalar(4)} toneMapped={false} />
      </mesh>
      <sprite scale={[2.2, 2.2, 1]}>
        <spriteMaterial map={getGlowTexture()} color="#35e06a" blending={AdditiveBlending} depthWrite={false} transparent opacity={0.8} />
      </sprite>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* worlds (one per movie)                                              */
/* ------------------------------------------------------------------ */

const planetVert = /* glsl */ `
varying vec3 vN;
varying vec3 vView;
varying vec3 vPos;
void main() {
  vN = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = normalize(-mv.xyz);
  vPos = position;
  gl_Position = projectionMatrix * mv;
}`;

/** gas-giant bands + a hot fresnel rim in the movie's signature colour */
const planetFrag = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uRim;
uniform float uIntensity;
uniform float uTime;
uniform float uSeed;
varying vec3 vN;
varying vec3 vView;
varying vec3 vPos;
void main() {
  float f = pow(1.0 - max(dot(normalize(vN), normalize(vView)), 0.0), 2.4);
  vec3 p = normalize(vPos);
  float warp = sin(p.x * 4.0 + uSeed + uTime * 0.35) * 0.6 + sin(p.z * 6.0 - uTime * 0.2) * 0.3;
  float bands = sin(p.y * 9.0 + warp * 2.0 + uSeed) * 0.5 + 0.5;
  float fine = sin(p.y * 31.0 + warp * 5.0) * 0.5 + 0.5;
  vec3 base = uColor * (0.12 + 0.32 * bands + 0.08 * fine);
  // terminator: a little directional shading so they read as spheres
  float light = clamp(dot(normalize(vN), normalize(vec3(0.4, 0.7, 0.6))) * 0.5 + 0.6, 0.2, 1.1);
  vec3 col = base * light * uIntensity + uRim * f * (1.4 + uIntensity);
  gl_FragColor = vec4(col, 1.0);
}`;

function usePlanetUniforms(color: Color, rim: Color, seed: number) {
  return useMemo(
    () => ({
      uColor: { value: color.clone() },
      uRim: { value: rim.clone() },
      uIntensity: { value: 1 },
      uTime: { value: 0 },
      uSeed: { value: seed },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
}

/* (world component)                                                   */
/* ------------------------------------------------------------------ */

function World({
  node,
  watched,
  upNext,
  nav,
  isFinale,
  onSelect,
  onFly,
}: {
  node: NodeLayout;
  watched: boolean;
  upNext: boolean;
  nav: MutableRefObject<NavState>;
  isFinale: boolean;
  onSelect: (e: Entry) => void;
  onFly: (i: number) => void;
}) {
  const { entry, index } = node;
  const group = useRef<Group>(null);
  const shell = useRef<Mesh>(null);
  const ring = useRef<Mesh>(null);
  const core = useRef<ShaderMaterial>(null);
  const shock = useRef<Mesh>(null);
  const beacon = useRef<Mesh>(null);
  const label = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const aura = useMemo(() => new Color(entry.wm.aura), [entry.wm.aura]);
  const radius = isFinale ? 1.6 : 0.85;
  const coreColor = watched ? aura.clone().lerp(GREEN, 0.2) : aura.clone().multiplyScalar(upNext ? 1 : 0.6);
  const rimColor = watched ? GREEN.clone().multiplyScalar(1.4) : aura.clone().multiplyScalar(upNext ? 1.5 : 0.9);
  const uniforms = usePlanetUniforms(coreColor, rimColor, index * 1.37);
  useEffect(() => {
    uniforms.uColor.value.copy(coreColor);
    uniforms.uRim.value.copy(rimColor);
  });

  // shockwave when this world flips to watched
  const shockStart = useRef(-1);
  const prevWatched = useRef(watched);
  useEffect(() => {
    if (watched && !prevWatched.current) shockStart.current = performance.now();
    prevWatched.current = watched;
  }, [watched]);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    // glide to new positions when the order changes
    g.position.lerp(node.pos, Math.min(1, dt * 3));
    const t = state.clock.elapsedTime;
    if (shell.current) {
      shell.current.rotation.y += dt * (watched ? 0.15 : 0.35);
      shell.current.rotation.x += dt * 0.12;
    }
    if (ring.current) ring.current.rotation.z += dt * (upNext ? 1.2 : 0.3);

    const pulse = upNext ? 1 + Math.sin(t * 3) * 0.08 : 1;
    const hoverScale = hover ? 1.15 : 1;
    const s = g.scale.x + (pulse * hoverScale - g.scale.x) * Math.min(1, dt * 8);
    g.scale.setScalar(s);

    uniforms.uTime.value = t;
    const base = watched ? 1.25 : upNext ? 1.5 + Math.sin(t * 3) * 0.4 : 0.8;
    uniforms.uIntensity.value += (base + (hover ? 0.7 : 0) - uniforms.uIntensity.value) * Math.min(1, dt * 6);

    if (beacon.current) {
      (beacon.current.material as MeshBasicMaterial).opacity = 0.35 + Math.sin(t * 2.2) * 0.15;
    }

    if (shock.current) {
      const m = shock.current.material as MeshBasicMaterial;
      if (shockStart.current > 0) {
        const age = (performance.now() - shockStart.current) / 1000;
        if (age > 1.4) {
          shockStart.current = -1;
          shock.current.visible = false;
        } else {
          shock.current.visible = true;
          shock.current.scale.setScalar(1 + age * 9);
          m.opacity = Math.max(0, 1 - age / 1.4);
        }
      } else shock.current.visible = false;
    }

    // labels fade with distance from the camera's focus (or hover in map mode)
    const el = label.current;
    if (el) {
      const n = nav.current;
      const d = Math.abs(index - n.focus);
      let o = n.map ? (n.hovered === index ? 1 : 0) : Math.max(0, Math.min(1, 1 - (d - 1.6) / 2.2));
      if (hover) o = 1;
      el.style.opacity = o.toFixed(3);
      el.style.visibility = o < 0.02 ? "hidden" : "visible";
    }
  });

  return (
    <group ref={group} position={node.pos}>
      {/* invisible fat hit-target so worlds are easy to click */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          if (nav.current.map) onFly(index);
          else if (Math.abs(nav.current.focus - index) > 0.6) onFly(index);
          else onSelect(entry);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
          nav.current.hovered = index;
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHover(false);
          if (nav.current.hovered === index) nav.current.hovered = null;
          document.body.style.cursor = "";
        }}
      >
        <sphereGeometry args={[radius * 2.1, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* core */}
      <mesh>
        <sphereGeometry args={[radius, 48, 48]} />
        <shaderMaterial ref={core} vertexShader={planetVert} fragmentShader={planetFrag} uniforms={uniforms} toneMapped={false} />
      </mesh>

      {/* halo */}
      <sprite scale={[radius * 5.5, radius * 5.5, 1]}>
        <spriteMaterial
          map={getGlowTexture()}
          color={watched ? GREEN : aura}
          blending={AdditiveBlending}
          depthWrite={false}
          transparent
          opacity={watched ? 0.5 : upNext ? 0.75 : 0.28}
        />
      </sprite>

      {/* lattice shell */}
      <mesh ref={shell}>
        <icosahedronGeometry args={[radius * 1.55, 1]} />
        <meshBasicMaterial
          color={watched ? GREEN : aura}
          wireframe
          transparent
          opacity={watched ? 0.5 : 0.22}
          toneMapped={false}
        />
      </mesh>

      {/* orbit ring */}
      <mesh ref={ring} rotation={[Math.PI / 2.4, 0.3, 0]}>
        <torusGeometry args={[radius * 2.1, watched ? 0.045 : 0.025, 8, 80]} />
        <meshBasicMaterial
          color={(watched ? GREEN : aura).clone().multiplyScalar(watched ? 2 : 1.2)}
          transparent
          opacity={watched ? 0.95 : 0.45}
          toneMapped={false}
        />
      </mesh>

      {/* watched shockwave */}
      <mesh ref={shock} visible={false} rotation={[Math.PI / 2.4, 0.3, 0]}>
        <torusGeometry args={[radius * 1.2, 0.06, 8, 64]} />
        <meshBasicMaterial color={GREEN.clone().multiplyScalar(3)} transparent opacity={0} toneMapped={false} depthWrite={false} />
      </mesh>

      {/* up-next beacon */}
      {upNext && (
        <mesh ref={beacon} position={[0, 14, 0]}>
          <cylinderGeometry args={[0.08, 0.5, 26, 16, 1, true]} />
          <meshBasicMaterial
            color={new Color("#e8b64c").multiplyScalar(2)}
            transparent
            opacity={0.4}
            blending={AdditiveBlending}
            side={DoubleSide}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      )}

      <Html
        center
        position={[0, -(radius * 2.4 + 0.4), 0]}
        distanceFactor={11}
        zIndexRange={[20, 0]}
        style={{ pointerEvents: "none" }}
      >
        <div ref={label} className={`mv-label ${watched ? "watched" : ""} ${upNext ? "upnext" : ""}`} style={{ opacity: 0 }}>
          {upNext && <span className="upnext-badge">Up Next</span>}
          {entry.sub && <span className="sub-label">{entry.sub}</span>}
          <Wordmark entry={entry} base={isFinale ? 2.2 : 1.6} />
          <span className="mv-year">
            {entry.year}
            {watched && <span className="mv-check"> · ✓ watched</span>}
          </span>
        </div>
      </Html>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* phase gates + looming bosses                                        */
/* ------------------------------------------------------------------ */

function BossSpecter({ img, pos, color, defeated }: { img: string; pos: Vector3; color: string; defeated: boolean }) {
  const tex = useTexture(img);
  const mat = useRef<MeshBasicMaterial>(null);
  const aspect = tex.image ? (tex.image as HTMLImageElement).width / (tex.image as HTMLImageElement).height : 0.6;
  const h = 26;
  const tint = useMemo(() => (defeated ? new Color("#4a4a52") : new Color(color).lerp(new Color("#ffffff"), 0.35)), [color, defeated]);
  useFrame((state) => {
    if (!mat.current) return;
    const t = state.clock.elapsedTime;
    mat.current.opacity = defeated ? 0.13 : 0.3 + Math.sin(t * 0.8) * 0.06;
  });
  return (
    <Billboard position={pos}>
      <mesh>
        <planeGeometry args={[h * aspect, h]} />
        <meshBasicMaterial ref={mat} map={tex} color={tint} transparent depthWrite={false} fog={false} toneMapped={false} />
      </mesh>
    </Billboard>
  );
}

function Gate({ gate, defeated, nav, onFly }: { gate: GateLayout; defeated: boolean; nav: MutableRefObject<NavState>; onFly: (i: number) => void }) {
  const color = PHASE_COLORS[gate.phase];
  const boss = PHASE_BOSSES[gate.phase];
  const spin = useRef<Group>(null);
  const shards = useRef<Group>(null);
  const label = useRef<HTMLDivElement>(null);
  const c = useMemo(() => new Color(color).multiplyScalar(2.2), [color]);

  useFrame((_, dt) => {
    if (spin.current) spin.current.rotation.z += dt * 0.08;
    if (shards.current) {
      shards.current.children.forEach((ch, i) => {
        ch.rotation.z += dt * 0.02 * (i % 2 ? 1 : -1);
      });
    }
    const el = label.current;
    if (el) {
      const n = nav.current;
      const d = Math.min(Math.abs(n.focus - gate.firstIndex), Math.abs(n.focus - (gate.firstIndex - 1)));
      const o = n.map ? 1 : Math.max(0, Math.min(1, 1 - (d - 1) / 2));
      el.style.opacity = o.toFixed(3);
      el.style.visibility = o < 0.02 ? "hidden" : "visible";
    }
  });

  // the boss looms behind the middle of its phase
  const bossPos = useMemo(() => {
    const span = gate.lastIndex - gate.firstIndex;
    return new Vector3(gate.phase % 2 ? 22 : -22, 6, gate.pos.z - 12 - span * 4);
  }, [gate]);

  // shattered ring: arcs knocked out of alignment
  const arcs = defeated ? 7 : 1;

  return (
    <group>
      <group position={gate.pos}>
        {defeated ? (
          <group ref={shards}>
            {Array.from({ length: arcs }, (_, i) => (
              <mesh key={i} rotation={[0, 0, (i / arcs) * Math.PI * 2]} position={[Math.cos(i * 1.7) * 0.6, Math.sin(i * 2.3) * 0.6, Math.sin(i) * 1.2]}>
                <torusGeometry args={[GATE_RADIUS, 0.12, 8, 24, (Math.PI * 2) / arcs - 0.18]} />
                <meshBasicMaterial color={new Color(color).multiplyScalar(0.9)} transparent opacity={0.55} toneMapped={false} />
              </mesh>
            ))}
          </group>
        ) : (
          <>
            <mesh>
              <torusGeometry args={[GATE_RADIUS, 0.14, 12, 160]} />
              <meshBasicMaterial color={c} toneMapped={false} />
            </mesh>
            <group ref={spin}>
              {Array.from({ length: 12 }, (_, i) => (
                <mesh key={i} rotation={[0, 0, (i / 12) * Math.PI * 2]}>
                  <torusGeometry args={[GATE_RADIUS + 0.9, 0.05, 6, 16, 0.32]} />
                  <meshBasicMaterial color={c} transparent opacity={0.7} toneMapped={false} />
                </mesh>
              ))}
            </group>
            <mesh>
              <ringGeometry args={[GATE_RADIUS - 0.2, GATE_RADIUS + 2.6, 96]} />
              <meshBasicMaterial color={color} transparent opacity={0.06} side={DoubleSide} depthWrite={false} blending={AdditiveBlending} />
            </mesh>
          </>
        )}
        <Html center position={[0, GATE_RADIUS + 2.2, 0]} distanceFactor={14} zIndexRange={[20, 0]}>
          <div
            ref={label}
            className={`mv-gate ${defeated ? "defeated" : ""}`}
            style={{ "--phase-color": color, opacity: 0 } as React.CSSProperties}
            onClick={() => onFly(gate.firstIndex)}
          >
            <span className="label">{PHASE_LABELS[gate.phase]}</span>
            {boss && (
              <span className="boss-tag">
                {defeated ? (
                  <>
                    <span className="boss-skull">☠</span> {boss.name} defeated
                  </>
                ) : (
                  <>Boss · {boss.name}</>
                )}
              </span>
            )}
          </div>
        </Html>
      </group>
      {boss && <BossSpecter img={boss.img} pos={bossPos} color={color} defeated={defeated} />}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* nebulae                                                             */
/* ------------------------------------------------------------------ */

function Nebulae({ clouds }: { clouds: { pos: Vector3; size: number; color: string; opacity: number }[] }) {
  const tex = getGlowTexture();
  return (
    <group>
      {clouds.map((c, i) => (
        <sprite key={i} position={c.pos} scale={[c.size, c.size * 0.7, 1]}>
          <spriteMaterial map={tex} color={c.color} blending={AdditiveBlending} transparent opacity={c.opacity} depthWrite={false} fog={false} />
        </sprite>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* the Doomsday portal                                                 */
/* ------------------------------------------------------------------ */

const portalVert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const portalFrag = /* glsl */ `
uniform float uTime;
uniform float uGlow;
varying vec2 vUv;
void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r = length(p);
  if (r > 1.0) discard;
  float a = atan(p.y, p.x);
  float swirl = sin(a * 5.0 + r * 14.0 - uTime * 2.2) * 0.5 + 0.5;
  float swirl2 = sin(a * 9.0 - r * 22.0 + uTime * 1.3) * 0.5 + 0.5;
  float s = mix(swirl, swirl2, 0.35);
  float core = smoothstep(0.55, 0.0, r);
  float edge = smoothstep(1.0, 0.82, r);
  vec3 deep = vec3(0.01, 0.12, 0.05);
  vec3 hot = vec3(0.45, 1.0, 0.6);
  vec3 col = mix(deep, hot, s * (0.35 + 0.65 * uGlow)) + core * hot * (0.4 + uGlow);
  float alpha = edge * (0.25 + 0.75 * s) * (0.22 + 0.5 * uGlow);
  gl_FragColor = vec4(col * (0.7 + uGlow * 1.4), alpha);
}`;

function DoomPortal({ z, glow }: { z: number; glow: number }) {
  const mat = useRef<ShaderMaterial>(null);
  const rings = useRef<Group>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uGlow: { value: glow } }), []); // eslint-disable-line react-hooks/exhaustive-deps
  useFrame((state, dt) => {
    if (mat.current) {
      mat.current.uniforms.uTime.value = state.clock.elapsedTime;
      mat.current.uniforms.uGlow.value += (glow - mat.current.uniforms.uGlow.value) * Math.min(1, dt * 2);
    }
    if (rings.current) {
      rings.current.children.forEach((ch, i) => {
        ch.rotation.z += dt * (0.2 + i * 0.12) * (i % 2 ? -1 : 1);
        ch.rotation.x = Math.sin(state.clock.elapsedTime * 0.3 + i) * 0.15;
      });
    }
  });
  const doomTex = useTexture("/bosses/doom.png");
  const aspect = doomTex.image ? (doomTex.image as HTMLImageElement).width / (doomTex.image as HTMLImageElement).height : 0.45;
  return (
    <group position={[0, 0, z]}>
      <mesh position={[0, 0, -1.5]}>
        <circleGeometry args={[9, 96]} />
        <shaderMaterial
          ref={mat}
          vertexShader={portalVert}
          fragmentShader={portalFrag}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
          side={DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <group ref={rings}>
        {[9.4, 10.6, 12.2].map((r, i) => (
          <mesh key={r}>
            <torusGeometry args={[r, 0.07 + i * 0.02, 8, 160, Math.PI * (1.4 + i * 0.25)]} />
            <meshBasicMaterial color={DOOM.clone().multiplyScalar(1.2 + glow * 2)} transparent opacity={0.4 + glow * 0.5} toneMapped={false} />
          </mesh>
        ))}
      </group>
      <pointLight color="#3dff6e" intensity={20 + glow * 80} distance={60} />
      <mesh position={[0, 4, -26]}>
        <planeGeometry args={[34 * aspect, 34]} />
        <meshBasicMaterial map={doomTex} color={new Color("#9dffbc")} transparent opacity={0.12 + glow * 0.25} depthWrite={false} fog={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* the whole multiverse                                                */
/* ------------------------------------------------------------------ */

export default function Scene({ entries, watched, upNextId, showPhases, finaleId, doomGlow, nav, lowPower, onSelect, onFly }: SceneProps) {
  const layout = useMemo(() => buildLayout(entries, showPhases, finaleId), [entries, showPhases, finaleId]);
  const count = layout.nodes.length;

  const span = useMemo(() => ({ minZ: layout.finaleZ - 10, maxZ: 10 }), [layout.finaleZ]);

  // color of space around each movie: its phase in release mode, its aura otherwise
  const fogColors = useMemo(() => {
    const cols = layout.nodes.map((n) => {
      const base = showPhases && n.entry.phase ? PHASE_COLORS[n.entry.phase] : n.entry.wm.aura;
      return new Color(base).multiplyScalar(0.07);
    });
    const out = new Color();
    return (focus: number) => {
      if (!cols.length) return out.set("#05040a");
      const i = Math.max(0, Math.min(cols.length - 1, focus));
      const a = cols[Math.floor(i)];
      const b = cols[Math.min(cols.length - 1, Math.ceil(i))];
      return out.copy(a).lerp(b, i - Math.floor(i));
    };
  }, [layout, showPhases]);

  const clouds = useMemo(() => {
    const rnd = mulberry32(1337 + (showPhases ? 0 : 7));
    const out: { pos: Vector3; size: number; color: string; opacity: number }[] = [];
    layout.nodes.forEach((n, i) => {
      if (i % 2) return;
      const color = showPhases && n.entry.phase ? PHASE_COLORS[n.entry.phase] : n.entry.wm.aura;
      for (let k = 0; k < (lowPower ? 1 : 2); k++) {
        const a = rnd() * Math.PI * 2;
        const r = 18 + rnd() * 26;
        out.push({
          pos: new Vector3(Math.cos(a) * r, Math.sin(a) * r * 0.6, n.pos.z - rnd() * 16),
          size: 30 + rnd() * 40,
          color,
          opacity: 0.05 + rnd() * 0.07,
        });
      }
    });
    return out;
  }, [layout, showPhases, lowPower]);

  const phaseDefeated = (p: number) => entries.filter((e) => e.phase === p).every((e) => watched[e.id]);

  // furthest point of an unbroken watched run, for the energy pulse
  let streak = 0;
  while (streak < count && watched[layout.nodes[streak].entry.id]) streak++;
  const pulseTo = Math.min(count - 1, streak);

  return (
    <>
      <CameraRig curve={layout.curve} count={count} nav={nav} span={span} fogColors={fogColors} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[10, 20, 10]} intensity={0.8} />
      <SpaceDust lowPower={lowPower} />
      <Nebulae clouds={clouds} />

      {layout.nodes.slice(0, -1).map((n, i) => (
        <TrailSegment key={`${n.entry.id}-${layout.nodes[i + 1].entry.id}`} curve={layout.curve} count={count} i={i} done={Boolean(watched[n.entry.id])} />
      ))}
      <EnergyPulse curve={layout.curve} count={count} upTo={streak > 0 ? pulseTo : 0} />

      {layout.nodes.map((n) => (
        <World
          key={n.entry.id}
          node={n}
          watched={Boolean(watched[n.entry.id])}
          upNext={n.entry.id === upNextId && !watched[n.entry.id]}
          isFinale={n.entry.id === finaleId}
          nav={nav}
          onSelect={onSelect}
          onFly={onFly}
        />
      ))}

      {layout.gates.map((g) => (
        <Gate key={g.phase} gate={g} defeated={phaseDefeated(g.phase)} nav={nav} onFly={onFly} />
      ))}

      <DoomPortal z={layout.finaleZ} glow={doomGlow} />

      {!lowPower && (
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur intensity={1.15} luminanceThreshold={0.62} luminanceSmoothing={0.2} radius={0.75} />
          <Noise opacity={0.035} />
          <Vignette eskil={false} offset={0.18} darkness={0.85} />
        </EffectComposer>
      )}
    </>
  );
}
