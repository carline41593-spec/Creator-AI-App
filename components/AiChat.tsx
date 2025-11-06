import React, { useState, useRef, useEffect } from 'react';
import { getChat } from '../services/geminiService';
import { ChatMessage } from '../types';
import { useSavedContent } from '../contexts/SavedContentContext';
import { Spinner } from './common/Spinner';
import { Icon } from './common/Icon';

const templates = [
  {
    name: '📢 Announcement',
    description: 'Share exciting news or updates with your audience.',
    template: 'Exciting news! ✨\n\n[Your announcement here]\n\n#announcement #[YourBrand]',
  },
  {
    name: '❓ Ask a Question',
    description: 'Engage your followers with a thought-provoking question.',
    template: 'Time for a chat! 🗣️\n\n[Your question here]\n\nLet me know your thoughts in the comments! 👇',
  },
  {
    name: '🚀 Promotion',
    description: 'Promote a product, service, or upcoming event.',
    template: '🔥 BIG NEWS! 🔥\n\nOur new [Product/Service] is finally here! \n\n[Briefly describe the benefits]\n\nCheck it out now! Link in bio. 🔗\n\n#promo #[YourProduct]',
  },
  {
    name: '🎬 Behind the Scenes',
    description: 'Give your audience a sneak peek into your process or workspace.',
    template: 'A little peek behind the scenes... 👀\n\n[Describe what you\'re working on or showing]\n\nWhat do you think? Let me know!\n\n#behindthescenes #workinprogress',
  },
];


export const AiChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: 'model', text: 'Hello! Welcome to Creator Chat. How can I help you create amazing social media content today? Try selecting a template to get started!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [savedMessages, setSavedMessages] = useState<Set<string>>(new Set());
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { saveItem } = useSavedContent();

  useEffect(() => {
    chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);
  
  const handleSaveMessage = (messageText: string) => {
      saveItem({ type: 'text', content: messageText, prompt: 'From Creator Chat' });
      setSavedMessages(prev => new Set(prev).add(messageText));
  }

  const handleSelectTemplate = (template: string) => {
    setInput(template);
    setIsTemplatesModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const chat = getChat();
      const response = await chat.sendMessage({ message: input });
      const modelMessage: ChatMessage = { sender: 'model', text: response.text };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: ChatMessage = { sender: 'model', text: 'Sorry, I encountered an error. Please try again.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {isTemplatesModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
                <h3 className="text-xl font-bold text-red-400">Content Templates</h3>
                <button onClick={() => setIsTemplatesModalOpen(false)} className="p-2 text-gray-400 hover:text-white">&times;</button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              {templates.map((template) => (
                <div key={template.name} onClick={() => handleSelectTemplate(template.template)} className="p-4 bg-gray-900 rounded-lg hover:bg-gray-700 cursor-pointer transition">
                  <h4 className="font-semibold text-white">{template.name}</h4>
                  <p className="text-sm text-gray-400">{template.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <h2 className="text-3xl font-bold mb-4 text-red-400">Creator Chat</h2>
      <p className="mb-6 text-gray-400">
        Chat with your AI assistant to brainstorm ideas, write captions, or even help you develop a consistent brand voice.
      </p>
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 bg-gray-800 rounded-lg space-y-4 mb-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-lg p-3 rounded-lg ${msg.sender === 'user' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
             {msg.sender === 'model' && (
                <button 
                    onClick={() => handleSaveMessage(msg.text)} 
                    title={savedMessages.has(msg.text) ? "Saved" : "Save message"}
                    disabled={savedMessages.has(msg.text)}
                    className="p-2 text-gray-500 hover:text-white hover:bg-gray-700 rounded-full transition disabled:text-green-400 disabled:cursor-default"
                >
                    <Icon name={savedMessages.has(msg.text) ? "check" : "save"} className="w-4 h-4"/>
                </button>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-lg p-3 rounded-lg bg-gray-700 text-gray-200">
              <Spinner size="sm" />
            </div>
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <button type="button" onClick={() => setIsTemplatesModalOpen(true)} title="Use a template" className="p-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition">
            <Icon name="template" className="w-6 h-6"/>
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask for a post idea about..."
          className="flex-1 p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
        />
        <button type="submit" disabled={isLoading} className="p-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition disabled:bg-red-400">
            <Icon name="send" className="w-6 h-6"/>
        </button>
      </form>
    </div>
  );
};