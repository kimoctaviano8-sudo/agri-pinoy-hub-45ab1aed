-- Create profanity_words table for storing filter words
CREATE TABLE public.profanity_words (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  word TEXT NOT NULL UNIQUE,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profanity_words ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access only
CREATE POLICY "Only admins can manage profanity words" 
ON public.profanity_words 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_profanity_words_updated_at
BEFORE UPDATE ON public.profanity_words
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default profanity words
INSERT INTO public.profanity_words (word, severity) VALUES 
('badword1', 'medium'),
('offensive', 'high'),
('inappropriate', 'medium'),
('vulgar', 'high'),
('spam', 'low');