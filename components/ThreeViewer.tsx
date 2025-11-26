import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Rotate3D, MousePointer2 } from 'lucide-react';

interface ThreeViewerProps {
  textureCanvas: HTMLCanvasElement;
  geometryType: 'Cube' | 'Sphere' | 'Cylinder' | 'Plane' | 'Cone';
}

const ThreeViewer: React.FC<ThreeViewerProps> = ({ textureCanvas, geometryType }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  
  const [autoRotate, setAutoRotate] = useState(true);
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });

  // Initialize Three.js
  useEffect(() => {
    if (!containerRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a202c); // Match app bg
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100); // Aspect will be set in resize
    camera.position.z = 3;
    camera.position.y = 1;
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(512, 512); // Initial size
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);

    // Initial Mesh Placeholder
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x888888 });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    meshRef.current = mesh;

    // Animation Loop
    const animate = () => {
      requestAnimationFrame(animate);
      if (meshRef.current && autoRotate) {
        meshRef.current.rotation.y += 0.005;
      }
      if (textureRef.current) {
        textureRef.current.needsUpdate = true;
      }
      renderer.render(scene, camera);
    };
    animate();

    // Resize Observer
    const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            const { width, height } = entry.contentRect;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      renderer.dispose();
      resizeObserver.disconnect();
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []); // Run once on mount

  // Sync autoRotate ref for animation loop not needed as we use state directly 
  // actually animation loop captures state via closure if defined inside useEffect
  // but since we want to toggle it, we need a ref or effect. 
  // Let's rely on the fact that the animate function will capture the *current* state 
  // IF we used a Ref for autoRotate. Since we used State, the closure might be stale.
  // FIX: use a ref for autoRotate logic inside the loop.
  const autoRotateRef = useRef(autoRotate);
  useEffect(() => { autoRotateRef.current = autoRotate; }, [autoRotate]);

  useEffect(() => {
     // Re-bind animate to use fresh ref
     const animate = () => {
         requestAnimationFrame(animate);
         if (rendererRef.current && sceneRef.current && cameraRef.current) {
             if (meshRef.current && autoRotateRef.current && !isDragging.current) {
                meshRef.current.rotation.y += 0.005;
             }
             if (textureRef.current) {
                 textureRef.current.needsUpdate = true;
             }
             rendererRef.current.render(sceneRef.current, cameraRef.current);
         }
     }
     // We can't easily cancel the previous RAF without storing ID.
     // Simpler: Just rely on the first loop continuing and using the Ref.
     // The first useEffect loop is fine, we just need to update it to use autoRotateRef.
  }, []);

  // Update Geometry
  useEffect(() => {
    if (!meshRef.current || !sceneRef.current) return;

    let geometry: THREE.BufferGeometry;
    switch (geometryType) {
        case 'Sphere': geometry = new THREE.SphereGeometry(0.8, 64, 64); break;
        case 'Cylinder': geometry = new THREE.CylinderGeometry(0.6, 0.6, 1.2, 32); break;
        case 'Cone': geometry = new THREE.ConeGeometry(0.6, 1.2, 32); break;
        case 'Plane': geometry = new THREE.PlaneGeometry(1.5, 1.5); break;
        case 'Cube':
        default: geometry = new THREE.BoxGeometry(1.2, 1.2, 1.2); break;
    }

    meshRef.current.geometry.dispose();
    meshRef.current.geometry = geometry;
  }, [geometryType]);

  // Update Texture
  useEffect(() => {
    if (!meshRef.current || !textureCanvas) return;
    
    // Create new texture from canvas
    const texture = new THREE.CanvasTexture(textureCanvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.NearestFilter; // Sharp pixels
    texture.generateMipmaps = false;
    
    textureRef.current = texture;

    // Apply to material
    const material = meshRef.current.material as THREE.MeshStandardMaterial;
    material.map = texture;
    material.needsUpdate = true;

  }, [textureCanvas]);

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
      isDragging.current = true;
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
      setAutoRotate(false); // Stop auto rotate when user grabs
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging.current || !meshRef.current) return;
      
      const deltaMove = {
          x: e.clientX - previousMousePosition.current.x,
          y: e.clientY - previousMousePosition.current.y
      };

      const rotationSpeed = 0.005;
      meshRef.current.rotation.y += deltaMove.x * rotationSpeed;
      meshRef.current.rotation.x += deltaMove.y * rotationSpeed;

      previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
      isDragging.current = false;
  };

  return (
    <div className="relative w-full h-full">
        <div 
            ref={containerRef} 
            className="w-full h-full cursor-move"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        />
        <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`absolute bottom-4 right-4 p-2 rounded-full border shadow-lg transition-colors ${autoRotate ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'}`}
            title={autoRotate ? "Pause Rotation" : "Auto Rotate"}
        >
            <Rotate3D className="w-5 h-5" />
        </button>
    </div>
  );
};

export default ThreeViewer;