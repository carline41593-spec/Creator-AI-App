import React, { useState, useRef } from 'react';
import { generateHeadshots } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import { Spinner } from './common/Spinner';
import { Icon } from './common/Icon';

const photoshootTypes = [
    'Corporate/Business',
    'Lifestyle/Casual',
    'Fashion/Editorial',
    'Fantasy/Artistic',
    'Futuristic/Sci-Fi',
    'Vintage/Classic',
    'Fitness/Sporty',
];


export const HeadshotGenerator: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // New state for custom inputs
    const [profession, setProfession] = useState('');
    const [photoshootType, setPhotoshootType] = useState(photoshootTypes[0]);
    const [details, setDetails] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
            setGeneratedImages([]);
            setError(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setError('Please upload an image first.');
            return;
        }
        if (!profession.trim()) {
            setError('Please enter a profession.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedImages([]);
        try {
            const base64 = await fileToBase64(file);
            const images = await generateHeadshots(base64, file.type, profession, photoshootType, details);
            setGeneratedImages(images);
            if (images.length === 0) {
                setError("Sorry, we couldn't generate any images. Please try a different photo or prompt.");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-red-400">AI Photoshoot Lounge</h2>
            <p className="mb-6 text-gray-400">
                Upload a photo and describe a scene. The AI will generate custom images of the person in that new setting. For best results, use a clear, forward-facing photo.
            </p>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Column 1: Inputs */}
                <div className="lg:col-span-1 space-y-4">
                    <div
                        className="w-full p-4 border-2 border-dashed border-gray-600 rounded-lg text-center cursor-pointer hover:border-red-500 transition"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                        {preview ? (
                            <img src={preview} alt="Preview" className="max-h-40 mx-auto rounded-md" />
                        ) : (
                            <div className="flex flex-col items-center p-4">
                                <Icon name="upload" className="w-10 h-10 text-gray-500 mb-2" />
                                <p>Click to upload photo</p>
                            </div>
                        )}
                    </div>
                    <div>
                        <label htmlFor="profession" className="block text-sm font-medium text-gray-300 mb-2">Profession</label>
                        <input
                            id="profession"
                            type="text"
                            value={profession}
                            onChange={(e) => setProfession(e.target.value)}
                            placeholder="e.g., Astronaut, Chef, Musician"
                            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="photoshootType" className="block text-sm font-medium text-gray-300 mb-2">Photoshoot Type</label>
                        <select
                            id="photoshootType"
                            value={photoshootType}
                            onChange={(e) => setPhotoshootType(e.target.value)}
                            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500"
                        >
                            {photoshootTypes.map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="details" className="block text-sm font-medium text-gray-300 mb-2">Additional Details</label>
                        <textarea
                            id="details"
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            placeholder="e.g., on a neon-lit street in Tokyo, in a rustic kitchen"
                            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500"
                            rows={3}
                        />
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !file}
                        className="w-full flex justify-center items-center py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <Spinner size="sm" /> : `Generate 4 Images`}
                    </button>
                    {error && <div className="p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-lg">{error}</div>}
                </div>
                
                {/* Column 2: Results */}
                <div className="lg:col-span-2">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center h-full bg-gray-800 rounded-lg">
                            <Spinner size="lg" />
                            <p className="mt-4 text-gray-300">Generating your photoshoot... this may take a moment.</p>
                        </div>
                    )}

                    {!isLoading && generatedImages.length === 0 && (
                         <div className="flex flex-col items-center justify-center h-full bg-gray-800 rounded-lg p-8">
                            <Icon name="portrait" className="w-24 h-24 text-gray-600 mb-4" />
                            <h3 className="text-xl font-semibold">Your images will appear here</h3>
                             <p className="text-gray-400 mt-2 text-center">Upload a photo and fill out the details to get started.</p>
                        </div>
                    )}
                    
                    {generatedImages.length > 0 && (
                        <div>
                             <h3 className="text-xl font-semibold mb-4">Your Generated Photoshoot</h3>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {generatedImages.map((imageUrl, index) => (
                                    <div key={index} className="bg-gray-900 rounded-lg overflow-hidden">
                                        <img src={imageUrl} alt={`Generated image ${index + 1}`} className="w-full h-auto object-cover aspect-square" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};