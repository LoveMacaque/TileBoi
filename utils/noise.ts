/**
 * A collection of noise generation utilities.
 * We implement basic versions here to avoid heavy external dependencies 
 * while maintaining control over tiling.
 */

// Simple pseudo-random number generator
function mulberry32(a: number) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

/* 
  Simplex Noise Implementation (Simplified for 4D tiling support)
  To tile 2D noise perfectly, we map the 2D plane to a 4D torus.
  (x, y) -> (cos(x), sin(x), cos(y), sin(y))
*/

// Fast Simplex Noise (Subset implementation suited for this task)
// Adapted from standard open source implementations
const F4 = (Math.sqrt(5.0) - 1.0) / 4.0;
const G4 = (5.0 - Math.sqrt(5.0)) / 20.0;

const p = new Uint8Array(512);
const perm = new Uint8Array(512);
const permMod12 = new Uint8Array(512);
const grad4 = [
  0,1,1,1,0,1,1,-1,0,1,-1,1,0,1,-1,-1,
  0,-1,1,1,0,-1,1,-1,0,-1,-1,1,0,-1,-1,-1,
  1,0,1,1,1,0,1,-1,1,0,-1,1,1,0,-1,-1,
  -1,0,1,1,-1,0,1,-1,-1,0,-1,1,-1,0,-1,-1,
  1,1,0,1,1,1,0,-1,1,-1,0,1,1,-1,0,-1,
  -1,1,0,1,-1,1,0,-1,-1,-1,0,1,-1,-1,0,-1,
  1,1,1,0,1,1,-1,0,1,-1,1,0,1,-1,-1,0,
  -1,1,1,0,-1,1,-1,0,-1,-1,1,0,-1,-1,-1,0
];

// Initialize permutation table with a seed
export function initNoise(seed: number) {
  const random = mulberry32(seed);
  for (let i = 0; i < 256; i++) {
    p[i] = Math.floor(random() * 256);
  }
  for (let i = 0; i < 512; i++) {
    perm[i] = p[i & 255];
    permMod12[i] = perm[i] % 32;
  }
}

// 4D Simplex Noise
function simplex4(x: number, y: number, z: number, w: number): number {
  let n0, n1, n2, n3, n4; 

  const s = (x + y + z + w) * F4;
  const i = Math.floor(x + s);
  const j = Math.floor(y + s);
  const k = Math.floor(z + s);
  const l = Math.floor(w + s);
  const t = (i + j + k + l) * G4;
  const X0 = i - t;
  const Y0 = j - t;
  const Z0 = k - t;
  const W0 = l - t;
  const x0 = x - X0;
  const y0 = y - Y0;
  const z0 = z - Z0;
  const w0 = w - W0;

  let rankx = 0;
  let ranky = 0;
  let rankz = 0;
  let rankw = 0;

  if (x0 > y0) rankx++; else ranky++;
  if (x0 > z0) rankx++; else rankz++;
  if (x0 > w0) rankx++; else rankw++;
  if (y0 > z0) ranky++; else rankz++;
  if (y0 > w0) ranky++; else rankw++;
  if (z0 > w0) rankz++; else rankw++;

  let i1, j1, k1, l1; 
  let i2, j2, k2, l2; 
  let i3, j3, k3, l3; 

  //[i1, j1, k1, l1] = [rankx >= 3 ? 1 : 0, ranky >= 3 ? 1 : 0, rankz >= 3 ? 1 : 0, rankw >= 3 ? 1 : 0];
  i1 = rankx >= 3 ? 1 : 0; j1 = ranky >= 3 ? 1 : 0; k1 = rankz >= 3 ? 1 : 0; l1 = rankw >= 3 ? 1 : 0;
  i2 = rankx >= 2 ? 1 : 0; j2 = ranky >= 2 ? 1 : 0; k2 = rankz >= 2 ? 1 : 0; l2 = rankw >= 2 ? 1 : 0;
  i3 = rankx >= 1 ? 1 : 0; j3 = ranky >= 1 ? 1 : 0; k3 = rankz >= 1 ? 1 : 0; l3 = rankw >= 1 ? 1 : 0;

  const x1 = x0 - i1 + G4;
  const y1 = y0 - j1 + G4;
  const z1 = z0 - k1 + G4;
  const w1 = w0 - l1 + G4;
  const x2 = x0 - i2 + 2.0 * G4;
  const y2 = y0 - j2 + 2.0 * G4;
  const z2 = z0 - k2 + 2.0 * G4;
  const w2 = w0 - l2 + 2.0 * G4;
  const x3 = x0 - i3 + 3.0 * G4;
  const y3 = y0 - j3 + 3.0 * G4;
  const z3 = z0 - k3 + 3.0 * G4;
  const w3 = w0 - l3 + 3.0 * G4;
  const x4 = x0 - 1.0 + 4.0 * G4;
  const y4 = y0 - 1.0 + 4.0 * G4;
  const z4 = z0 - 1.0 + 4.0 * G4;
  const w4 = w0 - 1.0 + 4.0 * G4;

  const ii = i & 255;
  const jj = j & 255;
  const kk = k & 255;
  const ll = l & 255;

  const calculateContribution = (ix: number, iy: number, iz: number, iw: number, dx: number, dy: number, dz: number, dw: number) => {
      let t = 0.6 - dx*dx - dy*dy - dz*dz - dw*dw;
      if (t < 0) return 0;
      t *= t;
      const gi = (perm[ix+perm[iy+perm[iz+perm[iw]]]] % 32) * 4;
      return t * t * (grad4[gi]*dx + grad4[gi+1]*dy + grad4[gi+2]*dz + grad4[gi+3]*dw);
  }

  n0 = calculateContribution(ii, jj, kk, ll, x0, y0, z0, w0);
  n1 = calculateContribution(ii+i1, jj+j1, kk+k1, ll+l1, x1, y1, z1, w1);
  n2 = calculateContribution(ii+i2, jj+j2, kk+k2, ll+l2, x2, y2, z2, w2);
  n3 = calculateContribution(ii+i3, jj+j3, kk+k3, ll+l3, x3, y3, z3, w3);
  n4 = calculateContribution(ii+1, jj+1, kk+1, ll+1, x4, y4, z4, w4);

  return 27.0 * (n0 + n1 + n2 + n3 + n4);
}


// Generator Functions
// These functions return a value 0-1 for a specific pixel (x,y) in a w*h grid.
// They handle tiling internally.

export const generateSimplexTiled = (x: number, y: number, w: number, h: number, scale: number): number => {
  // Map 2D -> 4D for tiling
  const nx = x / w;
  const ny = y / h;
  
  // Multiply by scale to determine frequency
  const s = scale; 
  
  // Coordinate mapping for tiling on a torus
  const PI2 = Math.PI * 2;
  const dx = s / (2*Math.PI);
  const u = Math.cos(nx * PI2) * dx;
  const v = Math.sin(nx * PI2) * dx;
  const a = Math.cos(ny * PI2) * dx;
  const b = Math.sin(ny * PI2) * dx;

  // Normalized -1 to 1 -> 0 to 1
  return (simplex4(u, v, a, b) + 1) * 0.5;
};

// Returns a value between -1 and 1
export const getRawSimplexTiled = (x: number, y: number, w: number, h: number, scale: number): number => {
  const nx = x / w;
  const ny = y / h;
  const s = scale; 
  const PI2 = Math.PI * 2;
  const dx = s / (2*Math.PI);
  const u = Math.cos(nx * PI2) * dx;
  const v = Math.sin(nx * PI2) * dx;
  const a = Math.cos(ny * PI2) * dx;
  const b = Math.sin(ny * PI2) * dx;
  return simplex4(u, v, a, b);
};

export const generateWhiteNoise = (): number => {
    return Math.random();
}

export const generateCellularTiled = (x: number, y: number, w: number, h: number, scale: number, jitter: number, seed: number): number => {
    const random = mulberry32(seed); // Need consistent random for feature points
    
    // Grid approach for optimization
    // We only care about closest points in neighboring cells (including wrapped ones)
    const px = (x / w) * scale;
    const py = (y / h) * scale;
    
    const ix = Math.floor(px);
    const iy = Math.floor(py);
    
    let minDist = 1.0;
    
    // Check 3x3 neighbor grids
    for (let yoff = -1; yoff <= 1; yoff++) {
        for (let xoff = -1; xoff <= 1; xoff++) {
            // Neighbor cell coordinate
            let nx = ix + xoff;
            let ny = iy + yoff;
            
            // Tiled coordinate for hash/random lookup
            // Use modulo to wrap around grid
            let wrappedX = ((nx % scale) + scale) % scale;
            let wrappedY = ((ny % scale) + scale) % scale;
            
            // Get point in that cell
            // Simple hash for point position
            // We use a simple coherent noise-like hash instead of full PRNG for speed here 
            // or just a deterministic pseudo-random based on cell ID
            
            const cellSeed = seed + wrappedX * 5743 + wrappedY * 1234;
            const r = mulberry32(cellSeed);
            const pointX = (nx) + (r() * jitter);
            const pointY = (ny) + (r() * jitter);
            
            // Distance
            const dist = Math.sqrt((px - pointX)**2 + (py - pointY)**2);
            if (dist < minDist) {
                minDist = dist;
            }
        }
    }
    
    // Invert so cells are white, borders black usually looks better, or vice versa
    // Worley noise is usually just the distance.
    // Clamp 0-1
    return Math.min(1.0, minDist);
}