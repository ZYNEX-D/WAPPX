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
    scene.fog = new THREE.FogExp2(0xF7F7F2, 0.035);

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 18);

    // 2. High Quality Antialiased WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // 3. Studio Lighting (Creates that sleek, glossy 3D product look)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    // Directional Key Light (Top-Right specular highlight)
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(8, 12, 10);
    scene.add(keyLight);

    // Signature WhatsApp Electric Emerald Rim Light (Bottom-Left backlight)
    const rimLight = new THREE.DirectionalLight(0x00A86B, 3.2);
    rimLight.position.set(-10, -6, -8);
    scene.add(rimLight);

    // Soft Mint Front Fill Light
    const fillLight = new THREE.DirectionalLight(0xA2E4B8, 1.2);
    fillLight.position.set(-6, 8, 8);
    scene.add(fillLight);

    // Main 3D Object Group
    const emblemGroup = new THREE.Group();
    scene.add(emblemGroup);

    // =========================================================================
    // 4. CLEAN 3D WHATSAPP SPEECH BUBBLE EMBLEM
    // =========================================================================
    const bubbleShape = new THREE.Shape();
    const r = 3.6;

    // Smooth circular arc
    const startAngle = 4.42; // ~253 deg
    const endAngle = 3.75;  // ~215 deg
    bubbleShape.absarc(0, 0.15, r, startAngle, endAngle, false);

    // WhatsApp curved pointer tail
    bubbleShape.quadraticCurveTo(-3.2, -2.6, -3.8, -3.6); // Tail tip
    bubbleShape.quadraticCurveTo(-2.3, -3.1, -1.0, -3.2); // Smooth return
    bubbleShape.closePath();

    const bubbleExtrudeSettings = {
      depth: 0.75,
      bevelEnabled: true,
      bevelSegments: 8,
      steps: 2,
      bevelSize: 0.25,
      bevelThickness: 0.25,
    };

    const bubbleGeo = new THREE.ExtrudeGeometry(bubbleShape, bubbleExtrudeSettings);
    bubbleGeo.center();

    // Glossy Emerald Material (Like official luxury 3D app icon)
    const bubbleMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#00A86B"),
      roughness: 0.2,
      metalness: 0.08,
      clearcoat: 0.9,
      clearcoatRoughness: 0.12,
      reflectivity: 0.7,
    });

    const bubbleMesh = new THREE.Mesh(bubbleGeo, bubbleMaterial);
    emblemGroup.add(bubbleMesh);

    // =========================================================================
    // 5. CLEAN EMBOSSED WHITE PHONE HANDSET ICON (FRONT & BACK)
    // =========================================================================
    const phoneShape = new THREE.Shape();
    phoneShape.moveTo(-0.7, -1.0);
    phoneShape.quadraticCurveTo(-1.3, -0.7, -1.1, -0.2);
    phoneShape.quadraticCurveTo(-0.75, -0.15, -0.5, -0.4);
    phoneShape.quadraticCurveTo(-0.15, 0.25, 0.25, 0.6);
    phoneShape.quadraticCurveTo(0.1, 1.0, 0.5, 1.25);
    phoneShape.quadraticCurveTo(1.1, 1.1, 0.85, 0.6);
    phoneShape.quadraticCurveTo(0.55, 0.35, 0.1, -0.05);
    phoneShape.quadraticCurveTo(-0.35, -0.5, -0.7, -1.0);

    const phoneExtrudeSettings = {
      depth: 0.18,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.08,
      bevelThickness: 0.08,
    };
    const phoneGeo = new THREE.ExtrudeGeometry(phoneShape, phoneExtrudeSettings);
    phoneGeo.center();

    const phoneMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#FFFFFF"),
      roughness: 0.15,
      metalness: 0.02,
    });

    // Front Phone Icon
    const frontPhoneMesh = new THREE.Mesh(phoneGeo, phoneMaterial);
    frontPhoneMesh.position.set(0, 0.15, 0.55);
    emblemGroup.add(frontPhoneMesh);

    // Back Phone Icon (for full 360 degree rotation)
    const backPhoneMesh = new THREE.Mesh(phoneGeo, phoneMaterial);
    backPhoneMesh.position.set(0, 0.15, -0.55);
    backPhoneMesh.rotation.y = Math.PI;
    emblemGroup.add(backPhoneMesh);

    // =========================================================================
    // 6. ELEGANT HOLOGRAPHIC ORBIT RING & SATELLITE DATA NODES
    // =========================================================================
    const orbitRadius = 5.2;
    const orbitRingGeo = new THREE.TorusGeometry(orbitRadius, 0.025, 16, 120);
    const orbitRingMat = new THREE.MeshBasicMaterial({
      color: 0x00A86B,
      transparent: true,
      opacity: 0.28,
    });
    const orbitRing = new THREE.Mesh(orbitRingGeo, orbitRingMat);
    orbitRing.rotation.x = Math.PI * 0.38;
    orbitRing.rotation.y = Math.PI * 0.15;
    emblemGroup.add(orbitRing);

    // Satellite beads orbiting the emblem
    const satellitesGroup = new THREE.Group();
    satellitesGroup.rotation.copy(orbitRing.rotation);
    emblemGroup.add(satellitesGroup);

    const satelliteGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const satelliteMat = new THREE.MeshBasicMaterial({
      color: 0x00A86B,
    });

    const satellites: THREE.Mesh[] = [];
    const satelliteAngles = [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3];

    satelliteAngles.forEach((angle) => {
      const sat = new THREE.Mesh(satelliteGeo, satelliteMat);
      sat.position.set(Math.cos(angle) * orbitRadius, Math.sin(angle) * orbitRadius, 0);
      satellitesGroup.add(sat);
      satellites.push(sat);
    });

    // =========================================================================
    // 7. RESPONSIVE POSITIONING & SCALING
    // =========================================================================
    const adjustLayout = () => {
      const w = window.innerWidth;
      if (w < 1024) {
        // Mobile / Tablet: Sits gently above center
        emblemGroup.position.set(0, 1.2, -2);
        emblemGroup.scale.set(0.68, 0.68, 0.68);
      } else {
        // Desktop: Center of hero screen
        emblemGroup.position.set(0, 1.4, 0);
        emblemGroup.scale.set(0.9, 0.9, 0.9);
      }
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      adjustLayout();
    };

    // =========================================================================
    // 8. INTERACTIVE PARALLAX & CONTINUOUS FLOATING ANIMATION
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
      emblemGroup.rotation.z = scrollY * 0.0005;
      const w = window.innerWidth;
      const baseY = w < 1024 ? 1.2 : 1.4;
      emblemGroup.position.y = baseY + scrollY * 0.0035;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, { passive: true });
    adjustLayout();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      time += 0.012;

      // Smooth mouse interpolation
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      // Gentle floating hover motion
      const w = window.innerWidth;
      const baseY = w < 1024 ? 1.2 : 1.4;
      emblemGroup.position.y = baseY + Math.sin(time * 1.5) * 0.22;

      // Smooth, elegant 3D tilt with mouse parallax
      emblemGroup.rotation.x = Math.sin(time * 0.7) * 0.12 + mouseY * 0.32;
      emblemGroup.rotation.y = time * 0.32 + mouseX * 0.42;

      // Revolve satellites along the orbit ring
      satellitesGroup.rotation.z = time * 0.45;

      // Subtle camera parallax
      camera.position.x += (mouseX * 1.2 - camera.position.x) * 0.03;
      camera.position.y += (mouseY * 1.2 - camera.position.y) * 0.03;
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
      bubbleGeo.dispose();
      bubbleMaterial.dispose();
      phoneGeo.dispose();
      phoneMaterial.dispose();
      orbitRingGeo.dispose();
      orbitRingMat.dispose();
      satelliteGeo.dispose();
      satelliteMat.dispose();
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
