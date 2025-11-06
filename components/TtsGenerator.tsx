import React, { useState, useRef, useEffect } from 'react';
import { generateSpeech, analyzeVoiceStyle } from '../services/geminiService';
import { decode, decodeAudioData } from '../utils/audioUtils';
import { fileToBase64 } from '../utils/fileUtils';
import { useSavedContent } from '../contexts/SavedContentContext';
import { Spinner } from './common/Spinner';
import { Icon } from './common/Icon';

export const TtsGenerator: React.FC = () => {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isScriptSaved, setIsScriptSaved] = useState(false);
  
  const [voiceSample, setVoiceSample] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedStyle, setAnalyzedStyle] = useState<string | null>(null);
  
  const { saveItem } = useSavedContent();

  const audioContextRef = useRef<AudioContext | null>(null);
  const voiceFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    return () => {
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }
    }
  }, []);
  
  const playAudio = async (base64Audio: string) => {
    if (!audioContextRef.current) return;
    
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    const decodedData = decode(base64Audio);
    const audioBuffer = await decodeAudioData(decodedData, audioContextRef.current, 24000, 1);
    
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    source.start();

    const blob = new Blob([decodedData], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    setAudioUrl(url);
  }

  const handleSaveScript = () => {
      if(text) {
          saveItem({ type: 'text', content: text, prompt: 'Text-to-Speech Script' });
          setIsScriptSaved(true);
          setTimeout(() => setIsScriptSaved(false), 2000);
      }
  }
  
  const handleVoiceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith('audio/')) {
        setVoiceSample(selectedFile);
        setAnalyzedStyle(null);
        setError(null);
    } else if (selectedFile) {
        setError("Please select a valid audio file (e.g., MP3, WAV).");
        setVoiceSample(null);
    }
  };

  const handleAnalyzeVoice = async () => {
    if (!voiceSample) {
        setError("Please upload an audio sample first.");
        return;
    }
    setIsAnalyzing(true);
    setError(null);
    setAnalyzedStyle(null);
    try {
        const base64 = await fileToBase64(voiceSample);
        const style = await analyzeVoiceStyle(base64, voiceSample.type);
        setAnalyzedStyle(style);
    } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred during analysis.');
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setError('Please enter some text.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setAudioUrl(null);
    try {
      const base64Audio = await generateSpeech(text, analyzedStyle);
      await playAudio(base64Audio);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-red-400">Text-to-Speech Studio</h2>
      <p className="mb-6 text-gray-400">
        Generate high-quality voiceovers for your videos or podcasts. Type your script, and let the AI create a natural-sounding audio track.
      </p>
      
      <div className="mb-6 p-4 bg-gray-800 border border-gray-700 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-red-400">Personalize Voice (Experimental)</h3>
          <p className="text-sm text-gray-400 mb-3">Upload a short audio clip of a voice, and the AI will analyze its style to influence the generated speech.</p>
          <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                  type="button"
                  onClick={() => voiceFileInputRef.current?.click()}
                  className="w-full sm:w-auto flex-grow py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition truncate"
              >
                  <Icon name="upload" className="w-5 h-5 mr-2 inline-block" />
                  {voiceSample ? voiceSample.name : 'Upload Voice Sample'}
              </button>
              <input type="file" ref={voiceFileInputRef} onChange={handleVoiceFileChange} accept="audio/*" className="hidden" />
              <button
                  type="button"
                  onClick={handleAnalyzeVoice}
                  disabled={!voiceSample || isAnalyzing}
                  className="w-full sm:w-auto flex justify-center items-center py-2 px-4 bg-black hover:bg-gray-800 border border-gray-600 text-white font-semibold rounded-lg transition disabled:bg-gray-900 disabled:text-gray-500"
              >
                  {isAnalyzing ? <Spinner size="sm" /> : 'Analyze Voice Style'}
              </button>
          </div>
          {analyzedStyle && (
              <div className="mt-3 text-sm text-green-400 bg-green-900/50 p-2 rounded-md">
                  <strong>Detected Style:</strong> {analyzedStyle}
                  <p className="text-xs text-green-300">This style will be used for the next audio generation.</p>
              </div>
          )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="tts-text" className="block text-sm font-medium text-gray-300 mb-2">
            Text to Convert
          </label>
          <textarea
            id="tts-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter your script here..."
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
            rows={6}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center items-center py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition disabled:bg-red-400 disabled:cursor-not-allowed"
        >
          {isLoading ? <Spinner size="sm" /> : 'Generate Audio'}
        </button>
      </form>

      {error && <div className="mt-4 p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-lg">{error}</div>}
      
      {isLoading && <div className="text-center mt-4"><p>Generating audio...</p></div>}

      {audioUrl && (
        <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Generated Audio</h3>
                 <button
                    onClick={handleSaveScript}
                    disabled={isScriptSaved}
                    className="flex items-center gap-2 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition disabled:bg-green-600"
                >
                    <Icon name={isScriptSaved ? "check" : "save"} className="w-5 h-5" />
                    {isScriptSaved ? 'Saved!' : 'Save Script'}
                </button>
            </div>
          <audio controls src={audioUrl} className="w-full">
            Your browser does not support the audio element.
          </audio>
        </div>
      )}
    </div>
  );
};