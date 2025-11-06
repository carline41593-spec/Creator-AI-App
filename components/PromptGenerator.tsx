import React, { useState } from 'react';
import { getFastResponse } from '../services/geminiService';
import { Spinner } from './common/Spinner';
import { Icon } from './common/Icon';

const styles = ['Cinematic', 'Photographic', 'Anime', 'Fantasy', 'Sci-Fi', 'Cartoonish', 'Minimalist', 'Retro'];
const tones = ['Humorous', 'Epic', 'Whimsical', 'Mysterious', 'Dark', 'Serene', 'Action-packed', 'Romantic'];
const promptTypes = ['Image', 'Video'];


export const PromptGenerator: React.FC = () => {
    const [idea, setIdea] = useState('');
    const [style, setStyle] = useState('Cinematic');
    const [tone, setTone] = useState('Epic');
    const [profession, setProfession] = useState('');
    const [promptType, setPromptType] = useState('Image');
    const [generatedPrompts, setGeneratedPrompts] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!idea.trim()) {
            setError('Please enter a basic idea.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedPrompts([]);

        const aiPrompt = `Generate 5 creative and detailed prompts for an AI ${promptType} generator. The subject is a ${profession} and the core idea is: "${idea}".
The desired style is ${style} and the tone should be ${tone}.
Each prompt must be a single, continuous sentence.
Each prompt must be on a new line and should not have any numbering (e.g., no '1.' or '-').
Crucially, each prompt MUST include realistic camera and lens specifications (e.g., Shot on Sony A7 IV with a G-Master 50mm f/1.2 lens), specific camera settings (e.g., aperture f/1.8, shutter speed 1/200s, ISO 100), and a detailed description of the lighting setup (e.g., 'lit with a single large octabox for soft, dramatic light').`;
        
        try {
            const response = await getFastResponse(aiPrompt);
            const prompts = response.split('\n').filter(p => p.trim() !== '');
            setGeneratedPrompts(prompts);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCopy = (text: string, index: number) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        });
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-red-400">Prompt Idea Generator</h2>
            <p className="mb-6 text-gray-400">
                Stuck on what to create? Describe an idea, select a profession, style, and tone, and let the AI generate hyper-realistic, detailed prompts complete with camera specs to kickstart your next project.
            </p>
            <form onSubmit={handleSubmit} className="p-6 bg-gray-800 border border-gray-700 rounded-lg space-y-4">
                <div>
                    <label htmlFor="idea" className="block text-sm font-medium text-gray-300 mb-2">
                        Your Idea or Keywords
                    </label>
                    <textarea
                        id="idea"
                        value={idea}
                        onChange={(e) => setIdea(e.target.value)}
                        placeholder="e.g., a cat in a library, futuristic city at night"
                        className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                        rows={3}
                    />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="profession" className="block text-sm font-medium text-gray-300 mb-2">
                            Profession
                        </label>
                        <input
                            id="profession"
                            type="text"
                            value={profession}
                            onChange={(e) => setProfession(e.target.value)}
                            placeholder="e.g., Photographer, Astronaut, Chef"
                            className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                        />
                    </div>
                     <div>
                        <label htmlFor="promptType" className="block text-sm font-medium text-gray-300 mb-2">
                            Prompt Type
                        </label>
                        <select
                            id="promptType"
                            value={promptType}
                            onChange={(e) => setPromptType(e.target.value)}
                            className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                        >
                            {promptTypes.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="style" className="block text-sm font-medium text-gray-300 mb-2">
                            Style
                        </label>
                        <select
                            id="style"
                            value={style}
                            onChange={(e) => setStyle(e.target.value)}
                            className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                        >
                            {styles.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="tone" className="block text-sm font-medium text-gray-300 mb-2">
                            Tone
                        </label>
                        <select
                            id="tone"
                            value={tone}
                            onChange={(e) => setTone(e.target.value)}
                            className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                        >
                            {tones.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center items-center py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition disabled:bg-red-400 disabled:cursor-not-allowed"
                >
                    {isLoading ? <Spinner size="sm" /> : 'Generate Prompts'}
                </button>
            </form>
            
            {error && <div className="mt-4 p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-lg">{error}</div>}

            {isLoading && (
                <div className="text-center mt-8">
                    <Spinner />
                    <p className="mt-2 text-gray-400">Generating ideas...</p>
                </div>
            )}
            
            {generatedPrompts.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-xl font-semibold mb-4">Generated Prompts</h3>
                    <div className="space-y-4">
                        {generatedPrompts.map((prompt, index) => (
                            <div key={index} className="flex items-center gap-4 p-4 bg-gray-800 border border-gray-700 rounded-lg">
                                <p className="flex-grow text-gray-300">{prompt}</p>
                                <button onClick={() => handleCopy(prompt, index)} title="Copy prompt" className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition">
                                    {copiedIndex === index ? <span className="text-xs text-green-400">Copied!</span> : <Icon name="copy" className="w-5 h-5" />}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};