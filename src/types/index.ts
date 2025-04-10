export interface MediaItem {
  id: string;
  memory_id: string;
  url: string;
  type: 'image' | 'video';
  created_at: string;
}

export interface Memory {
  id: string;
  title: string;
  description: string;
  date: string;
  location?: string;
  created_at: string;
  media?: MediaItem[];
}
