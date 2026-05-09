"use client";

import { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, Line } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

// --- Coordinate data ---

const NODE_COORDS: [number, number][] = [
  [40.7, -74.0], [51.5, -0.1], [48.9, 2.3], [35.7, 139.7], [22.3, 114.2],
  [1.3, 103.8], [-33.9, 151.2], [37.8, -122.4], [19.1, 72.9], [55.8, 37.6],
  [39.9, 116.4], [-23.5, -46.6], [34.1, -118.2], [52.5, 13.4], [25.3, 55.3],
  [41.0, 28.9], [30.0, 31.2], [-1.3, 36.8], [33.9, -84.4], [43.7, -79.4],
  [47.6, -122.3], [45.5, -73.6], [59.3, 18.1], [53.3, -6.3], [35.2, -80.8],
  [-34.6, -58.4], [28.6, 77.2], [13.1, 80.3], [31.2, 121.5], [37.6, 127.0],
  [14.6, 121.0], [3.1, 101.7], [-6.2, 106.8], [23.1, 113.3], [39.0, -77.0],
  [42.4, -71.1], [29.8, -95.4], [32.8, -96.8], [38.9, -77.0], [36.2, -115.1],
  [21.3, -157.8], [49.3, -123.1], [44.6, -63.6], [50.4, 30.5], [46.5, 6.6],
  [60.2, 25.0], [35.7, 51.4], [24.5, 54.7], [-26.2, 28.0], [6.5, 3.4],
];

const CONNECTIONS: [number, number][] = [
  [0, 1], [0, 7], [1, 2], [1, 13], [2, 14], [3, 4], [3, 29], [4, 5],
  [5, 8], [6, 5], [7, 11], [8, 27], [9, 13], [10, 28], [11, 25],
  [12, 7], [14, 15], [15, 16], [16, 17], [17, 48], [18, 0], [19, 0],
  [20, 7], [21, 19], [22, 1], [23, 1], [24, 18], [26, 8], [29, 3],
];

function latLongToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// --- Sub-components ---

function GlobeSphere() {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame(() => {
    meshRef.current.rotation.y += 0.0008;
  });

  return (
    <group ref={meshRef}>
      {/* Main sphere */}
      <Sphere args={[2, 64, 64]}>
        <meshStandardMaterial color="#0A1A0F" roughness={0.8} metalness={0.1} />
      </Sphere>

      {/* Wireframe overlay for the "grid" feel */}
      <Sphere args={[2.005, 32, 32]}>
        <meshBasicMaterial color="#4ADE80" wireframe transparent opacity={0.03} />
      </Sphere>

      {/* Atmosphere rim glow */}
      <Sphere args={[2.06, 64, 64]}>
        <meshBasicMaterial color="#4ADE80" transparent opacity={0.035} side={THREE.BackSide} />
      </Sphere>

      {/* Dot nodes */}
      {NODE_COORDS.map((coord, i) => (
        <PulsingDot key={i} lat={coord[0]} lon={coord[1]} index={i} />
      ))}

      {/* Connection lines */}
      {CONNECTIONS.map(([a, b], i) => (
        <ConnectionLine key={i} from={NODE_COORDS[a]} to={NODE_COORDS[b]} index={i} />
      ))}
    </group>
  );
}

function PulsingDot({ lat, lon, index }: { lat: number; lon: number; index: number }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const pos = useMemo(() => latLongToVector3(lat, lon, 2.02), [lat, lon]);
  const offset = useMemo(() => index * 0.4, [index]);

  useFrame(({ clock }) => {
    const t = ((clock.getElapsedTime() + offset) % 2) / 2;
    const scale = 1 + 0.8 * Math.sin(t * Math.PI);
    meshRef.current.scale.setScalar(scale);
    (meshRef.current.material as THREE.MeshStandardMaterial).opacity = 1 - 0.4 * Math.sin(t * Math.PI);
  });

  return (
    <mesh ref={meshRef} position={pos}>
      <sphereGeometry args={[0.02, 8, 8]} />
      <meshStandardMaterial
        color="#4ADE80"
        emissive="#4ADE80"
        emissiveIntensity={2}
        transparent
        opacity={1}
      />
    </mesh>
  );
}

function ConnectionLine({ from, to, index }: { from: [number, number]; to: [number, number]; index: number }) {
  const dotRef = useRef<THREE.Mesh>(null!);
  const offset = useMemo(() => index * 0.7, [index]);

  const { curve, pointsArray } = useMemo(() => {
    const start = latLongToVector3(from[0], from[1], 2.02);
    const end = latLongToVector3(to[0], to[1], 2.02);

    const mid = start.clone().add(end).multiplyScalar(0.5);
    const elevation = start.distanceTo(end) * 0.3 + 0.15;
    mid.normalize().multiplyScalar(2.02 + elevation);

    const c = new THREE.QuadraticBezierCurve3(start, mid, end);
    const pts = c.getPoints(40);
    return { curve: c, pointsArray: pts.map((p) => p.toArray() as [number, number, number]) };
  }, [from, to]);

  useFrame(({ clock }) => {
    const t = ((clock.getElapsedTime() * 0.3 + offset) % 3) / 3;
    const pos = curve.getPoint(t);
    dotRef.current.position.copy(pos);
  });

  return (
    <group>
      <Line points={pointsArray} color="#4ADE80" transparent opacity={0.15} lineWidth={1} />
      <mesh ref={dotRef}>
        <sphereGeometry args={[0.012, 6, 6]} />
        <meshStandardMaterial color="#4ADE80" emissive="#4ADE80" emissiveIntensity={3} />
      </mesh>
    </group>
  );
}

// --- Exported Globe component ---

export default function Globe() {
  return (
    <div className="h-full w-full">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 3, 5]} intensity={0.8} />

        <Suspense fallback={null}>
          <GlobeSphere />
        </Suspense>

        <EffectComposer>
          <Bloom
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            intensity={1.5}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
