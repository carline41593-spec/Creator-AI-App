import React, { useState, useRef } from 'react';
import { editImage, analyzeImage } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import { useSavedContent } from '../contexts/SavedContentContext';
import { Spinner } from './common/Spinner';
import { Icon } from './common/Icon';

export const ImageEditor: React.FC = () => {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referencePreview, setReferencePreview] = useState<string | null>(null);
  
  const [prompt, setPrompt] = useState('');
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { saveItem } = useSavedContent();

  const sourceFileInputRef = useRef<HTMLInputElement>(null);
  const referenceFileInputRef = useRef<HTMLInputElement>(null);

  const handleSourceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setSourceFile(selectedFile);
      setSourcePreview(URL.createObjectURL(selectedFile));
      setEditedImage(null);
      setError(null);
      setAnalysis(null);
    }
  };
  
  const handleReferenceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setReferenceFile(selectedFile);
      setReferencePreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleAnalyze = async () => {
      if (!sourceFile) {
          setError('Please upload a source image first.');
          return;
      }
      setIsAnalyzing(true);
      setError(null);
      setAnalysis(null);
      try {
          const base64 = await fileToBase64(sourceFile);
          const result = await analyzeImage('Describe this image for a social media post.', base64, sourceFile.type);
          setAnalysis(result);
      } catch (err) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred during analysis.');
      } finally {
          setIsAnalyzing(false);
      }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceFile || !prompt.trim()) {
      setError('Please upload a source image and enter a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setEditedImage(null);
    try {
      const sourceImg = {
        base64: await fileToBase64(sourceFile),
        mimeType: sourceFile.type,
      };

      let referenceImg;
      if (referenceFile) {
        referenceImg = {
          base64: await fileToBase64(referenceFile),
          mimeType: referenceFile.type,
        };
      }
      
      const imageUrl = await editImage(prompt, sourceImg, referenceImg);
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
        Upload a source image to edit. You can optionally add a reference image to influence the edit, like transferring a style or combining elements. You can also analyze the source image to get a description.
      </p>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div
            className="w-full p-4 border-2 border-dashed border-gray-600 rounded-lg text-center cursor-pointer hover:border-red-500 transition flex items-center justify-center min-h-[150px]"
            onClick={() => sourceFileInputRef.current?.click()}
        >
            <input type="file" ref={sourceFileInputRef} onChange={handleSourceFileChange} accept="image/*" className="hidden" />
            {sourcePreview ? (
                <img src={sourcePreview} alt="Source Preview" className="max-h-48 mx-auto rounded-md" />
            ) : (
                <div className="flex flex-col items-center">
                    <Icon name="upload" className="w-10 h-10 text-gray-500 mb-2" />
                    <p className="font-semibold">Source Image</p>
                    <p className="text-sm text-gray-400">(The image to edit)</p>
                </div>
            )}
        </div>
        <div
            className="w-full p-4 border-2 border-dashed border-gray-600 rounded-lg text-center cursor-pointer hover:border-red-500 transition flex items-center justify-center min-h-[150px]"
            onClick={() => referenceFileInputRef.current?.click()}
        >
            <input type="file" ref={referenceFileInputRef} onChange={handleReferenceFileChange} accept="image/*" className="hidden" />
            {referencePreview ? (
                <img src={referencePreview} alt="Reference Preview" className="max-h-48 mx-auto rounded-md" />
            ) : (
                <div className="flex flex-col items-center">
                    <Icon name="upload" className="w-10 h-10 text-gray-500 mb-2" />
                    <p className="font-semibold">Reference Image</p>
                    <p className="text-sm text-gray-400">(Optional style/content)</p>
                </div>
            )}
        </div>
      </div>

      {sourcePreview && (
        <>
            <div className="mt-4">
                <button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full flex justify-center items-center py-3 px-4 bg-black hover:bg-gray-800 border border-gray-600 text-white font-semibold rounded-lg transition disabled:bg-gray-900 disabled:text-gray-500 disabled:cursor-not-allowed">
                    {isAnalyzing ? <Spinner size="sm" /> : 'Analyze Source Image'}
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
                    placeholder={referenceFile ? "e.g., Apply the art style from the reference image" : "e.g., Add a futuristic neon glow to the city"}
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