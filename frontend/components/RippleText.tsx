"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { motion } from "framer-motion";

interface RippleTextProps {
  text: string;
  className?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string | number;
  color?: string;
}

export default function RippleText({
  text,
  className = "",
  fontSize = 100,
  fontFamily = "serif",
  fontWeight = "300", // Default to light/thin to match design
  color = "#ffffff",
}: RippleTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    
    // Cleanup existing canvas if any
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    // Scene Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 100;

    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true,
      powerPreference: "high-performance" 
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor("#f3f3f3", 0);
    container.appendChild(renderer.domElement);

    // Text Texture (Offscreen Canvas)
    const createTextTexture = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      // Super high quality scale to avoid blur
      const scale = 4;
      canvas.width = container.clientWidth * scale;
      canvas.height = container.clientHeight * scale;

      ctx.fillStyle = color;
      // Include fontWeight in the font string
      ctx.font = `${fontWeight} ${fontSize * scale}px ${fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, canvas.width / 2, canvas.height / 2);

      // Thin grey border
      ctx.lineWidth = 4; // 1px effective width (on 4x scale)
      ctx.strokeStyle = "#ffffff";
      ctx.strokeText(text, canvas.width / 2, canvas.height / 2);

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      // CRITICAL FIX: Clamp to edge to prevent transparent "tearing"
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      return { texture, aspect: canvas.width / canvas.height };
    };

    const textData = createTextTexture();
    if (!textData) return;

    // Ripple Map (Offscreen)
    const rippleScene = new THREE.Scene();
    const rippleCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const rippleTarget = new THREE.WebGLRenderTarget(
      container.clientWidth,
      container.clientHeight, 
      { 
        format: THREE.RGBAFormat,
        type: THREE.HalfFloatType,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        stencilBuffer: false,
        depthBuffer: false
      }
    );
    
    // Brush System
    const maxBrushes = 100; 
    const brushes: THREE.Mesh[] = [];
    const brushGeometry = new THREE.PlaneGeometry(0.25, 0.25); 
    const brushMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.0,
      map: null,
      blending: THREE.AdditiveBlending 
    });

    const brushCanvas = document.createElement('canvas');
    brushCanvas.width = 64;
    brushCanvas.height = 64;
    const bCtx = brushCanvas.getContext('2d');
    if (bCtx) {
        const grd = bCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grd.addColorStop(0, 'rgba(255, 255, 255, 0.6)'); 
        grd.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
        grd.addColorStop(1, 'rgba(84, 233, 238, 0)');
        bCtx.fillStyle = grd;
        bCtx.fillRect(0, 0, 64, 64);
    }
    const brushTexture = new THREE.CanvasTexture(brushCanvas);
    brushMaterial.map = brushTexture;
    
    for(let i=0; i<maxBrushes; i++) {
        const brush = new THREE.Mesh(brushGeometry, brushMaterial.clone());
        brush.visible = false;
        brush.rotation.z = Math.random() * Math.PI * 2; 
        rippleScene.add(brush);
        brushes.push(brush);
    }
    
    let currentBrush = 0;
    
    // Main Display Material
    const geometry = new THREE.PlaneGeometry(container.clientWidth, container.clientHeight, 32, 32);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: textData.texture },
        uDisplacement: { value: rippleTarget.texture },
        uColor: { value: new THREE.Color(color) }, // Pass solid color
        uResolution: { value: new THREE.Vector2(container.clientWidth, container.clientHeight) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        uniform sampler2D uDisplacement;
        uniform vec3 uColor;
        varying vec2 vUv;
        
        void main() {
          // 1. Fixed Skin mask from original texture
          vec4 original = texture2D(uTexture, vUv);
          float alpha = original.a;
          
          if (alpha < 0.01) discard; // Optimize empty pixels

          // 2. Ripple/Displacement Force
          vec4 disp = texture2D(uDisplacement, vUv);
          float force = disp.r; 
          
          // 3. Lighting / Liquid Shine
          // Instead of distorting the TEXTURE (which causes black holes),
          // we distort the LIGHTING.
          
          float ambient = 0.8;
          float gloss = force * 0.4; // Highlight intensity
          
          // Subtle chromatic aberration on the SHINE only
          float r = gloss;
          float g = force * 0.38; // Slight offset
          float b = force * 0.42; // Slight offset
          
          vec3 finalColor = uColor * ambient + vec3(r, g, b);
          
          // Add white border if present in original texture (it's part of uColor effectively in this simple mode? 
          // No, uColor overrides texture color. We should mix.)
          // Actually, let's use the texture color as base to keep the white border we drew!
          
          vec3 textureRgb = original.rgb;
          
          // If texture is white (boundary), keep it white. If it's the fill color, add gloss.
          // Simple blend:
          gl_FragColor = vec4(textureRgb + vec3(r,g,b), alpha);
        }
      `,
      transparent: true
    });

    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    // Mouse Tracking 
    const mouse = new THREE.Vector2(0, 0);
    const prevMouse = new THREE.Vector2(0, 0); 
    let isFirstMove = true;
    
    const spawnBrush = (x: number, y: number) => {
      const brush = brushes[currentBrush];
      brush.position.set(x, y, 0);
      brush.visible = true;
      (brush.material as THREE.MeshBasicMaterial).opacity = 1.0;
      brush.scale.setScalar(1.0 + Math.random() * 0.2); 
      currentBrush = (currentBrush + 1) % maxBrushes;
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      
      mouse.set(x, y);
      
      // Update DOM cursor position relative to container
      setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      
      if (isFirstMove) {
        prevMouse.copy(mouse);
        isFirstMove = false;
        return;
      }

      // Interpolation
      const distance = mouse.distanceTo(prevMouse);
      const steps = Math.min(Math.ceil(distance / 0.02), 20); 
      
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const lerpX = prevMouse.x + (mouse.x - prevMouse.x) * t;
        const lerpY = prevMouse.y + (mouse.y - prevMouse.y) * t;
        spawnBrush(lerpX, lerpY);
      }
      
      prevMouse.copy(mouse);
    };

    const onMouseEnter = () => setIsHovered(true);
    const onMouseLeave = () => setIsHovered(false);

    container.addEventListener("mousemove", onMouseMove);
    container.addEventListener("mouseenter", onMouseEnter);
    container.addEventListener("mouseleave", onMouseLeave);

    // Animation Loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Update Brushes
      brushes.forEach(brush => {
          if (brush.visible) {
              const mat = brush.material as THREE.MeshBasicMaterial;
              mat.opacity *= 0.96; 
              brush.scale.multiplyScalar(1.02);
              brush.rotation.z += 0.02; 
              if (mat.opacity < 0.01) brush.visible = false;
          }
      });

      // Render Ripple Map 
      renderer.setRenderTarget(rippleTarget);
      renderer.setClearColor(0x000000); 
      renderer.clear();
      renderer.render(rippleScene, rippleCamera);
      
      // Render Main Scene
      renderer.setRenderTarget(null);
      renderer.setClearColor(0x000000, 0); 
      renderer.clear();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      
      renderer.setSize(width, height);
      plane.geometry = new THREE.PlaneGeometry(width, height);
      
      const newTextData = createTextTexture();
      if (newTextData) {
        material.uniforms.uTexture.value = newTextData.texture;
      }
    };
    
    window.addEventListener('resize', handleResize);

    return () => {
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("mouseenter", onMouseEnter);
      container.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      textData.texture.dispose();
      rippleTarget.dispose();
    };
  }, [text, fontSize, fontFamily, color, fontWeight]);

  return (
    <div ref={containerRef} className={`relative ${className} cursor-none`}>
       {/* Custom Dotted Cursor */}
       <motion.div
        className="pointer-events-none absolute z-50 flex items-center justify-center"
        animate={{
          x: cursorPos.x - 20, 
          y: cursorPos.y - 20,
          scale: isHovered ? 1 : 0,
          opacity: isHovered ? 1 : 0
        }}
        transition={{ type: "spring", stiffness: 500, damping: 28, mass: 0.5 }}
        style={{ width: 40, height: 40 }}
      >
        <div className="w-full h-full rounded-full border-2 border-dotted border-white/50 animate-[spin_10s_linear_infinite]" />
        <div className="absolute w-1 h-1 bg-white rounded-full" />
      </motion.div>
    </div>
  );
}
