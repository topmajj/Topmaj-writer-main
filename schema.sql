-- Create templates table
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  icon TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create template_fields table for dynamic form fields
CREATE TABLE template_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  type TEXT NOT NULL, -- text, textarea, select, etc.
  placeholder TEXT,
  required BOOLEAN DEFAULT false,
  options JSONB, -- For select fields
  order_position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create generated_content table
CREATE TABLE generated_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  template_id UUID REFERENCES templates(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  form_data JSONB NOT NULL, -- Store the form inputs
  word_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert blog post templates
INSERT INTO templates (title, description, category, icon) VALUES
('Blog Post Introduction', 'Create an engaging introduction for your blog post', 'Blog Posts', 'BookText'),
('SEO Blog Post', 'Generate SEO-optimized blog content', 'Blog Posts', 'BookText'),
('Case Study', 'Create detailed case studies showcasing your success stories', 'Blog Posts', 'BookText'),
('How-To Guide', 'Step-by-step instructional content for your audience', 'Blog Posts', 'BookText');

-- Insert template fields for Blog Post Introduction
INSERT INTO template_fields (template_id, name, label, type, placeholder, required, order_position) VALUES
((SELECT id FROM templates WHERE title = 'Blog Post Introduction'), 'topic', 'Blog Topic', 'text', 'Enter the main topic of your blog post', true, 1),
((SELECT id FROM templates WHERE title = 'Blog Post Introduction'), 'audience', 'Target Audience', 'text', 'Who is your target audience?', true, 2),
((SELECT id FROM templates WHERE title = 'Blog Post Introduction'), 'tone', 'Tone of Voice', 'select', 'Select the tone for your content', true, 3),
((SELECT id FROM templates WHERE title = 'Blog Post Introduction'), 'keyPoints', 'Key Points', 'textarea', 'List the key points you want to cover (optional)', false, 4);

-- Insert template fields for SEO Blog Post
INSERT INTO template_fields (template_id, name, label, type, placeholder, required, order_position) VALUES
((SELECT id FROM templates WHERE title = 'SEO Blog Post'), 'keyword', 'Primary Keyword', 'text', 'Enter your main SEO keyword', true, 1),
((SELECT id FROM templates WHERE title = 'SEO Blog Post'), 'secondaryKeywords', 'Secondary Keywords', 'text', 'Enter secondary keywords separated by commas', false, 2),
((SELECT id FROM templates WHERE title = 'SEO Blog Post'), 'topic', 'Blog Topic', 'text', 'What is your blog post about?', true, 3),
((SELECT id FROM templates WHERE title = 'SEO Blog Post'), 'audience', 'Target Audience', 'text', 'Who is your target audience?', true, 4),
((SELECT id FROM templates WHERE title = 'SEO Blog Post'), 'wordCount', 'Word Count', 'select', 'Select desired word count', true, 5),
((SELECT id FROM templates WHERE title = 'SEO Blog Post'), 'outline', 'Content Outline', 'textarea', 'Provide an outline or key points (optional)', false, 6);

-- Insert template fields for Case Study
INSERT INTO template_fields (template_id, name, label, type, placeholder, required, order_position) VALUES
((SELECT id FROM templates WHERE title = 'Case Study'), 'clientName', 'Client/Company Name', 'text', 'Enter the name of the client or company', true, 1),
((SELECT id FROM templates WHERE title = 'Case Study'), 'industry', 'Industry', 'text', 'What industry is the client in?', true, 2),
((SELECT id FROM templates WHERE title = 'Case Study'), 'challenge', 'Challenge/Problem', 'textarea', 'Describe the challenge or problem faced', true, 3),
((SELECT id FROM templates WHERE title = 'Case Study'), 'solution', 'Solution Provided', 'textarea', 'Describe the solution you provided', true, 4),
((SELECT id FROM templates WHERE title = 'Case Study'), 'results', 'Results/Outcomes', 'textarea', 'Describe the results or outcomes achieved', true, 5),
((SELECT id FROM templates WHERE title = 'Case Study'), 'testimonial', 'Client Testimonial', 'textarea', 'Add a client testimonial (optional)', false, 6);

-- Insert template fields for How-To Guide
INSERT INTO template_fields (template_id, name, label, type, placeholder, required, order_position) VALUES
((SELECT id FROM templates WHERE title = 'How-To Guide'), 'topic', 'Guide Topic', 'text', 'What is your how-to guide about?', true, 1),
((SELECT id FROM templates WHERE title = 'How-To Guide'), 'audience', 'Target Audience', 'text', 'Who is your target audience?', true, 2),
((SELECT id FROM templates WHERE title = 'How-To Guide'), 'difficulty', 'Difficulty Level', 'select', 'Select the difficulty level', true, 3),
((SELECT id FROM templates WHERE title = 'How-To Guide'), 'prerequisites', 'Prerequisites', 'textarea', 'List any prerequisites or materials needed', false, 4),
((SELECT id FROM templates WHERE title = 'How-To Guide'), 'steps', 'Key Steps', 'textarea', 'Outline the main steps (one per line)', true, 5),
((SELECT id FROM templates WHERE title = 'How-To Guide'), 'tips', 'Additional Tips', 'textarea', 'Provide any additional tips or advice', false, 6);

-- Update the options for select fields
UPDATE template_fields 
SET options = '["Casual", "Professional", "Friendly", "Authoritative", "Humorous"]'::jsonb 
WHERE name = 'tone' AND label = 'Tone of Voice';

UPDATE template_fields 
SET options = '["500-750 words", "750-1000 words", "1000-1500 words", "1500-2000 words", "2000+ words"]'::jsonb 
WHERE name = 'wordCount' AND label = 'Word Count';

UPDATE template_fields 
SET options = '["Beginner", "Intermediate", "Advanced", "Expert"]'::jsonb 
WHERE name = 'difficulty' AND label = 'Difficulty Level';
