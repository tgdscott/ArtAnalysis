import { CVMetrics } from "../types";

// Helper to convert RGB to HSL
function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s, l];
}

// Helper to get hue name
function getHueName(h: number, s: number, l: number): string {
  if (l < 0.15) return "Black";
  if (l > 0.93) return "White"; // High lightness is white
  if (s < 0.15) return "Gray";

  if (h >= 0 && h < 15) return "Red";
  if (h >= 15 && h < 45) return "Orange";
  if (h >= 45 && h < 70) return "Yellow";
  if (h >= 70 && h < 150) return "Green";
  if (h >= 150 && h < 190) return "Teal";
  if (h >= 190 && h < 250) return "Blue";
  if (h >= 250 && h < 290) return "Purple";
  if (h >= 290 && h < 340) return "Pink";
  return "Red"; // Wrap around
}

export const analyzeImageCV = async (base64: string): Promise<CVMetrics> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        // Resize for faster processing, but keep enough detail
        const maxDim = 800;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          const ratio = Math.min(maxDim / w, maxDim / h);
          w *= ratio;
          h *= ratio;
        }
        canvas.width = w;
        canvas.height = h;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject("Could not get canvas context");
          return;
        }
        
        ctx.drawImage(img, 0, 0, w, h);
        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;
        const totalPixels = w * h;

        // 1. DYNAMIC WHITE THRESHOLDING
        // Find the brightest pixel to assume "Paper White" (to account for bad lighting)
        let maxL = 0;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const l = (Math.max(r, g, b) + Math.min(r, g, b)) / 2 / 255;
          if (l > maxL) maxL = l;
        }
        // If image is very dark, assume standard white (avoid dividing by zero)
        if (maxL < 0.5) maxL = 1.0; 
        
        const whiteThreshold = maxL * 0.90; // Pixel must be 90% as bright as the brightest pixel to be "white"

        let whitePixels = 0;
        let blackPixels = 0;
        const colorCounts: Record<string, number> = {};

        // For Consistency Calculation
        let varianceSum = 0;
        let varianceCount = 0;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          const [h, s, l] = rgbToHsl(r, g, b);

          // Count White Space
          if (l >= whiteThreshold && s < 0.2) {
             whitePixels++;
             continue; // Skip white pixels for color analysis
          }

          // Count Black Lines (FEATS: Line Visibility)
          // We assume lines are very dark and low saturation
          if (l < 0.25) {
            blackPixels++;
          }

          // Color Bucketing
          const hueName = getHueName(h, s, l);
          if (hueName !== "White" && hueName !== "Black" && hueName !== "Gray") {
             colorCounts[hueName] = (colorCounts[hueName] || 0) + 1;
          }
          
          // Simple local consistency check (comparing to neighbor)
          // Just checking pixel to the right
          if ((i / 4) % w < w - 1) {
             const r2 = data[i + 4], g2 = data[i + 5], b2 = data[i + 6];
             const diff = Math.abs(r - r2) + Math.abs(g - g2) + Math.abs(b - b2);
             // Accumulate difference for non-white/non-black regions to measure "messiness" of shading
             if (l > 0.25 && l < whiteThreshold) {
               varianceSum += diff;
               varianceCount++;
             }
          }
        }

        // --- CALCULATE METRICS ---

        // 1. White Space Ratio
        const whiteSpaceRatio = whitePixels / totalPixels;

        // 2. Dominant Colors
        const totalColorPixels = Object.values(colorCounts).reduce((a, b) => a + b, 0);
        const dominantColors = Object.entries(colorCounts)
          .map(([color, count]) => ({
            color,
            percentage: totalColorPixels > 0 ? (count / totalColorPixels) * 100 : 0
          }))
          .sort((a, b) => b.percentage - a.percentage)
          .slice(0, 3); // Top 3

        // 3. Line Visibility (Proxy for "Did they color over lines?")
        // A typical line art page has about 5-15% black pixels. 
        // If this drops significantly, they might have colored over lines. 
        // Or if it is preserved, they respected boundaries.
        // We normalize this to a score. 
        const blackRatio = blackPixels / totalPixels;
        // Heuristic: If black ratio is > 3%, lines are likely visible/respected. 
        const lineVisibilityScore = Math.min(blackRatio / 0.05, 1.0);

        // 4. Fill Consistency (Proxy for "Control")
        // Low variance = smooth shading (High Control). High variance = scribbles (Low Control).
        const avgDiff = varianceCount > 0 ? varianceSum / varianceCount : 0;
        // Normalize: avgDiff of 0 is perfect. avgDiff of 50 is very messy.
        const fillConsistencyScore = Math.max(0, 1 - (avgDiff / 50));

        resolve({
          whiteSpaceRatio,
          dominantColors,
          lineVisibilityScore,
          fillConsistencyScore
        });

      } catch (e) {
        reject(e);
      }
    };
    img.onerror = (e) => reject(e);
    img.src = `data:image/png;base64,${base64}`;
  });
};
