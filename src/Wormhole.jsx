import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// -------------------------------------------------------------
// Dust Particles (Scattered all over the screen)
// Reduced count on mobile for performance (mobile < 768px).
// -------------------------------------------------------------
const dustVertexShader = `
  attribute float size;
  attribute vec3 customColor;
  
  uniform float uTime;
  uniform float uSpeed;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = customColor;

    vec3 pos = position;
    
    // Slow drift based on time
    pos.y += sin(uTime * 0.1 + pos.x * 0.05) * 5.0;
    pos.x += cos(uTime * 0.1 + pos.y * 0.05) * 5.0;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    
    // Prevent negative point sizes
    gl_PointSize = size * (150.0 / max(0.1, -mvPosition.z));
    gl_Position = projectionMatrix * mvPosition;
    
    // Fade based on distance to soften edges
    vAlpha = smoothstep(120.0, 20.0, length(pos.xy));
  }
`;

const particleFragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float dist = distance(gl_PointCoord, vec2(0.5));
    if (dist > 0.5) discard;
    
    float alpha = smoothstep(0.5, 0.1, dist) * vAlpha;
    gl_FragColor = vec4(vColor, alpha);
  }
`;

function DustParticles({ particleCount }) {
  const pointsRef = useRef();

  const [geometryData] = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const colors = new Float32Array(particleCount * 3);

    const coreColor = new THREE.Color("#ffffff");
    const edgeColor = new THREE.Color("#88ccff"); // subtle blue tint

    for (let i = 0; i < particleCount; i++) {
      // Spread evenly across a massive volume
      positions[i * 3] = (Math.random() - 0.5) * 200; // X spread
      positions[i * 3 + 1] = (Math.random() - 0.5) * 200; // Y spread
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100 - 20; // Z depth

      sizes[i] = Math.random() * 3.0 + 1.5;

      const mixRatio = Math.random();
      const c = coreColor.clone().lerp(edgeColor, mixRatio);

      const intensity = 0.3 + 0.7 * Math.random(); // Random brightness

      colors[i * 3] = c.r * intensity;
      colors[i * 3 + 1] = c.g * intensity;
      colors[i * 3 + 2] = c.b * intensity;
    }

    return [{ positions, sizes, colors }];
  }, [particleCount]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 }
  }), []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.material.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particleCount} array={geometryData.positions} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={particleCount} array={geometryData.sizes} itemSize={1} />
        <bufferAttribute attach="attributes-customColor" count={particleCount} array={geometryData.colors} itemSize={3} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={dustVertexShader}
        fragmentShader={particleFragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// -------------------------------------------------------------
// Scene & Camera Rig
// -------------------------------------------------------------
function SceneContainer({ particleCount }) {
  const containerRef = useRef();
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame((state, delta) => {
    if (containerRef.current) {
      const targetX = -(mouse.current.y * 0.15);
      const targetY = mouse.current.x * 0.15;

      containerRef.current.rotation.x += (targetX - containerRef.current.rotation.x) * delta * 3;
      containerRef.current.rotation.y += (targetY - containerRef.current.rotation.y) * delta * 3;
    }
  });

  return (
    <group ref={containerRef}>
      <DustParticles particleCount={particleCount} />
    </group>
  );
}

export default function Wormhole() {
  const [isMobile, setIsMobile] = useState(false);
  const [paused, setPaused] = useState(false);

  // Stop rendering 15k particles when the tab is hidden or the user prefers reduced motion.
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const update = () => setPaused(document.hidden || !!reduce?.matches);
    update();
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 4000 particles on mobile, 15000 on desktop
  const particleCount = isMobile ? 4000 : 15000;

  return (
    <div className="absolute inset-0 pointer-events-none w-full h-full bg-black">
      <Canvas camera={{ position: [0, 0, 25], fov: 60 }} dpr={[1, isMobile ? 1.5 : 2]} frameloop={paused ? 'never' : 'always'}>
        <fog attach="fog" args={['#000000', 10, 50]} />
        <SceneContainer particleCount={particleCount} />
      </Canvas>
    </div>
  );
}
