import { CVMetrics } from "../types";

declare global {
  interface Window { cv: any; }
}

const waitForOpenCV = async (): Promise<void> => {
  return new Promise((resolve) => {
    if (window.cv && window.cv.Mat) {
      resolve();
    } else {
      const interval = setInterval(() => {
        if (window.cv && window.cv.Mat) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    }
  });
};

const loadImage = async (base64: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`;
  });
};

// Helper to convert CV hue to Name
function getHueName(h: number, s: number, v: number): string {
  // OpenCV Hue is 0-179. s,v are 0-255
  if (v < 40) return "Black";
  if (v > 230 && s < 30) return "White";
  if (s < 30) return "Gray";

  const hueDeg = h * 2;
  if (hueDeg >= 0 && hueDeg < 15) return "Red";
  if (hueDeg >= 15 && hueDeg < 45) return "Orange";
  if (hueDeg >= 45 && hueDeg < 70) return "Yellow";
  if (hueDeg >= 70 && hueDeg < 150) return "Green";
  if (hueDeg >= 150 && hueDeg < 190) return "Teal";
  if (hueDeg >= 190 && hueDeg < 260) return "Blue";
  if (hueDeg >= 260 && hueDeg < 300) return "Purple";
  if (hueDeg >= 300 && hueDeg < 340) return "Pink";
  return "Red"; 
}

export const analyzeArtwork = async (userBase64: string, templateBase64?: string): Promise<CVMetrics> => {
  await waitForOpenCV();
  const cv = window.cv;
  
  const src = cv.imread(await loadImage(userBase64));
  let template: any = null;
  if (templateBase64) {
    template = cv.imread(await loadImage(templateBase64));
    // Ensure size match. If not, resize template to src
    if (src.rows !== template.rows || src.cols !== template.cols) {
      const dsize = new cv.Size(src.cols, src.rows);
      cv.resize(template, template, dsize, 0, 0, cv.INTER_AREA);
    }
  }

  // Convert to Grayscale & HSV
  const gray = new cv.Mat();
  const hsv = new cv.Mat();
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
  cv.cvtColor(src, hsv, cv.COLOR_RGBA2RGB); 
  cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);

  const totalPixels = src.rows * src.cols;

  // --- METRIC 1: Space (White Space Ratio) ---
  const whiteMask = new cv.Mat();
  cv.threshold(gray, whiteMask, 245, 255, cv.THRESH_BINARY);
  const whitePixelCount = cv.countNonZero(whiteMask);
  const whiteSpaceRatio = whitePixelCount / totalPixels;

  // --- METRIC 2: Rebellion Score (Boundary Adherence) ---
  let rebellionScore = 0;
  let lineVisibilityScore = 0;
  const lineMask = new cv.Mat();

  if (template) {
    // === METHOD A: SUBTRACTION (If we have the template) ===
    // 1. Extract lines from Template (Black lines)
    const grayTemplate = new cv.Mat();
    cv.cvtColor(template, grayTemplate, cv.COLOR_RGBA2GRAY, 0);
    const templateLines = new cv.Mat();
    // Invert: Lines become white (255), Background black (0)
    cv.threshold(grayTemplate, templateLines, 100, 255, cv.THRESH_BINARY_INV);

    // 2. Identify User Ink (Anything dark/colored in User Image)
    const userInk = new cv.Mat();
    cv.threshold(gray, userInk, 240, 255, cv.THRESH_BINARY_INV);

    // 3. Rebellion = (User Ink) - (Template Lines)
    // Pixels that are INK but NOT LINES.
    const rebellionMask = new cv.Mat();
    cv.subtract(userInk, templateLines, rebellionMask);

    const totalInkPixels = cv.countNonZero(userInk);
    const spilloverPixels = cv.countNonZero(rebellionMask);
    
    // Normalized Score
    rebellionScore = totalInkPixels > 0 ? (spilloverPixels / totalInkPixels) : 0;
    
    // Line Visibility (Inverse proxy)
    // We check if pixels that ARE lines in template are still dark in Source
    // This is computationally heavier, so we approximate:
    lineVisibilityScore = 1 - rebellionScore; 

    grayTemplate.delete(); templateLines.delete(); userInk.delete(); rebellionMask.delete();
  } else {
    // === METHOD B: INFERENCE (If uploaded image only) ===
    // Infer lines are the darkest pixels
    cv.threshold(gray, lineMask, 60, 255, cv.THRESH_BINARY_INV);
    const blackPixelCount = cv.countNonZero(lineMask);
    
    // Standard coloring page is ~5-8% black lines.
    const expectedLineThreshold = 0.05 * totalPixels;
    lineVisibilityScore = Math.min(blackPixelCount / expectedLineThreshold, 1.0);
    
    // If line visibility is low, it implies they colored over lines -> High Rebellion
    rebellionScore = 1 - lineVisibilityScore;
  }

  // --- METRIC 3: Fill Consistency (Control) ---
  // StdDev of color in colored areas
  const notWhite = new cv.Mat();
  cv.bitwise_not(whiteMask, notWhite);
  
  // Refine colored area: Not White AND Not inferred lines
  // (We recalculate lineMask for consistency if template was used)
  const currentLines = new cv.Mat();
  cv.threshold(gray, currentLines, 60, 255, cv.THRESH_BINARY_INV);
  const notLines = new cv.Mat();
  cv.bitwise_not(currentLines, notLines);
  
  const coloredAreaMask = new cv.Mat();
  cv.bitwise_and(notWhite, notLines, coloredAreaMask);

  const mean = new cv.Mat();
  const stdDev = new cv.Mat();
  cv.meanStdDev(src, mean, stdDev, coloredAreaMask);
  
  const avgStdDev = (stdDev.data64F[0] + stdDev.data64F[1] + stdDev.data64F[2]) / 3;
  // Normalize: 0 stdDev is perfect control. 60+ is very messy.
  const fillConsistencyScore = Math.max(0, 1 - (avgStdDev / 60));

  // --- METRIC 4: Dominant Colors ---
  // Optimized Histogram via Resize
  const dominantColors: { color: string; percentage: number }[] = [];
  const colorBuckets: Record<string, number> = {};
  let validColorPixels = 0;

  const smallHsv = new cv.Mat();
  const smallMask = new cv.Mat();
  const dsize = new cv.Size(100, 100);
  cv.resize(hsv, smallHsv, dsize, 0, 0, cv.INTER_AREA);
  cv.resize(coloredAreaMask, smallMask, dsize, 0, 0, cv.INTER_NEAREST);

  // Iterate simplified data
  const smallHsvData = smallHsv.data;
  const smallMaskData = smallMask.data;
  const numPixels = smallHsv.rows * smallHsv.cols;

  // We can iterate linear array since channels are interleaved [h,s,v, h,s,v...]
  // NOTE: OpenCV.js Mat type depends on source. RGBA2RGB -> 3 channels?
  // Actually resize keeps type. RGB2HSV -> 3 channels (CV_8UC3).
  for (let i = 0; i < numPixels; i++) {
     if (smallMaskData[i] > 0) { // Mask is usually single channel
        const baseIdx = i * 3;
        const h = smallHsvData[baseIdx];
        const s = smallHsvData[baseIdx + 1];
        const v = smallHsvData[baseIdx + 2];
        
        const colorName = getHueName(h, s, v);
        colorBuckets[colorName] = (colorBuckets[colorName] || 0) + 1;
        validColorPixels++;
     }
  }

  Object.entries(colorBuckets).forEach(([color, count]) => {
    dominantColors.push({
      color,
      percentage: validColorPixels > 0 ? (count / validColorPixels) * 100 : 0
    });
  });
  dominantColors.sort((a, b) => b.percentage - a.percentage);

  // Clean up
  src.delete(); if(template) template.delete(); 
  gray.delete(); hsv.delete(); whiteMask.delete(); 
  lineMask.delete(); currentLines.delete(); notLines.delete(); 
  notWhite.delete(); coloredAreaMask.delete();
  mean.delete(); stdDev.delete(); smallHsv.delete(); smallMask.delete();

  return {
    whiteSpaceRatio,
    dominantColors: dominantColors.slice(0, 3),
    lineVisibilityScore,
    rebellionScore,
    fillConsistencyScore
  };
};