import { GoogleGenAI, Modality, Type, GenerateContentResponse, Chat } from "@google/genai";

const getGenAI = () => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Image Generation
export const generateImage = async (prompt: string, aspectRatio: string) => {
  const ai = getGenAI();
  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt,
    config: {
      numberOfImages: 1,
      outputMimeType: 'image/jpeg',
      aspectRatio: aspectRatio as "1:1" | "3:4" | "4:3" | "9:16" | "16:9",
    },
  });
  return `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`;
};

// Image Editing
export const editImage = async (prompt: string, imageBase64: string, mimeType: string) => {
  const ai = getGenAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: imageBase64, mimeType } },
        { text: prompt },
      ],
    },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });
  const part = response.candidates?.[0]?.content?.parts?.[0];
  if (part?.inlineData) {
    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
  }
  throw new Error("Could not edit image.");
};

// AI Photoshoot Lounge Generation
export const generateHeadshots = async (
    imageBase64: string, 
    mimeType: string, 
    profession: string, 
    photoshootType: string, 
    details: string
): Promise<string[]> => {
    const ai = getGenAI();
    const imagePart = { inlineData: { data: imageBase64, mimeType } };

    // Construct a detailed base prompt from user inputs
    const basePrompt = `A ${photoshootType} photoshoot featuring the person from the uploaded image. They are a professional ${profession}. ${details}`;

    // Create 4 variations for different looks
    const personaPrompts = [
        `${basePrompt}. Cinematic lighting, focused on a confident expression, medium shot.`,
        `${basePrompt}. Full body shot in a dynamic pose, with a background that complements their profession.`,
        `${basePrompt}. Shot with a shallow depth of field, creating a soft, blurry background and highlighting the subject.`,
        `${basePrompt}. An artistic, dramatic black and white interpretation with high-contrast lighting.`
    ];

    const generationPromises = personaPrompts.map(prompt => {
        return ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    imagePart,
                    { text: `Generate a new, full image of the person from the original photo, placing them in this new scene: ${prompt}. It is crucial that the person's face is preserved and recognizable.` },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        }).then(response => {
            const part = response.candidates?.[0]?.content?.parts?.[0];
            if (part?.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
            return null;
        }).catch(error => {
            console.error(`Persona generation failed for prompt: "${prompt}"`, error);
            return null;
        });
    });

    const results = await Promise.all(generationPromises);
    return results.filter((result): result is string => result !== null);
};

// FIX: Add generateVideo function to fix import error in VideoGenerator.tsx
// Video Generation
export const generateVideo = async (
  prompt: string,
  aspectRatio: '16:9' | '9:16',
  imagePayload?: { base64: string; mimeType: string }
): Promise<string> => {
  const ai = getGenAI();
  
  const request: any = {
    model: 'veo-3.1-fast-generate-preview',
    prompt,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: aspectRatio,
    },
  };

  if (imagePayload) {
    request.image = {
      imageBytes: imagePayload.base64,
      mimeType: imagePayload.mimeType,
    };
  }

  let operation = await ai.models.generateVideos(request);

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

  if (!downloadLink) {
    throw new Error('Video generation failed or did not return a download link.');
  }

  const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to download video: ${response.statusText}. ${errorBody}`);
  }
  const videoBlob = await response.blob();
  return URL.createObjectURL(videoBlob);
};


// Image Understanding
export const analyzeImage = async (prompt: string, imageBase64: string, mimeType: string) => {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { inlineData: { data: imageBase64, mimeType } },
                { text: prompt },
            ],
        }
    });
    return response.text;
};

// AI Chat
let chatInstance: Chat | null = null;
export const getChat = () => {
    if (!chatInstance) {
        const ai = getGenAI();
        chatInstance = ai.chats.create({
            model: 'gemini-2.5-flash',
             config: {
                systemInstruction: "You are an AI assistant for The Digital Dollhouse Creator AI app, and an expert social media assistant. Help the user brainstorm ideas, write captions, and create engaging content. Mimic their style if they provide examples.",
            },
        });
    }
    return chatInstance;
};

// Content Analysis with Search Grounding
export const getGroundedResponse = async (prompt: string) => {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });
    return response;
};

// General Fast Task
export const getFastResponse = async (prompt: string) => {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: prompt,
    });
    return response.text;
};

// General Complex Task
export const getAdvancedResponse = async (prompt: string) => {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
    });
    return response.text;
};

// Voice Style Analysis
export const analyzeVoiceStyle = async (audioBase64: string, mimeType: string): Promise<string> => {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', // Multimodal model
        contents: {
            parts: [
                { inlineData: { data: audioBase64, mimeType } },
                { text: "Analyze the vocal characteristics of the speaker in this audio. Describe their pitch (e.g., low, medium, high), pace (e.g., slow, moderate, fast), and tone (e.g., energetic, calm, formal). Respond with only three descriptive words, separated by commas. For example: high-pitch, fast, energetic" },
            ],
        }
    });
    return response.text;
};

// TTS
export const generateSpeech = async (text: string, voiceStyle?: string | null): Promise<string> => {
    const ai = getGenAI();
    const promptText = voiceStyle
        ? `Generate audio for the following text using a voice with these characteristics: ${voiceStyle}. Text: "${text}"`
        : `Say this with a friendly, engaging tone: ${text}`;
        
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: promptText }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("TTS generation failed");
    }
    return base64Audio;
};


// Live Assistant
export const connectLive = (callbacks: any) => {
    const ai = getGenAI();
    return ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks,
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
            },
            systemInstruction: 'You are a friendly and helpful AI assistant for a social media creator. Keep your responses concise and conversational.',
            inputAudioTranscription: {},
            outputAudioTranscription: {},
        }
    });
}