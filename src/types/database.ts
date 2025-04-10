export type Memory = {
  id: string
  title: string
  description: string
  date: string
  location?: string
  category_id?: string
  image_url?: string
  created_at: string
  updated_at: string
}

export type Category = {
  id: string
  name: string
  description?: string
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      memories: {
        Row: Memory
        Insert: Omit<Memory, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Memory, 'id' | 'created_at' | 'updated_at'>>
      }
      categories: {
        Row: Category
        Insert: Omit<Category, 'id' | 'created_at'>
        Update: Partial<Omit<Category, 'id' | 'created_at'>>
      }
    }
  }
} 