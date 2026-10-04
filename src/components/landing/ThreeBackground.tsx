"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export function ThreeBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationFrameId: number;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xF7F7F2, 0.035);

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 20);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const objectGroup = new THREE.Group();
    scene.add(objectGroup);

    // =========================================================================
    // 3D ISOMETRIC PARTICLE CUBE (Original design from design.example)
    // =========================================================================
    const geometry = new THREE.BoxGeometry(9, 9, 9, 38, 38, 38);

    // Inner wireframe lattice for high-tech holographic depth
    const edgesGeometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(8.95, 8.95, 8.95));
    const edgesMaterial = new THREE.LineBasicMaterial({
      color: 0x00A86B,
      transparent: true,
      opacity: 0.15,
    });
    const wireframeBox = new THREE.LineSegments(edgesGeometry, edgesMaterial);
    objectGroup.add(wireframeBox);

    const vertexShader = `
      uniform float uTime;
      uniform float uDistortion;
      uniform float uSize;
      uniform vec2 uMouse;
      varying float vNoise;

      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

      float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        vec3 x1 = x0 - i1 + 1.0 * C.xxx;
        vec3 x2 = x0 - i2 + 2.0 * C.xxx;
        vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
        i = mod289(i);
        vec4 p = permute(permute(permute(
                  i.z + vec4(0.0, i1.z, i2.z, 1.0))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        float n_ = 1.0/7.0;
        vec3 ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        vec4 x = x_ * ns.x + ns.yyyy;
        vec4 y = y_ * ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
      }

      void main() {
        vec3 pos = position;
        float noise = snoise(vec3(pos.x * 0.4 + uTime * 0.15, pos.y * 0.4, pos.z * 0.4));
        vNoise = noise;
        vec3 newPos = pos + (normal * noise * uDistortion);
        float dist = distance(uMouse * 10.0, newPos.xy);
        float interaction = smoothstep(5.0, 0.0, dist);
        newPos.z += interaction * 1.5;
        vec4 mvPosition = modelViewMatrix * vec4(newPos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = uSize * (22.0 / -mvPosition.z);
      }
    `;

    const fragmentShader = `
      uniform vec3 uColor;
      uniform vec3 uColor2;
      varying float vNoise;
      void main() {
        vec2 center = gl_PointCoord - vec2(0.5);
        float dist = length(center);
        if (dist > 0.45) discard;
        float alpha = smoothstep(0.45, 0.15, dist) * 0.88;
        vec3 finalColor = mix(uColor, uColor2, vNoise * 0.5 + 0.5);
        gl_FragColor = vec4(finalColor, alpha);
      }
    `;

    const uniforms = {
      uTime: { value: 0 },
      uDistortion: { value: 0.1 },
      uSize: { value: 2.0 },
      uColor: { value: new THREE.Color("#0A504A") }, // Deep obsidian teal
      uColor2: { value: new THREE.Color("#00A86B") }, // Electric jade green
      uMouse: { value: new THREE.Vector2(0, 0) },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
      blending: THREE.NormalBlending,
    });

    const points = new THREE.Points(geometry, material);
    objectGroup.add(points);

    let time = 0;
    let mouseX = 0,
      mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
      uniforms.uMouse.value.x += (mouseX - uniforms.uMouse.value.x) * 0.03;
      uniforms.uMouse.value.y += (mouseY - uniforms.uMouse.value.y) * 0.03;
    };

    // Position centered directly in the middle of the viewport
    const adjustLayout = () => {
      const w = window.innerWidth;
      if (w < 1024) {
        // Mobile / Tablet: Anchored centered slightly higher
        objectGroup.position.set(0, 1.5, -2);
        objectGroup.scale.set(0.6, 0.6, 0.6);
      } else {
        // Desktop: Center of hero screen
        objectGroup.position.set(0, 1.8, 0);
        objectGroup.scale.set(0.72, 0.72, 0.72);
      }
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      adjustLayout();
    };

    const handleScroll = () => {
      const scrollY = window.scrollY;
      objectGroup.rotation.z = scrollY * 0.0004;
      const w = window.innerWidth;
      const baseY = w < 1024 ? 1.5 : 1.8;
      objectGroup.position.y = baseY + scrollY * 0.004;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, { passive: true });
    adjustLayout();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      time += 0.008;

      // Continuous 3D rotation with gentle mouse influence
      objectGroup.rotation.x = time * 0.16 + mouseY * 0.2;
      objectGroup.rotation.y = time * 0.22 + mouseX * 0.2;

      uniforms.uTime.value = time;
      camera.position.x += (mouseX * 1.5 - camera.position.x) * 0.025;
      camera.position.y += (mouseY * 1.5 - camera.position.y) * 0.025;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      edgesGeometry.dispose();
      edgesMaterial.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="canvas-container"
      className="fixed inset-0 z-0 pointer-events-none opacity-85"
    />
  );
}
