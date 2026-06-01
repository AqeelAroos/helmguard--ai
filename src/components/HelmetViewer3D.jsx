import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import '../styles/HelmetViewer3D.css';

const HelmetViewer3D = () => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const helmetRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const targetRotationRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e27);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 3;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00d4ff, 1.5);
    pointLight1.position.set(5, 5, 5);
    pointLight1.castShadow = true;
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff006e, 0.8);
    pointLight2.position.set(-5, 3, 5);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0x00f5ff, 0.6);
    pointLight3.position.set(0, -5, 5);
    scene.add(pointLight3);

    // Create helmet geometry
    const helmetGroup = new THREE.Group();
    scene.add(helmetGroup);
    helmetRef.current = helmetGroup;

    // Helmet shell (main structure)
    const shellGeometry = new THREE.SphereGeometry(1.2, 32, 32);
    const shellMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a1a2e,
      metalness: 0.9,
      shininess: 100,
      emissive: 0x00d4ff,
      emissiveIntensity: 0.3,
    });
    const shell = new THREE.Mesh(shellGeometry, shellMaterial);
    shell.scale.set(1, 1.1, 1);
    shell.castShadow = true;
    shell.receiveShadow = true;
    helmetGroup.add(shell);

    // Visor (front glass)
    const visorGeometry = new THREE.BoxGeometry(2, 1.2, 0.3);
    const visorMaterial = new THREE.MeshPhongMaterial({
      color: 0x00f5ff,
      metalness: 0.3,
      shininess: 80,
      emissive: 0x00d4ff,
      emissiveIntensity: 0.5,
      wireframe: false,
      transparent: true,
      opacity: 0.7,
    });
    const visor = new THREE.Mesh(visorGeometry, visorMaterial);
    visor.position.z = 0.8;
    visor.castShadow = true;
    visor.receiveShadow = true;
    helmetGroup.add(visor);

    // Visor glow line
    const visorLineGeometry = new THREE.BoxGeometry(2.2, 0.08, 0.2);
    const visorLineMaterial = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      emissive: 0x00d4ff,
      emissiveIntensity: 1,
    });
    const visorLine = new THREE.Mesh(visorLineGeometry, visorLineMaterial);
    visorLine.position.set(0, 0.65, 0.85);
    helmetGroup.add(visorLine);

    // Chin guard
    const chinGeometry = new THREE.BoxGeometry(1.6, 0.5, 0.6);
    const chinMaterial = new THREE.MeshPhongMaterial({
      color: 0x0f0f1e,
      metalness: 0.7,
      shininess: 60,
      emissive: 0xff006e,
      emissiveIntensity: 0.2,
    });
    const chin = new THREE.Mesh(chinGeometry, chinMaterial);
    chin.position.set(0, -1.1, 0.4);
    chin.castShadow = true;
    chin.receiveShadow = true;
    helmetGroup.add(chin);

    // Side armor panels
    const sideGeometry = new THREE.BoxGeometry(0.3, 1, 0.8);
    const sideMaterial = new THREE.MeshPhongMaterial({
      color: 0x16213e,
      metalness: 0.8,
      shininess: 70,
      emissive: 0xff006e,
      emissiveIntensity: 0.1,
    });

    const sideLeft = new THREE.Mesh(sideGeometry, sideMaterial);
    sideLeft.position.set(-1.4, -0.2, 0.3);
    sideLeft.castShadow = true;
    helmetGroup.add(sideLeft);

    const sideRight = new THREE.Mesh(sideGeometry, sideMaterial);
    sideRight.position.set(1.4, -0.2, 0.3);
    sideRight.castShadow = true;
    helmetGroup.add(sideRight);

    // Crest/top ridge
    const crestGeometry = new THREE.BoxGeometry(0.2, 0.6, 1.8);
    const crestMaterial = new THREE.MeshPhongMaterial({
      color: 0x00d4ff,
      metalness: 0.95,
      shininess: 120,
      emissive: 0x00d4ff,
      emissiveIntensity: 0.6,
    });
    const crest = new THREE.Mesh(crestGeometry, crestMaterial);
    crest.position.set(0, 1.2, 0.2);
    crest.castShadow = true;
    helmetGroup.add(crest);

    // Accent stripes
    const stripeGeometry = new THREE.BoxGeometry(1.8, 0.04, 0.15);
    const stripeMaterial = new THREE.MeshBasicMaterial({
      color: 0xff006e,
      emissive: 0xff006e,
      emissiveIntensity: 1,
    });

    for (let i = 0; i < 3; i++) {
      const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
      stripe.position.set(0, 0.6 - i * 0.35, 1);
      helmetGroup.add(stripe);
    }

    // Mouse tracking
    const handleMouseMove = (event) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = -(event.clientY / window.innerHeight) * 2 + 1;
      mouseRef.current = { x, y };
      targetRotationRef.current = {
        x: y * 0.5,
        y: x * 0.5,
      };
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Animation loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Smooth rotation follow
      if (helmetRef.current) {
        helmetRef.current.rotation.x += (targetRotationRef.current.x - helmetRef.current.rotation.x) * 0.08;
        helmetRef.current.rotation.y += (targetRotationRef.current.y - helmetRef.current.rotation.y) * 0.08;

        // Gentle idle rotation
        helmetRef.current.rotation.z += 0.0005;
      }

      // Animate lights
      pointLight1.intensity = 1.5 + Math.sin(Date.now() * 0.001) * 0.3;
      pointLight2.intensity = 0.8 + Math.cos(Date.now() * 0.0012) * 0.2;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      containerRef.current?.removeChild(renderer.domElement);
      shellGeometry.dispose();
      visorGeometry.dispose();
      visorLineGeometry.dispose();
      chinGeometry.dispose();
      sideGeometry.dispose();
      crestGeometry.dispose();
      stripeGeometry.dispose();
      shellMaterial.dispose();
      visorMaterial.dispose();
      visorLineMaterial.dispose();
      chinMaterial.dispose();
      sideMaterial.dispose();
      crestMaterial.dispose();
      stripeMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="helmet-viewer-container" ref={containerRef}>
      <div className="helmet-info">
        <h2>HelmGuard AI Defense System</h2>
        <p>Move your mouse to rotate the helmet</p>
      </div>
    </div>
  );
};

export default HelmetViewer3D;
