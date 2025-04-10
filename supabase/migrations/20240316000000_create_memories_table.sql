-- Create memories table
CREATE TABLE IF NOT EXISTS public.memories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL,
    location TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow users to view their own memories"
    ON public.memories
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert their own memories"
    ON public.memories
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own memories"
    ON public.memories
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own memories"
    ON public.memories
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_memories_updated_at
    BEFORE UPDATE ON public.memories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 