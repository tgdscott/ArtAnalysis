import { analyzeArtwork } from "./vision";
import { analyzeImage as analyzeImageGemini } from "./geminiService";
import { AnalysisResult, CVMetrics } from "../types";

export const analysisService = {
  /**
   * Orchestrates the analysis process:
   * 1. Runs local Computer Vision (OpenCV) to get hard data on color/space.
   * 2. Constructs a data-rich prompt.
   * 3. Calls Gemini for the psychological synthesis.
   * 
   * @param base64 The colored image
   * @param mimeType Mime type
   * @param userEmotion Self-reported emotion
   * @param templateBase64 (Optional) The original blank template. If provided, allows for precise "Rebellion" calculation (subtraction).
   */
  processArtwork: async (
    base64: string, 
    mimeType: string,
    userEmotion?: { primary: string; secondary: string; tertiary?: string },
    templateBase64?: string
  ): Promise<{ result: AnalysisResult; cvMetrics: CVMetrics }> => {
    
    // Step 1: Computer Vision Analysis
    console.log("Running OpenCV Analysis...");
    // Pass template if we have it for better accuracy
    const cvMetrics = await analyzeArtwork(base64, templateBase64);
    console.log("CV Data:", cvMetrics);

    // Step 2: Format Data for LLM
    const cvContext = `
    HARD DATA FROM COMPUTER VISION ALGORITHMS (Use this to validate your observations):
    
    1. SPACE UTILIZATION (FEATS: Space):
       - White Space Ratio: ${(cvMetrics.whiteSpaceRatio * 100).toFixed(1)}%
       - Interpretation Guide: >70% = High Avoidance/Low Energy. <10% = Horror Vacui/Anxiety.
       
    2. COLOR PALETTE (FEATS: Color):
       - Dominant Hues: ${cvMetrics.dominantColors.map(c => `${c.color} (${c.percentage.toFixed(0)}%)`).join(', ')}
       
    3. BOUNDARY CONTROL (FEATS: Line Fit & Mental Control):
       - Rebellion Score: ${(cvMetrics.rebellionScore * 100).toFixed(1)}% 
         (Interpretation: Low = Conscientious/Rigid. High = Impulsive/Rebellious/Low Control. >50% suggests significant coloring over lines).
       - Fill Consistency Score: ${(cvMetrics.fillConsistencyScore * 100).toFixed(0)}/100 
         (Interpretation: Higher = Smooth shading/High Control. Lower = Energetic/Chaotic scribbling).

    4. USER SELF-REPORTED EMOTION:
       - Primary: ${userEmotion?.primary || "Unknown"}
       - Secondary: ${userEmotion?.secondary || "Unknown"}
       - Tertiary: ${userEmotion?.tertiary || "N/A"}
       
    INSTRUCTIONS:
    - Compare the CV data with the user's reported emotion. 
    - Use the 'Rebellion Score' to determine if they respected the boundaries. High rebellion score must be noted as "Testing constraints" or "Free-spirited".
    - Use 'White Space Ratio' for energy levels.
    `;

    // Step 3: GenAI Analysis
    console.log("Calling Gemini...");
    const result = await analyzeImageGemini(base64, mimeType, cvContext);

    return { result, cvMetrics };
  }
};