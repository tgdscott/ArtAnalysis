import React, { useState, useRef, useEffect } from 'react';
import { Palette, Loader2, Download, ArrowRight, History, Printer, FileText, Layers, CloudFog } from 'lucide-react';
import { ART_STYLES, FADING_STYLES } from '../constants';
import { generateLineArt } from '../services/geminiService';
import { exportService } from '../services/exportService';
import { SavedArtwork, PromptConfig } from '../types';

interface ArtGeneratorProps {
  onAnalyze: (artwork: SavedArtwork) => void;
  savedGallery: SavedArtwork[];
  onSaveToGallery: (artwork: SavedArtwork) => void;
}

type GeneratorMode = 'abstract' | 'fading';

const ArtGenerator: React.FC<ArtGeneratorProps> = ({ onAnalyze, savedGallery, onSaveToGallery }) => {
  const [mode, setMode] = useState<GeneratorMode>('abstract');
  const [selectedStyle, setSelectedStyle] = useState<PromptConfig>(ART_STYLES[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentArtwork, setCurrentArtwork] = useState<SavedArtwork | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Reset selection when mode changes
  useEffect(() => {
    if (mode === 'abstract') {
      setSelectedStyle(ART_STYLES[0]);
    } else {
      setSelectedStyle(FADING_STYLES[0]);
    }
  }, [mode]);

  const processAndStampImage = async (base64Raw: string, styleLabel: string) => {
    return new Promise<SavedArtwork>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        // Set canvas to match image dimensions (usually 1024x1024 from Gemini)
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw the image
        ctx.drawImage(img, 0, 0);

        // Generate ID
        const uniqueId = Math.random().toString(16).substr(2, 8).toUpperCase();

        // Configure Text
        const fontSize = Math.max(12, Math.floor(img.width * 0.015)); // Scale slightly with image
        ctx.font = `500 ${fontSize}px monospace`;
        ctx.fillStyle = '#4B5563'; // Gray-600
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';

        // Draw Text (Bottom Right, padded)
        const padding = fontSize * 1.5;
        ctx.fillText(`#${uniqueId}`, canvas.width - padding, canvas.height - padding);

        // Export
        const finalBase64 = canvas.toDataURL('image/png');
        
        const newArtwork: SavedArtwork = {
          id: uniqueId,
          base64: finalBase64,
          promptLabel: styleLabel,
          timestamp: Date.now()
        };

        resolve(newArtwork);
      };
      img.onerror = reject;
      img.src = `data:image/png;base64,${base64Raw}`;
    });
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setCurrentArtwork(null);
    
    try {
      const rawBase64 = await generateLineArt(selectedStyle.prompt);
      const artwork = await processAndStampImage(rawBase64, selectedStyle.label);
      setCurrentArtwork(artwork);
      onSaveToGallery(artwork);
    } catch (error) {
      alert("Failed to generate image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const activeStyles = mode === 'abstract' ? ART_STYLES : FADING_STYLES;

  return (
    <div className="animate-fade-in space-y-8">
      
      {/* Hidden Canvas for Processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Mode Switcher */}
      <div className="flex justify-center">
        <div className="bg-gray-100 p-1.5 rounded-xl inline-flex space-x-1">
          <button
            onClick={() => setMode('abstract')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'abstract' ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Layers size={16} /> Abstract Projection
          </button>
          <button
            onClick={() => setMode('fading')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'fading' ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <CloudFog size={16} /> Fading Reality
          </button>
        </div>
      </div>

      {/* Style Selection Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {activeStyles.map((style) => (
          <button
            key={style.id}
            onClick={() => setSelectedStyle(style)}
            className={`
              relative p-4 rounded-xl text-left transition-all duration-200 border-2
              ${selectedStyle.id === style.id 
                ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200 ring-offset-2' 
                : 'border-gray-200 bg-white hover:border-indigo-200 hover:bg-gray-50'
              }
            `}
          >
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center mb-3
              ${selectedStyle.id === style.id ? 'bg-indigo-200 text-indigo-700' : 'bg-gray-100 text-gray-500'}
            `}>
              {mode === 'abstract' ? <Palette size={16} /> : <CloudFog size={16} />}
            </div>
            <h4 className="font-bold text-gray-800 text-sm mb-1">{style.label}</h4>
            <p className="text-xs text-gray-500 leading-tight line-clamp-2">{style.description}</p>
          </button>
        ))}
      </div>

      {/* Generator Area */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8 min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))] -z-10"></div>
        
        {isGenerating ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800">Constructing {selectedStyle.label}</h3>
            <p className="text-gray-500 mt-2">The AI is creating a unique projective surface...</p>
          </div>
        ) : currentArtwork ? (
          <div className="w-full max-w-4xl flex flex-col md:flex-row gap-8 items-center animate-fade-in-up">
            <div className="relative group rounded-xl overflow-hidden shadow-lg border-8 border-white bg-white w-full md:w-1/2">
               <img src={currentArtwork.base64} alt="Generated Art" className="w-full h-auto" />
               <div className="absolute bottom-3 right-3 bg-white/90 px-2 py-0.5 rounded text-[10px] font-mono text-gray-500 shadow-sm backdrop-blur-sm border border-gray-200">
                  ID: #{currentArtwork.id}
               </div>
            </div>
            
            <div className="flex flex-col gap-4 w-full md:w-1/2">
              <div className="mb-4">
                <h3 className="text-2xl font-bold text-gray-800">Creation Complete</h3>
                <p className="text-gray-500">ID: <span className="font-mono text-indigo-600 bg-indigo-50 px-2 py-1 rounded">#{currentArtwork.id}</span></p>
              </div>
              
              <button 
                onClick={() => onAnalyze(currentArtwork)}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl transition-all flex items-center justify-center gap-2 group"
              >
                Analyze This Image <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              
              <div className="grid grid-cols-2 gap-3">
                 <button 
                   onClick={() => exportService.printImage(currentArtwork.base64)}
                   className="py-3 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
                 >
                   <Printer size={18} /> Print Sheet
                 </button>
                 <button 
                   onClick={() => exportService.generatePDF(currentArtwork.base64, currentArtwork.id)}
                   className="py-3 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
                 >
                   <FileText size={18} /> Export PDF
                 </button>
                 <button 
                   onClick={() => {
                     const link = document.createElement('a');
                     link.download = `projective_art_${currentArtwork.id}.png`;
                     link.href = currentArtwork.base64;
                     link.click();
                   }}
                   className="py-3 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
                 >
                   <Download size={18} /> Download
                 </button>
                 <button 
                   onClick={handleGenerate}
                   className="py-3 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
                 >
                   Generate New
                 </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
              {mode === 'abstract' ? <Layers className="w-10 h-10 text-indigo-400" /> : <CloudFog className="w-10 h-10 text-indigo-400" />}
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Create Projective Art</h3>
            <p className="text-gray-500 mb-8">
              Generate a unique, psychologically ambiguous coloring page using standard FEATS protocols.
            </p>
            <button 
              onClick={handleGenerate}
              className="px-8 py-4 bg-indigo-600 text-white rounded-full font-bold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl hover:-translate-y-1 transition-all"
            >
              Generate {selectedStyle.label}
            </button>
          </div>
        )}
      </div>

      {/* Internal Gallery */}
      {savedGallery.length > 0 && (
        <div className="border-t border-gray-200 pt-8">
           <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
             <History size={18} className="text-indigo-500" /> Session Gallery
           </h3>
           <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
             {savedGallery.map((art) => (
               <div 
                 key={art.id} 
                 onClick={() => {
                   setCurrentArtwork(art);
                   if (!isGenerating) setCurrentArtwork(art);
                 }}
                 className={`
                   relative flex-shrink-0 w-32 cursor-pointer group rounded-lg overflow-hidden border-2 transition-all
                   ${currentArtwork?.id === art.id ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200 hover:border-indigo-300'}
                 `}
               >
                 <img src={art.base64} alt={art.id} className="w-full h-32 object-cover" />
                 <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                 <div className="absolute bottom-0 left-0 right-0 bg-white/90 text-[10px] p-1 text-center font-mono text-gray-600 truncate">
                   #{art.id}
                 </div>
               </div>
             ))}
           </div>
        </div>
      )}

    </div>
  );
};

export default ArtGenerator;
