
import React, { useRef, useState } from 'react';
import { Layer, NoiseType } from '../types';
import { Plus, Trash2, Eye, EyeOff, GripVertical, Layers, Save, Upload, Image as ImageIcon, Waves, Circle, Grip, FilePlus, X } from 'lucide-react';

interface LayerListProps {
  layers: Layer[];
  selectedId: string | null;
  projectTitle: string;
  onChangeTitle: (title: string) => void;
  onNewProject: () => void;
  onSelect: (id: string) => void;
  onAdd: (type: NoiseType) => void;
  onRemove: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onLoadLayers: (layers: Layer[]) => void;
  onReorder: (dragIndex: number, hoverIndex: number) => void;
}

const LayerList: React.FC<LayerListProps> = ({ 
  layers, selectedId, projectTitle, onChangeTitle, onNewProject, onSelect, onAdd, onRemove, onToggleVisibility, onLoadLayers, onReorder
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [showAbout, setShowAbout] = useState(false);

  const handleSaveProject = () => {
    const data = JSON.stringify(layers, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    // Sanitize title for filename
    const filename = projectTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `${filename || 'tileboi-project'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const json = JSON.parse(event.target?.result as string);
            if (Array.isArray(json)) {
                onLoadLayers(json);
            } else {
                alert('Invalid project file');
            }
        } catch (err) {
            console.error(err);
            alert('Failed to load project');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDragStart = (index: number) => {
    setDraggedItemIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === index) return;
    onReorder(draggedItemIndex, index);
    setDraggedItemIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedItemIndex(null);
  };

  return (
    <div className="w-72 bg-gray-900 flex flex-col border-r border-gray-800 h-full shadow-xl z-10 relative">
      
      {/* Header Section */}
      <div className="p-4 border-b border-gray-800 bg-gray-900 sticky top-0 z-20 space-y-3">
          {/* Logo and Actions Row */}
          <div className="flex items-center justify-between">
            <div 
                className="flex items-center gap-2 cursor-pointer group"
                onClick={() => setShowAbout(true)}
                title="About TileBoi"
            >
                <div className="p-1.5 bg-indigo-500/10 rounded-lg group-hover:bg-indigo-500/20 transition-colors">
                     <Layers className="w-5 h-5 text-indigo-500" />
                </div>
                <h1 className="text-xl font-bold text-white tracking-tight group-hover:text-indigo-400 transition-colors">TileBoi</h1>
            </div>

            <div className="flex gap-1">
                <button 
                    onClick={onNewProject}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                    title="New Project"
                >
                    <FilePlus className="w-4 h-4" />
                </button>
                <button 
                    onClick={handleSaveProject}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                    title="Save Project"
                >
                    <Save className="w-4 h-4" />
                </button>
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                    title="Load Project"
                >
                    <Upload className="w-4 h-4" />
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden"
                    accept=".json"
                    onChange={handleLoadProject}
                />
            </div>
          </div>

          {/* Project Title Input */}
          <div>
              <input 
                type="text"
                value={projectTitle}
                onChange={(e) => onChangeTitle(e.target.value)}
                placeholder="Project Title"
                className="w-full bg-gray-950/50 border border-gray-800 rounded px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder-gray-600 font-medium"
              />
          </div>
      </div>

      {/* Layer List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {layers.map((layer, index) => (
          <div 
            key={layer.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            onClick={() => onSelect(layer.id)}
            className={`
                group flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all
                ${selectedId === layer.id 
                    ? 'bg-gray-800 border-indigo-500/50 shadow-md shadow-indigo-900/20' 
                    : 'bg-gray-800/50 border-transparent hover:bg-gray-800 hover:border-gray-700'}
                ${draggedItemIndex === index ? 'opacity-50' : ''}
            `}
          >
            <div className="text-gray-500 cursor-grab active:cursor-grabbing">
                <GripVertical className="w-4 h-4" />
            </div>
            
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${selectedId === layer.id ? 'text-white' : 'text-gray-300'}`}>
                    {layer.name}
                </p>
                <p className="text-xs text-gray-500 truncate">{layer.type} • {layer.blendMode}</p>
            </div>

            <button 
                onClick={(e) => { e.stopPropagation(); onToggleVisibility(layer.id); }}
                className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-gray-200"
            >
                {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 opacity-50" />}
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); onRemove(layer.id); }}
                className="p-1.5 rounded hover:bg-red-900/30 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}

        {layers.length === 0 && (
            <div className="text-center py-10 px-4">
                <p className="text-gray-500 text-sm mb-4">No layers yet. Add one to start forging.</p>
            </div>
        )}
      </div>

      {/* Footer: Add Layer Grid */}
      <div className="p-4 border-t border-gray-800 bg-gray-900 sticky bottom-0 z-20">
        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Add New Layer</p>
        <div className="grid grid-cols-2 gap-2">
            <button onClick={() => onAdd(NoiseType.SIMPLEX)} className="btn-add">Simplex</button>
            <button onClick={() => onAdd(NoiseType.PERLIN)} className="btn-add">Perlin</button>
            <button onClick={() => onAdd(NoiseType.CELLULAR)} className="btn-add">Cellular</button>
            <button onClick={() => onAdd(NoiseType.GRAIN)} className="btn-add">Grain</button>
            
            <button onClick={() => onAdd(NoiseType.DOTS)} className="btn-add">
                <Circle className="w-3 h-3" /> Dots
            </button>
            <button onClick={() => onAdd(NoiseType.STRIPES)} className="btn-add">
                <Grip className="w-3 h-3" /> Stripes
            </button>
            <button onClick={() => onAdd(NoiseType.MASK)} className="btn-add">
                <Circle className="w-3 h-3" /> Mask
            </button>
            <button onClick={() => onAdd(NoiseType.IMAGE)} className="btn-add">
                <ImageIcon className="w-3 h-3" /> Image
            </button>
            
             <button onClick={() => onAdd(NoiseType.WARP)} className="btn-add col-span-2 text-teal-300 border-teal-900/30 bg-teal-900/10 hover:bg-teal-900/20 justify-center">
                <Waves className="w-3 h-3" /> Warp
            </button>
            <button onClick={() => onAdd(NoiseType.CUSTOM_AI)} className="btn-add col-span-2 bg-indigo-900/30 text-indigo-300 hover:bg-indigo-900/50 hover:text-indigo-200 border-indigo-900/50 justify-center">
                Custom AI
            </button>
        </div>
      </div>
      
      {/* About Modal */}
      {showAbout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-6 w-full max-w-sm relative">
                  <button 
                    onClick={() => setShowAbout(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
                  >
                      <X className="w-5 h-5" />
                  </button>
                  <div className="flex flex-col items-center text-center space-y-4">
                      <div className="p-3 bg-indigo-500/10 rounded-xl">
                          <Layers className="w-10 h-10 text-indigo-500" />
                      </div>
                      <div>
                          <h2 className="text-2xl font-bold text-white mb-1">TileBoi</h2>
                          <p className="text-gray-400">Procedural Texture Generator</p>
                      </div>
                      <div className="bg-gray-800 rounded-lg p-4 w-full border border-gray-700">
                          <p className="text-indigo-300 font-mono text-sm">Version 0.5</p>
                          <p className="text-gray-500 text-xs mt-1">Powered by Gemini 3</p>
                      </div>
                      <button 
                        onClick={() => setShowAbout(false)}
                        className="w-full py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
                      >
                          Close
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* CSS Utility for button to keep JSX clean */}
      <style>{`
        .btn-add {
            @apply h-9 px-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-xs text-gray-300 font-medium transition-colors flex items-center gap-2;
        }
      `}</style>
    </div>
  );
};

export default LayerList;
