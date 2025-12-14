import React, { useRef, useState } from 'react';
import { Upload, Heart, ArrowRight } from 'lucide-react';
import { EMOTION_WHEEL } from '../constants';

interface ImageUploaderProps {
  onImageSelected: (base64: string, mimeType: string, emotion: { primary: string, secondary: string, tertiary?: string }) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelected }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ base64: string, type: string } | null>(null);
  
  // Emotion State
  const [primaryEmotion, setPrimaryEmotion] = useState<string | null>(null);
  const [secondaryEmotion, setSecondaryEmotion] = useState<string | null>(null);
  const [tertiaryEmotion, setTertiaryEmotion] = useState<string | null>(null);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setSelectedFile({ base64, type: file.type });
      // Reset emotion state on new file
      setPrimaryEmotion(null);
      setSecondaryEmotion(null);
      setTertiaryEmotion(null);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleFinalSubmit = () => {
    if (selectedFile && primaryEmotion && secondaryEmotion) {
      onImageSelected(
        selectedFile.base64, 
        selectedFile.type, 
        { 
          primary: primaryEmotion, 
          secondary: secondaryEmotion,
          tertiary: tertiaryEmotion || undefined 
        }
      );
    }
  };

  // Helper to get tertiary options based on current selections
  const getTertiaryOptions = () => {
    if (!primaryEmotion || !secondaryEmotion) return [];
    return EMOTION_WHEEL[primaryEmotion][secondaryEmotion] || [];
  };

  // --------------------------------------------------------
  // VIEW: Emotion Selection (After file drop)
  // --------------------------------------------------------
  if (selectedFile) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden animate-fade-in-up flex flex-col md:flex-row h-auto md:min-h-[600px]">
        
        {/* Left Col: Image Preview */}
        <div className="w-full md:w-1/3 bg-gray-50 p-6 flex flex-col border-b md:border-b-0 md:border-r border-gray-200">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Your Artwork</h3>
            <div className="relative rounded-xl overflow-hidden shadow-md mb-6 aspect-square bg-white">
               <img src={selectedFile.base64} className="w-full h-full object-cover" />
            </div>
            
            <p className="text-xs text-gray-400 mt-auto">
              Please identify the emotions you felt while creating this piece.
            </p>
            
             <button 
              onClick={() => setSelectedFile(null)} 
              className="mt-4 text-gray-400 hover:text-gray-600 font-medium text-xs text-center"
            >
              Cancel & Upload Different
            </button>
        </div>

        {/* Right Col: Emotion Wheel */}
        <div className="w-full md:w-2/3 p-8 flex flex-col">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800">Emotion Context</h3>
            <p className="text-gray-500 text-sm">Follow the wheel to identify your feelings.</p>
          </div>

          <div className="flex-grow space-y-8">
            
            {/* Level 1: Primary */}
            <div>
              <h4 className="flex items-center gap-2 text-xs font-bold text-indigo-500 uppercase tracking-wider mb-3">
                <span className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">1</span>
                Core Emotion
              </h4>
              <div className="flex flex-wrap gap-2">
                {Object.keys(EMOTION_WHEEL).map((emotion) => (
                  <button
                    key={emotion}
                    onClick={() => {
                      setPrimaryEmotion(emotion);
                      setSecondaryEmotion(null);
                      setTertiaryEmotion(null);
                    }}
                    className={`
                      px-4 py-2 rounded-lg text-sm font-medium transition-all
                      ${primaryEmotion === emotion 
                        ? 'bg-indigo-600 text-white shadow-md' 
                        : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50'}
                    `}
                  >
                    {emotion}
                  </button>
                ))}
              </div>
            </div>

            {/* Level 2: Secondary */}
            <div className={`transition-all duration-300 ${primaryEmotion ? 'opacity-100 translate-y-0' : 'opacity-30 translate-y-4 pointer-events-none'}`}>
              <h4 className="flex items-center gap-2 text-xs font-bold text-purple-500 uppercase tracking-wider mb-3">
                <span className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">2</span>
                Specific Feeling
              </h4>
              {primaryEmotion && (
                <div className="flex flex-wrap gap-2">
                  {Object.keys(EMOTION_WHEEL[primaryEmotion]).map((subEmotion) => (
                    <button
                      key={subEmotion}
                      onClick={() => {
                        setSecondaryEmotion(subEmotion);
                        setTertiaryEmotion(null);
                      }}
                      className={`
                        px-3 py-1.5 rounded-full text-sm border transition-all
                        ${secondaryEmotion === subEmotion
                          ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-purple-300 hover:bg-purple-50'}
                      `}
                    >
                      {subEmotion}
                    </button>
                  ))}
                </div>
              )}
            </div>

             {/* Level 3: Tertiary */}
            <div className={`transition-all duration-300 ${secondaryEmotion ? 'opacity-100 translate-y-0' : 'opacity-30 translate-y-4 pointer-events-none'}`}>
              <h4 className="flex items-center gap-2 text-xs font-bold text-pink-500 uppercase tracking-wider mb-3">
                <span className="w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">3</span>
                Nuance
              </h4>
              {secondaryEmotion && (
                <div className="flex flex-wrap gap-2">
                   {/* Option to stick with Secondary */}
                   <button
                      onClick={() => setTertiaryEmotion("None")} // "None" implies sticking with secondary
                      className={`
                        px-3 py-1.5 rounded-full text-sm border transition-all italic
                        ${tertiaryEmotion === "None"
                          ? 'bg-pink-600 text-white border-pink-600 shadow-md'
                          : 'bg-white border-pink-200 text-pink-600 hover:bg-pink-50'}
                      `}
                    >
                      "{secondaryEmotion}" describes me best
                    </button>
                    
                  {getTertiaryOptions().map((tEmotion) => (
                    <button
                      key={tEmotion}
                      onClick={() => setTertiaryEmotion(tEmotion)}
                      className={`
                        px-3 py-1.5 rounded-full text-sm border transition-all
                        ${tertiaryEmotion === tEmotion
                          ? 'bg-pink-600 text-white border-pink-600 shadow-md'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-pink-300 hover:bg-pink-50'}
                      `}
                    >
                      {tEmotion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
            <button
              onClick={handleFinalSubmit}
              disabled={!primaryEmotion || !secondaryEmotion || !tertiaryEmotion}
              className={`
                flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-lg shadow-lg transition-all w-full md:w-auto justify-center
                ${(primaryEmotion && secondaryEmotion && tertiaryEmotion)
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-indigo-200 hover:-translate-y-0.5'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
              `}
            >
              Analyze Artwork <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------
  // VIEW: Default Dropzone
  // --------------------------------------------------------
  return (
    <div className="w-full max-w-xl mx-auto animate-fade-in">
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-300 group
          ${isDragging 
            ? 'border-indigo-500 bg-indigo-50 scale-102 shadow-xl' 
            : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50 bg-white/50 shadow-sm'
          }
        `}
      >
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] rounded-3xl -z-10"></div>
        
        <div className={`
          w-20 h-20 mx-auto bg-indigo-100 rounded-full flex items-center justify-center mb-6 transition-transform duration-300
          ${isDragging ? 'scale-110' : 'group-hover:scale-110'}
        `}>
          {isDragging ? (
            <Upload className="w-10 h-10 text-indigo-600" />
          ) : (
            <Heart className="w-10 h-10 text-indigo-600" />
          )}
        </div>

        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          {isDragging ? 'Drop to analyze' : 'Upload your artwork'}
        </h3>
        <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
          We'll ask for your emotions, then analyze the art.
        </p>

        <button className="px-6 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 shadow-sm group-hover:bg-indigo-50 group-hover:text-indigo-700 group-hover:border-indigo-200 transition-colors">
          Select File
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};

export default ImageUploader;