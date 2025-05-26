-- Insert ad templates
INSERT INTO templates (title, description, category, icon) VALUES
('Facebook Ad Copy', 'Create compelling ad copy for Facebook campaigns', 'Ads', 'FileText'),
('Google Ads Copy', 'Craft effective copy for Google search campaigns', 'Ads', 'FileText'),
('Ad Copy', 'Create versatile ad copy for various platforms', 'Ads', 'FileText');

-- Insert template fields for Facebook Ad Copy
INSERT INTO template_fields (template_id, name, label, type, placeholder, required, order_position) VALUES
((SELECT id FROM templates WHERE title = 'Facebook Ad Copy'), 'productService', 'Product/Service', 'text', 'What product or service are you advertising?', true, 1),
((SELECT id FROM templates WHERE title = 'Facebook Ad Copy'), 'targetAudience', 'Target Audience', 'text', 'Who is your target audience?', true, 2),
((SELECT id FROM templates WHERE title = 'Facebook Ad Copy'), 'primaryBenefit', 'Primary Benefit', 'text', 'What is the main benefit of your product/service?', true, 3),
((SELECT id FROM templates WHERE title = 'Facebook Ad Copy'), 'secondaryBenefits', 'Secondary Benefits', 'textarea', 'List any additional benefits', false, 4),
((SELECT id FROM templates WHERE title = 'Facebook Ad Copy'), 'tone', 'Tone of Voice', 'select', 'Select the tone for your ad', false, 5),
((SELECT id FROM templates WHERE title = 'Facebook Ad Copy'), 'offer', 'Special Offer', 'text', 'Any special offer or discount to include?', false, 6),
((SELECT id FROM templates WHERE title = 'Facebook Ad Copy'), 'callToAction', 'Call to Action', 'select', 'Select a call to action', true, 7);

-- Insert template fields for Google Ads Copy
INSERT INTO template_fields (template_id, name, label, type, placeholder, required, order_position) VALUES
((SELECT id FROM templates WHERE title = 'Google Ads Copy'), 'productService', 'Product/Service', 'text', 'What product or service are you advertising?', true, 1),
((SELECT id FROM templates WHERE title = 'Google Ads Copy'), 'targetKeywords', 'Target Keywords', 'textarea', 'Enter target keywords (one per line)', true, 2),
((SELECT id FROM templates WHERE title = 'Google Ads Copy'), 'uniqueSellingPoint', 'Unique Selling Point', 'text', 'What makes your offer unique?', true, 3),
((SELECT id FROM templates WHERE title = 'Google Ads Copy'), 'competitiveAdvantage', 'Competitive Advantage', 'text', 'How do you stand out from competitors?', false, 4),
((SELECT id FROM templates WHERE title = 'Google Ads Copy'), 'promotion', 'Promotion', 'text', 'Any special promotion to include?', false, 5),
((SELECT id FROM templates WHERE title = 'Google Ads Copy'), 'callToAction', 'Call to Action', 'select', 'Select a call to action', true, 6);

-- Insert template fields for Ad Copy
INSERT INTO template_fields (template_id, name, label, type, placeholder, required, order_position) VALUES
((SELECT id FROM templates WHERE title = 'Ad Copy'), 'platform', 'Platform', 'select', 'Select the advertising platform', true, 1),
((SELECT id FROM templates WHERE title = 'Ad Copy'), 'productService', 'Product/Service', 'text', 'What product or service are you advertising?', true, 2),
((SELECT id FROM templates WHERE title = 'Ad Copy'), 'targetAudience', 'Target Audience', 'text', 'Who is your target audience?', true, 3),
((SELECT id FROM templates WHERE title = 'Ad Copy'), 'mainBenefit', 'Main Benefit', 'text', 'What is the main benefit of your product/service?', true, 4),
((SELECT id FROM templates WHERE title = 'Ad Copy'), 'tone', 'Tone of Voice', 'select', 'Select the tone for your ad', false, 5),
((SELECT id FROM templates WHERE title = 'Ad Copy'), 'wordCount', 'Word Count', 'select', 'Select the approximate word count', false, 6),
((SELECT id FROM templates WHERE title = 'Ad Copy'), 'callToAction', 'Call to Action', 'select', 'Select a call to action', true, 7);

-- Update the options for select fields
UPDATE template_fields 
SET options = '["Persuasive", "Urgent", "Friendly", "Professional", "Humorous", "Emotional"]'::jsonb 
WHERE name = 'tone' AND template_id = (SELECT id FROM templates WHERE title = 'Facebook Ad Copy');

UPDATE template_fields 
SET options = '["Persuasive", "Professional", "Direct", "Informative", "Urgent"]'::jsonb 
WHERE name = 'tone' AND template_id = (SELECT id FROM templates WHERE title = 'Ad Copy');

UPDATE template_fields 
SET options = '["Shop Now", "Learn More", "Sign Up", "Get Started", "Contact Us", "Book Now", "Download", "Try for Free"]'::jsonb 
WHERE name = 'callToAction' AND template_id = (SELECT id FROM templates WHERE title = 'Facebook Ad Copy');

UPDATE template_fields 
SET options = '["Shop Now", "Learn More", "Sign Up", "Get Started", "Contact Us", "Book Now", "Download", "Try for Free"]'::jsonb 
WHERE name = 'callToAction' AND template_id = (SELECT id FROM templates WHERE title = 'Google Ads Copy');

UPDATE template_fields 
SET options = '["Shop Now", "Learn More", "Sign Up", "Get Started", "Contact Us", "Book Now", "Download", "Try for Free"]'::jsonb 
WHERE name = 'callToAction' AND template_id = (SELECT id FROM templates WHERE title = 'Ad Copy');

UPDATE template_fields 
SET options = '["Facebook", "Instagram", "Google", "YouTube", "LinkedIn", "Twitter/X", "TikTok", "Pinterest"]'::jsonb 
WHERE name = 'platform' AND template_id = (SELECT id FROM templates WHERE title = 'Ad Copy');

UPDATE template_fields 
SET options = '["Short (50-100 words)", "Medium (100-200 words)", "Long (200-300 words)"]'::jsonb 
WHERE name = 'wordCount' AND template_id = (SELECT id FROM templates WHERE title = 'Ad Copy');
