
export enum BlendMode {
  NORMAL = 'source-over',
  MULTIPLY = 'multiply',
  SCREEN = 'screen',
  OVERLAY = 'overlay',
  DARKEN = 'darken',
  LIGHTEN = 'lighten',
  COLOR_DODGE = 'color-dodge',
  COLOR_BURN = 'color-burn',
  HARD_LIGHT = 'hard-light',
  SOFT_LIGHT = 'soft-light',
  DIFFERENCE = 'difference',
  EXCLUSION = 'exclusion',
}

export enum NoiseType {
  SIMPLEX = 'SIMPLEX',
  PERLIN = 'PERLIN',
  CELLULAR = 'CELLULAR',
  DOTS = 'DOTS',
  STRIPES = 'STRIPES',
  MASK = 'MASK',
  GRAIN = 'GRAIN',
  CUSTOM_AI = 'CUSTOM_AI',
  IMAGE = 'IMAGE',
  WARP = 'WARP'
}

export enum WarpType {
  SWIRL = 'SWIRL',
  TURBULENCE = 'TURBULENCE',
  FLOW = 'FLOW'
}

export enum MaskType {
  GLOW_CIRCLE = 'GLOW_CIRCLE',
  GLOW_SQUARE = 'GLOW_SQUARE',
  STAR_4 = 'STAR_4',
  STAR_5 = 'STAR_5',
  RINGS = 'RINGS'
}

export interface LayerParams {
  scale: number;
  seed: number;
  contrast: number;
  brightness: number;
  invert: boolean;
  // Specific to Cellular/Dots
  jitter?: number; 
  sizeVariation?: number; // For Dots (reduces size)
  dotBaseSize?: number; // For Dots (0-1 relative to cell)
  maskThreshold?: number; // For Dots (0-1, 0 = all dots, 1 = no dots)
  // Specific to Mask
  maskType?: MaskType;
  maskHardness?: number; // 0 (soft) to 1 (hard)
  ringCount?: number;
  // Specific to Custom AI
  prompt?: string;
  customFunctionBody?: string;
  // Specific to Image
  image?: string; // Data URL
  // Specific to Warp
  warpType?: WarpType;
  warpStrength?: number;
}

export interface Layer {
  id: string;
  name: string;
  type: NoiseType;
  blendMode: BlendMode;
  opacity: number;
  visible: boolean;
  params: LayerParams;
  isProcessing?: boolean; // For AI loading state
}

export const DEFAULT_PARAMS: LayerParams = {
  scale: 5,
  seed: 12345,
  contrast: 1.0,
  brightness: 0.0,
  invert: false,
  jitter: 1.0,
  sizeVariation: 0.0,
  dotBaseSize: 0.8,
  maskThreshold: 0.0,
  maskType: MaskType.GLOW_CIRCLE,
  maskHardness: 0.5,
  ringCount: 5,
  prompt: 'A seamless stone wall texture',
  customFunctionBody: '',
  image: undefined,
  warpType: WarpType.TURBULENCE,
  warpStrength: 0.5
};
