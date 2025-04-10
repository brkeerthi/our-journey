export interface MediaItem {
  id: number;
  memory_id: number;
  url: string;
  type: 'image' | 'video';
  created_at: string;
}

export interface Memory {
  id: number;
  created_at: string;
  title: string;
  description: string;
  date: string;
  location: string | null;
  emoji: string | null;
  media: MediaItem[];
  user_id: string;
}

export interface MemoryWithOptionalMedia extends Omit<Memory, 'media'> {
  media?: MediaItem[];
}
