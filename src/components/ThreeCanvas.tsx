"use client";

import React, { useEffect, useRef } from "react";
import {
  BufferAttribute,
  BufferGeometry,
  Clock,
  Color,
  NormalBlending,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  WebGLRenderer,
} from "three";

export default function ThreeCanvas() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Scene & Camera
    const scene = new Scene();
    const camera = new PerspectiveCamera(
      45,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 24;

    const renderer = new WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // Ethereal Ribbon Geometry (Torus Knot with custom shader or point cloud)
    const count = 1800;
    const geometry = new BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    // Palette: #C8E6E2, #9ED5D1, #63C1BB, #3A9295, #105F68
    const palette = [
      new Color("#C8E6E2"),
      new Color("#9ED5D1"),
      new Color("#63C1BB"),
      new Color("#3A9295"),
      new Color("#105F68"),
    ];

    for (let i = 0; i < count; i++) {
      const u = (i / count) * Math.PI * 2 * 3;
      const v = (i / count) * Math.PI * 4;

      const r = 7 + Math.sin(v) * 2.2;
      const x = Math.cos(u) * r;
      const y = Math.sin(u) * r + Math.cos(v) * 1.5;
      const z = Math.sin(v) * 4;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const color = palette[i % palette.length];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    geometry.setAttribute("color", new BufferAttribute(colors, 3));

    const material = new PointsMaterial({
      size: 0.16,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: NormalBlending,
    });

    const points = new Points(geometry, material);
    scene.add(points);

    // Smooth undulating movement & mouse interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      targetX = (e.clientX / innerWidth - 0.5) * 0.8;
      targetY = (e.clientY / innerHeight - 0.5) * 0.8;
    };

    window.addEventListener("mousemove", handleMouseMove);

    let frameId = 0;
    let loopOn = false;
    let stopped = false;
    const clock = new Clock();

    const animate = () => {
      if (stopped || document.hidden) {
        loopOn = false;
        return;
      }
      loopOn = true;
      const elapsedTime = clock.getElapsedTime();

      // Smooth interpolation for mouse movement
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      points.rotation.y = elapsedTime * 0.07 + mouseX;
      points.rotation.x = Math.sin(elapsedTime * 0.05) * 0.2 + mouseY;
      points.rotation.z = Math.cos(elapsedTime * 0.04) * 0.1;

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(frameId);
        loopOn = false;
        clock.stop();
        return;
      }
      clock.start();
      if (!loopOn) animate();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    animate();

    const handleResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      stopped = true;
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(frameId);
      if (mount && renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 pointer-events-none -z-10 overflow-hidden opacity-70"
      aria-hidden="true"
    />
  );
}
