import React, { useState, useRef, useEffect } from 'react';
import { useSavedContent } from '../contexts/SavedContentContext';
import { Spinner } from './common/Spinner';
import { Icon } from './common/Icon';

export const VideoEditor: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [videoSrc, setVideoSrc] = useState<string | null>(null);
    const [duration, setDuration] = useState<number>(0);
    
    const [trimStart, setTrimStart] = useState<number>(0);
    const [trimEnd, setTrimEnd] = useState<number>(0);
    const [textOverlay, setTextOverlay] = useState('');
    const [filter, setFilter] = useState('none');
    
    const [isLoading, setIsLoading] = useState(false);
    const [processedVideoUrl, setProcessedVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [notification, setNotification] = useState<string | null>(null);
    const [hasSavedProject, setHasSavedProject] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const { saveItem } = useSavedContent();
    
    useEffect(() => {
        if (localStorage.getItem('videoEditorProject')) {
            setHasSavedProject(true);
        }
    }, []);

    useEffect(() => {
        const video = videoRef.current;
        if (video && videoSrc) {
            const handleLoadedMetadata = () => {
                const videoDuration = video.duration;
                setDuration(videoDuration);
                // Only set trimEnd if it hasn't been loaded from a project
                if (trimEnd === 0 || trimEnd > videoDuration) {
                    setTrimEnd(videoDuration);
                }
            };
            video.addEventListener('loadedmetadata', handleLoadedMetadata);
            return () => {
                video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            };
        }
    }, [videoSrc, trimEnd]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && selectedFile.type.startsWith('video/')) {
            setFile(selectedFile);
            const url = URL.createObjectURL(selectedFile);
            setVideoSrc(url);
            setProcessedVideoUrl(null);
            setError(null);
            setTrimStart(0);
            setTextOverlay('');
            setFilter('none');
        } else {
            setError('Please select a valid video file.');
        }
    };

    const handleShowNotification = (message: string) => {
        setNotification(message);
        setTimeout(() => {
            setNotification(null);
        }, 3000);
    };
    
    const handleSaveProject = () => {
        if (!file) {
            setError("Please upload a video before saving the project.");
            return;
        }
        const projectData = {
            fileName: file.name,
            fileType: file.type,
            trimStart,
            trimEnd,
            textOverlay,
            filter,
            duration,
        };
        localStorage.setItem('videoEditorProject', JSON.stringify(projectData));
        setHasSavedProject(true);
        handleShowNotification('Project saved successfully!');
    };

    const handleLoadProject = () => {
        const savedProjectJSON = localStorage.getItem('videoEditorProject');
        if (savedProjectJSON) {
            const savedProject = JSON.parse(savedProjectJSON);
            
            const tempInput = document.createElement('input');
            tempInput.type = 'file';
            tempInput.accept = 'video/*';
            tempInput.onchange = (e) => {
                const target = e.target as HTMLInputElement;
                const selectedFile = target.files?.[0];

                if (selectedFile && selectedFile.name === savedProject.fileName && selectedFile.type === savedProject.fileType) {
                    setFile(selectedFile);
                    const url = URL.createObjectURL(selectedFile);
                    setVideoSrc(url);
                    setProcessedVideoUrl(null);
                    setError(null);
                    setTrimStart(savedProject.trimStart);
                    setTrimEnd(savedProject.trimEnd);
                    setTextOverlay(savedProject.textOverlay);
                    setFilter(savedProject.filter);
                    handleShowNotification('Project loaded!');
                } else if (selectedFile) {
                    setError(`Incorrect file. Please select "${savedProject.fileName}".`);
                }
            };
            tempInput.click();

        } else {
            setError("No saved project found.");
        }
    };
    
    const handleClearProject = () => {
        localStorage.removeItem('videoEditorProject');
        setHasSavedProject(false);
        handleShowNotification('Saved project cleared.');
    };
    
    const handleTrimStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value);
        if (value < trimEnd) {
            setTrimStart(value);
        }
    };

    const handleTrimEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value);
        if (value > trimStart) {
            setTrimEnd(value);
        }
    };

    const handleProcessVideo = async () => {
        if (!videoRef.current || !canvasRef.current || !file) return;

        setIsLoading(true);
        setError(null);
        setProcessedVideoUrl(null);

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            setError("Could not get canvas context.");
            setIsLoading(false);
            return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const stream = canvas.captureStream(30);
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            setProcessedVideoUrl(url);
            setIsLoading(false);
            video.muted = false;
        };
        
        recorder.start();
        video.currentTime = trimStart;
        video.muted = true;
        await video.play();

        let animationFrameId: number;

        const drawFrame = () => {
            if (video.currentTime >= trimEnd || video.paused) {
                if (recorder.state === "recording") recorder.stop();
                video.pause();
                cancelAnimationFrame(animationFrameId);
                return;
            }
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.filter = filter;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            if (textOverlay) {
                ctx.filter = 'none';
                ctx.fillStyle = 'white';
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 2;
                ctx.font = `${Math.max(20, canvas.height / 20)}px Arial`;
                ctx.textAlign = 'center';
                const x = canvas.width / 2;
                const y = canvas.height * 0.9;
                ctx.strokeText(textOverlay, x, y);
                ctx.fillText(textOverlay, x, y);
            }

            animationFrameId = requestAnimationFrame(drawFrame);
        };
        
        animationFrameId = requestAnimationFrame(drawFrame);
    };
    
    const handleSave = () => {
        if (processedVideoUrl) {
            saveItem({
                type: 'video',
                content: processedVideoUrl,
                prompt: `Edited Video: trim=[${trimStart.toFixed(1)}-${trimEnd.toFixed(1)}s], filter=${filter}, text='${textOverlay}'`
            });
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            {notification && (
                <div className="fixed top-20 right-8 bg-red-600 text-white py-2 px-4 rounded-lg shadow-lg z-50 transition-opacity duration-300">
                    {notification}
                </div>
            )}
            <div className="flex justify-between items-center mb-6">
                 <h2 className="text-3xl font-bold text-red-400">Video Editor</h2>
                {hasSavedProject && (
                    <div className="flex items-center gap-2">
                         <button onClick={handleLoadProject} className="flex items-center gap-2 py-2 px-3 bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold rounded-lg transition">
                            <Icon name="folder-open" className="w-4 h-4" /> Load Project
                        </button>
                        <button onClick={handleClearProject} title="Clear Saved Project" className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition">
                            <Icon name="trash" className="w-5 h-5"/>
                        </button>
                    </div>
                )}
            </div>
            <p className="mb-6 text-gray-400">
                Upload a video to trim it, add a text overlay, and apply simple filters. All processing happens in your browser. You can save your project to resume editing later.
            </p>

            <div
                className="w-full p-8 mb-6 border-2 border-dashed border-gray-600 rounded-lg text-center cursor-pointer hover:border-red-500 transition"
                onClick={() => fileInputRef.current?.click()}
            >
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="video/*" className="hidden" />
                <Icon name="upload" className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                <p>{file ? `Selected: ${file.name}` : 'Click to upload a video'}</p>
            </div>

            {error && <div className="mb-4 p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-lg">{error}</div>}

            {videoSrc && (
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Trim Video</h3>
                            <div className="space-y-3">
                                <div>
                                    <label htmlFor="trimStart" className="text-sm text-gray-300">Start: {trimStart.toFixed(1)}s</label>
                                    <input type="range" id="trimStart" min={0} max={duration} step={0.1} value={trimStart} onChange={handleTrimStartChange} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500" />
                                </div>
                                <div>
                                    <label htmlFor="trimEnd" className="text-sm text-gray-300">End: {trimEnd.toFixed(1)}s</label>
                                    <input type="range" id="trimEnd" min={0} max={duration} step={0.1} value={trimEnd} onChange={handleTrimEndChange} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"/>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2">Text Overlay</h3>
                            <input
                                type="text"
                                value={textOverlay}
                                onChange={(e) => setTextOverlay(e.target.value)}
                                placeholder="Add text to video (bottom center)"
                                className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500"
                            />
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2">Filter</h3>
                            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500">
                                <option value="none">None</option>
                                <option value="grayscale(100%)">Grayscale</option>
                                <option value="sepia(100%)">Sepia</option>
                                <option value="invert(100%)">Invert</option>
                                <option value="brightness(1.5)">Brighten</option>
                                <option value="contrast(2)">High Contrast</option>
                            </select>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <button onClick={handleProcessVideo} disabled={isLoading} className="flex-grow flex justify-center items-center py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition disabled:bg-red-400 disabled:cursor-not-allowed">
                               {isLoading ? <Spinner size="sm" /> : 'Apply Edits'}
                            </button>
                             <button onClick={handleSaveProject} title="Save Project" className="p-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition">
                                <Icon name="save" className="w-6 h-6"/>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                       <div>
                            <h3 className="text-lg font-semibold mb-2">Original Preview</h3>
                            <video ref={videoRef} src={videoSrc} controls className="w-full rounded-lg bg-black"></video>
                       </div>
                       
                        {isLoading && (
                            <div className="text-center p-4">
                                <Spinner />
                                <p className="mt-2 text-gray-400">Processing video...</p>
                            </div>
                        )}

                       {processedVideoUrl && (
                           <div>
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-lg font-semibold">Edited Result</h3>
                                    <button 
                                        onClick={handleSave}
                                        disabled={isSaved}
                                        className="flex items-center gap-2 py-1 px-3 bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold rounded-lg transition disabled:bg-green-600"
                                    >
                                        <Icon name={isSaved ? "check" : "save"} className="w-4 h-4" />
                                        {isSaved ? 'Saved!' : 'Save'}
                                    </button>
                                </div>
                                <video src={processedVideoUrl} controls loop className="w-full rounded-lg bg-black" />
                           </div>
                       )}
                    </div>
                </div>
            )}
            
            <canvas ref={canvasRef} className="hidden"></canvas>
        </div>
    );
};