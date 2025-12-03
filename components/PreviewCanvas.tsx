
import React, { useEffect, useRef, useState } from 'react';
import { Layer, NoiseType, WarpType, MaskType } from '../types';
import { initNoise, generateSimplexTiled, generateCellularTiled, generateGrain, getRawSimplexTiled, generateDotsTiled, generateStripesTiled, generateMaskTiled } from '../utils/noise';
import { Download, Box, Grid, Grid3x3 } from 'lucide-react';
import ThreeViewer from './ThreeViewer';

interface PreviewCanvasProps {
  layers: Layer[];
  projectTitle: string;
}

const PreviewCanvas: React.FC<PreviewCanvasProps> = ({ layers, projectTitle }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageCache = useRef<Record<string, HTMLImageElement>>({});
  const [resolution, setResolution] = useState(512);
  const [isRendering, setIsRendering] = useState(false);
  const [viewMode, setViewMode] = useState<'2D' | 'Tiled' | '3D'>('2D');
  const [geometryType, setGeometryType] = useState<'Cube' | 'Sphere' | 'Cylinder' | 'Plane' | 'Cone'>('Cube');
  
  // Debounce render requests
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const render = async () => {
      setIsRendering(true);
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      if (!canvasRef.current) return;
      const displayCtx = canvasRef.current.getContext('2d', { willReadFrequently: true });
      if (!displayCtx) return;

      // Pixel art look
      displayCtx.imageSmoothingEnabled = false;

      const w = resolution;
      const h = resolution;

      if (canvasRef.current.width !== w) canvasRef.current.width = w;
      if (canvasRef.current.height !== h) canvasRef.current.height = h;

      // Offscreen composition canvas
      const compositeCanvas = document.createElement('canvas');
      compositeCanvas.width = w;
      compositeCanvas.height = h;
      const ctx = compositeCanvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      
      ctx.imageSmoothingEnabled = false; 

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);

      for (const layer of layers) {
        if (!layer.visible) continue;

        // --- IMAGE & CUSTOM AI (Image-based) HANDLING ---
        if ((layer.type === NoiseType.IMAGE || layer.type === NoiseType.CUSTOM_AI) && layer.params.image) {
            let img = imageCache.current[layer.params.image];
            if (!img) {
                img = new Image();
                img.src = layer.params.image;
                img.onload = () => { setIsRendering(prev => !prev); }; 
                imageCache.current[layer.params.image] = img;
            }

            if (img.complete && img.width > 0) {
                 ctx.globalCompositeOperation = layer.blendMode;
                 ctx.globalAlpha = layer.opacity;

                 const pattern = ctx.createPattern(img, 'repeat');
                 if (pattern) {
                     // Scale Logic
                     const targetTileW = w / Math.max(0.1, layer.params.scale);
                     const targetTileH = h / Math.max(0.1, layer.params.scale);
                     const scaleX = targetTileW / img.width;
                     const scaleY = targetTileH / img.height;

                     ctx.save();
                     if (layer.params.invert) {
                         ctx.filter = `invert(1) contrast(${layer.params.contrast}) brightness(${1 + layer.params.brightness})`;
                     } else {
                         ctx.filter = `contrast(${layer.params.contrast}) brightness(${1 + layer.params.brightness})`;
                     }

                     ctx.scale(scaleX, scaleY);
                     ctx.fillStyle = pattern;
                     ctx.fillRect(0, 0, w / scaleX, h / scaleY);
                     ctx.restore();
                 }

                 ctx.globalAlpha = 1.0;
                 ctx.globalCompositeOperation = 'source-over';
            }
            continue;
        }

        // --- WARP LAYER HANDLING ---
        if (layer.type === NoiseType.WARP) {
            initNoise(layer.params.seed);
            
            // Get current composite
            const currentImageData = ctx.getImageData(0, 0, w, h);
            const src = currentImageData.data;
            const outputImageData = ctx.createImageData(w, h);
            const dst = outputImageData.data;

            // Warp parameters
            // Fix: Check if undefined, allowing 0 to be a valid value
            const strValue = layer.params.warpStrength !== undefined ? layer.params.warpStrength : 0.5;
            const str = strValue * 100;
            const scale = layer.params.scale || 1.0;
            const type = layer.params.warpType || WarpType.TURBULENCE;

            // This is computationally expensive in JS for large res, but fine for preview
            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    let offsetX = 0;
                    let offsetY = 0;

                    const normalizedX = x / w;
                    const normalizedY = y / h;

                    if (type === WarpType.TURBULENCE) {
                        const nX = getRawSimplexTiled(x + 123.4, y, w, h, scale);
                        const nY = getRawSimplexTiled(x, y + 567.8, w, h, scale);
                        offsetX = nX * str;
                        offsetY = nY * str;
                    } else if (type === WarpType.SWIRL) {
                        const dx = normalizedX - 0.5;
                        const dy = normalizedY - 0.5;
                        const dist = Math.sqrt(dx*dx + dy*dy);
                        const angle = Math.atan2(dy, dx);
                        const swirl = Math.sin(dist * scale * 10 - layer.params.seed); 
                        offsetX = Math.cos(angle + swirl) * str * dist;
                        offsetY = Math.sin(angle + swirl) * str * dist;
                    } else if (type === WarpType.FLOW) {
                        const n = getRawSimplexTiled(x, y, w, h, scale);
                        offsetX = Math.cos(n * Math.PI) * str;
                        offsetY = Math.sin(n * Math.PI) * str;
                    }

                    // Tiled sample lookup
                    let srcX = (x + offsetX) % w;
                    let srcY = (y + offsetY) % h;
                    if (srcX < 0) srcX += w;
                    if (srcY < 0) srcY += h;

                    const sx = Math.floor(srcX);
                    const sy = Math.floor(srcY);
                    
                    const srcIdx = (sy * w + sx) * 4;
                    const dstIdx = (y * w + x) * 4;

                    dst[dstIdx] = src[srcIdx];
                    dst[dstIdx+1] = src[srcIdx+1];
                    dst[dstIdx+2] = src[srcIdx+2];
                    dst[dstIdx+3] = src[srcIdx+3];
                }
            }

            // Put warped data back
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = w;
            tempCanvas.height = h;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx?.putImageData(outputImageData, 0, 0);
            
            ctx.save();
            ctx.globalAlpha = layer.opacity;
            ctx.globalCompositeOperation = 'source-over'; 
            ctx.drawImage(tempCanvas, 0, 0);
            ctx.restore();
            continue;
        }

        // --- PROCEDURAL LAYER HANDLING ---
        const layerData = ctx.createImageData(w, h);
        const data = layerData.data;

        initNoise(layer.params.seed);

        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            let value = 0;
            const idx = (y * w + x) * 4;

            switch (layer.type) {
                case NoiseType.SIMPLEX:
                case NoiseType.PERLIN: 
                    value = generateSimplexTiled(x, y, w, h, layer.params.scale);
                    break;
                case NoiseType.CELLULAR:
                    value = generateCellularTiled(x, y, w, h, layer.params.scale, layer.params.jitter || 1, layer.params.seed);
                    break;
                case NoiseType.DOTS:
                    value = generateDotsTiled(
                        x, y, w, h, 
                        layer.params.scale, 
                        layer.params.dotBaseSize || 0.8, 
                        layer.params.sizeVariation || 0,
                        layer.params.maskThreshold || 0,
                        layer.params.seed,
                        layer.params.jitter !== undefined ? layer.params.jitter : 1.0
                    );
                    break;
                case NoiseType.STRIPES:
                    value = generateStripesTiled(x, y, w, h, layer.params.scale);
                    break;
                case NoiseType.MASK:
                    value = generateMaskTiled(
                        x, y, w, h, 
                        layer.params.scale, 
                        layer.params.maskType || MaskType.GLOW_CIRCLE,
                        layer.params.maskHardness !== undefined ? layer.params.maskHardness : 0.5,
                        layer.params.ringCount || 5
                    );
                    break;
                case NoiseType.GRAIN:
                    value = generateGrain();
                    break;
            }

            if (layer.params.invert) {
                value = 1.0 - value;
            }

            value = (value - 0.5) * layer.params.contrast + 0.5 + layer.params.brightness;
            value = Math.max(0, Math.min(1, value));

            const pixelVal = Math.floor(value * 255);
            
            data[idx] = pixelVal;
            data[idx + 1] = pixelVal;
            data[idx + 2] = pixelVal;
            data[idx + 3] = Math.floor(layer.opacity * 255);
          }
        }

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = w;
        tempCanvas.height = h;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
            tempCtx.putImageData(layerData, 0, 0);
            ctx.globalCompositeOperation = layer.blendMode;
            ctx.drawImage(tempCanvas, 0, 0);
            ctx.globalCompositeOperation = 'source-over';
        }
      }

      // --- FINAL DISPLAY RENDERING ---
      displayCtx.clearRect(0, 0, w, h);

      if (viewMode === 'Tiled') {
          // Use ceil to ensure overlap (fix seam lines)
          const tileW = Math.ceil(w / 3);
          const tileH = Math.ceil(h / 3);
          
          for (let y = 0; y < 3; y++) {
              for (let x = 0; x < 3; x++) {
                  // Draw at integer coordinates
                  displayCtx.drawImage(compositeCanvas, x * tileW, y * tileH, tileW, tileH);
              }
          }
      } else {
          displayCtx.drawImage(compositeCanvas, 0, 0);
      }
      
      setIsRendering(false);
    };

    timeoutId = setTimeout(render, 50);
    return () => clearTimeout(timeoutId);
  }, [layers, resolution, viewMode]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    if (viewMode !== '2D') {
        alert("Switch to 2D view to download the full resolution seamless texture.");
        return;
    }
    const link = document.createElement('a');
    // Sanitize title for filename
    const filename = projectTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `${filename || 'texture'}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="flex-1 bg-black flex flex-col relative overflow-hidden flex items-center justify-center p-8 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-800 to-gray-950">
      
      {/* Top Toolbar */}
      <div className="absolute top-4 right-4 flex gap-2 bg-gray-900 p-2 rounded-lg border border-gray-800 shadow-xl z-20">
         <div className="flex bg-gray-800 rounded p-1 gap-1 mr-2 border border-gray-700">
             <button 
                onClick={() => setViewMode('2D')}
                className={`p-1.5 rounded transition-colors ${viewMode === '2D' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                title="2D View"
             >
                 <Grid className="w-4 h-4" />
             </button>
             <button 
                onClick={() => setViewMode('Tiled')}
                className={`p-1.5 rounded transition-colors ${viewMode === 'Tiled' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                title="Tiled Preview (3x3)"
             >
                 <Grid3x3 className="w-4 h-4" />
             </button>
             <button 
                onClick={() => setViewMode('3D')}
                className={`p-1.5 rounded transition-colors ${viewMode === '3D' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                title="3D View"
             >
                 <Box className="w-4 h-4" />
             </button>
         </div>

         {viewMode === '3D' && (
             <select 
                className="bg-gray-800 text-xs text-gray-300 border border-gray-700 rounded p-1 outline-none mr-2"
                value={geometryType}
                onChange={(e) => setGeometryType(e.target.value as any)}
             >
                 <option value="Cube">Cube</option>
                 <option value="Sphere">Sphere</option>
                 <option value="Cylinder">Cylinder</option>
                 <option value="Cone">Cone</option>
                 <option value="Plane">Plane</option>
             </select>
         )}

        <select 
            className="bg-gray-800 text-xs text-gray-300 border border-gray-700 rounded p-1 outline-none"
            value={resolution}
            onChange={(e) => setResolution(Number(e.target.value))}
        >
            <option value="256">256 x 256</option>
            <option value="512">512 x 512</option>
            <option value="1024">1024 x 1024</option>
        </select>
        <button 
            onClick={handleDownload}
            className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors"
            title="Download Texture (2D View)"
        >
            <Download className="w-4 h-4" />
        </button>
      </div>

      {/* Main Preview Area */}
      <div 
        className="relative shadow-2xl shadow-black border border-gray-700 bg-gray-900/50 backdrop-blur-sm"
        style={{ width: 512, height: 512 }} 
      >
        <canvas 
            ref={canvasRef}
            width={resolution}
            height={resolution}
            className={`w-full h-full rendering-pixelated ${viewMode === '3D' ? 'opacity-0 absolute pointer-events-none' : ''}`}
            style={{ imageRendering: 'pixelated' }}
        />

        {viewMode === '3D' && canvasRef.current && (
            <div className="absolute inset-0 z-10">
                <ThreeViewer textureCanvas={canvasRef.current} geometryType={geometryType} />
            </div>
        )}
        
        {isRendering && viewMode !== '3D' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px] z-30">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )}
      </div>

      <div className="absolute bottom-4 text-gray-600 text-xs font-mono">
        {resolution}px • seamless • {layers.filter(l => l.visible).length} active layers • {viewMode}
      </div>
    </div>
  );
};

export default PreviewCanvas;
