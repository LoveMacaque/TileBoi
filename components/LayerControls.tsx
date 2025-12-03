
import React, { useState, useRef } from 'react';
import { Layer, NoiseType, BlendMode, LayerParams, WarpType, MaskType } from '../types';
import { Sliders, RefreshCw, Wand2, Info, Upload, Wind, Waves, Tornado, Circle, Square, Sun, Grip, Star, Disc } from 'lucide-react';
import { generateTextureImage } from '../services/geminiService';

interface LayerControlsProps {
  layer: Layer;
  onUpdate: (id: string, updates: Partial<Layer>) => void;
}

const LayerControls: React.FC<LayerControlsProps> = ({ layer, onUpdate }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleParamChange = (key: keyof LayerParams, value: any) => {
    onUpdate(layer.id, {
      params: { ...layer.params, [key]: value }
    });
  };

  const handleAiGenerate = async () => {
    if (!layer.params.prompt) return;
    setIsGenerating(true);
    setError(null);
    onUpdate(layer.id, { isProcessing: true });
    
    try {
      const imageUrl = await generateTextureImage(layer.params.prompt);
      handleParamChange('image', imageUrl);
    } catch (e: any) {
      setError("Failed to generate. " + (e.message || "Try again."));
    } finally {
      setIsGenerating(false);
      onUpdate(layer.id, { isProcessing: false });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          handleParamChange('image', event.target?.result as string);
      };
      reader.readAsDataURL(file);
  };

  const handleBlendScroll = (e: React.WheelEvent) => {
    e.preventDefault();
    const modes = Object.values(BlendMode);
    const currentIndex = modes.indexOf(layer.blendMode);
    
    if (e.deltaY > 0) {
        const nextIndex = (currentIndex + 1) % modes.length;
        onUpdate(layer.id, { blendMode: modes[nextIndex] });
    } else {
        const prevIndex = (currentIndex - 1 + modes.length) % modes.length;
        onUpdate(layer.id, { blendMode: modes[prevIndex] });
    }
  };

  return (
    <div className="p-4 bg-gray-900 border-l border-gray-800 h-full overflow-y-auto w-80 flex flex-col gap-6 shadow-xl">
      <div className="flex items-center gap-2 mb-2 pb-4 border-b border-gray-800">
        <Sliders className="w-5 h-5 text-indigo-400" />
        <h2 className="text-lg font-bold text-white tracking-wide">Properties</h2>
      </div>

      {/* Common Controls */}
      <div className="space-y-4">
        <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex justify-between">
                Blend Mode 
                <span className="text-[10px] normal-case text-gray-600">(Scroll to change)</span>
            </label>
            <div className="relative group" onWheel={handleBlendScroll}>
                <select 
                    value={layer.blendMode} 
                    onChange={(e) => onUpdate(layer.id, { blendMode: e.target.value as BlendMode })}
                    className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                >
                    {Object.values(BlendMode).map(mode => (
                        <option key={mode} value={mode}>{mode.toUpperCase()}</option>
                    ))}
                </select>
            </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
             <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Opacity</label>
             <span className="text-xs text-gray-500">{Math.round(layer.opacity * 100)}%</span>
          </div>
          <input 
            type="range" min="0" max="1" step="0.01"
            value={layer.opacity}
            onChange={(e) => onUpdate(layer.id, { opacity: parseFloat(e.target.value) })}
            className="w-full accent-indigo-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        
        {layer.type !== NoiseType.WARP && (
            <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Invert</label>
                <input 
                    type="checkbox"
                    checked={layer.params.invert}
                    onChange={(e) => handleParamChange('invert', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-700 text-indigo-600 focus:ring-indigo-500 bg-gray-800"
                />
            </div>
        )}

        {layer.type !== NoiseType.WARP && (
            <>
                <div className="space-y-2">
                   <div className="flex justify-between">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {layer.type === NoiseType.DOTS ? 'Density (Grid Size)' : 'Scale / Frequency'}
                    </label>
                    <span className="text-xs text-gray-500">{layer.params.scale}x</span>
                   </div>
                  <input 
                    type="range" min="0.1" max="20" step="0.1"
                    value={layer.params.scale}
                    onChange={(e) => handleParamChange('scale', parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Contrast</label>
                        <span className="text-xs text-gray-500">{layer.params.contrast.toFixed(1)}</span>
                    </div>
                    <input 
                        type="range" min="0.5" max="3" step="0.1"
                        value={layer.params.contrast}
                        onChange={(e) => handleParamChange('contrast', parseFloat(e.target.value))}
                        className="w-full accent-indigo-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
                 <div className="space-y-2">
                    <div className="flex justify-between">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Brightness</label>
                        <span className="text-xs text-gray-500">{layer.params.brightness.toFixed(1)}</span>
                    </div>
                    <input 
                        type="range" min="-1" max="1" step="0.05"
                        value={layer.params.brightness}
                        onChange={(e) => handleParamChange('brightness', parseFloat(e.target.value))}
                        className="w-full accent-indigo-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
            </>
        )}
        
        {/* Seed */}
        {(['SIMPLEX', 'PERLIN', 'CELLULAR', 'DOTS', 'WARP'].includes(layer.type)) && (
             <div className="flex items-center justify-between pt-2">
                 <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Seed</label>
                 <div className="flex items-center gap-2">
                     <input 
                        type="number"
                        value={layer.params.seed}
                        onChange={(e) => handleParamChange('seed', parseInt(e.target.value))}
                        className="w-20 bg-gray-800 text-xs border border-gray-700 rounded p-1 text-right focus:outline-none focus:border-indigo-500"
                     />
                     <button 
                        onClick={() => handleParamChange('seed', Math.floor(Math.random() * 99999))}
                        className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
                     >
                         <RefreshCw className="w-4 h-4" />
                     </button>
                 </div>
            </div>
        )}
      </div>

      <div className="border-t border-gray-800 my-2"></div>

      {/* Type Specific Controls */}
      
      {layer.type === NoiseType.WARP && (
          <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                  <Waves className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-semibold text-gray-200">Distortion Settings</span>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Warp Type</label>
                <div className="grid grid-cols-3 gap-2">
                    {Object.values(WarpType).map((type) => (
                        <button
                            key={type}
                            onClick={() => handleParamChange('warpType', type)}
                            className={`
                                p-2 rounded text-xs border flex flex-col items-center gap-1 transition-all
                                ${layer.params.warpType === type 
                                    ? 'bg-indigo-900/50 border-indigo-500 text-white' 
                                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-750'}
                            `}
                        >
                            {type === WarpType.SWIRL && <Tornado className="w-4 h-4" />}
                            {type === WarpType.TURBULENCE && <Wind className="w-4 h-4" />}
                            {type === WarpType.FLOW && <Waves className="w-4 h-4" />}
                            <span>{type.charAt(0) + type.slice(1).toLowerCase()}</span>
                        </button>
                    ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Strength</label>
                    <span className="text-xs text-gray-500">{layer.params.warpStrength?.toFixed(2)}</span>
                </div>
                <input 
                    type="range" min="0" max="2" step="0.05"
                    value={layer.params.warpStrength}
                    onChange={(e) => handleParamChange('warpStrength', parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                   <div className="flex justify-between">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Noise Scale</label>
                    <span className="text-xs text-gray-500">{layer.params.scale}x</span>
                   </div>
                  <input 
                    type="range" min="0.1" max="10" step="0.1"
                    value={layer.params.scale}
                    onChange={(e) => handleParamChange('scale', parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
          </div>
      )}

      {layer.type === NoiseType.CELLULAR && (
         <div className="space-y-2">
            <div className="flex justify-between">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Jitter</label>
                <span className="text-xs text-gray-500">{layer.params.jitter?.toFixed(2)}</span>
            </div>
            <input 
                type="range" min="0" max="1.5" step="0.05"
                value={layer.params.jitter || 1}
                onChange={(e) => handleParamChange('jitter', parseFloat(e.target.value))}
                className="w-full accent-indigo-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
        </div>
      )}

      {layer.type === NoiseType.DOTS && (
          <div className="space-y-4">
             <div className="space-y-2">
                <div className="flex justify-between">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Base Size</label>
                    <span className="text-xs text-gray-500">{layer.params.dotBaseSize?.toFixed(2)}</span>
                </div>
                <input 
                    type="range" min="0.1" max="1.5" step="0.05"
                    value={layer.params.dotBaseSize || 0.8}
                    onChange={(e) => handleParamChange('dotBaseSize', parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
             </div>
             
             <div className="space-y-2">
                <div className="flex justify-between">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Size Reduction Var.</label>
                    <span className="text-xs text-gray-500">{layer.params.sizeVariation?.toFixed(2)}</span>
                </div>
                <input 
                    type="range" min="0" max="1" step="0.05"
                    value={layer.params.sizeVariation || 0}
                    onChange={(e) => handleParamChange('sizeVariation', parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
             </div>

             <div className="space-y-2">
                <div className="flex justify-between">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Masking Threshold</label>
                    <span className="text-xs text-gray-500">{layer.params.maskThreshold?.toFixed(2)}</span>
                </div>
                <input 
                    type="range" min="0" max="1" step="0.05"
                    value={layer.params.maskThreshold || 0}
                    onChange={(e) => handleParamChange('maskThreshold', parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-[10px] text-gray-500">0 = All dots shown, 1 = No dots</p>
             </div>
          </div>
      )}

      {layer.type === NoiseType.MASK && (
          <div className="space-y-4">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Mask Shape</label>
            <select 
                 value={layer.params.maskType}
                 onChange={(e) => handleParamChange('maskType', e.target.value)}
                 className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-xs rounded p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none mb-2"
            >
                <option value={MaskType.GLOW_CIRCLE}>Glow Circle</option>
                <option value={MaskType.GLOW_SQUARE}>Glow Square</option>
                <option value={MaskType.STAR_4}>4-Point Star</option>
                <option value={MaskType.STAR_5}>5-Point Star</option>
                <option value={MaskType.RINGS}>Radial Rings</option>
            </select>

            <div className="space-y-2">
                <div className="flex justify-between">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Hardness</label>
                    <span className="text-xs text-gray-500">{layer.params.maskHardness?.toFixed(2)}</span>
                </div>
                <input 
                    type="range" min="0" max="1" step="0.05"
                    value={layer.params.maskHardness !== undefined ? layer.params.maskHardness : 0.5}
                    onChange={(e) => handleParamChange('maskHardness', parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
             </div>
             
             {layer.params.maskType === MaskType.RINGS && (
                 <div className="space-y-2">
                    <div className="flex justify-between">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ring Count</label>
                        <span className="text-xs text-gray-500">{layer.params.ringCount}</span>
                    </div>
                    <input 
                        type="range" min="1" max="20" step="1"
                        value={layer.params.ringCount || 5}
                        onChange={(e) => handleParamChange('ringCount', parseInt(e.target.value))}
                        className="w-full accent-indigo-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                 </div>
             )}
          </div>
      )}

      {layer.type === NoiseType.IMAGE && (
         <div className="space-y-4">
             <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Source Image</label>
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-700 rounded-lg p-4 hover:border-indigo-500 hover:bg-gray-800/50 transition-all flex flex-col items-center gap-2 group"
                >
                    <Upload className="w-6 h-6 text-gray-500 group-hover:text-indigo-400" />
                    <span className="text-xs text-gray-500 group-hover:text-gray-300">Click to upload image</span>
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    className="hidden" 
                    accept="image/*"
                />
             </div>
             
             {layer.params.image && (
                 <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-gray-700">
                     <img src={layer.params.image} alt="Layer Preview" className="w-full h-full object-cover" />
                 </div>
             )}
         </div>
      )}

      {layer.type === NoiseType.CUSTOM_AI && (
        <div className="space-y-4">
            <div className="p-3 bg-indigo-900/20 border border-indigo-900/50 rounded-lg">
                <div className="flex items-start gap-2 mb-2">
                    <Info className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-indigo-200">
                        Describe a texture. The AI will generate a seamless image tile.
                    </p>
                </div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Texture Description</label>
                <textarea 
                    value={layer.params.prompt}
                    onChange={(e) => handleParamChange('prompt', e.target.value)}
                    placeholder="e.g. cracked dry mud, rusting metal panel, mossy cobblestone"
                    className="w-full h-24 bg-gray-800 border border-gray-700 text-sm text-white rounded p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none mb-2"
                />
                <button 
                    onClick={handleAiGenerate}
                    disabled={isGenerating || !layer.params.prompt}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-2 rounded transition-all"
                >
                    {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    {isGenerating ? 'Dreaming...' : 'Generate Texture'}
                </button>
                {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
            </div>
            
            {layer.params.image && (
                 <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-gray-700">
                     <img src={layer.params.image} alt="Generated Preview" className="w-full h-full object-cover" />
                 </div>
             )}
        </div>
      )}

    </div>
  );
};

export default LayerControls;
