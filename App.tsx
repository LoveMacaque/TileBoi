import React, { useState } from 'react';
import LayerList from './components/LayerList';
import LayerControls from './components/LayerControls';
import PreviewCanvas from './components/PreviewCanvas';
import { Layer, NoiseType, BlendMode, DEFAULT_PARAMS } from './types';

const App: React.FC = () => {
  const [layers, setLayers] = useState<Layer[]>([
    {
      id: 'layer-1',
      name: 'Base Simplex',
      type: NoiseType.SIMPLEX,
      blendMode: BlendMode.NORMAL,
      opacity: 1,
      visible: true,
      params: { ...DEFAULT_PARAMS, scale: 3 }
    }
  ]);
  const [selectedId, setSelectedId] = useState<string | null>('layer-1');

  const handleAddLayer = (type: NoiseType) => {
    const newLayer: Layer = {
      id: `layer-${Date.now()}`,
      name: `${type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()} Noise`,
      type,
      blendMode: layers.length === 0 ? BlendMode.NORMAL : BlendMode.SCREEN, // Smart default
      opacity: 1,
      visible: true,
      params: { ...DEFAULT_PARAMS }
    };
    setLayers([...layers, newLayer]);
    setSelectedId(newLayer.id);
  };

  const handleRemoveLayer = (id: string) => {
    const newLayers = layers.filter(l => l.id !== id);
    setLayers(newLayers);
    if (selectedId === id) {
        setSelectedId(newLayers.length > 0 ? newLayers[newLayers.length - 1].id : null);
    }
  };

  const handleUpdateLayer = (id: string, updates: Partial<Layer>) => {
    setLayers(layers.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const handleToggleVisibility = (id: string) => {
    setLayers(layers.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  };
  
  const handleLoadLayers = (newLayers: Layer[]) => {
      setLayers(newLayers);
      if (newLayers.length > 0) {
          setSelectedId(newLayers[0].id);
      } else {
          setSelectedId(null);
      }
  };

  const selectedLayer = layers.find(l => l.id === selectedId);

  return (
    <div className="flex h-screen w-full bg-gray-950 text-white overflow-hidden font-sans">
      {/* Left Sidebar: Layer List */}
      <LayerList 
        layers={layers}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onAdd={handleAddLayer}
        onRemove={handleRemoveLayer}
        onToggleVisibility={handleToggleVisibility}
        onLoadLayers={handleLoadLayers}
      />

      {/* Center: Preview Canvas */}
      <PreviewCanvas layers={layers} />

      {/* Right Sidebar: Layer Controls */}
      {selectedLayer ? (
        <LayerControls 
            layer={selectedLayer} 
            onUpdate={handleUpdateLayer} 
        />
      ) : (
        <div className="w-80 bg-gray-900 border-l border-gray-800 flex items-center justify-center p-8 text-center">
            <p className="text-gray-500 text-sm">Select a layer to edit its properties or add a new one.</p>
        </div>
      )}
    </div>
  );
};

export default App;