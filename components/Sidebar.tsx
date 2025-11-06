import React from 'react';
import { Icon } from './common/Icon';
import { Logo } from './common/Logo';

export type View = 'chat' | 'prompt-gen' | 'image-gen' | 'image-edit' | 'headshot-gen' | 'live-assistant' | 'content-analyzer' | 'tts' | 'library';

const navItems: { id: View; name: string; icon: string }[] = [
  { id: 'chat', name: 'Creator Chat', icon: 'chat' },
  { id: 'prompt-gen', name: 'Prompt Generator', icon: 'lightbulb' },
  { id: 'image-gen', name: 'Image Generation', icon: 'image' },
  { id: 'image-edit', name: 'Image Editing', icon: 'edit' },
  { id: 'headshot-gen', name: 'AI Photoshoot Lounge', icon: 'portrait' },
  { id: 'live-assistant', name: 'Live Assistant', icon: 'mic' },
  { id: 'content-analyzer', name: 'Content Analyzer', icon: 'analyze' },
  { id: 'tts', name: 'Text-to-Speech', icon: 'tts' },
  { id: 'library', name: 'My Library', icon: 'library' },
];

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  return (
    <div className="flex flex-col h-full bg-gray-800 text-gray-200">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Icon name="logo" className="w-8 h-8 text-red-400" />
          <span>
            <Logo className="text-2xl" />
            <span className="text-2xl"> Creator AI</span>
          </span>
        </h1>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`w-full flex items-center px-4 py-3 text-left text-sm font-medium rounded-lg transition-colors duration-200 ${
              activeView === item.id
                ? 'bg-red-600 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <Icon name={item.icon} className="w-5 h-5 mr-3" />
            {item.name}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-700 text-xs text-gray-400">
        <p>&copy; 2024 <Logo className="text-xs" /> Creator AI</p>
      </div>
    </div>
  );
};