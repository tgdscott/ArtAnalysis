import { CVMetrics } from "../types";

declare global {
  interface Window { cv: any; }
}

// Wait for OpenCV to initialize
const waitForOpenCV = async (): Promise<void> => {
  return new Promise((resolve) => {
    if (window.cv && window.cv.Mat) {
      resolve();
    } else {
      // Poll for it
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

export const analyzeArtwork = async (base64: string): Promise<CVMetrics> => {
  await waitForOpenCV();
  const cv = window.cv;
  const imgElement = await loadImage(base64);

  // 1. Read Image
  const src = cv.imread(imgElement);
  
  // 2. Convert to Grayscale & HSV
  const gray = new cv.Mat();
  const hsv = new cv.Mat();
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
  cv.cvtColor(src, hsv, cv.COLOR_RGBA2RGB); // Convert to RGB first
  cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);

  const totalPixels = src.rows * src.cols;

  // --- METRIC 1: Space (White Space Ratio) ---
  // Threshold to find white paper (assuming > 240 is white in grayscale)
  // We can be smarter: Adaptive threshold or just high luminance check
  const whiteMask = new cv.Mat();
  cv.threshold(gray, whiteMask, 245, 255, cv.THRESH_BINARY);
  const whitePixelCount = cv.countNonZero(whiteMask);
  const whiteSpaceRatio = whitePixelCount / totalPixels;

  // --- METRIC 2: Boundary Adherence (Line Visibility / Rebellion) ---
  // Since we don't always have the source template, we infer lines from the image itself.
  // Assumption: Original lines are the darkest pixels (Intensity < 50).
  // If user colors OVER lines, those pixels become lighter (Intensity > 50) or Colored.
  
  const lineMask = new cv.Mat();
  // Strictly black lines
  cv.threshold(gray, lineMask, 60, 255, cv.THRESH_BINARY_INV);
  const blackPixelCount = cv.countNonZero(lineMask);
  
  // Heuristic: A standard coloring page is ~5-15% black lines.
  // If black pixel count drops below ~2%, they likely colored over the lines.
  // We normalize this to a 0-1 score where 1.0 is "Perfect Lines" (approx > 5% black).
  const expectedLineThreshold = 0.05 * totalPixels;
  let lineVisibilityScore = blackPixelCount / expectedLineThreshold;
  if (lineVisibilityScore > 1) lineVisibilityScore = 1;
  
  // --- METRIC 3: Fill Consistency (Control) ---
  // We look at the standard deviation of color in non-white/non-black areas.
  // Lower StdDev = More Uniform/Controlled. Higher = Messy/Scribbly.
  const inkMask = new cv.Mat();
  const lowerInk = new cv.Mat(src.rows, src.cols, src.type(), [0, 0, 0, 0]);
  const upperInk = new cv.Mat(src.rows, src.cols, src.type(), [255, 255, 255, 255]);
  
  // Create a mask for "colored" areas (Not White, Not Black)
  // Invert white mask (everything not white) AND Invert line mask (everything not black)
  const notWhite = new cv.Mat();
  const notBlack = new cv.Mat();
  cv.bitwise_not(whiteMask, notWhite);
  cv.bitwise_not(lineMask, notBlack);
  
  const coloredAreaMask = new cv.Mat();
  cv.bitwise_and(notWhite, notBlack, coloredAreaMask);
  
  // Calculate Mean and StdDev of the colored areas
  const mean = new cv.Mat();
  const stdDev = new cv.Mat();
  cv.meanStdDev(src, mean, stdDev, coloredAreaMask);
  
  // Average StdDev across R, G, B channels
  const avgStdDev = (stdDev.data64F[0] + stdDev.data64F[1] + stdDev.data64F[2]) / 3;
  // Normalize: 0 stdDev is perfect control. 60+ is very messy.
  const fillConsistencyScore = Math.max(0, 1 - (avgStdDev / 60));

  // --- METRIC 4: Dominant Colors ---
  // Simple Histogram approach on Hue channel
  // We only care about Hue where Saturation > threshold
  const dominantColors: { color: string; percentage: number }[] = [];
  const colorBuckets: Record<string, number> = {};
  let validColorPixels = 0;

  // Accessing pixel data (Heavy loop, but okay for single image on client)
  // To optimize: We could use cv.calcHist, but mapping back to names is complex without logic.
  // We'll iterate the 'hsv' Mat data for pixels in 'coloredAreaMask'.
  
  // For performance in JS, we iterate the raw data array if possible, 
  // but accessing Mat elements directly in a loop is slow in OpenCV.js.
  // Better approach: Resize image down significantly for color analysis (e.g. 100x100)
  const smallHsv = new cv.Mat();
  const smallMask = new cv.Mat();
  const dsize = new cv.Size(100, 100);
  cv.resize(hsv, smallHsv, dsize, 0, 0, cv.INTER_AREA);
  cv.resize(coloredAreaMask, smallMask, dsize, 0, 0, cv.INTER_NEAREST);

  for (let i = 0; i < smallHsv.rows; i++) {
    for (let j = 0; j < smallHsv.cols; j++) {
       // Check mask (uchar)
       if (smallMask.ucharPtr(i, j)[0] > 0) {
          const pixel = smallHsv.ucharPtr(i, j);
          const h = pixel[0] * 2; // OpenCV Hue is 0-179, we want 0-360
          const s = pixel[1];
          const v = pixel[2]; // Value (Brightness)

          let colorName = "Gray";
          if (s < 30) colorName = "Gray"; // Low Saturation
          else {
            if (h >= 0 && h < 15) colorName = "Red";
            else if (h >= 15 && h < 45) colorName = "Orange";
            else if (h >= 45 && h < 70) colorName = "Yellow";
            else if (h >= 70 && h < 150) colorName = "Green";
            else if (h >= 150 && h < 190) colorName = "Teal";
            else if (h >= 190 && h < 260) colorName = "Blue";
            else if (h >= 260 && h < 300) colorName = "Purple";
            else if (h >= 300 && h < 340) colorName = "Pink";
            else colorName = "Red";
          }
          
          colorBuckets[colorName] = (colorBuckets[colorName] || 0) + 1;
          validColorPixels++;
       }
    }
  }

  // Format Colors
  Object.entries(colorBuckets).forEach(([color, count]) => {
    dominantColors.push({
      color,
      percentage: (count / validColorPixels) * 100
    });
  });
  dominantColors.sort((a, b) => b.percentage - a.percentage);
  
  // Cleanup
  src.delete(); gray.delete(); hsv.delete(); whiteMask.delete(); 
  lineMask.delete(); notWhite.delete(); notBlack.delete(); coloredAreaMask.delete();
  mean.delete(); stdDev.delete(); smallHsv.delete(); smallMask.delete();
  lowerInk.delete(); upperInk.delete();

  return {
    whiteSpaceRatio,
    dominantColors: dominantColors.slice(0, 3),
    lineVisibilityScore,
    fillConsistencyScore
  };
};
