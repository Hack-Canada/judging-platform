"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import {
  Environment,
  Html,
  OrbitControls,
  useGLTF,
} from "@react-three/drei";
import { LocateFixed, MapPin, RotateCcw, Users } from "lucide-react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import { Button } from "@/components/ui/button";

type MarkerCategory = "judging" | "workspace" | "support";

type RoomMarker = {
  id: string;
  name: string;
  category: MarkerCategory;
  floor: string;
  details: string;
  position: [number, number, number];
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
};

const modelUrl = "/hacker/hackjudge1.glb";
const buildingName = "Main Event Building";

const categoryStyles: Record<
  MarkerCategory,
  {
    bg: string;
    border: string;
    label: string;
    ring: string;
    text: string;
  }
> = {
  judging: {
    bg: "#38bdf8",
    border: "border-sky-300",
    label: "Judging rooms",
    ring: "bg-sky-400",
    text: "text-sky-950",
  },
  workspace: {
    bg: "#22c55e",
    border: "border-emerald-300",
    label: "Hacker workspaces",
    ring: "bg-emerald-500",
    text: "text-emerald-950",
  },
  support: {
    bg: "#f59e0b",
    border: "border-amber-300",
    label: "Support areas",
    ring: "bg-amber-500",
    text: "text-amber-950",
  },
};

const roomMarkers: RoomMarker[] = [
  {
    id: "judging-a",
    name: "Judging Room A",
    category: "judging",
    floor: "Level 1",
    details: "Primary judging room for early project reviews.",
    position: [-5.4, 5.85, -9.8],
    cameraPosition: [-1.8, 12.2, -4.1],
    cameraTarget: [-5.4, 3.1, -9.8],
  },
  {
    id: "judging-b",
    name: "Judging Room B",
    category: "judging",
    floor: "Level 1",
    details: "Secondary judging room for team presentations.",
    position: [-18.2, 5.85, -10.2],
    cameraPosition: [-22.5, 12.2, -4.4],
    cameraTarget: [-18.2, 3.1, -10.2],
  },
  {
    id: "workspace-east",
    name: "Open Hacker Workspace",
    category: "workspace",
    floor: "Level 1",
    details: "Open seating for teams that want a noisier build area.",
    position: [-6.5, 5.85, 7.3],
    cameraPosition: [-1.7, 11.6, 11.8],
    cameraTarget: [-6.5, 3.1, 7.3],
  },
  {
    id: "workspace-west",
    name: "Quiet Hacker Workspace",
    category: "workspace",
    floor: "Level 1",
    details: "Lower-noise work area for focused building and debugging.",
    position: [-17.3, 5.85, 7.1],
    cameraPosition: [-22.6, 11.6, 11.2],
    cameraTarget: [-17.3, 3.1, 7.1],
  },
  {
    id: "help-desk",
    name: "Help Desk",
    category: "support",
    floor: "Level 1",
    details: "Go here for organizer help, wayfinding, and event questions.",
    position: [-11.8, 5.85, -0.8],
    cameraPosition: [-11.8, 13.2, 7.4],
    cameraTarget: [-11.8, 3.1, -0.8],
  },
];

const defaultCameraPosition: [number, number, number] = [7, 18, 24];
const defaultCameraTarget: [number, number, number] = [-11.8, 2.9, -0.9];

function LocationModel() {
  const gltf = useGLTF(modelUrl);

  const scene = useMemo(() => {
    const clonedScene = gltf.scene.clone(true);

    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return clonedScene;
  }, [gltf.scene]);

  return <primitive object={scene} />;
}

function CameraRig({
  controlsRef,
  selectedMarker,
}: {
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  selectedMarker: RoomMarker | null;
}) {
  const { camera } = useThree();

  const cameraPosition = selectedMarker?.cameraPosition ?? defaultCameraPosition;
  const cameraTarget = selectedMarker?.cameraTarget ?? defaultCameraTarget;

  const desiredPosition = useMemo(
    () => new THREE.Vector3(...cameraPosition),
    [cameraPosition],
  );
  const desiredTarget = useMemo(
    () => new THREE.Vector3(...cameraTarget),
    [cameraTarget],
  );

  useFrame(() => {
    camera.position.lerp(desiredPosition, 0.075);

    if (controlsRef.current) {
      controlsRef.current.target.lerp(desiredTarget, 0.09);
      controlsRef.current.update();
    }
  });

  return null;
}

function MarkerDot({
  marker,
  selected,
  onSelect,
}: {
  marker: RoomMarker;
  selected: boolean;
  onSelect: (markerId: string) => void;
}) {
  const style = categoryStyles[marker.category];

  function handleMarkerClick(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation();
    onSelect(marker.id);
  }

  return (
    <group position={marker.position}>
      <mesh
        onClick={handleMarkerClick}
        onPointerOut={() => {
          document.body.style.cursor = "";
        }}
        onPointerOver={() => {
          document.body.style.cursor = "pointer";
        }}
      >
        <sphereGeometry args={[selected ? 0.42 : 0.32, 32, 16]} />
        <meshStandardMaterial
          color={style.bg}
          emissive={style.bg}
          emissiveIntensity={selected ? 0.9 : 0.45}
          roughness={0.28}
        />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, selected ? 0.82 : 0.68, 42]} />
        <meshBasicMaterial
          color={style.bg}
          opacity={selected ? 0.8 : 0.38}
          side={THREE.DoubleSide}
          transparent
        />
      </mesh>

      {selected ? (
        <Html center distanceFactor={10} position={[0, 1.05, 0]}>
          <div className="min-w-36 rounded-md border border-white/70 bg-white/95 px-3 py-2 text-center shadow-lg">
            <p className="text-xs font-bold text-neutral-950">{marker.name}</p>
            <p className="text-[10px] font-medium text-neutral-500">
              {marker.floor}
            </p>
          </div>
        </Html>
      ) : null}
    </group>
  );
}

function MarkerLayer({
  selectedMarkerId,
  onSelectMarker,
}: {
  selectedMarkerId: string | null;
  onSelectMarker: (markerId: string) => void;
}) {
  return (
    <>
      {roomMarkers.map((marker) => (
        <MarkerDot
          key={marker.id}
          marker={marker}
          onSelect={onSelectMarker}
          selected={selectedMarkerId === marker.id}
        />
      ))}
    </>
  );
}

function SceneLoading() {
  return (
    <Html center>
      <div className="rounded-md border border-white/70 bg-white/90 px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm">
        Loading building map...
      </div>
    </Html>
  );
}

function LocationCanvas({
  selectedMarker,
  selectedMarkerId,
  onSelectMarker,
  onReset,
}: {
  selectedMarker: RoomMarker | null;
  selectedMarkerId: string | null;
  onSelectMarker: (markerId: string) => void;
  onReset: () => void;
}) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  return (
    <Canvas
      camera={{ fov: 42, position: defaultCameraPosition }}
      onPointerMissed={onReset}
      shadows
    >
      <color args={["#eef7ff"]} attach="background" />
      <ambientLight intensity={0.85} />
      <directionalLight
        castShadow
        intensity={2.2}
        position={[3, 12, 8]}
        shadow-mapSize={[1024, 1024]}
      />

      <Suspense fallback={<SceneLoading />}>
        <LocationModel />
        <MarkerLayer
          onSelectMarker={onSelectMarker}
          selectedMarkerId={selectedMarkerId}
        />
        <Environment preset="city" />
      </Suspense>

      <CameraRig controlsRef={controlsRef} selectedMarker={selectedMarker} />
      <OrbitControls
        ref={controlsRef}
        enableDamping
        makeDefault
        maxDistance={46}
        maxPolarAngle={Math.PI / 2.15}
        minDistance={7}
        target={defaultCameraTarget}
      />
    </Canvas>
  );
}

function CategoryLegend() {
  const categories = Object.entries(categoryStyles) as Array<
    [MarkerCategory, (typeof categoryStyles)[MarkerCategory]]
  >;

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1">
      {categories.map(([category, style]) => (
        <div
          key={category}
          className={`flex items-center gap-3 rounded-md border bg-white/85 px-3 py-2 ${style.border}`}
        >
          <span className={`size-3 rounded-full ${style.ring}`} />
          <span className="text-sm font-semibold text-neutral-800">
            {style.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export function LocationMap() {
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const selectedMarker =
    roomMarkers.find((marker) => marker.id === selectedMarkerId) ?? null;

  return (
    <main className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#eef7ff] p-4 text-neutral-950 sm:p-6">
      <header className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold uppercase text-[#0077a3]">
            <MapPin className="size-4" aria-hidden="true" />
            Venue map
          </p>
          <h1 className="mt-1 text-3xl font-black text-neutral-950 sm:text-4xl">
            {buildingName}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-600">
            Click a dot to focus the 3D map on judging rooms, hacker workspaces,
            and support areas.
          </p>
        </div>

        <Button
          className="w-fit"
          onClick={() => setSelectedMarkerId(null)}
          type="button"
          variant="outline"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          Reset view
        </Button>
      </header>

      <section className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="relative min-h-[440px] overflow-hidden rounded-lg border border-white/80 bg-white shadow-sm lg:min-h-0">
          <LocationCanvas
            onReset={() => setSelectedMarkerId(null)}
            onSelectMarker={setSelectedMarkerId}
            selectedMarker={selectedMarker}
            selectedMarkerId={selectedMarkerId}
          />

          <div className="pointer-events-none absolute left-4 top-4 rounded-md border border-white/70 bg-white/90 px-3 py-2 shadow-sm">
            <p className="text-xs font-semibold uppercase text-neutral-500">
              Interactive 3D map
            </p>
            <p className="text-sm font-bold text-neutral-950">
              Drag to orbit, scroll to zoom
            </p>
          </div>
        </div>

        <aside className="flex min-h-0 flex-col gap-4 overflow-auto">
          <section className="rounded-lg border border-neutral-200 bg-white/90 p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <LocateFixed className="size-5 text-[#0099cc]" aria-hidden="true" />
              <h2 className="text-lg font-bold">Map Legend</h2>
            </div>
            <CategoryLegend />
          </section>

          <section className="rounded-lg border border-neutral-200 bg-white/90 p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Users className="size-5 text-[#0099cc]" aria-hidden="true" />
              <h2 className="text-lg font-bold">Locations</h2>
            </div>

            <div className="flex flex-col gap-2">
              {roomMarkers.map((marker) => {
                const style = categoryStyles[marker.category];
                const selected = selectedMarkerId === marker.id;

                return (
                  <button
                    key={marker.id}
                    className={`rounded-md border px-3 py-3 text-left transition-colors ${
                      selected
                        ? `${style.border} bg-white shadow-sm`
                        : "border-neutral-200 bg-neutral-50 hover:border-neutral-300 hover:bg-white"
                    }`}
                    onClick={() => setSelectedMarkerId(marker.id)}
                    type="button"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="mt-1 size-3 shrink-0 rounded-full"
                        style={{ backgroundColor: style.bg }}
                      />
                      <div>
                        <p className="font-semibold text-neutral-950">
                          {marker.name}
                        </p>
                        <p className="mt-0.5 text-xs font-medium text-neutral-500">
                          {marker.floor} · {style.label}
                        </p>
                        <p className="mt-2 text-sm text-neutral-600">
                          {marker.details}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-lg border border-sky-100 bg-sky-50 p-4">
            <p className="text-sm font-semibold text-sky-950">
              Marker setup note
            </p>
            <p className="mt-1 text-sm text-sky-900/75">
              Marker positions are defined in this file, so exact room names and
              coordinates can be adjusted as the Blender model is finalized.
            </p>
          </section>
        </aside>
      </section>
    </main>
  );
}

useGLTF.preload(modelUrl);
