import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
  type RefObject,
} from "react";
import {
  Canvas,
  useFrame,
  useThree,
  type ThreeEvent,
} from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { config, type DestinationId } from "./config";
import type { WorldGeometry } from "./geometry";

interface WorldProps {
  geometry: WorldGeometry;
  selected: DestinationId | null;
  entered: boolean;
  mobile: boolean;
  reduced: boolean;
  paused: boolean;
  labelRoot: RefObject<HTMLDivElement>;
  onSelect: (id: DestinationId) => void;
  onReady: () => void;
  onHover: (id: DestinationId | null) => void;
}
type V3 = [number, number, number];
const locations: Record<DestinationId, V3> = {
  blood: [-0.5, 1.65, 0.4],
  plasma: [3.65, 1.7, 0],
  fractionation: [4.25, -1.5, 0],
  stories: [0.1, -2, 0.3],
  about: [1.65, 2.95, -1.2],
};
const mobileLocations: Record<DestinationId, V3> = {
  blood: [-1.25, 0.3, 0.4],
  plasma: [1.25, 0.25, 0],
  fractionation: [1.25, -2.45, 0.3],
  stories: [-1.25, -2.4, 0.2],
  about: [0, 1.15, -0.8],
};

function CameraRig({
  selected,
  mobile,
  entered,
  reduced,
}: Pick<WorldProps, "selected" | "mobile" | "entered" | "reduced">) {
  const { camera } = useThree();
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const previous = useRef<{
    position: THREE.Vector3;
    target: THREE.Vector3;
  } | null>(null);
  const tween = useRef<gsap.core.Timeline | null>(null);
  const last = useRef<DestinationId | null>(null);
  const interaction = useRef(false);
  interaction.current = entered && !selected;
  useEffect(() => {
    if (!controls.current) return;
    tween.current?.kill();
    previous.current = null;
    last.current = null;
    camera.position.set(0, mobile ? 0.15 : 0, mobile ? 14.5 : 12);
    controls.current.target.set(0, 0, 0);
    controls.current.update();
  }, [camera, mobile]);
  useEffect(() => {
    const control = controls.current;
    if (!control) return;
    tween.current?.kill();
    if (selected && !last.current && !previous.current)
      previous.current = {
        position: camera.position.clone(),
        target: control.target.clone(),
      };
    const target = selected
      ? new THREE.Vector3(
          ...(mobile ? mobileLocations : locations)[selected],
        ).add(new THREE.Vector3(mobile ? 0 : 1.45, mobile ? -1.45 : 0, 0))
      : (previous.current?.target.clone() ?? new THREE.Vector3(0, 0, 0));
    const position = selected
      ? target.clone().add(new THREE.Vector3(0, 0, mobile ? 8 : 6.7))
      : (previous.current?.position.clone() ??
        new THREE.Vector3(0, mobile ? 0.15 : 0, mobile ? 14.5 : 12));
    control.enabled = false;
    const timeline = gsap.timeline({
      onUpdate: () => {
        camera.lookAt(control.target);
      },
      onComplete: () => {
        if (!selected) {
          control.enabled = interaction.current;
          previous.current = null;
        }
      },
    });
    timeline.to(
      camera.position,
      {
        x: position.x,
        y: position.y,
        z: position.z,
        duration: reduced ? 0 : 1.25,
        ease: "power3.inOut",
      },
      0,
    );
    timeline.to(
      control.target,
      {
        x: target.x,
        y: target.y,
        z: target.z,
        duration: reduced ? 0 : 1.25,
        ease: "power3.inOut",
      },
      0,
    );
    tween.current = timeline;
    last.current = selected;
    return () => {
      timeline.kill();
    };
  }, [selected, camera, mobile, reduced]);
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enabled={entered && !selected}
      enableZoom={false}
      enablePan={false}
      enableDamping={!reduced}
      dampingFactor={0.065}
      rotateSpeed={0.4}
      minPolarAngle={1.15}
      maxPolarAngle={1.98}
      minAzimuthAngle={-0.5}
      maxAzimuthAngle={0.5}
    />
  );
}

function Life({
  geometry,
  mobile,
  still,
}: {
  geometry: WorldGeometry;
  mobile: boolean;
  still: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  useFrame((state, dt) => {
    if (group.current && !still) {
      group.current.rotation.y += dt * 0.1;
      group.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.2) * 0.07;
    }
  });
  return (
    <group
      ref={group}
      position={mobile ? [0, -1.05, -0.6] : [1.45, -0.15, -0.6]}
      scale={mobile ? 0.74 : 1.1}
      dispose={null}
    >
      {geometry.life.map((geo, i) => (
        <mesh key={i} geometry={geo}>
          <meshPhysicalMaterial
            color={i === 1 ? config.colors.crimson : "#d46c70"}
            roughness={0.31}
            metalness={0.32}
            clearcoat={0.85}
            clearcoatRoughness={0.25}
            emissive="#721c29"
            emissiveIntensity={0.16}
          />
        </mesh>
      ))}
      {geometry.ribbons.map((geo, i) => (
        <mesh key={i} geometry={geo} rotation={[0.2, 0, i * 0.45]}>
          <meshStandardMaterial
            color={config.colors.gold}
            emissive="#b08c38"
            emissiveIntensity={0.5}
            metalness={0.75}
            roughness={0.28}
          />
        </mesh>
      ))}
      <mesh scale={0.3}>
        <sphereGeometry args={[1, 32, 24]} />
        <meshStandardMaterial
          color="#ffe3b0"
          emissive="#f5b954"
          emissiveIntensity={1.3}
          roughness={0.3}
        />
      </mesh>
      <pointLight color="#ffc581" intensity={3} distance={5} />
    </group>
  );
}

function DestinationForm({
  id,
  g,
  highlight,
}: {
  id: DestinationId;
  g: WorldGeometry;
  highlight: boolean;
}) {
  const tint = config.destinations.find((d) => d.id === id)!.color;
  const crimson = (
    <meshPhysicalMaterial
      color={tint}
      roughness={0.36}
      clearcoat={0.6}
      metalness={0.16}
      emissive="#b12b45"
      emissiveIntensity={highlight ? 0.35 : 0.05}
    />
  );
  const gold = (
    <meshStandardMaterial
      color={tint}
      roughness={0.28}
      metalness={0.75}
      emissive="#c99745"
      emissiveIntensity={highlight ? 0.6 : 0.17}
    />
  );
  if (id === "blood")
    return (
      <group rotation={[0.95, 0.1, -0.3]}>
        <mesh geometry={g.cell}>{crimson}</mesh>
        <mesh
          geometry={g.cell}
          position={[0.45, 0.65, -0.4]}
          scale={0.52}
          rotation={[0.2, 0.3, 0.3]}
        >
          {crimson}
        </mesh>
      </group>
    );
  if (id === "plasma")
    return (
      <group scale={0.54} rotation={[0.4, 0.25, -0.35]}>
        {g.ribbons.map((geo, i) => (
          <mesh
            geometry={geo}
            key={i}
            rotation={[i * 0.4, 0, 0]}
            scale={[1, 1.3, 1]}
          >
            {gold}
          </mesh>
        ))}
        <mesh>
          <sphereGeometry args={[0.5, 32, 24]} />
          <meshPhysicalMaterial
            color="#e8bb67"
            roughness={0.2}
            metalness={0.6}
            emissive="#a47225"
            emissiveIntensity={highlight ? 0.5 : 0.2}
          />
        </mesh>
      </group>
    );
  if (id === "fractionation")
    return (
      <group scale={0.56}>
        {g.branch.map((geo, i) => (
          <mesh geometry={geo} key={i}>
            {gold}
          </mesh>
        ))}
        {Array.from({ length: 7 }, (_, i) => (
          <mesh
            position={[
              Math.sin((i - 3) * 0.34) * 1.25,
              1.15,
              Math.sin(i) * 0.26,
            ]}
            key={i}
          >
            <sphereGeometry args={[0.105, 16, 12]} />
            {gold}
          </mesh>
        ))}
      </group>
    );
  if (id === "stories")
    return (
      <group>
        {[
          [-0.35, 0.15, 0],
          [0.2, 0.35, 0.15],
          [0.22, -0.2, 0],
        ].map((p, i) => (
          <mesh key={i} geometry={g.white} position={p as V3} scale={0.58}>
            <meshStandardMaterial
              color="#efbfba"
              emissive="#8d3f42"
              emissiveIntensity={highlight ? 0.5 : 0.08}
              roughness={0.64}
            />
          </mesh>
        ))}
      </group>
    );
  return (
    <group scale={0.43}>
      {g.life.map((geo, i) => (
        <mesh key={i} geometry={geo}>
          <meshStandardMaterial
            color="#efe0c6"
            emissive="#aa7960"
            emissiveIntensity={highlight ? 0.5 : 0.12}
            roughness={0.3}
            metalness={0.4}
          />
        </mesh>
      ))}
    </group>
  );
}

function DestinationObject({
  id,
  geometry,
  selected,
  entered,
  mobile,
  paused,
  reduced,
  labelRoot,
  onSelect,
  onHover,
}: Omit<WorldProps, "onReady"> & { id: DestinationId }) {
  const ref = useRef<THREE.Group>(null);
  const hovered = useRef(false);
  const [highlight, setHighlight] = useState(false);
  const destination = config.destinations.find((d) => d.id === id)!;
  const scaleVector = useRef(new THREE.Vector3(1, 1, 1));
  const pos = (mobile ? mobileLocations : locations)[id];
  useFrame((state, dt) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const still = paused || reduced || selected !== null;
    ref.current.position.y =
      pos[1] +
      (still ? 0 : Math.sin(t * 0.35 + Number(destination.number)) * 0.075);
    const scale = selected === id ? 1.12 : hovered.current ? 1.1 : 1;
    scaleVector.current.setScalar(scale);
    ref.current.scale.lerp(scaleVector.current, Math.min(1, dt * 7));
  });
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta < 5 && entered && !selected) onSelect(id);
  };
  const hover = (value: boolean) => {
    hovered.current = value;
    setHighlight(value);
    onHover(value ? id : null);
  };
  return (
    <group
      ref={ref}
      position={pos}
      dispose={null}
      onClick={click}
      onPointerOver={(e) => {
        e.stopPropagation();
        hover(true);
      }}
      onPointerOut={() => hover(false)}
    >
      <DestinationForm
        id={id}
        g={geometry}
        highlight={highlight || selected === id}
      />
      {entered && (!selected || selected === id) ? (
        <Html
          portal={labelRoot}
          center
          position={[0, id === "fractionation" ? -0.75 : -0.95, 0.3]}
          zIndexRange={[12, 0]}
        >
          <button
            className={`world-label ${selected === id ? "selected" : ""}`}
            aria-label={`Explore ${destination.label}`}
            aria-describedby={`description-${id}`}
            aria-haspopup="dialog"
            aria-pressed={selected === id}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(id);
            }}
            onMouseEnter={() => hover(true)}
            onMouseLeave={() => hover(false)}
            onFocus={() => hover(true)}
            onBlur={() => hover(false)}
          >
            <span className="label-number">{destination.number}</span>
            <span>{destination.label}</span>
            <span aria-hidden="true" className="label-plus">
              +
            </span>
            <span id={`description-${id}`} className="label-description">
              {destination.description}
            </span>
          </button>
        </Html>
      ) : null}
    </group>
  );
}

function Ambient({
  g,
  mobile,
  still,
  selected,
}: {
  g: WorldGeometry;
  mobile: boolean;
  still: boolean;
  selected: DestinationId | null;
}) {
  const cells = useRef<THREE.Group>(null);
  const stars = useRef<THREE.Points>(null);
  const data = useMemo(
    () =>
      Array.from({ length: mobile ? 16 : 32 }, (_, i) => ({
        pos: [
          Math.sin(i * 2.399) * (3.7 + (i % 4) * 1.25),
          Math.cos(i * 2.399) * (2.8 + (i % 3)),
          -3 - (i % 5) * 0.6,
        ] as V3,
        scale: 0.2 + (i % 5) * 0.115,
        rotation: [i * 0.45, i * 0.72, i * 0.12] as V3,
      })),
    [mobile],
  );
  const displacement = useRef(0);
  useFrame((state, dt) => {
    displacement.current = THREE.MathUtils.damp(
      displacement.current,
      selected ? 1 : 0,
      3,
      dt,
    );
    const t = state.clock.elapsedTime;
    cells.current?.children.forEach((obj, i) => {
      obj.position.x =
        data[i].pos[0] + Math.sign(data[i].pos[0]) * displacement.current * 1.3;
      obj.position.y =
        data[i].pos[1] + (still ? 0 : Math.sin(t * 0.18 + i) * 0.12);
      if (!still) obj.rotation.z += dt * 0.04;
    });
    if (stars.current && !still) stars.current.rotation.z += dt * 0.0056;
  });
  return (
    <>
      <group ref={cells} dispose={null}>
        {data.map((d, i) => (
          <mesh
            key={i}
            geometry={i % 11 === 0 ? g.white : g.cell}
            position={d.pos}
            scale={d.scale}
            rotation={d.rotation}
          >
            <meshStandardMaterial
              color={
                i % 11 === 0 ? "#c9beb2" : i % 3 === 0 ? "#6e1730" : "#b42c47"
              }
              roughness={0.5}
              metalness={0.13}
            />
          </mesh>
        ))}
      </group>
      <points ref={stars}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[g.particles.slice(0, (mobile ? 90 : 240) * 3), 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#ddbc85"
          size={mobile ? 0.025 : 0.018}
          sizeAttenuation
          transparent
          opacity={0.56}
          depthWrite={false}
        />
      </points>
      {Array.from({ length: mobile ? 6 : 12 }, (_, i) => (
        <mesh
          key={i}
          position={[
            Math.sin(i * 3.1) * 6,
            Math.cos(i * 2.3) * 4,
            -1 - (i % 3),
          ]}
          scale={[0.08, 0.03, 0.1]}
          rotation={[i, 0.2, i * 0.4]}
        >
          <icosahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color="#e5b784" roughness={0.7} />
        </mesh>
      ))}
    </>
  );
}

function Ready({ onReady }: { onReady: () => void }) {
  const frames = useRef(0);
  useFrame(() => {
    if (++frames.current === 3) onReady();
  });
  return null;
}
function Scene(props: WorldProps) {
  const still = props.reduced || props.paused;
  return (
    <>
      <fog attach="fog" args={[config.colors.burgundy, 13, 26]} />
      <ambientLight intensity={0.85} />
      <directionalLight position={[-3, 4, 6]} intensity={3.2} color="#fff0d9" />
      <directionalLight position={[5, -1, 3]} intensity={2.7} color="#dc5770" />
      <pointLight
        position={[0, 3, 4]}
        intensity={20}
        color="#dcb77a"
        distance={14}
      />
      <CameraRig {...props} />
      <Life
        geometry={props.geometry}
        mobile={props.mobile}
        still={still || !!props.selected}
      />
      <Ambient
        g={props.geometry}
        mobile={props.mobile}
        still={still}
        selected={props.selected}
      />
      {config.destinations.map((d) => (
        <DestinationObject key={d.id} id={d.id} {...props} />
      ))}
      <Ready onReady={props.onReady} />
    </>
  );
}
export default function World(props: WorldProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 12], fov: 42, near: 0.1, far: 40 }}
      dpr={[1, props.mobile ? 1.25 : 1.65]}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.setClearColor("#280913", 0);
        gl.domElement.setAttribute("aria-hidden", "true");
      }}
    >
      <Scene {...props} />
    </Canvas>
  );
}
