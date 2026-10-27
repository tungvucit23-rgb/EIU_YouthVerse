"use client";

function AcademicBlock({ position, width = 2.8, rotation = 0 }: { position: [number, number, number]; width?: number; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.69, 0]} castShadow>
        <boxGeometry args={[width, 1.2, 1.1]} />
        <meshStandardMaterial color="#ae8c71" />
      </mesh>
      {[0.4, 0.8, 1.2].map((y) => (
        <group key={y}>
          <mesh position={[0, y, 0.557]}>
            <boxGeometry args={[width - 0.16, 0.19, 0.025]} />
            <meshStandardMaterial color="#415f65" roughness={0.33} metalness={0.25} />
          </mesh>
          <mesh position={[0, y - 0.14, 0.6]} castShadow>
            <boxGeometry args={[width + 0.08, 0.055, 1.25]} />
            <meshStandardMaterial color="#f1eada" />
          </mesh>
        </group>
      ))}
      {[-0.37, 0, 0.37].map((x) => (
        <mesh key={x} position={[x * width, 0.74, 0.585]}>
          <boxGeometry args={[0.055, 1.18, 0.07]} />
          <meshStandardMaterial color="#e9dfcc" />
        </mesh>
      ))}
      <mesh position={[0, 1.34, 0]} castShadow>
        <boxGeometry args={[width + 0.25, 0.13, 1.35]} />
        <meshStandardMaterial color="#f6f0df" />
      </mesh>
      <mesh position={[0, 1.42, -0.12]}>
        <boxGeometry args={[width * 0.65, 0.06, 0.7]} />
        <meshStandardMaterial color="#c9d0c7" />
      </mesh>
      {[-0.34, 0.34].map((offset) => <mesh key={offset} position={[offset * width, 1.44, -0.24]}><boxGeometry args={[0.23, 0.12, 0.22]} /><meshStandardMaterial color="#c0bdaf" /></mesh>)}
    </group>
  );
}

export function CampusBuildings() {
  return (
    <group>
      <AcademicBlock position={[-2.45, 0.13, -1.55]} width={2.7} rotation={-0.1} />
      <AcademicBlock position={[0.6, 0.13, -2.25]} width={3} />
      <AcademicBlock position={[2.6, 0.13, -0.9]} width={2.2} rotation={-Math.PI / 2} />
      <AcademicBlock position={[-2.3, 0.13, 0.05]} width={2.6} />
    </group>
  );
}
