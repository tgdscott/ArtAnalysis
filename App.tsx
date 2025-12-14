import React, { useState, useEffect } from 'react';
import { Sparkles, Brain, ScanEye, Palette, Lock, ShieldCheck, Loader2 } from 'lucide-react';
import ImageUploader from './components/ImageUploader';
import AnalysisDisplay from './components/AnalysisDisplay';
import LoadingOverlay from './components/LoadingOverlay';
import ArtGenerator from './components/ArtGenerator';
import AdminDashboard from './components/AdminDashboard';
import { analysisService } from './services/analysisService';
import { storageService } from './services/storageService';
import { AppState, AnalysisResult, UploadedImage, ViewMode, SavedArtwork } from './types';
import { useOpenCV } from './hooks/useOpenCV';

const App: React.FC = () => {
  const cvLoaded = useOpenCV();
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.ANALYZE);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  
  const [image, setImage] = useState<UploadedImage | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Internal Gallery State
  const [savedGallery, setSavedGallery] = useState<SavedArtwork[]>([]);

  // Load persistence on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const gallery = await storageService.getGallery();
        setSavedGallery(gallery);
      } catch (e) {
        console.error("Failed to load local storage data", e);
      }
    };
    loadData();
  }, []);

  const handleImageSelected = async (
    base64: string, 
    mimeType: string, 
    emotion: { primary: string, secondary: string, tertiary?: string } | undefined, 
    userName: string,
    originalTemplate?: string // Optional: The blank template if available
  ) => {
    // If coming from generator, we need to switch view mode
    setViewMode(ViewMode.ANALYZE);
    
    setImage({ base64, mimeType, previewUrl: base64 });
    setAppState(AppState.ANALYZING);
    setErrorMsg(null);

    try {
      // Use the new Analysis Service that orchestrates CV + AI
      // Pass the originalTemplate if we have it for Rebellion Score subtraction
      const { result: data, cvMetrics } = await analysisService.processArtwork(
        base64, 
        mimeType, 
        emotion,
        originalTemplate
      );
      
      setResult(data);
      setAppState(AppState.SUCCESS);

      // Save Analysis to Persistence (DB)
      await storageService.saveAnalysis({
        id: crypto.randomUUID(),
        imageUrl: base64,
        userName: userName,
        userEmotion: emotion,
        result: data,
        cvMetrics: cvMetrics, // Save the CV data too
        timestamp: Date.now()
      });

    } catch (err) {
      console.error(err);
      setAppState(AppState.ERROR);
      setErrorMsg("We couldn't analyze that image. Please try a clearer photo.");
    }
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setImage(null);
    setResult(null);
    setErrorMsg(null);
  };

  const handleArtworkFromGenerator = (artwork: SavedArtwork) => {
    // When analyzing from generator, we skip the emotion check/Name input for now.
    // KEY: We pass artwork.base64 as the *original template* because in the generator, 
    // the user downloads the blank, colors it offline, and re-uploads it? 
    // Wait, typically the user would upload a *photo* of the colored version. 
    // But if we are simulating the flow where they color digitally or we just want to analyze the blank one (test), it works.
    
    // However, usually the flow is: 
    // 1. Generate Template (Stored in Library)
    // 2. Print & Color
    // 3. Upload Photo via "Analyze Art" tab
    
    // If the user clicks "Analyze This Image" on a *Generated Blank* (in ArtGenerator), 
    // they are technically asking to analyze the blank image. 
    // The CV will report 100% White Space and 0% Rebellion.
    
    handleImageSelected(artwork.base64, 'image/png', undefined, "Generator User", artwork.base64);
  };

  const handleSaveToGallery = async (art: SavedArtwork) => {
    setSavedGallery(prev => [art, ...prev]);
    await storageService.saveArtwork(art);
  };

  // If OpenCV is not ready, block the app with a loading screen
  if (!cvLoaded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Initializing Computer Vision Engine...</h2>
        <p className="text-slate-500 text-sm mt-2">Loading OpenCV libraries for local analysis</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 flex flex-col">
      
      {/* Background decoration */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-200/30 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow w-full">
        
        {/* Header */}
        <header className="mb-10 text-center">
          <div className="inline-flex items-center justify-center space-x-2 bg-white px-4 py-1.5 rounded-full shadow-sm border border-slate-200 mb-6">
            <Sparkles size={16} className="text-indigo-500" />
            <span className="text-xs font-semibold tracking-wider uppercase text-slate-500">AI Art Therapy Assistant</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-4">
            The Projective <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              Art Analyst
            </span>
          </h1>
        </header>

        {/* Navigation Tabs (Only show if not in Admin mode) */}
        {viewMode !== ViewMode.ADMIN && (
          <div className="flex justify-center mb-10">
            <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 inline-flex">
              <button
                onClick={() => setViewMode(ViewMode.ANALYZE)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  viewMode === ViewMode.ANALYZE 
                    ? 'bg-indigo-100 text-indigo-700 shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <ScanEye size={18} /> Analyze Art
              </button>
              <button
                onClick={() => {
                  setViewMode(ViewMode.GENERATE);
                  if (appState === AppState.SUCCESS) handleReset();
                }}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  viewMode === ViewMode.GENERATE 
                    ? 'bg-indigo-100 text-indigo-700 shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <Palette size={18} /> Generate Page
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="transition-all duration-500 min-h-[400px]">
          
          {viewMode === ViewMode.ADMIN && (
             <AdminDashboard />
          )}

          {viewMode === ViewMode.GENERATE && (
            <ArtGenerator 
              onAnalyze={handleArtworkFromGenerator} 
              savedGallery={savedGallery}
              onSaveToGallery={handleSaveToGallery}
            />
          )}

          {viewMode === ViewMode.ANALYZE && (
            <>
              {appState === AppState.IDLE && (
                <div className="animate-fade-in-up">
                  <div className="text-center mb-8">
                     <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                      Upload your colored artwork below. We analyze <strong>how</strong> you colored it—not just what you drew—to reveal a unique personality snapshot.
                    </p>
                  </div>
                  <ImageUploader onImageSelected={handleImageSelected} />
                </div>
              )}

              {appState === AppState.ANALYZING && (
                <LoadingOverlay />
              )}

              {appState === AppState.SUCCESS && result && image && (
                <AnalysisDisplay 
                  result={result} 
                  imagePreview={image.previewUrl} 
                  onReset={handleReset} 
                />
              )}

              {appState === AppState.ERROR && (
                <div className="text-center py-20 animate-fade-in">
                  <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Brain className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Analysis Failed</h3>
                  <p className="text-gray-500 mb-6">{errorMsg}</p>
                  <button 
                    onClick={handleReset}
                    className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Footer with Admin Toggle */}
      <footer className="mt-auto py-8 border-t border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-sm mb-4">&copy; {new Date().getFullYear()} Projective Art Analyst. Loosely based on the Formal Elements Art Therapy Scale (FEATS).</p>
          
          <button 
            onClick={() => setViewMode(viewMode === ViewMode.ADMIN ? ViewMode.ANALYZE : ViewMode.ADMIN)}
            className="inline-flex items-center gap-2 text-xs text-slate-300 hover:text-indigo-500 transition-colors"
          >
            {viewMode === ViewMode.ADMIN ? <ShieldCheck size={12} /> : <Lock size={12} />}
            {viewMode === ViewMode.ADMIN ? "Exit Admin" : "Admin Login"}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default App;