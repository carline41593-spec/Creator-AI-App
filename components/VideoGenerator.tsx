import React, { useState, useRef, useEffect } from 'react';
import { generateVideo } from '../services/geminiService';
import { useAistudio } from '../hooks/useAistudio';
import { fileToBase64 } from '../utils/fileUtils';
import { useSavedContent } from '../contexts/SavedContentContext';
import { Spinner } from './common/Spinner';
import { Icon } from './common/Icon';

const VEO_LOADING_MESSAGES = [
    "Warming up the digital director's chair...",
    "Choreographing pixels into motion...",
    "Rendering your cinematic masterpiece...",
    "This can take a few minutes, time for a coffee break!",
    "Polishing the final frames...",
];

export const VideoGenerator: React.FC = () => {
    const { hasKey, isLoading: isKeyLoading, selectKey, handleApiError } = useAistudio();
    const { saveItem } = useSavedContent();
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState(VEO_LOADING_MESSAGES[0]);
    const [isSaved, setIsSaved] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load state from session storage on component mount
    useEffect(() => {
        const savedStateJSON = sessionStorage.getItem('videoGeneratorState');
        if (savedStateJSON) {
            try {
                const savedState = JSON.parse(savedStateJSON);
                setPrompt(savedState.prompt || '');
                setAspectRatio(savedState.aspectRatio || '16:9');
            } catch (e) {
                console.error("Failed to parse video generator state from session storage", e);
            }
        }
    }, []); // Empty dependency array ensures this runs only once on mount

    // Save state to session storage whenever it changes
    useEffect(() => {
        const stateToSave = JSON.stringify({ prompt, aspectRatio });
        sessionStorage.setItem('videoGeneratorState', stateToSave);
    }, [prompt, aspectRatio]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
            setVideoUrl(null);
            setError(null);
        }
    };
    
    const handleSave = () => {
        if(videoUrl) {
            saveItem({ type: 'video', content: videoUrl, prompt });
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000);
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() && !file) {
            setError('Please enter a prompt or upload an image.');
            return;
        }
        
        setIsLoading(true);
        setError(null);
        setVideoUrl(null);
        
        const messageInterval = setInterval(() => {
            setLoadingMessage(VEO_LOADING_MESSAGES[Math.floor(Math.random() * VEO_LOADING_MESSAGES.length)]);
        }, 5000);

        try {
            let imagePayload;
            if (file) {
                const base64 = await fileToBase64(file);
                imagePayload = { base64, mimeType: file.type };
            }
            const url = await generateVideo(prompt, aspectRatio, imagePayload);
            setVideoUrl(url);
        } catch (err) {
            handleApiError(err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred during video generation.');
        } finally {
            setIsLoading(false);
            clearInterval(messageInterval);
        }
    };

    if (isKeyLoading) {
        return <div className="flex justify-center items-center h-full"><Spinner /></div>;
    }

    if (!hasKey) {
        return (
            <div className="max-w-xl mx-auto text-center">
                <h2 className="text-2xl font-bold mb-4">API Key Required for Video Generation</h2>
                <p className="mb-6 text-gray-400">
                    The VEO video generation model requires you to select your own API key. This is a one-time setup.
                    Please ensure your project has billing enabled.
                </p>
                <button onClick={selectKey} className="py-3 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition">
                    Select API Key
                </button>
                <p className="mt-4 text-sm text-gray-500">
                    For more information, see the{' '}
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-red-400 hover:underline">
                        billing documentation
                    </a>.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-red-400">VEO Video Generator</h2>
            <p className="mb-6 text-gray-400">
                Create short videos from a text prompt or animate an existing image. Describe a scene, choose an orientation, and watch VEO bring it to life.
            </p>
            
            <div
                className="w-full p-8 mb-6 border-2 border-dashed border-gray-600 rounded-lg text-center cursor-pointer hover:border-red-500 transition"
                onClick={() => fileInputRef.current?.click()}
            >
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                {preview ? (
                <img src={preview} alt="Starting Frame Preview" className="max-h-48 mx-auto rounded-md" />
                ) : (
                <div className="flex flex-col items-center">
                    <Icon name="upload" className="w-12 h-12 text-gray-500 mb-2" />
                    <p>Click to upload a starting image (optional)</p>
                </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">Prompt</label>
                    <textarea
                        id="prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={file ? "e.g., make the cat fly through space" : "e.g., A majestic lion waking up at sunrise"}
                        className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                        rows={3}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Aspect Ratio</label>
                    <div className="flex gap-4">
                        <button type="button" onClick={() => setAspectRatio('16:9')} className={`py-2 px-4 rounded-lg border-2 ${aspectRatio === '16:9' ? 'border-red-500 bg-red-900/50' : 'border-gray-600 hover:border-gray-500'}`}>Landscape (16:9)</button>
                        <button type="button" onClick={() => setAspectRatio('9:16')} className={`py-2 px-4 rounded-lg border-2 ${aspectRatio === '9:16' ? 'border-red-500 bg-red-900/50' : 'border-gray-600 hover:border-gray-500'}`}>Portrait (9:16)</button>
                    </div>
                </div>
                <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition disabled:bg-red-400 disabled:cursor-not-allowed">
                    {isLoading ? <Spinner size="sm" /> : 'Generate Video'}
                </button>
            </form>

            {error && <div className="mt-4 p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-lg">{error}</div>}

            {isLoading && (
                <div className="text-center mt-8">
                    <Spinner size="lg" />
                    <p className="mt-4 text-gray-300">{loadingMessage}</p>
                </div>
            )}

            {videoUrl && (
                <div className="mt-8">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold">Result</h3>
                         <button
                            onClick={handleSave}
                            disabled={isSaved}
                            className="flex items-center gap-2 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition disabled:bg-green-600"
                        >
                            <Icon name={isSaved ? "check" : "save"} className="w-5 h-5" />
                            {isSaved ? 'Saved!' : 'Save Video'}
                        </button>
                    </div>
                    <div className="bg-gray-800 p-2 rounded-lg">
                        <video src={videoUrl} controls autoPlay loop className="w-full h-auto rounded-md" />
                    </div>
                </div>
            )}
        </div>
    );
};