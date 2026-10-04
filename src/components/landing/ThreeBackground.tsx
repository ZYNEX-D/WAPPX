"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export function ThreeBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationFrameId: number;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    // Seamless atmospheric fog matching page background (#F7F7F2)
    scene.fog = new THREE.FogExp2(0xf7f7f2, 0.032);

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 19);

    // 2. High Quality Antialiased WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // 3. Studio Lighting (Crisp highlights on curved surfaces)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
    scene.add(ambientLight);

    // Directional Key Light (Top-Right specular highlight)
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(10, 14, 12);
    scene.add(keyLight);

    // Signature Electric Emerald Rim Light (Backlight)
    const rimLight = new THREE.DirectionalLight(0x00a86b, 3.8);
    rimLight.position.set(-12, -8, -10);
    scene.add(rimLight);

    // Deep Pine Accent Light (Bottom Fill)
    const fillLight = new THREE.DirectionalLight(0xa2e4b8, 1.4);
    fillLight.position.set(-6, 8, 8);
    scene.add(fillLight);

    // Main Abstract Group
    const abstractGroup = new THREE.Group();
    scene.add(abstractGroup);

    // =========================================================================
    // 4. ELEGANT SCULPTURAL TORUS KNOT (Kinetic Abstract Core)
    // =========================================================================
    // Smooth, fluid mathematical ribbon (TorusKnot p=2, q=3)
    const knotGeo = new THREE.TorusKnotGeometry(2.3, 0.44, 220, 36, 2, 3);

    // Glossy Emerald Material with clearcoat specular sheen
    const knotMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#00A86B"),
      roughness: 0.18,
      metalness: 0.12,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      reflectivity: 0.85,
    });

    const knotMesh = new THREE.Mesh(knotGeo, knotMat);
    abstractGroup.add(knotMesh);

    // =========================================================================
    // 5. INNER FACETED GLASS CRYSTAL CORE
    // =========================================================================
    const coreGeo = new THREE.IcosahedronGeometry(1.05, 0);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#0A504A"),
      roughness: 0.08,
      metalness: 0.2,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      transparent: true,
      opacity: 0.85,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    abstractGroup.add(coreMesh);

    // Subtle delicate wireframe cage around inner crystal
    const wireGeo = new THREE.IcosahedronGeometry(1.2, 0);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xa2e4b8,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    abstractGroup.add(wireMesh);

    // =========================================================================
    // 6. MULTI-AXIS KINETIC ARCHITECTURAL RINGS
    // =========================================================================
    const ring1Geo = new THREE.TorusGeometry(4.2, 0.018, 16, 160);
    const ring1Mat = new THREE.MeshBasicMaterial({
      color: 0x0a504a,
      transparent: true,
      opacity: 0.32,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI * 0.35;
    ring1.rotation.y = Math.PI * 0.18;
    abstractGroup.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(5.2, 0.015, 16, 160);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: 0x00a86b,
      transparent: true,
      opacity: 0.25,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = -Math.PI * 0.28;
    ring2.rotation.y = Math.PI * 0.42;
    abstractGroup.add(ring2);

    const ring3Geo = new THREE.TorusGeometry(6.3, 0.012, 16, 160);
    const ring3Mat = new THREE.MeshBasicMaterial({
      color: 0xa2e4b8,
      transparent: true,
      opacity: 0.2,
    });
    const ring3 = new THREE.Mesh(ring3Geo, ring3Mat);
    ring3.rotation.x = Math.PI * 0.65;
    ring3.rotation.z = Math.PI * 0.22;
    abstractGroup.add(ring3);

    // =========================================================================
    // 7. ORBITING DATA BEADS (SATELLITE PULSES)
    // =========================================================================
    const satellitesGroup = new THREE.Group();
    abstractGroup.add(satellitesGroup);

    const beadGeo = new THREE.SphereGeometry(0.1, 16, 16);
    const beadMat1 = new THREE.MeshBasicMaterial({ color: 0x00a86b });
    const beadMat2 = new THREE.MeshBasicMaterial({ color: 0x0a504a });

    const beads: { mesh: THREE.Mesh; radius: number; speed: number; phase: number; plane: number }[] = [
      { mesh: new THREE.Mesh(beadGeo, beadMat1), radius: 4.2, speed: 0.6, phase: 0, plane: 1 },
      { mesh: new THREE.Mesh(beadGeo, beadMat2), radius: 4.2, speed: 0.6, phase: Math.PI, plane: 1 },
      { mesh: new THREE.Mesh(beadGeo, beadMat1), radius: 5.2, speed: -0.45, phase: Math.PI * 0.5, plane: 2 },
      { mesh: new THREE.Mesh(beadGeo, beadMat2), radius: 6.3, speed: 0.35, phase: Math.PI * 1.2, plane: 3 },
    ];

    beads.forEach((b) => satellitesGroup.add(b.mesh));

    // =========================================================================
    // 8. RESPONSIVE POSITIONING & SCALING
    // =========================================================================
    const adjustLayout = () => {
      const w = window.innerWidth;
      if (w < 768) {
        // Mobile
        abstractGroup.position.set(0, 1.0, -3);
        abstractGroup.scale.set(0.65, 0.65, 0.65);
      } else if (w < 1024) {
        // Tablet
        abstractGroup.position.set(0, 1.2, -1);
        abstractGroup.scale.set(0.78, 0.78, 0.78);
      } else {
        // Desktop: Positioned elegantly in center-right of hero space
        abstractGroup.position.set(2.2, 1.2, 0);
        abstractGroup.scale.set(0.95, 0.95, 0.95);
      }
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      adjustLayout();
    };

    // =========================================================================
    // 9. INTERACTIVE PARALLAX & CONTINUOUS KINETIC ANIMATION
    // =========================================================================
    let time = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
      targetMouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const handleScroll = () => {
      const scrollY = window.scrollY;
      abstractGroup.rotation.z = scrollY * 0.0004;
      const w = window.innerWidth;
      const baseY = 1.2;
      const baseX = w < 1024 ? 0 : 2.2;
      abstractGroup.position.y = baseY + scrollY * 0.003;
      abstractGroup.position.x = baseX + scrollY * 0.001;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, { passive: true });
    adjustLayout();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      time += 0.008;

      // Smooth mouse interpolation
      mouseX += (targetMouseX - mouseX) * 0.04;
      mouseY += (targetMouseY - mouseY) * 0.04;

      // Gentle floating hover motion
      const w = window.innerWidth;
      const baseY = 1.2;
      abstractGroup.position.y = baseY + Math.sin(time * 1.4) * 0.18;

      // Elegant rotation of the central sculpture
      knotMesh.rotation.x = time * 0.35 + mouseY * 0.25;
      knotMesh.rotation.y = time * 0.45 + mouseX * 0.35;

      // Counter-rotation of the inner faceted core
      coreMesh.rotation.x = -time * 0.5;
      coreMesh.rotation.y = -time * 0.65;
      wireMesh.rotation.x = coreMesh.rotation.x;
      wireMesh.rotation.y = coreMesh.rotation.y;

      // Slow dynamic spin of the concentric architectural rings
      ring1.rotation.z = time * 0.2;
      ring2.rotation.z = -time * 0.15;
      ring3.rotation.z = time * 0.1;

      // Calculate bead positions along their respective rings
      beads.forEach((b) => {
        const theta = time * b.speed + b.phase;
        if (b.plane === 1) {
          // Along Ring 1
          const v = new THREE.Vector3(Math.cos(theta) * b.radius, Math.sin(theta) * b.radius, 0);
          v.applyEuler(ring1.rotation);
          b.mesh.position.copy(v);
        } else if (b.plane === 2) {
          // Along Ring 2
          const v = new THREE.Vector3(Math.cos(theta) * b.radius, Math.sin(theta) * b.radius, 0);
          v.applyEuler(ring2.rotation);
          b.mesh.position.copy(v);
        } else {
          // Along Ring 3
          const v = new THREE.Vector3(Math.cos(theta) * b.radius, Math.sin(theta) * b.radius, 0);
          v.applyEuler(ring3.rotation);
          b.mesh.position.copy(v);
        }
      });

      // Subtle camera parallax
      camera.position.x += (mouseX * 1.0 - camera.position.x) * 0.03;
      camera.position.y += (mouseY * 0.8 - camera.position.y) * 0.03;
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
      knotGeo.dispose();
      knotMat.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      ring1Geo.dispose();
      ring1Mat.dispose();
      ring2Geo.dispose();
      ring2Mat.dispose();
      ring3Geo.dispose();
      ring3Mat.dispose();
      beadGeo.dispose();
      beadMat1.dispose();
      beadMat2.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="canvas-container"
      className="fixed inset-0 z-0 pointer-events-none opacity-90 transition-opacity duration-700"
    />
  );
}
