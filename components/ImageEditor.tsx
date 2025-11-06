import React, { useState, useRef } from 'react';
import { editImage, analyzeImage } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import { useSavedContent } from '../contexts/SavedContentContext';
import { Spinner } from './common/Spinner';
import { Icon } from './common/Icon';

export const ImageEditor: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { saveItem } = useSavedContent();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setEditedImage(null);
      setError(null);
      setAnalysis(null);
    }
  };

  const handleAnalyze = async () => {
      if (!file) {
          setError('Please upload an image first.');
          return;
      }
      setIsAnalyzing(true);
      setError(null);
      setAnalysis(null);
      try {
          const base64 = await fileToBase64(file);
          const result = await analyzeImage('Describe this image for a social media post.', base64, file.type);
          setAnalysis(result);
      } catch (err) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred during analysis.');
      } finally {
          setIsAnalyzing(false);
      }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !prompt.trim()) {
      setError('Please upload an image and enter a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setEditedImage(null);
    try {
      const base64 = await fileToBase64(file);
      const imageUrl = await editImage(prompt, base64, file.type);
      setEditedImage(imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (editedImage) {
        saveItem({ type: 'image', content: editedImage, prompt });
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-red-400">Image Magic Studio</h2>
      <p className="mb-6 text-gray-400">
        Upload an image and use text prompts to make edits. Try "add a retro filter", "make the sky purple", or "remove the car in the background". You can also analyze the image to get a description.
      </p>

      <div
        className="w-full p-8 border-2 border-dashed border-gray-600 rounded-lg text-center cursor-pointer hover:border-red-500 transition"
        onClick={() => fileInputRef.current?.click()}
      >
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
        {preview ? (
          <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-md" />
        ) : (
          <div className="flex flex-col items-center">
            <Icon name="upload" className="w-12 h-12 text-gray-500 mb-2" />
            <p>Click to upload an image</p>
          </div>
        )}
      </div>

      {preview && (
        <>
            <div className="mt-4">
                <button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full flex justify-center items-center py-3 px-4 bg-black hover:bg-gray-800 border border-gray-600 text-white font-semibold rounded-lg transition disabled:bg-gray-900 disabled:text-gray-500 disabled:cursor-not-allowed">
                    {isAnalyzing ? <Spinner size="sm" /> : 'Analyze Image'}
                </button>
            </div>
            {isAnalyzing && <p className="text-center mt-2 text-sm text-gray-400">Analyzing...</p>}
            {analysis && (
                <div className="mt-4 p-4 bg-gray-800 border border-gray-700 rounded-lg">
                    <h3 className="font-semibold text-red-400 mb-2">Analysis Result:</h3>
                    <p className="text-gray-300 whitespace-pre-wrap">{analysis}</p>
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                <div>
                <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">
                    Editing Prompt
                </label>
                <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., Add a futuristic neon glow to the city"
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                    rows={2}
                />
                </div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center items-center py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition disabled:bg-red-400 disabled:cursor-not-allowed"
                    >
                    {isLoading ? <Spinner size="sm" /> : 'Apply Edit'}
                </button>
            </form>
        </>
      )}

      {error && <div className="mt-4 p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-lg">{error}</div>}

      {isLoading && (
        <div className="text-center mt-4">
          <Spinner />
          <p className="mt-2 text-gray-400">Applying magic...</p>
        </div>
      )}

      {editedImage && (
        <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Edited Result</h3>
                <button
                    onClick={handleSave}
                    disabled={isSaved}
                    className="flex items-center gap-2 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition disabled:bg-green-600"
                >
                    <Icon name={isSaved ? "check" : "save"} className="w-5 h-5" />
                    {isSaved ? 'Saved!' : 'Save Edit'}
                </button>
            </div>
          <div className="bg-gray-800 p-2 rounded-lg">
            <img src={editedImage} alt="Edited" className="w-full h-auto rounded-md" />
          </div>
        </div>
      )}
    </div>
  );
};