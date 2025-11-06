import React, { useState, useCallback } from 'react';
import { Sidebar, View } from './components/Sidebar';
import { ImageGenerator } from './components/ImageGenerator';
import { ImageEditor } from './components/ImageEditor';
import { AiChat } from './components/AiChat';
import { LiveAssistant } from './components/LiveAssistant';
import { ContentAnalyzer } from './components/ContentAnalyzer';
import { TtsGenerator } from './components/TtsGenerator';
import { MyLibrary } from './components/MyLibrary';
import { Icon } from './components/common/Icon';
import { SavedContentProvider } from './contexts/SavedContentContext';
import { Logo } from './components/common/Logo';
import { PromptGenerator } from './components/PromptGenerator';
import { HeadshotGenerator } from './components/HeadshotGenerator';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  const renderView = () => {
    switch (activeView) {
      case 'prompt-gen':
        return <PromptGenerator />;
      case 'image-gen':
        return <ImageGenerator />;
      case 'image-edit':
        return <ImageEditor />;
      case 'headshot-gen':
        return <HeadshotGenerator />;
      case 'live-assistant':
        return <LiveAssistant />;
      case 'content-analyzer':
        return <ContentAnalyzer />;
      case 'tts':
        return <TtsGenerator />;
      case 'library':
        return <MyLibrary />;
      case 'chat':
      default:
        return <AiChat />;
    }
  };

  const handleViewChange = useCallback((view: View) => {
    setActiveView(view);
    setIsSidebarOpen(false);
  }, []);

  return (
    <SavedContentProvider>
      <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
        <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-800 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <Sidebar activeView={activeView} setActiveView={handleViewChange} />
        </div>
        
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-4 bg-gray-800 md:hidden sticky top-0 z-20 shadow-md">
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <Icon name="logo" className="w-6 h-6 text-red-400" />
                  <span>
                    <Logo className="text-xl" />
                    <span className="text-xl"> Creator AI</span>
                  </span>
              </h1>
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700">
                  <Icon name="menu" className="w-6 h-6" />
              </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            {renderView()}
          </div>
        </main>
      </div>
    </SavedContentProvider>
  );
};

export default App;