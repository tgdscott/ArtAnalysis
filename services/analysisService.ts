import { analyzeArtwork } from "./vision";
import { analyzeImage as analyzeImageGemini } from "./geminiService";
import { AnalysisResult, CVMetrics } from "../types";

export const analysisService = {
  /**
   * Orchestrates the analysis process:
   * 1. Runs local Computer Vision (OpenCV) to get hard data on color/space.
   * 2. Constructs a data-rich prompt.
   * 3. Calls Gemini for the psychological synthesis.
   */
  processArtwork: async (
    base64: string, 
    mimeType: string,
    userEmotion?: { primary: string; secondary: string; tertiary?: string }
  ): Promise<{ result: AnalysisResult; cvMetrics: CVMetrics }> => {
    
    // Step 1: Computer Vision Analysis
    console.log("Running OpenCV Analysis...");
    const cvMetrics = await analyzeArtwork(base64);
    console.log("CV Data:", cvMetrics);

    // Step 2: Format Data for LLM
    const cvContext = `
    HARD DATA FROM COMPUTER VISION ALGORITHMS (Use this to validate your observations):
    
    1. SPACE UTILIZATION (FEATS: Space):
       - White Space Ratio: ${(cvMetrics.whiteSpaceRatio * 100).toFixed(1)}%
       - Interpretation Guide: >70% = High Avoidance/Low Energy. <10% = Horror Vacui/Anxiety.
       
    2. COLOR PALETTE (FEATS: Color):
       - Dominant Hues: ${cvMetrics.dominantColors.map(c => `${c.color} (${c.percentage.toFixed(0)}%)`).join(', ')}
       
    3. BOUNDARY CONTROL (FEATS: Line Fit):
       - Line Visibility Score: ${(cvMetrics.lineVisibilityScore * 100).toFixed(0)}/100 (Higher means black lines are preserved; lower means colored over - Rebellion).
       - Fill Consistency Score: ${(cvMetrics.fillConsistencyScore * 100).toFixed(0)}/100 (Higher means smooth shading/Control; lower means energetic scribbling).

    4. USER SELF-REPORTED EMOTION:
       - Primary: ${userEmotion?.primary || "Unknown"}
       - Secondary: ${userEmotion?.secondary || "Unknown"}
       - Tertiary: ${userEmotion?.tertiary || "N/A"}
       
    INSTRUCTIONS:
    - Compare the CV data with the user's reported emotion. Is there a mismatch? (e.g., reported "Calm" but Fill Consistency is low/scribbly).
    - Use the White Space Ratio specifically to comment on their use of the "Void".
    - Use Line Visibility to detect "Rebellion" (if Score is low, they colored over lines).
    `;

    // Step 3: GenAI Analysis
    console.log("Calling Gemini...");
    const result = await analyzeImageGemini(base64, mimeType, cvContext);

    return { result, cvMetrics };
  }
};
