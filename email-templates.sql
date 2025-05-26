-- Insert email templates
INSERT INTO templates (title, description, category, icon) VALUES
('Welcome Email', 'Create a warm welcome email for new subscribers', 'Email', 'FileText'),
('Newsletter', 'Craft engaging newsletter content for your audience', 'Email', 'FileText'),
('Promotional Email', 'Create compelling promotional emails for your products or services', 'Email', 'FileText');

-- Insert template fields for Welcome Email
INSERT INTO template_fields (template_id, name, label, type, placeholder, required, order_position) VALUES
((SELECT id FROM templates WHERE title = 'Welcome Email'), 'brandName', 'Brand Name', 'text', 'Enter your brand or company name', true, 1),
((SELECT id FROM templates WHERE title = 'Welcome Email'), 'audience', 'Target Audience', 'text', 'Who are your subscribers?', true, 2),
((SELECT id FROM templates WHERE title = 'Welcome Email'), 'tone', 'Tone of Voice', 'select', 'Select the tone for your email', false, 3),
((SELECT id FROM templates WHERE title = 'Welcome Email'), 'keyBenefits', 'Key Benefits', 'textarea', 'What benefits will subscribers receive?', true, 4),
((SELECT id FROM templates WHERE title = 'Welcome Email'), 'nextSteps', 'Next Steps', 'textarea', 'What should subscribers do next?', false, 5),
((SELECT id FROM templates WHERE title = 'Welcome Email'), 'signatureInfo', 'Signature Information', 'text', 'Name and title to include in the signature', false, 6);

-- Insert template fields for Newsletter
INSERT INTO template_fields (template_id, name, label, type, placeholder, required, order_position) VALUES
((SELECT id FROM templates WHERE title = 'Newsletter'), 'brandName', 'Brand Name', 'text', 'Enter your brand or company name', true, 1),
((SELECT id FROM templates WHERE title = 'Newsletter'), 'subject', 'Email Subject', 'text', 'Enter a compelling subject line', true, 2),
((SELECT id FROM templates WHERE title = 'Newsletter'), 'mainTopic', 'Main Topic', 'text', 'What is the main topic of this newsletter?', true, 3),
((SELECT id FROM templates WHERE title = 'Newsletter'), 'secondaryTopics', 'Secondary Topics', 'textarea', 'List any secondary topics to include', false, 4),
((SELECT id FROM templates WHERE title = 'Newsletter'), 'audience', 'Target Audience', 'text', 'Who are your newsletter subscribers?', true, 5),
((SELECT id FROM templates WHERE title = 'Newsletter'), 'tone', 'Tone of Voice', 'select', 'Select the tone for your newsletter', false, 6),
((SELECT id FROM templates WHERE title = 'Newsletter'), 'callToAction', 'Call to Action', 'text', 'What action do you want readers to take?', false, 7);

-- Insert template fields for Promotional Email
INSERT INTO template_fields (template_id, name, label, type, placeholder, required, order_position) VALUES
((SELECT id FROM templates WHERE title = 'Promotional Email'), 'brandName', 'Brand Name', 'text', 'Enter your brand or company name', true, 1),
((SELECT id FROM templates WHERE title = 'Promotional Email'), 'productName', 'Product/Service Name', 'text', 'What are you promoting?', true, 2),
((SELECT id FROM templates WHERE title = 'Promotional Email'), 'offer', 'Special Offer', 'text', 'Describe your special offer or discount', true, 3),
((SELECT id FROM templates WHERE title = 'Promotional Email'), 'audience', 'Target Audience', 'text', 'Who is this promotion for?', true, 4),
((SELECT id FROM templates WHERE title = 'Promotional Email'), 'keyBenefits', 'Key Benefits', 'textarea', 'List the main benefits of your product/service', true, 5),
((SELECT id FROM templates WHERE title = 'Promotional Email'), 'urgency', 'Urgency Factor', 'text', 'Why should they act now? (e.g., limited time offer)', false, 6),
((SELECT id FROM templates WHERE title = 'Promotional Email'), 'callToAction', 'Call to Action', 'text', 'What specific action do you want readers to take?', true, 7);

-- Update the options for select fields
UPDATE template_fields 
SET options = '["Friendly", "Professional", "Enthusiastic", "Formal", "Casual", "Conversational"]'::jsonb 
WHERE name = 'tone' AND template_id = (SELECT id FROM templates WHERE title = 'Welcome Email');

UPDATE template_fields 
SET options = '["Informative", "Conversational", "Professional", "Friendly", "Enthusiastic", "Authoritative"]'::jsonb 
WHERE name = 'tone' AND template_id = (SELECT id FROM templates WHERE title = 'Newsletter');
