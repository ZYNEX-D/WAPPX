-- ====================================================================
-- Zynex WhatsApp Platform - Supabase Seed Data
-- ====================================================================

-- 1. Contacts Seed
INSERT INTO public.contacts (
    id, name, phone, avatar_url, status, assigned_agent, tags, unread_count, 
    last_message_snippet, last_message_time, is_bot_active, notes
) VALUES
('c-1', 'Kavindu Perera', '+94 77 123 4567', NULL, 'active', 'Tharindu (You)', 
 ARRAY['High Value', 'Inquiry', 'Enterprise'], 0, 'Can we integrate this with Shopify and Google Sheets?', '14:32', false, 
 ARRAY['Client runs a 10-person e-commerce fashion brand in Colombo.', 'Needs broadcast marketing feature.']),

('c-2', 'Dilani Fernando', '+94 71 987 6543', NULL, 'pending_human', 'Unassigned', 
 ARRAY['Urgent', 'Needs Agent'], 2, 'Customer requested: ''👤 Talk to Agent''', '14:15', false, 
 ARRAY['Waiting for manual reply regarding refund inquiry.']),

('c-3', 'Kasun Bandara', '+94 70 555 1212', NULL, 'active', 'Bot Engine', 
 ARRAY['Automated', 'Order Tracking'], 0, '#ORD-9102', '13:50', true, 
 ARRAY[]::TEXT[]),

('c-4', 'Sajith Silva', '+94 76 333 4444', NULL, 'resolved', 'Bot Engine', 
 ARRAY['Lead', 'Demo Booked'], 0, 'Thank you for the quick assistance!', 'Yesterday', true, 
 ARRAY['Demo scheduled for Monday.'])
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    status = EXCLUDED.status,
    assigned_agent = EXCLUDED.assigned_agent,
    tags = EXCLUDED.tags,
    unread_count = EXCLUDED.unread_count,
    last_message_snippet = EXCLUDED.last_message_snippet,
    last_message_time = EXCLUDED.last_message_time,
    is_bot_active = EXCLUDED.is_bot_active,
    notes = EXCLUDED.notes;

-- 2. Messages Seed
INSERT INTO public.messages (
    id, contact_id, sender, sender_name, text, timestamp, status, buttons, selected_button_id, is_internal_note
) VALUES
-- c-1 Messages
('m-101', 'c-1', 'customer', NULL, 'Hi, I saw your WhatsApp automation SaaS video.', '14:20', 'read', NULL, NULL, false),
('m-102', 'c-1', 'bot', NULL, '👋 Ayubowan! Welcome to our automated WhatsApp assistant. How can we support your business today?', '14:20', 'read', '[{"id": "btn-pricing", "title": "💼 Packages & Pricing"}, {"id": "btn-order", "title": "📦 Track Order"}, {"id": "btn-agent", "title": "👤 Talk to Agent"}]'::jsonb, 'btn-pricing', false),
('m-103', 'c-1', 'customer', NULL, '💼 Packages & Pricing', '14:21', 'read', NULL, NULL, false),
('m-104', 'c-1', 'bot', NULL, '🚀 Here are our WhatsApp Automation Plans:

• Starter: $29/mo (1,000 chats, 1 agent)
• Growth: $79/mo (5,000 chats, 5 agents)
• Scale: $199/mo (Unlimited flows & AI agent)', '14:21', 'read', '[{"id": "btn-demo", "title": "📅 Request Demo"}, {"id": "btn-back", "title": "🔙 Back to Menu"}]'::jsonb, NULL, false),
('m-105', 'c-1', 'customer', NULL, 'Can we integrate this with Shopify and Google Sheets?', '14:32', 'read', NULL, NULL, false),

-- c-2 Messages
('m-201', 'c-2', 'customer', NULL, 'Hello, my delivery has not arrived yet.', '14:10', 'read', NULL, NULL, false),
('m-202', 'c-2', 'bot', NULL, '👋 Ayubowan! Welcome to our automated WhatsApp assistant. How can we support your business today?', '14:10', 'read', '[{"id": "btn-pricing", "title": "💼 Packages & Pricing"}, {"id": "btn-order", "title": "📦 Track Order"}, {"id": "btn-agent", "title": "👤 Talk to Agent"}]'::jsonb, 'btn-agent', false),
('m-203', 'c-2', 'customer', NULL, '👤 Talk to Agent', '14:14', 'read', NULL, NULL, false),
('m-204', 'c-2', 'bot', NULL, 'Connecting you with an available customer care specialist. Please hold on for a moment while our team joins this chat.', '14:14', 'delivered', NULL, NULL, false),
('m-205', 'c-2', 'customer', NULL, 'Please reply fast, order #ORD-7721', '14:15', 'delivered', NULL, NULL, false),

-- c-3 Messages
('m-301', 'c-3', 'customer', NULL, 'Track order', '13:48', 'read', NULL, NULL, false),
('m-302', 'c-3', 'bot', NULL, '🔍 Please send your Order Number (e.g. #ORD-8492) and our system will instantly look up the dispatch status for you.', '13:48', 'read', NULL, NULL, false),
('m-303', 'c-3', 'customer', NULL, '#ORD-9102', '13:50', 'read', NULL, NULL, false),
('m-304', 'c-3', 'bot', NULL, '✅ Order #ORD-9102 status: Out for delivery via PromptX Courier. Estimated delivery: Today before 5:00 PM.', '13:50', 'read', NULL, NULL, false),

-- c-4 Messages
('m-401', 'c-4', 'customer', NULL, 'Hey, can I book a demo?', 'Yesterday', 'read', NULL, NULL, false),
('m-402', 'c-4', 'agent', 'Tharindu', 'Certainly! We have set up a meeting for Monday 10:00 AM. A calendar invitation has been sent.', 'Yesterday', 'read', NULL, NULL, false),
('m-403', 'c-4', 'customer', NULL, 'Thank you for the quick assistance!', 'Yesterday', 'read', NULL, NULL, false)
ON CONFLICT (id) DO UPDATE SET
    text = EXCLUDED.text,
    timestamp = EXCLUDED.timestamp,
    status = EXCLUDED.status;

-- 3. Flow Nodes Seed
INSERT INTO public.flow_nodes (
    id, type, title, content, trigger_keywords, buttons, next_node_id, position
) VALUES
('node-1', 'trigger', '1. Inbound Welcome Trigger', 'Activates when user starts a chat or says hello.', 
 ARRAY['hi', 'hello', 'menu', 'start', 'help', 'hey'], '[]'::jsonb, 'node-2', '{"x": 50, "y": 100}'::jsonb),

('node-2', 'buttons', '2. Main Interactive Menu', '👋 Ayubowan! Welcome to our automated WhatsApp assistant. How can we support your business today?', 
 ARRAY[]::text[], '[{"id": "btn-pricing", "title": "💼 Packages & Pricing", "nextNodeId": "node-3"}, {"id": "btn-order", "title": "📦 Track Order", "nextNodeId": "node-4"}, {"id": "btn-agent", "title": "👤 Talk to Agent", "nextNodeId": "node-5"}]'::jsonb, NULL, '{"x": 380, "y": 100}'::jsonb),

('node-3', 'buttons', '3. Packages & Pricing Details', '🚀 Here are our WhatsApp Automation Plans:

• Starter: $29/mo (1,000 chats, 1 agent)
• Growth: $79/mo (5,000 chats, 5 agents)
• Scale: $199/mo (Unlimited flows & AI agent)

Which option interests you?', 
 ARRAY[]::text[], '[{"id": "btn-demo", "title": "📅 Request Demo", "nextNodeId": "node-6"}, {"id": "btn-back", "title": "🔙 Back to Menu", "nextNodeId": "node-2"}]'::jsonb, NULL, '{"x": 740, "y": 20}'::jsonb),

('node-4', 'message', '4. Order Tracking Prompt', '🔍 Please send your Order Number (e.g. #ORD-8492) and our system will instantly look up the dispatch status for you.', 
 ARRAY[]::text[], '[{"id": "btn-back-order", "title": "🔙 Back to Menu", "nextNodeId": "node-2"}]'::jsonb, NULL, '{"x": 740, "y": 240}'::jsonb),

('node-5', 'human_handoff', '5. Human Agent Handoff', 'Connecting you with an available customer care specialist. Please hold on for a moment while our team joins this chat.', 
 ARRAY[]::text[], '[]'::jsonb, NULL, '{"x": 740, "y": 460}'::jsonb),

('node-6', 'message', '6. Demo Confirmation', '🎉 Great! Our solution architect will call you or message back within 15 minutes to configure your customized demo.', 
 ARRAY[]::text[], '[{"id": "btn-done", "title": "🔙 Back to Menu", "nextNodeId": "node-2"}]'::jsonb, NULL, '{"x": 1100, "y": 20}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    content = EXCLUDED.content,
    buttons = EXCLUDED.buttons,
    position = EXCLUDED.position;

-- 4. Meta Config Seed
INSERT INTO public.meta_config (
    id, phone_number_id, waba_id, access_token, verify_token, webhook_url, is_connected
) VALUES (
    'default', '108923485719321', '249018249081234', 'EAA...', 
    'zynex_meta_webhook_secret_2026', 'https://api.yourdomain.com/api/webhook', true
)
ON CONFLICT (id) DO UPDATE SET
    verify_token = EXCLUDED.verify_token;
