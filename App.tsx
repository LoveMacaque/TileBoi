
import React, { useState } from 'react';
import LayerList from './components/LayerList';
import LayerControls from './components/LayerControls';
import PreviewCanvas from './components/PreviewCanvas';
import { Layer, NoiseType, BlendMode, DEFAULT_PARAMS } from './types';

const App: React.FC = () => {
  const [projectTitle, setProjectTitle] = useState('Untitled Project');
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

  const handleNewProject = () => {
    if (window.confirm('Are you sure you want to start a new project? All unsaved changes will be lost.')) {
        setProjectTitle('Untitled Project');
        const newLayer: Layer = {
            id: `layer-${Date.now()}`,
            name: 'Base Simplex',
            type: NoiseType.SIMPLEX,
            blendMode: BlendMode.NORMAL,
            opacity: 1,
            visible: true,
            params: { ...DEFAULT_PARAMS, scale: 3 }
        };
        setLayers([newLayer]);
        setSelectedId(newLayer.id);
    }
  };

  const handleAddLayer = (type: NoiseType) => {
    // Specific defaults for new layers to make them look good immediately
    let specificParams = {};
    if (type === NoiseType.MASK) {
        specificParams = { scale: 1.0 };
    } else if (type === NoiseType.DOTS) {
        specificParams = { scale: 10.0, jitter: 1.0, sizeVariation: 0.5 };
    }

    const newLayer: Layer = {
      id: `layer-${Date.now()}`,
      name: `${type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()} Noise`,
      type,
      blendMode: layers.length === 0 ? BlendMode.NORMAL : BlendMode.SCREEN, // Smart default
      opacity: 1,
      visible: true,
      params: { ...DEFAULT_PARAMS, ...specificParams }
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

  const handleReorderLayers = (dragIndex: number, hoverIndex: number) => {
      const draggedLayer = layers[dragIndex];
      const newLayers = [...layers];
      newLayers.splice(dragIndex, 1);
      newLayers.splice(hoverIndex, 0, draggedLayer);
      setLayers(newLayers);
  };

  const selectedLayer = layers.find(l => l.id === selectedId);

  return (
    <div className="flex h-screen w-full bg-gray-950 text-white overflow-hidden font-sans">
      {/* Left Sidebar: Layer List */}
      <LayerList 
        layers={layers}
        selectedId={selectedId}
        projectTitle={projectTitle}
        onChangeTitle={setProjectTitle}
        onNewProject={handleNewProject}
        onSelect={setSelectedId}
        onAdd={handleAddLayer}
        onRemove={handleRemoveLayer}
        onToggleVisibility={handleToggleVisibility}
        onLoadLayers={handleLoadLayers}
        onReorder={handleReorderLayers}
      />

      {/* Center: Preview Canvas */}
      <PreviewCanvas layers={layers} projectTitle={projectTitle} />

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
