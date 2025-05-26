-- Insert website copy templates
INSERT INTO templates (title, description, category, icon) VALUES
('Landing Page Copy', 'Persuasive copy for your landing pages', 'Website Copy', 'FileText'),
('About Us Page', 'Compelling company story for your website', 'Website Copy', 'FileText'),
('FAQ Page', 'Comprehensive FAQ content for your website', 'Website Copy', 'FileText');

-- Insert template fields for Landing Page Copy
INSERT INTO template_fields (template_id, name, label, type, placeholder, required, order_position) VALUES
((SELECT id FROM templates WHERE title = 'Landing Page Copy'), 'productService', 'Product/Service', 'text', 'What product or service are you promoting?', true, 1),
((SELECT id FROM templates WHERE title = 'Landing Page Copy'), 'targetAudience', 'Target Audience', 'text', 'Who is your target audience?', true, 2),
((SELECT id FROM templates WHERE title = 'Landing Page Copy'), 'mainBenefit', 'Main Benefit', 'text', 'What is the main benefit of your product/service?', true, 3),
((SELECT id FROM templates WHERE title = 'Landing Page Copy'), 'keyFeatures', 'Key Features', 'textarea', 'List the key features of your product/service (one per line)', true, 4),
((SELECT id FROM templates WHERE title = 'Landing Page Copy'), 'painPoints', 'Pain Points', 'textarea', 'What problems does your product/service solve?', false, 5),
((SELECT id FROM templates WHERE title = 'Landing Page Copy'), 'tone', 'Tone of Voice', 'select', 'Select the tone for your landing page', false, 6),
((SELECT id FROM templates WHERE title = 'Landing Page Copy'), 'callToAction', 'Call to Action', 'text', 'What action do you want visitors to take?', true, 7),
((SELECT id FROM templates WHERE title = 'Landing Page Copy'), 'includeTestimonials', 'Include Testimonials', 'select', 'Should the copy include testimonial placeholders?', false, 8);

-- Insert template fields for About Us Page
INSERT INTO template_fields (template_id, name, label, type, placeholder, required, order_position) VALUES
((SELECT id FROM templates WHERE title = 'About Us Page'), 'companyName', 'Company Name', 'text', 'What is your company name?', true, 1),
((SELECT id FROM templates WHERE title = 'About Us Page'), 'industry', 'Industry', 'text', 'What industry are you in?', true, 2),
((SELECT id FROM templates WHERE title = 'About Us Page'), 'foundingYear', 'Founding Year', 'text', 'When was your company founded?', false, 3),
((SELECT id FROM templates WHERE title = 'About Us Page'), 'mission', 'Mission Statement', 'textarea', 'What is your company''s mission?', true, 4),
((SELECT id FROM templates WHERE title = 'About Us Page'), 'vision', 'Vision Statement', 'textarea', 'What is your company''s vision?', false, 5),
((SELECT id FROM templates WHERE title = 'About Us Page'), 'values', 'Core Values', 'textarea', 'List your company''s core values (one per line)', false, 6),
((SELECT id FROM templates WHERE title = 'About Us Page'), 'achievements', 'Key Achievements', 'textarea', 'List any notable achievements or milestones', false, 7),
((SELECT id FROM templates WHERE title = 'About Us Page'), 'tone', 'Tone of Voice', 'select', 'Select the tone for your about page', false, 8),
((SELECT id FROM templates WHERE title = 'About Us Page'), 'includeTeam', 'Include Team Section', 'select', 'Should the copy include a team section?', false, 9);

-- Insert template fields for FAQ Page
INSERT INTO template_fields (template_id, name, label, type, placeholder, required, order_position) VALUES
((SELECT id FROM templates WHERE title = 'FAQ Page'), 'productService', 'Product/Service', 'text', 'What product or service is this FAQ for?', true, 1),
((SELECT id FROM templates WHERE title = 'FAQ Page'), 'industry', 'Industry', 'text', 'What industry are you in?', true, 2),
((SELECT id FROM templates WHERE title = 'FAQ Page'), 'commonQuestions', 'Common Questions', 'textarea', 'List common questions customers ask (one per line)', true, 3),
((SELECT id FROM templates WHERE title = 'FAQ Page'), 'productFeatures', 'Product Features', 'textarea', 'List key features of your product/service', false, 4),
((SELECT id FROM templates WHERE title = 'FAQ Page'), 'pricingInfo', 'Pricing Information', 'textarea', 'Provide basic pricing information', false, 5),
((SELECT id FROM templates WHERE title = 'FAQ Page'), 'supportInfo', 'Support Information', 'textarea', 'Provide information about your support process', false, 6),
((SELECT id FROM templates WHERE title = 'FAQ Page'), 'tone', 'Tone of Voice', 'select', 'Select the tone for your FAQ page', false, 7),
((SELECT id FROM templates WHERE title = 'FAQ Page'), 'faqCategories', 'FAQ Categories', 'select', 'How should FAQs be categorized?', false, 8);

-- Update the options for select fields
UPDATE template_fields 
SET options = '["Persuasive", "Professional", "Friendly", "Enthusiastic", "Authoritative", "Conversational"]'::jsonb 
WHERE name = 'tone' AND template_id = (SELECT id FROM templates WHERE title = 'Landing Page Copy');

UPDATE template_fields 
SET options = '["Professional", "Friendly", "Inspirational", "Authoritative", "Conversational", "Storytelling"]'::jsonb 
WHERE name = 'tone' AND template_id = (SELECT id FROM templates WHERE title = 'About Us Page');

UPDATE template_fields 
SET options = '["Helpful", "Professional", "Friendly", "Conversational", "Straightforward", "Detailed"]'::jsonb 
WHERE name = 'tone' AND template_id = (SELECT id FROM templates WHERE title = 'FAQ Page');

UPDATE template_fields 
SET options = '["yes", "no"]'::jsonb 
WHERE name = 'includeTestimonials';

UPDATE template_fields 
SET options = '["yes", "no"]'::jsonb 
WHERE name = 'includeTeam';

UPDATE template_fields 
SET options = '["By topic", "By product", "By user type", "No categories"]'::jsonb 
WHERE name = 'faqCategories';
