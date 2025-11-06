import React, { useState, useRef } from 'react';
import { getFastResponse, getAdvancedResponse, getGroundedResponse, analyzeImage } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import { GroundingChunk } from '../types';
import { useSavedContent } from '../contexts/SavedContentContext';
import { Spinner } from './common/Spinner';
import { Icon } from './common/Icon';

type AnalysisType = 'fast' | 'advanced' | 'grounded';

export const ContentAnalyzer: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [analysisType, setAnalysisType] = useState<AnalysisType>('fast');
  const [result, setResult] = useState<string | null>(null);
  const [sources, setSources] = useState<GroundingChunk[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const { saveItem } = useSavedContent();

  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null); // For image previews
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setResult(null);
    setError(null);
    setSources([]);

    if (selectedFile.type.startsWith('image/')) {
      setFilePreview(URL.createObjectURL(selectedFile));
      setPrompt('');
    } else if (selectedFile.type.startsWith('text/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const textContent = event.target?.result as string;
        setPrompt(textContent);
      };
      reader.readAsText(selectedFile);
      setFilePreview(null);
    } else {
      setError("Unsupported file type. Please upload an image or a text file.");
      setFile(null);
      setFilePreview(null);
    }
  };

  const handleClearFile = () => {
    setFile(null);
    setFilePreview(null);
    setPrompt('');
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);
    setSources([]);

    if (file && file.type.startsWith('image/')) {
      if (!prompt.trim()) {
        setError('Please enter a prompt to ask about the image.');
        setIsLoading(false);
        return;
      }
      try {
        const base64 = await fileToBase64(file);
        const resultText = await analyzeImage(prompt, base64, file.type);
        setResult(resultText);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
      }
    } else {
      if (!prompt.trim()) {
        setError('Please enter some content or upload a file to analyze.');
        setIsLoading(false);
        return;
      }
      try {
        let response;
        switch (analysisType) {
          case 'grounded':
            response = await getGroundedResponse(prompt);
            setResult(response.text);
            setSources(response.candidates?.[0]?.groundingMetadata?.groundingChunks || []);
            break;
          case 'advanced':
            response = await getAdvancedResponse(prompt);
            setResult(response);
            break;
          case 'fast':
          default:
            response = await getFastResponse(prompt);
            setResult(response);
            break;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSave = () => {
    if (result) {
      saveItem({ type: 'text', content: result, prompt });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-red-400">Content Analyzer</h2>
      <p className="mb-6 text-gray-400">
        Upload an image or text file, or paste your content to get suggestions, check for trending topics, or perform deep analysis. Use "Fast" for quick edits, "Advanced" for in-depth feedback, and "Search Grounded" for up-to-date information.
      </p>

      <div className="mb-4">
        <div
          className="w-full p-6 border-2 border-dashed border-gray-600 rounded-lg text-center cursor-pointer hover:border-red-500 transition relative"
          onClick={() => fileInputRef.current?.click()}
        >
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,text/plain,text/markdown,.txt,.md" className="hidden" />
          {filePreview ? (
            <img src={filePreview} alt="Preview" className="max-h-40 mx-auto rounded-md" />
          ) : file ? (
            <div className="flex flex-col items-center">
              <Icon name="template" className="w-12 h-12 text-gray-500 mb-2" />
              <p className="font-semibold">{file.name}</p>
              <p className="text-sm text-gray-400">Content loaded into textarea below.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Icon name="upload" className="w-12 h-12 text-gray-500 mb-2" />
              <p>Click to upload an image or text file</p>
              <p className="text-sm text-gray-500">(Optional)</p>
            </div>
          )}
        </div>
        {file && (
          <button onClick={handleClearFile} className="mt-2 text-sm text-red-400 hover:text-red-300">
            Clear file
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-300 mb-2">
            {file?.type.startsWith('image/') ? 'Question about the image' : 'Content / Prompt'}
          </label>
          <textarea
            id="content"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              file?.type.startsWith('image/')
                ? "e.g., Write a social media caption for this image"
                : "Paste your blog post, video script, or just a question..."
            }
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
            rows={8}
            readOnly={!!file && file.type.startsWith('text/')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Analysis Type</label>
          <div className="flex gap-2">
            <button type="button" onClick={() => setAnalysisType('fast')} disabled={!!file?.type.startsWith('image/')} className={`py-2 px-4 rounded-lg border-2 ${analysisType === 'fast' ? 'border-red-500 bg-red-900/50' : 'border-gray-600 hover:border-gray-500'} disabled:opacity-50 disabled:cursor-not-allowed`}>Fast</button>
            <button type="button" onClick={() => setAnalysisType('advanced')} disabled={!!file?.type.startsWith('image/')} className={`py-2 px-4 rounded-lg border-2 ${analysisType === 'advanced' ? 'border-red-500 bg-red-900/50' : 'border-gray-600 hover:border-gray-500'} disabled:opacity-50 disabled:cursor-not-allowed`}>Advanced</button>
            <button type="button" onClick={() => setAnalysisType('grounded')} disabled={!!file?.type.startsWith('image/')} className={`py-2 px-4 rounded-lg border-2 ${analysisType === 'grounded' ? 'border-red-500 bg-red-900/50' : 'border-gray-600 hover:border-gray-500'} disabled:opacity-50 disabled:cursor-not-allowed`}>Search Grounded</button>
          </div>
           {file?.type.startsWith('image/') && <p className="text-xs text-gray-400 mt-1">Image analysis is enabled. Other analysis types are disabled.</p>}
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center items-center py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition disabled:bg-red-400 disabled:cursor-not-allowed"
        >
          {isLoading ? <Spinner size="sm" /> : 'Analyze Content'}
        </button>
      </form>

      {error && <div className="mt-4 p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-lg">{error}</div>}

      {isLoading && <div className="text-center mt-4"><Spinner /></div>}

      {result && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Analysis Result</h3>
            <button
              onClick={handleSave}
              disabled={isSaved}
              className="flex items-center gap-2 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition disabled:bg-green-600"
            >
              <Icon name={isSaved ? "check" : "save"} className="w-5 h-5" />
              {isSaved ? 'Saved!' : 'Save Result'}
            </button>
          </div>
          <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg whitespace-pre-wrap text-gray-300">
            {result}
          </div>
        </div>
      )}

      {sources.length > 0 && (
        <div className="mt-6">
          <h4 className="text-lg font-semibold mb-2">Sources</h4>
          <ul className="list-disc list-inside space-y-1">
            {sources.map((source, index) => source.web && (
              <li key={index}>
                <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-red-400 hover:underline">
                  {source.web.title || source.web.uri}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};