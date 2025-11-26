import React, { useRef } from 'react';
import { Layer, NoiseType } from '../types';
import { Plus, Trash2, Eye, EyeOff, GripVertical, Layers, Save, Upload, Image as ImageIcon, Waves } from 'lucide-react';

interface LayerListProps {
  layers: Layer[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: (type: NoiseType) => void;
  onRemove: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onLoadLayers: (layers: Layer[]) => void;
}

const LayerList: React.FC<LayerListProps> = ({ 
  layers, selectedId, onSelect, onAdd, onRemove, onToggleVisibility, onLoadLayers
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveProject = () => {
    const data = JSON.stringify(layers, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tileboi-project-${Date.now()}.json`;
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
                // Basic validation could go here
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
    // Reset value so we can load same file again if needed
    e.target.value = '';
  };

  return (
    <div className="w-72 bg-gray-900 flex flex-col border-r border-gray-800 h-full shadow-xl z-10">
      <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900 sticky top-0">
        <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-500" />
            <h1 className="text-xl font-bold text-white tracking-tight">TileBoi</h1>
        </div>
        <div className="flex gap-1">
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

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {layers.map((layer) => (
          <div 
            key={layer.id}
            onClick={() => onSelect(layer.id)}
            className={`
                group flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all
                ${selectedId === layer.id 
                    ? 'bg-gray-800 border-indigo-500/50 shadow-md shadow-indigo-900/20' 
                    : 'bg-gray-800/50 border-transparent hover:bg-gray-800 hover:border-gray-700'}
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

      <div className="p-4 border-t border-gray-800 bg-gray-900 sticky bottom-0">
        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Add New Layer</p>
        <div className="grid grid-cols-2 gap-2">
            <button onClick={() => onAdd(NoiseType.SIMPLEX)} className="btn-add">Simplex</button>
            <button onClick={() => onAdd(NoiseType.PERLIN)} className="btn-add">Perlin</button>
            <button onClick={() => onAdd(NoiseType.CELLULAR)} className="btn-add">Cellular</button>
            <button onClick={() => onAdd(NoiseType.WHITE)} className="btn-add">White</button>
            <button onClick={() => onAdd(NoiseType.IMAGE)} className="btn-add flex items-center gap-1">
                <ImageIcon className="w-3 h-3" /> Image
            </button>
             <button onClick={() => onAdd(NoiseType.WARP)} className="btn-add flex items-center gap-1 text-teal-300 border-teal-900/30 bg-teal-900/10 hover:bg-teal-900/20">
                <Waves className="w-3 h-3" /> Warp
            </button>
            <button onClick={() => onAdd(NoiseType.CUSTOM_AI)} className="col-span-2 btn-add bg-indigo-900/30 text-indigo-300 hover:bg-indigo-900/50 hover:text-indigo-200 border-indigo-900/50">
                Custom AI
            </button>
        </div>
      </div>
      
      {/* CSS Utility for button to keep JSX clean */}
      <style>{`
        .btn-add {
            @apply px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-xs text-gray-300 font-medium transition-colors text-left;
        }
      `}</style>
    </div>
  );
};

export default LayerList;