
export interface ChatMessage {
  sender: 'user' | 'model';
  text: string;
  groundingChunks?: GroundingChunk[];
}

export interface GroundingChunk {
    web?: {
      uri: string;
      title: string;
    };
    maps?: {
        uri: string;
        title: string;
    }
}

export interface SavedItem {
  id: string;
  type: 'image' | 'video' | 'text';
  content: string; // data URL for image, object URL for video, raw text for text
  prompt: string; // The prompt that generated it
  createdAt: string; // ISO date string
}
