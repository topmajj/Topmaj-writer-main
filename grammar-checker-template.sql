-- Insert Grammar Checker template if it doesn't exist
INSERT INTO templates (title, description, category, icon)
SELECT 'Grammar Checker', 'Check and improve grammar, spelling, and style in your writing', 'Editing', 'Wand2'
WHERE NOT EXISTS (SELECT 1 FROM templates WHERE title = 'Grammar Checker');

-- Insert template fields for Grammar Checker
INSERT INTO template_fields (template_id, name, label, type, placeholder, required, order_position) VALUES
((SELECT id FROM templates WHERE title = 'Grammar Checker'), 'title', 'Document Title', 'text', 'Enter a title for your document', false, 1),
((SELECT id FROM templates WHERE title = 'Grammar Checker'), 'content', 'Text to Check', 'textarea', 'Paste your text here to check for grammar and style issues...', true, 2),
((SELECT id FROM templates WHERE title = 'Grammar Checker'), 'formality', 'Formality Level', 'select', 'Select the desired formality level', true, 3),
((SELECT id FROM templates WHERE title = 'Grammar Checker'), 'focusAreas', 'Focus Areas', 'text', 'Areas to focus on improving', true, 4),
((SELECT id FROM templates WHERE title = 'Grammar Checker'), 'outputFormat', 'Output Format', 'select', 'How you want to see the results', true, 5),
((SELECT id FROM templates WHERE title = 'Grammar Checker'), 'additionalInstructions', 'Additional Instructions', 'textarea', 'Any specific instructions for the grammar check', false, 6);

-- Update the options for select fields
UPDATE template_fields 
SET options = '["Formal", "Neutral", "Casual"]'::jsonb 
WHERE name = 'formality' AND template_id = (SELECT id FROM templates WHERE title = 'Grammar Checker');

UPDATE template_fields 
SET options = '["Corrected", "Highlighted", "Both"]'::jsonb 
WHERE name = 'outputFormat' AND template_id = (SELECT id FROM templates WHERE title = 'Grammar Checker');
