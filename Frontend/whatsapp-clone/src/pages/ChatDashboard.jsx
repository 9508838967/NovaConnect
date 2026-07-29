import React, { useState, useEffect } from 'react';
import { Search, MessageSquarePlus, Camera, MoreVertical, ArrowLeft, Smile, Paperclip, Send, Mic, Trash2 } from 'lucide-react';
import { useSocket } from '../context/SocketContext.jsx';
import API from '../services/api';
import ChatList from '../components/ChatList';
import IncomingCallModal from "../components/videoCall/IncomingCallModal"; // 🔴 IMPORTED MODAL

export default function ChatDashboard({ onTriggerCall, onOpenSettings }) {
  const { getSocket } = useSocket();
  const [activeChats, setActiveChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMenuDropDown, setShowMenuDropDown] = useState(false);

  // 🔴 1. INCOMING CALL STATE (For Video/Audio Call Popup)
  const [incomingCall, setIncomingCall] = useState(null);

  // 1. INITIAL SYNC: Load chat list
  useEffect(() => {
    const loadConversations = async () => {
      try {
        if (!localStorage.getItem('token')) return;

        const response = await API.get('/messages/conversations'); 
        
        if (response.data && Array.isArray(response.data)) {
          setActiveChats(response.data);
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          setActiveChats(response.data.data);
        }
      } catch (err) {
        console.error("Failed to sync conversations feed context:", err);
        setActiveChats([]); 
      }
    };
    loadConversations();
  }, [getSocket]);

  // 2. LIVE REAL-TIME CHANNELS STREAMING MANAGEMENT & CALL LISTENERS
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const myUserId = localStorage.getItem('userId');

    // 🔴 INCOMING CALL HANDLERS
    const handleIncomingCall = (data) => {
      console.log("☎️ Incoming call payload received:", data);
      // data = { callId, caller: { id, username }, callType, offer }
      setIncomingCall(data);
    };

    const handleCallEndedOrMissed = () => {
      setIncomingCall(null);
    };

    const handlePrivateMessage = (incomingMsg) => {
      if (!incomingMsg) return;

      if (String(incomingMsg.senderId) === String(myUserId)) {
        return; 
      }

      const formattedPrivate = {
        id: incomingMsg._id || incomingMsg.id || `msg-${Date.now()}`,
        text: incomingMsg.text || incomingMsg.content || '', 
        time: incomingMsg.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: false
      };

      updateChatMessagesPipeline(incomingMsg.chatId || incomingMsg.senderId, formattedPrivate);
    };

    const handleGroupMessage = (incomingGroupPayload) => {
      if (!incomingGroupPayload || !incomingGroupPayload.message) return;
      const { message } = incomingGroupPayload;
      
      if (String(message.sender) === String(myUserId) || String(message.sender?._id) === String(myUserId)) {
        return; 
      }

      const formattedGroup = {
        id: message._id || `msg-${Date.now()}`,
        text: message.content || '',
        time: message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: false
      };
      updateChatMessagesPipeline(message.group, formattedGroup);
    };

    const handlePresenceUpdate = (data) => {
      if (!data) return;
      setActiveChats(prev => prev.map(c => c.id === data.userId ? { ...c, isOnline: data.isOnline } : c));
      if (selectedChat && selectedChat.id === data.userId) {
        setSelectedChat(prev => ({ ...prev, isOnline: data.isOnline }));
      }
    };

    const handleTypingChange = (data) => {
      if (!data) return;
      setActiveChats(prev => prev.map(c => c.id === data.chatId ? { ...c, isTyping: data.isTyping } : c));
      if (selectedChat && selectedChat.id === data.chatId) {
        setSelectedChat(prev => ({ ...prev, isTyping: data.isTyping }));
      }
    };

    // DELETE FOR EVERYONE REAL-TIME LISTENER
    const handleMessageDeletedEveryone = ({ messageId, chatId }) => {
      const markAsDeleted = (msgs = []) =>
        msgs.map(m =>
          (m.id === messageId || m._id === messageId)
            ? { ...m, text: 'This message was deleted', content: 'This message was deleted', isDeleted: true }
            : m
        );

      setSelectedChat(prev => (prev && (prev.id === chatId || prev._id === chatId) ? { ...prev, messages: markAsDeleted(prev.messages) } : prev));
      setActiveChats(prev => prev.map(c => (c.id === chatId ? { ...c, messages: markAsDeleted(c.messages) } : c)));
    };

    // Socket Events Bind
    socket.on('private:message', handlePrivateMessage);
    socket.on('group:message', handleGroupMessage);
    socket.on('presence:update', handlePresenceUpdate);
    socket.on('typing:state_change', handleTypingChange);
    socket.on('message:deleted_everyone', handleMessageDeletedEveryone);

    // 🔴 CALL SOCKET LISTENERS
    socket.on('call:incoming', handleIncomingCall);
    socket.on('call:ended', handleCallEndedOrMissed);
    socket.on('call:missed', handleCallEndedOrMissed);
    socket.on('call:rejected', handleCallEndedOrMissed);

    return () => {
      socket.off('private:message', handlePrivateMessage);
      socket.off('group:message', handleGroupMessage);
      socket.off('presence:update', handlePresenceUpdate);
      socket.off('typing:state_change', handleTypingChange);
      socket.off('message:deleted_everyone', handleMessageDeletedEveryone);

      socket.off('call:incoming', handleIncomingCall);
      socket.off('call:ended', handleCallEndedOrMissed);
      socket.off('call:missed', handleCallEndedOrMissed);
      socket.off('call:rejected', handleCallEndedOrMissed);
    };
  }, [getSocket, selectedChat]);

  // 🔴 FIXED RECEIVER ACCEPT HANDLER
  const handleAcceptCall = () => {
    if (!incomingCall) return;

    // Direct VideoCallPage open karein (useWebRTC ka acceptCall trigger hoga)
    if (onTriggerCall) {
      onTriggerCall({
        id: incomingCall.caller.id,
        name: incomingCall.caller.username,
        callData: incomingCall,
        isIncoming: true
      });
    }

    setIncomingCall(null);
  };

  const handleRejectCall = () => {
    if (!incomingCall) return;
    const socket = getSocket();

    if (socket?.connected) {
      socket.emit('call:reject', {
        callId: incomingCall.callId,
        reason: 'rejected'
      });
    }

    setIncomingCall(null);
  };

  const updateChatMessagesPipeline = (chatId, msgObject) => {
    if (!chatId) return;

    const appendIfNotExists = (existingMsgs = []) => {
      const exists = existingMsgs.some(m => (m.id && m.id === msgObject.id) || (m._id && m._id === msgObject.id));
      if (exists) return existingMsgs;
      return [...existingMsgs, msgObject];
    };

    setActiveChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          messages: appendIfNotExists(chat.messages || []),
          unreadCount: selectedChat?.id === chatId ? 0 : (chat.unreadCount || 0) + 1
        };
      }
      return chat;
    }));

    if (selectedChat && selectedChat.id === chatId) {
      setSelectedChat(prev => ({ ...prev, messages: appendIfNotExists(prev.messages || []) }));
    }
  };

  const handleSelectChatThread = async (chat) => {
    if (!chat || !chat.id) return;
    try {
      const response = await API.get(`/messages/${chat.id}`); 
      const rawMessages = response.data?.messages || response.data?.data?.messages || response.data || [];
      
      const myUserId = localStorage.getItem('userId');
      const formattedHistory = (Array.isArray(rawMessages) ? rawMessages : []).map(m => {
        const textContent = m.content || m.text || '';
        const isDeleted = m.isDeleted || textContent === 'This message was deleted';
        return {
          id: m._id || m.id,
          text: isDeleted ? 'This message was deleted' : textContent,
          isDeleted: isDeleted,
          time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (m.time || 'Now'),
          isMe: String(m.sender?._id || m.sender || m.senderId) === String(myUserId)
        };
      });

      setSelectedChat({
        ...chat,
        messages: formattedHistory,
        unreadCount: 0
      });
      
      setActiveChats(prev => prev.map(c => c.id === chat.id ? { ...c, unreadCount: 0 } : c));
    } catch (err) {
      console.error("History load karne me dikkat aayi:", err);
      setSelectedChat({ ...chat, messages: [] }); 
    }
  };

  // MESSAGE DISPATCH SYSTEM
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedChat) return;

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const tempUniqueId = `msg-${Date.now()}`;
    const textToSend = messageInput.trim();

    const localBubble = { id: tempUniqueId, text: textToSend, time: currentTime, isMe: true };
    
    setSelectedChat(prev => ({ ...prev, messages: [...(prev.messages || []), localBubble] }));
    setActiveChats(prev => prev.map(c => c.id === selectedChat.id ? { ...c, messages: [...(c.messages || []), localBubble] } : c));
    setMessageInput('');

    const socket = getSocket();

    if (socket?.connected) {
      if (selectedChat.isGroup) {
        socket.emit('group:message', { groupId: selectedChat.id, content: textToSend, tempId: tempUniqueId });
      } else {
        socket.emit('private:message', { chatId: selectedChat.id, text: textToSend, time: currentTime }, (res) => {
          if (res?.success && res?.message?._id) {
            setSelectedChat(prev => ({
              ...prev,
              messages: (prev.messages || []).map(m => m.id === tempUniqueId ? { ...m, id: res.message._id, _id: res.message._id } : m)
            }));
          }
        });
      }
      socket.emit('typing:stop', { chatId: selectedChat.id });
    } else {
      try {
        await API.post('/messages', { recipientId: selectedChat.id, content: textToSend });
      } catch (err) {
        console.error("Message delivery failed via HTTP API:", err);
      }
    }
  };

  // DELETE FOR EVERYONE HANDLER FUNCTION
  const handleDeleteForEveryone = (messageId) => {
    if (!selectedChat || !messageId) return;

    if (!window.confirm("Kya aap ye message sabke liye delete karna chahte hain?")) return;

    const socket = getSocket();

    if (socket?.connected) {
      socket.emit('message:delete_everyone', { messageId, recipientId: selectedChat.id }, (response) => {
        if (response?.success) {
          const markAsDeleted = (msgs = []) =>
            msgs.map(m =>
              (m.id === messageId || m._id === messageId)
                ? { ...m, text: 'This message was deleted', content: 'This message was deleted', isDeleted: true }
                : m
            );

          setSelectedChat(prev => ({ ...prev, messages: markAsDeleted(prev.messages) }));
          setActiveChats(prev => prev.map(c => (c.id === selectedChat.id ? { ...c, messages: markAsDeleted(c.messages) } : c)));
        }
      });
    }
  };

  const handleInputChangeEvent = (val) => {
    setMessageInput(val);
    if (!selectedChat) return;
    const socket = getSocket();

    if (val.trim().length > 0) {
      socket?.emit('typing:start', { chatId: selectedChat.id });
    } else {
      socket?.emit('typing:stop', { chatId: selectedChat.id });
    }
  };

  const handleCreateChat = async () => {
    const inputId = window.prompt("Enter Target User's Valid MongoDB ID (24-digit hex) from MongoDB Compass:");
    if (!inputId || !inputId.trim()) return;

    const isGroupChoice = window.confirm("Is this a Group Chat channel?");
    const secureId = inputId.trim().length === 24 ? inputId.trim() : "65f1a2b3c4d5e6f7a8b9c0d1"; 

    const newChat = {
      id: secureId,
      name: inputId.trim().includes('@') ? inputId.trim().split('@')[0] : "Test User",
      isGroup: isGroupChoice,
      unreadCount: 0,
      isOnline: true,
      isTyping: false,
      messages: []
    };
    setActiveChats(prev => [newChat, ...prev]);
    setSelectedChat(newChat);
  };

  const filteredChats = (activeChats || []).filter(chat =>
    chat && chat.name && chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      
      {/* 🔴 INCOMING CALL OVERLAY MODAL */}
      {incomingCall && (
        <IncomingCallModal
          caller={incomingCall.caller}
          callType={incomingCall.callType}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
        />
      )}

      {/* ACTIVE CHAT WORKSPACE OVERLAY SCREEN */}
      {selectedChat && (
        <div style={{ position: 'absolute', inset: 0, backgroundColor: '#0b141a', zIndex: 50, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <header style={{ height: '60px', backgroundColor: '#202c33', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <button onClick={() => setSelectedChat(null)} style={{ background: 'none', border: 'none', padding: '4px', color: '#aebac1', cursor: 'pointer' }}>
                <ArrowLeft size={22} />
              </button>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#1fa855', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', textTransform: 'uppercase', flexShrink: 0 }}>
                {(selectedChat.name || 'CH').slice(0, 2)}
              </div>
              <div style={{ minWidth: 0 }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#e9edef', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedChat.name}</h3>
                <span style={{ fontSize: '11px', color: '#1fa855', display: 'block', fontWeight: '500' }}>
                  {selectedChat.isTyping ? 'typing...' : (selectedChat.isOnline ? 'online' : 'offline')}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#aebac1' }}>
              <Camera
                size={20}
                style={{ cursor: 'pointer' }}
                onClick={() => onTriggerCall({ id: selectedChat.id, name: selectedChat.name })}
              />
              <MoreVertical size={20} style={{ cursor: 'pointer' }} />
            </div>
          </header>

          {/* Messages Window */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: '#0b141a' }}>
            {selectedChat.messages?.map((m, idx) => {
              const msgId = m.id || m._id;
              const isDeleted = m.isDeleted || m.text === 'This message was deleted' || m.content === 'This message was deleted';

              return (
                <div key={msgId || idx} style={{ display: 'flex', width: '100%', justifyContent: m.isMe ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '75%',
                    minWidth: '90px',
                    padding: '6px 12px 22px 12px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxShadow: '0 1px 1px rgba(0,0,0,0.2)',
                    position: 'relative',
                    wordBreak: 'break-word',
                    backgroundColor: isDeleted ? '#182229' : (m.isMe ? '#005c4b' : '#202c33'),
                    color: isDeleted ? '#8696a0' : '#e9edef',
                    fontStyle: isDeleted ? 'italic' : 'normal',
                    borderTopRightRadius: m.isMe ? '0px' : '8px',
                    borderTopLeftRadius: m.isMe ? '8px' : '0px'
                  }}>
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                      {isDeleted ? '🚫 This message was deleted' : (m.text || m.content)}
                    </p>

                    <div style={{ position: 'absolute', bottom: '2px', right: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '10px', color: '#8696a0', fontWeight: '500' }}>{m.time}</span>
                      
                      {/* Delete for Everyone */}
                      {m.isMe && !isDeleted && (
                        <Trash2
                          size={12}
                          onClick={() => handleDeleteForEveryone(msgId)}
                          style={{ cursor: 'pointer', color: '#8696a0', opacity: 0.8 }}
                          className="hover:text-red-400"
                          title="Delete for Everyone"
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleSendMessage} style={{ backgroundColor: '#202c33', padding: '8px', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <Smile style={{ color: '#8696a0', cursor: 'pointer' }} size={24} />
            <Paperclip style={{ color: '#8696a0', cursor: 'pointer' }} size={20} />
            <input 
              type="text" 
              value={messageInput}
              onChange={(e) => handleInputChangeEvent(e.target.value)}
              style={{ flex: 1, backgroundColor: '#2a3942', borderRadius: '24px', padding: '8px 16px', fontSize: '14px', outline: 'none', border: 'none', color: '#e9edef' }}
              placeholder="Type a message"
            />
            {messageInput.trim().length > 0 ? (
              <button type="submit" style={{ width: '40px', height: '40px', backgroundColor: '#1fa855', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                <Send size={16} />
              </button>
            ) : (
              <button type="button" style={{ width: '40px', height: '40px', backgroundColor: '#1fa855', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                <Mic size={16} />
              </button>
            )}
          </form>
        </div>
      )}

      {/* MAIN SCREEN USER INTERFACE CONTAINER */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <header style={{ padding: '16px 16px 8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, position: 'relative' }}>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#1fa855', letterSpacing: '0.025em' }}>NovaConnect</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', color: '#aebac1' }}>
            <span style={{ fontSize: '18px', fontWeight: '900', cursor: 'pointer' }}>₹</span>
            <Camera size={20} style={{ cursor: 'pointer' }} />
            <MoreVertical size={20} style={{ cursor: 'pointer' }} onClick={() => setShowMenuDropDown(!showMenuDropDown)} />
          </div>

          {showMenuDropDown && (
            <div style={{ position: 'absolute', top: '50px', right: '12px', backgroundColor: '#233138', borderRadius: '8px', padding: '8px 0', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', zIndex: 110, width: '150px' }}>
              <div onClick={() => { onOpenSettings(); setShowMenuDropDown(false); }} style={{ padding: '10px 16px', color: '#e9edef', fontSize: '14px', cursor: 'pointer' }}>Settings</div>
            </div>
          )}
        </header>

        <div style={{ padding: '8px 16px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#202c33', padding: '10px 16px', borderRadius: '24px' }}>
            <Search size={18} style={{ color: '#8696a0', flexShrink: 0 }} />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ backgroundColor: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '15px', color: '#e9edef' }} placeholder="Ask Meta AI or Search" />
          </div>
        </div>

        <ChatList chats={filteredChats} onSelectChat={handleSelectChatThread} />

        <button onClick={handleCreateChat} style={{ position: 'absolute', bottom: '24px', right: '24px', width: '56px', height: '56px', backgroundColor: '#1fa855', color: 'white', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', zIndex: 30 }}><MessageSquarePlus size={24} /></button>
      </div>

    </div>
  );
}
