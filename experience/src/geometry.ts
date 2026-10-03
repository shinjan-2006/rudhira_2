import * as THREE from "three";
export interface WorldGeometry {
  cell: THREE.LatheGeometry;
  white: THREE.SphereGeometry;
  life: THREE.TubeGeometry[];
  ribbons: THREE.TubeGeometry[];
  branch: THREE.TubeGeometry[];
  particles: Float32Array;
}
const nextFrame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
export async function prepareWorld(
  progress: (value: number, label: string) => void,
): Promise<WorldGeometry> {
  let done = 0;
  const report = async (label: string) => {
    progress(Math.round((++done / 8) * 100), label);
    await nextFrame();
  };
  const profile: THREE.Vector2[] = [];
  for (let i = 0; i <= 32; i++) {
    const r = i / 32;
    const y =
      Math.sqrt(Math.max(0, 1 - r * r)) *
      (0.075 + 0.46 * r * r - 0.17 * r * r * r * r);
    profile.push(new THREE.Vector2(r, -y));
  }
  for (let i = 31; i >= 0; i--) {
    const r = i / 32;
    const y =
      Math.sqrt(Math.max(0, 1 - r * r)) *
      (0.075 + 0.46 * r * r - 0.17 * r * r * r * r);
    profile.push(new THREE.Vector2(r, y));
  }
  const cell = new THREE.LatheGeometry(profile, 64);
  cell.computeVertexNormals();
  await report("Shaping red cells");
  const white = new THREE.SphereGeometry(0.54, 36, 28);
  const positions = white.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const p = new THREE.Vector3().fromBufferAttribute(positions, i);
    p.multiplyScalar(
      1 + 0.055 * Math.sin(p.x * 40) * Math.sin(p.y * 38) * Math.cos(p.z * 32),
    );
    positions.setXYZ(i, p.x, p.y, p.z);
  }
  white.computeVertexNormals();
  await report("Shaping white cells");
  const life = Array.from({ length: 3 }, (_, layer) => {
    const points = Array.from({ length: 96 }, (_, i) => {
      const a = (i / 96) * Math.PI * 2;
      const r = 1 + 0.12 * Math.sin(a * 3 + layer);
      const p = new THREE.Vector3(
        Math.cos(a) * r,
        Math.sin(a) * r,
        0.23 * Math.sin(a * 2),
      );
      p.applyAxisAngle(new THREE.Vector3(1, 0, 0), layer * 0.85 + 0.15);
      p.applyAxisAngle(new THREE.Vector3(0, 1, 0), layer * 1.02);
      return p;
    });
    return new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(points, true),
      120,
      0.22,
      16,
      true,
    );
  });
  await report("Connecting the life sculpture");
  const ribbons = Array.from({ length: 3 }, (_, n) => {
    const points = Array.from({ length: 65 }, (_, i) => {
      const t = (i / 64) * Math.PI * 2.7;
      return new THREE.Vector3(
        Math.cos(t + n * 0.4) * (1.55 + 0.04 * t),
        Math.sin(t + n * 0.4) * 0.85 + 0.15 * n,
        Math.sin(t * 0.5) * 0.65,
      );
    });
    return new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(points),
      140,
      0.017 + n * 0.004,
      7,
      false,
    );
  });
  await report("Weaving plasma ribbons");
  const branch: THREE.TubeGeometry[] = [];
  for (let n = 0; n < 7; n++) {
    const a = (n - 3) * 0.34;
    const points = [
      new THREE.Vector3(0, -0.7, 0),
      new THREE.Vector3(Math.sin(a) * 0.3, 0, 0),
      new THREE.Vector3(Math.sin(a) * 0.85, 0.65, Math.cos(n) * 0.22),
      new THREE.Vector3(Math.sin(a) * 1.25, 1.15, Math.sin(n) * 0.26),
    ];
    branch.push(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points),
        32,
        0.03,
        8,
        false,
      ),
    );
  }
  await report("Growing partner connections");
  const particles = new Float32Array(240 * 3);
  let seed = 524;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < particles.length; i += 3) {
    particles[i] = (random() - 0.5) * 18;
    particles[i + 1] = (random() - 0.5) * 12;
    particles[i + 2] = (random() - 0.5) * 8;
  }
  await report("Scattering golden particles");
  await report("Preparing light and depth");
  return { cell, white, life, ribbons, branch, particles };
}
export function disposeWorld(g: WorldGeometry) {
  g.cell.dispose();
  g.white.dispose();
  [...g.life, ...g.ribbons, ...g.branch].forEach((x) => x.dispose());
}
