-- Insert Product Description template if it doesn't exist
INSERT INTO templates (title, description, category, icon)
SELECT 'Product Description', 'Create compelling product descriptions that convert', 'Ecommerce', 'ShoppingBag'
WHERE NOT EXISTS (SELECT 1 FROM templates WHERE title = 'Product Description');

-- Insert template fields for Product Description
INSERT INTO template_fields (template_id, name, label, type, placeholder, required, order_position) VALUES
((SELECT id FROM templates WHERE title = 'Product Description'), 'productName', 'Product Name', 'text', 'Enter the name of your product', true, 1),
((SELECT id FROM templates WHERE title = 'Product Description'), 'productType', 'Product Type/Category', 'text', 'What type of product is this?', true, 2),
((SELECT id FROM templates WHERE title = 'Product Description'), 'keyFeatures', 'Key Features & Benefits', 'textarea', 'List the main features and benefits of your product', false, 3),
((SELECT id FROM templates WHERE title = 'Product Description'), 'targetAudience', 'Target Audience', 'text', 'Who is this product for?', false, 4),
((SELECT id FROM templates WHERE title = 'Product Description'), 'tone', 'Tone of Voice', 'select', 'Select the tone for your content', false, 5);

-- Update the options for select fields
UPDATE template_fields 
SET options = '["Professional", "Conversational", "Enthusiastic", "Luxury", "Technical"]'::jsonb 
WHERE name = 'tone' AND template_id = (SELECT id FROM templates WHERE title = 'Product Description');

-- Update the template link in the templates table
UPDATE templates 
SET link = '/dashboard/templates/product-description' 
WHERE title = 'Product Description';
