import React, { useEffect, useState } from 'react';
import { AnalysisRecord, SavedArtwork } from '../types';
import { storageService } from '../services/storageService';
import { User, Calendar, MessageCircle, Layers, Grid, List } from 'lucide-react';
import { exportService } from '../services/exportService';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'submissions' | 'library'>('submissions');
  const [records, setRecords] = useState<AnalysisRecord[]>([]);
  const [library, setLibrary] = useState<SavedArtwork[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [historyData, galleryData] = await Promise.all([
          storageService.getHistory(),
          storageService.getGallery()
        ]);
        setRecords(historyData);
        setLibrary(galleryData);
      } catch (error) {
        console.error("Failed to load admin data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="text-center py-20 text-gray-500">Loading administrative data...</div>;

  return (
    <div className="animate-fade-in pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Admin Dashboard</h2>
          <p className="text-slate-500">Overview of user submissions and template library.</p>
        </div>
        
        {/* Stats */}
        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 rounded-lg shadow border border-gray-200 text-center min-w-[100px]">
             <span className="text-2xl font-bold text-indigo-600 block">{records.length}</span>
             <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Submissions</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg shadow border border-gray-200 text-center min-w-[100px]">
             <span className="text-2xl font-bold text-purple-600 block">{library.length}</span>
             <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Templates</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('submissions')}
          className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 ${
            activeTab === 'submissions' 
            ? 'bg-slate-800 text-white shadow-md' 
            : 'bg-white text-slate-600 hover:bg-gray-50'
          }`}
        >
          <List size={16} /> User Submissions
        </button>
        <button
          onClick={() => setActiveTab('library')}
          className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 ${
            activeTab === 'library' 
            ? 'bg-slate-800 text-white shadow-md' 
            : 'bg-white text-slate-600 hover:bg-gray-50'
          }`}
        >
          <Grid size={16} /> Template Library
        </button>
      </div>

      {/* TAB: SUBMISSIONS */}
      {activeTab === 'submissions' && (
        <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Artwork</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Self-Reported Emotion</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Snapshot</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                     <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                             {record.userName ? record.userName.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div className="text-sm font-medium text-gray-900">{record.userName || "Anonymous"}</div>
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-16 w-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex-shrink-0 group relative">
                          <img className="h-full w-full object-cover" src={record.imageUrl} alt="" />
                          <a href={record.imageUrl} target="_blank" className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        {record.artworkId && (
                          <div className="ml-4">
                             <div className="text-[10px] uppercase text-gray-400 font-bold mb-1">Based on Template</div>
                             <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200">
                               #{record.artworkId}
                             </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.userEmotion ? (
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                             <span className="text-sm font-bold text-indigo-900">{record.userEmotion.primary}</span>
                             <span className="text-gray-300">/</span>
                             <span className="text-sm font-medium text-gray-700">{record.userEmotion.secondary}</span>
                          </div>
                          {record.userEmotion.tertiary && record.userEmotion.tertiary !== "None" && (
                             <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-pink-50 text-pink-700 border border-pink-100">
                               {record.userEmotion.tertiary}
                             </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm italic">Not recorded</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700 line-clamp-2 max-w-xs italic border-l-2 border-indigo-200 pl-3">
                        "{record.result.personalitySnapshot}"
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(record.timestamp).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {new Date(record.timestamp).toLocaleTimeString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: ART LIBRARY */}
      {activeTab === 'library' && (
        <div>
           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {library.map((art) => (
                <div key={art.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                   <div className="aspect-square bg-gray-50 relative group">
                      <img src={art.base64} className="w-full h-full object-contain p-4 mix-blend-multiply" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors"></div>
                   </div>
                   <div className="p-3 border-t border-gray-100">
                      <div className="flex justify-between items-center mb-1">
                         <span className="font-mono text-xs font-bold text-slate-500">#{art.id}</span>
                         <span className="text-[10px] text-gray-400">{new Date(art.timestamp).toLocaleDateString()}</span>
                      </div>
                      <div className="font-medium text-sm text-gray-800 truncate mb-3">{art.promptLabel}</div>
                      
                      <button 
                         onClick={() => exportService.printImage(art.base64)}
                         className="w-full py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded hover:bg-indigo-100 transition-colors"
                      >
                         Print / Download
                      </button>
                   </div>
                </div>
              ))}
           </div>
           {library.length === 0 && (
              <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                 <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                 <h3 className="text-lg font-medium text-gray-900">Library is Empty</h3>
                 <p className="text-gray-500">Go to "Generate Page" to create and save new templates.</p>
              </div>
           )}
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
