import React, { useState, useEffect } from 'react';
import { generateImage } from '../services/geminiService';
import { useSavedContent } from '../contexts/SavedContentContext';
import { Spinner } from './common/Spinner';
import { Icon } from './common/Icon';

export const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const { saveItem } = useSavedContent();

  // Load state from session storage on component mount
  useEffect(() => {
    const savedStateJSON = sessionStorage.getItem('imageGeneratorState');
    if (savedStateJSON) {
      try {
        const savedState = JSON.parse(savedStateJSON);
        setPrompt(savedState.prompt || '');
        setAspectRatio(savedState.aspectRatio || '1:1');
      } catch (e) {
        console.error("Failed to parse image generator state from session storage", e);
      }
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // Save state to session storage whenever it changes
  useEffect(() => {
    const stateToSave = JSON.stringify({ prompt, aspectRatio });
    sessionStorage.setItem('imageGeneratorState', stateToSave);
  }, [prompt, aspectRatio]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    try {
      const imageUrl = await generateImage(prompt, aspectRatio);
      setGeneratedImage(imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (generatedImage) {
        saveItem({ type: 'image', content: generatedImage, prompt });
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-red-400">Image Generation Studio</h2>
      <p className="mb-6 text-gray-400">
        Create stunning, high-quality images from text descriptions using Imagen-4.0. Describe what you want to see, select an aspect ratio, and let the AI bring your vision to life.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">
            Prompt
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A cinematic shot of a robot meditating on a mountain in a thunderstorm"
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
            rows={3}
          />
        </div>
        <div>
          <label htmlFor="aspectRatio" className="block text-sm font-medium text-gray-300 mb-2">
            Aspect Ratio
          </label>
          <select
            id="aspectRatio"
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value)}
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
          >
            <option value="1:1">Square (1:1)</option>
            <option value="16:9">Landscape (16:9)</option>
            <option value="9:16">Portrait (9:16)</option>
            <option value="4:3">Standard (4:3)</option>
            <option value="3:4">Tall (3:4)</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center items-center py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition disabled:bg-red-400 disabled:cursor-not-allowed"
        >
          {isLoading ? <Spinner size="sm" /> : 'Generate Image'}
        </button>
      </form>

      {error && <div className="mt-4 p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-lg">{error}</div>}

      {generatedImage && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Result</h3>
            <button
                onClick={handleSave}
                disabled={isSaved}
                className="flex items-center gap-2 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition disabled:bg-green-600"
            >
                <Icon name={isSaved ? "check" : "save"} className="w-5 h-5" />
                {isSaved ? 'Saved!' : 'Save Image'}
            </button>
          </div>
          <div className="bg-gray-800 p-2 rounded-lg">
            <img src={generatedImage} alt="Generated" className="w-full h-auto rounded-md" />
          </div>
        </div>
      )}
    </div>
  );
};