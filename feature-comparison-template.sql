-- Insert Feature Comparison template if it doesn't exist
INSERT INTO templates (title, description, category, icon)
SELECT 'Feature Comparison', 'Highlight product features and benefits against competitors', 'Ecommerce', 'BarChart2'
WHERE NOT EXISTS (SELECT 1 FROM templates WHERE title = 'Feature Comparison');

-- Insert template fields for Feature Comparison
INSERT INTO template_fields (template_id, name, label, type, placeholder, required, order_position) VALUES
((SELECT id FROM templates WHERE title = 'Feature Comparison'), 'productName', 'Your Product Name', 'text', 'e.g., UltraBoost Running Shoes', true, 1),
((SELECT id FROM templates WHERE title = 'Feature Comparison'), 'competitorProducts', 'Competitor Products', 'textarea', 'List competitor products to compare against (one per line)', true, 2),
((SELECT id FROM templates WHERE title = 'Feature Comparison'), 'keyFeatures', 'Key Features to Compare', 'textarea', 'List the main features to compare (e.g., price, durability, performance)', false, 3),
((SELECT id FROM templates WHERE title = 'Feature Comparison'), 'targetAudience', 'Target Audience', 'text', 'e.g., Runners, Athletes, Fitness Enthusiasts', false, 4),
((SELECT id FROM templates WHERE title = 'Feature Comparison'), 'comparisonStyle', 'Comparison Style', 'select', 'Select the style for your comparison', false, 5),
((SELECT id FROM templates WHERE title = 'Feature Comparison'), 'wordCount', 'Word Count', 'select', 'Select the desired length', false, 6),
((SELECT id FROM templates WHERE title = 'Feature Comparison'), 'additionalInstructions', 'Additional Instructions', 'textarea', 'Any specific requirements or information to include', false, 7);

-- Update the options for select fields
UPDATE template_fields 
SET options = '["table", "pros and cons", "detailed analysis", "bullet points", "star rating"]'::jsonb 
WHERE name = 'comparisonStyle' AND template_id = (SELECT id FROM templates WHERE title = 'Feature Comparison');

UPDATE template_fields 
SET options = '["300", "500", "800", "1000"]'::jsonb 
WHERE name = 'wordCount' AND template_id = (SELECT id FROM templates WHERE title = 'Feature Comparison');
