-- Insert Twitter Thread template if it doesn't exist
INSERT INTO templates (title, description, category, icon)
SELECT 'Twitter Thread', 'Engaging multi-tweet content for Twitter/X', 'Social Media', 'MessageSquare'
WHERE NOT EXISTS (SELECT 1 FROM templates WHERE title = 'Twitter Thread');

-- Insert template fields for Twitter Thread
INSERT INTO template_fields (template_id, name, label, type, placeholder, required, order_position) VALUES
((SELECT id FROM templates WHERE title = 'Twitter Thread'), 'topic', 'Topic', 'text', 'What is your thread about?', true, 1),
((SELECT id FROM templates WHERE title = 'Twitter Thread'), 'audience', 'Target Audience', 'text', 'Who is your target audience?', true, 2),
((SELECT id FROM templates WHERE title = 'Twitter Thread'), 'threadLength', 'Thread Length', 'select', 'How many tweets in the thread?', true, 3),
((SELECT id FROM templates WHERE title = 'Twitter Thread'), 'tone', 'Tone of Voice', 'select', 'Select the tone for your thread', false, 4),
((SELECT id FROM templates WHERE title = 'Twitter Thread'), 'includeStats', 'Include Statistics', 'select', 'Should the thread include statistics?', false, 5),
((SELECT id FROM templates WHERE title = 'Twitter Thread'), 'includeQuestions', 'Include Questions', 'select', 'Should the thread include questions to engage followers?', false, 6),
((SELECT id FROM templates WHERE title = 'Twitter Thread'), 'keyPoints', 'Key Points', 'textarea', 'List the key points to cover (one per line)', true, 7),
((SELECT id FROM templates WHERE title = 'Twitter Thread'), 'callToAction', 'Call to Action', 'text', 'What action do you want readers to take?', false, 8);

-- Update the options for select fields
UPDATE template_fields 
SET options = '["3-5", "5-7", "7-10", "10+"]'::jsonb 
WHERE name = 'threadLength' AND template_id = (SELECT id FROM templates WHERE title = 'Twitter Thread');

UPDATE template_fields 
SET options = '["Casual", "Professional", "Educational", "Humorous", "Controversial", "Inspirational"]'::jsonb 
WHERE name = 'tone' AND template_id = (SELECT id FROM templates WHERE title = 'Twitter Thread');

UPDATE template_fields 
SET options = '["yes", "no"]'::jsonb 
WHERE name = 'includeStats' AND template_id = (SELECT id FROM templates WHERE title = 'Twitter Thread');

UPDATE template_fields 
SET options = '["yes", "no"]'::jsonb 
WHERE name = 'includeQuestions' AND template_id = (SELECT id FROM templates WHERE title = 'Twitter Thread');
