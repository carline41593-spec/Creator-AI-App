import React, { useState, useRef, useEffect, useCallback } from 'react';
import { connectLive } from '../services/geminiService';
import { encode, decode, decodeAudioData } from '../utils/audioUtils';
import { Icon } from './common/Icon';
import type { LiveServerMessage, Blob } from '@google/genai';

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export const LiveAssistant: React.FC = () => {
    const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
    const [transcripts, setTranscripts] = useState<{ user: string, model: string }[]>([]);
    const [currentInterim, setCurrentInterim] = useState<{ user: string, model: string }>({ user: '', model: '' });

    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    const stopConversation = useCallback(() => {
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
            sessionPromiseRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }
        if(outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed'){
            outputAudioContextRef.current.close();
        }
        setConnectionState('disconnected');
    }, []);

    const startConversation = async () => {
        if (connectionState !== 'disconnected') return;
        setConnectionState('connecting');
        setTranscripts([]);
        setCurrentInterim({ user: '', model: '' });

        try {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            nextStartTimeRef.current = 0;
            sourcesRef.current.clear();
            const outputNode = outputAudioContextRef.current.createGain();

            sessionPromiseRef.current = connectLive({
                onopen: async () => {
                    setConnectionState('connected');
                    streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
                    const source = audioContextRef.current!.createMediaStreamSource(streamRef.current);
                    scriptProcessorRef.current = audioContextRef.current!.createScriptProcessor(4096, 1, 1);

                    scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const pcmBlob = createBlob(inputData);
                        if (sessionPromiseRef.current) {
                            sessionPromiseRef.current.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        }
                    };
                    source.connect(scriptProcessorRef.current);
                    scriptProcessorRef.current.connect(audioContextRef.current!.destination);
                },
                onmessage: async (message: LiveServerMessage) => {
                    handleMessage(message);
                },
                onerror: (e: ErrorEvent) => {
                    console.error('Live connection error:', e);
                    setConnectionState('error');
                    stopConversation();
                },
                onclose: (e: CloseEvent) => {
                    stopConversation();
                },
            });
        } catch (err) {
            console.error('Failed to start conversation:', err);
            setConnectionState('error');
        }
    };
    
    const createBlob = (data: Float32Array): Blob => {
        const l = data.length;
        const int16 = new Int16Array(l);
        for (let i = 0; i < l; i++) {
            int16[i] = data[i] * 32768;
        }
        return {
            data: encode(new Uint8Array(int16.buffer)),
            mimeType: 'audio/pcm;rate=16000',
        };
    }
    
    const handleMessage = async (message: LiveServerMessage) => {
        if (message.serverContent) {
            const { inputTranscription, outputTranscription, turnComplete } = message.serverContent;
            
            if (inputTranscription) {
                setCurrentInterim(prev => ({ ...prev, user: prev.user + inputTranscription.text }));
            }
            if (outputTranscription) {
                setCurrentInterim(prev => ({ ...prev, model: prev.model + outputTranscription.text }));
            }
            if (turnComplete) {
                setTranscripts(prev => [...prev, {user: currentInterim.user, model: currentInterim.model}]);
                setCurrentInterim({ user: '', model: '' });
            }

            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
                const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current, 24000, 1);
                const source = outputAudioContextRef.current.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputAudioContextRef.current.destination);
                source.addEventListener('ended', () => sourcesRef.current.delete(source));
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
            }
        }
    }

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            stopConversation();
        };
    }, [stopConversation]);

    return (
        <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6 text-red-400">Live AI Assistant</h2>
            <p className="mb-8 text-gray-400">
                Have a real-time conversation with your AI assistant. Perfect for hands-free brainstorming while you work.
            </p>
            <div className="flex justify-center items-center mb-8">
                {connectionState !== 'connected' ? (
                    <button
                        onClick={startConversation}
                        disabled={connectionState === 'connecting'}
                        className="flex items-center gap-3 py-4 px-8 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full transition-transform transform hover:scale-105 disabled:bg-red-400"
                    >
                        <Icon name="mic" className="w-6 h-6" />
                        {connectionState === 'connecting' ? 'Connecting...' : 'Start Conversation'}
                    </button>
                ) : (
                    <button
                        onClick={stopConversation}
                        className="flex items-center gap-3 py-4 px-8 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full transition-transform transform hover:scale-105"
                    >
                        <Icon name="stop" className="w-6 h-6" />
                        Stop Conversation
                    </button>
                )}
            </div>
            
            <div className="w-full min-h-[200px] bg-gray-800 rounded-lg p-4 text-left space-y-2">
                {connectionState === 'connected' && <div className="text-green-400 text-sm font-semibold">● Live</div>}
                {connectionState === 'error' && <div className="text-red-400 text-sm font-semibold">Connection Error. Please try again.</div>}
                
                {transcripts.map((t, i) => (
                    <div key={i}>
                        <p><strong className="text-red-400">You:</strong> {t.user}</p>
                        <p><strong className="text-gray-200">AI:</strong> {t.model}</p>
                    </div>
                ))}
                 { (currentInterim.user || currentInterim.model) &&
                    <div>
                        {currentInterim.user && <p className="text-gray-400"><strong className="text-red-400">You:</strong> {currentInterim.user}</p>}
                        {currentInterim.model && <p className="text-gray-400"><strong className="text-gray-200">AI:</strong> {currentInterim.model}</p>}
                    </div>
                 }
                 {connectionState === 'disconnected' && transcripts.length === 0 && <p className="text-gray-500">Your conversation will appear here...</p>}
            </div>
        </div>
    );
};