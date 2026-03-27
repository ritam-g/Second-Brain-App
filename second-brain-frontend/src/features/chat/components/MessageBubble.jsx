import React from 'react';
import ChatMessage from '../../../components/chat/ChatMessage';

// Backwards-compatible wrapper that keeps the existing feature import path stable.
const MessageBubble = (props) => <ChatMessage {...props} />;

export default MessageBubble;
