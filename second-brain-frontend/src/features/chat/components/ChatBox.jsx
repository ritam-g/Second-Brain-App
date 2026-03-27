import React from 'react';
import ChatContainer from '../../../components/chat/ChatContainer';

// Backwards-compatible wrapper so existing feature-level imports can keep working while the UI lives in shared components.
const ChatBox = (props) => <ChatContainer {...props} />;

export default ChatBox;
