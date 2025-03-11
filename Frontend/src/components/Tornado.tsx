import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function Tornado() {
  const spiralRef = useRef<THREE.Group>(null);
  const lightningRef = useRef<THREE.PointLight>(null);
  const waterParticlesRef = useRef<THREE.Points>(null);

  // Create spiral points
  const spiralPoints = Array.from({ length: 100 }, (_, i) => {
    const t = i / 99;
    const angle = t * Math.PI * 8;
    const radius = 0.5 + t * 0.5;
    return new THREE.Vector3(
      Math.cos(angle) * radius,
      t * 5,
      Math.sin(angle) * radius
    );
  });

  // Create water particles
  const particleCount = 1000;
  const particlesGeometry = new THREE.BufferGeometry();
  const particlesPositions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount * 3; i += 3) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 2;
    particlesPositions[i] = Math.cos(angle) * radius;
    particlesPositions[i + 1] = Math.random() * 5;
    particlesPositions[i + 2] = Math.sin(angle) * radius;
  }

  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlesPositions, 3));

  const curve = new THREE.CatmullRomCurve3(spiralPoints);
  const tubeGeometry = new THREE.TubeGeometry(curve, 100, 0.05, 8, false);

  useFrame((state) => {
    if (spiralRef.current) {
      spiralRef.current.rotation.y += 0.01;
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      spiralRef.current.scale.set(scale, 1, scale);
    }

    // Animate lightning
    if (lightningRef.current) {
      const time = state.clock.elapsedTime;
      const intensity = Math.random() > 0.93 ? 5 : 0;
      lightningRef.current.intensity = intensity;
      lightningRef.current.position.x = Math.sin(time) * 2;
      lightningRef.current.position.z = Math.cos(time) * 2;
    }

    // Animate water particles
    if (waterParticlesRef.current) {
      const positions = waterParticlesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] -= 0.03;
        if (positions[i + 1] < 0) positions[i + 1] = 5;
      }
      waterParticlesRef.current.geometry.attributes.position.needsUpdate = true;
      waterParticlesRef.current.rotation.y += 0.001;
    }
  });

  return (
    <group ref={spiralRef} position={[0, -2.5, 0]}>
      {/* Main tornado spiral */}
      <mesh geometry={tubeGeometry}>
        <meshPhongMaterial
          color="#60A5FA"
          transparent
          opacity={0.8}
          emissive="#60A5FA"
          emissiveIntensity={0.5}
          shininess={100}
        />
      </mesh>

      {/* Water particles */}
      <points ref={waterParticlesRef}>
        <primitive object={particlesGeometry} />
        <pointsMaterial
          size={0.05}
          color="#60A5FA"
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Lightning effect */}
      <pointLight
        ref={lightningRef}
        color="#60A5FA"
        intensity={0}
        distance={10}
        decay={2}
      />
    </group>
  );
}