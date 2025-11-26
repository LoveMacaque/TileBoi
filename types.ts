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
  CELLULAR = 'CELLULAR', // Worley
  WHITE = 'WHITE',
  CUSTOM_AI = 'CUSTOM_AI',
  IMAGE = 'IMAGE',
  WARP = 'WARP'
}

export enum WarpType {
  SWIRL = 'SWIRL',
  TURBULENCE = 'TURBULENCE',
  FLOW = 'FLOW'
}

export interface LayerParams {
  scale: number;
  seed: number;
  contrast: number;
  brightness: number;
  invert: boolean;
  // Specific to Cellular
  jitter?: number; 
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
  prompt: 'A seamless stone wall texture',
  customFunctionBody: '',
  image: undefined,
  warpType: WarpType.TURBULENCE,
  warpStrength: 0.5
};