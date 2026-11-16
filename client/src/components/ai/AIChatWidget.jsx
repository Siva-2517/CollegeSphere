import React, { useState, useRef, useEffect } from 'react';
import api from '../../api/axios';
import ConfirmationCard from './ConfirmationCard';
import { Bot, Sparkles, Send, X, Minimize2, ChevronRight, User } from 'lucide-react';

export default function AIChatWidget({ userRole = 'student', userName = 'User' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello ${userName}! 👋 I am your **CollegeSphere Assistant**.\nHow can I help you discover events, check deadlines, or manage registrations today?`
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, pendingAction]);

  // Role-specific suggestions
  const getSuggestions = () => {
    if (userRole === 'student') {
      return [
        '🔍 Upcoming hackathons',
        '📋 My registrations',
        '⚡ Imminent deadlines',
        '🎓 Recommend events'
      ];
    } else if (userRole === 'organizer') {
      return [
        '📝 Draft new event',
        '📊 Summarize registrations',
        '💡 Suggest event guidelines'
      ];
    } else if (userRole === 'admin') {
      return [
        '📈 Platform analytics',
        '👥 Pending organizers',
        '⏳ Pending event permits'
      ];
    } else if (userRole === 'superadmin') {
      return [
        '👑 Platform diagnostics',
        '🏫 Partner colleges list',
        '👥 System users overview'
      ];
    }
    return ['🔍 Search events', '📋 My registrations'];
  };

  const handleSend = async (textToSend = null) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isLoading) return;

    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    if (!textToSend) setInputMessage('');
    setIsLoading(true);
    setPendingAction(null);

    try {
      const response = await api.post('/api/ai/chat', {
        messages: newMessages
      });

      const { reply, requiresConfirmation, pendingAction: serverAction } = response.data;

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: reply || 'Here is the response to your request.',
          pendingAction: requiresConfirmation ? serverAction : null
        }
      ]);

      if (requiresConfirmation && serverAction) {
        setPendingAction(serverAction);
      }
    } catch (err) {
      console.error('AI Chat Error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I encountered an issue processing your request. Please retry shortly.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAction = async (actionToConfirm) => {
    setIsLoading(true);
    try {
      const response = await api.post('/api/ai/chat', {
        messages,
        confirmAction: actionToConfirm
      });

      const { reply } = response.data;

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: reply || 'Action confirmed and executed successfully!'
        }
      ]);
      setPendingAction(null);
    } catch (err) {
      console.error('Confirm Action Error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Failed to execute confirmed action: ' + (err.response?.data?.message || err.message)
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelAction = () => {
    setPendingAction(null);
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: 'Action cancelled. Let me know if you would like assistance with anything else.'
      }
    ]);
  };

  const renderFormattedText = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      let formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      formattedLine = formattedLine.replace(
        /`([^`]+)`/g,
        '<code class="px-1.5 py-0.5 bg-slate-800 text-brand-300 rounded font-mono text-[11px]">$1</code>'
      );

      return (
        <p
          key={idx}
          className={`${line.startsWith('•') || line.startsWith('-') ? 'pl-3 my-0.5 text-slate-200' : 'my-1'} leading-relaxed`}
          dangerouslySetInnerHTML={{ __html: formattedLine }}
        />
      );
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 px-4 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-2xl shadow-modal hover:shadow-brand-500/20 transition-all cursor-pointer border border-brand-500/40"
        >
          <div className="w-5 h-5 rounded-lg bg-white/10 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs tracking-wide">SphereAI Copilot</span>
        </button>
      )}

      {/* Expanded Chat Window */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[560px] bg-surface-900 border border-slate-700 rounded-2xl shadow-modal flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="px-4 py-3 bg-surface-800/90 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-brand-600 text-white shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-xs sm:text-sm">SphereAI Copilot</h3>
                  <span className="px-2 py-0.5 text-[9px] uppercase tracking-wider font-bold rounded-full bg-brand-500/15 text-brand-300 border border-brand-500/30">
                    {userRole}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">Database Tools & Direct Actions</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Minimize"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar bg-slate-950/60 text-xs">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-lg bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400 flex-shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-brand-600 text-white rounded-br-none shadow-sm'
                      : 'bg-surface-800 border border-slate-700/80 text-slate-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  {renderFormattedText(msg.content)}

                  {msg.pendingAction && (
                    <ConfirmationCard
                      pendingAction={msg.pendingAction}
                      onConfirm={handleConfirmAction}
                      onCancel={handleCancelAction}
                      isLoading={isLoading}
                    />
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 flex-shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && !pendingAction && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-6 h-6 rounded-lg bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400 flex-shrink-0">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="bg-surface-800 border border-slate-700/80 px-3.5 py-2.5 rounded-2xl rounded-bl-none text-slate-400 text-xs flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] text-slate-400">Processing tools...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Suggestions */}
          <div className="px-3 py-2 bg-surface-900 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {getSuggestions().map((sug, i) => (
              <button
                key={i}
                onClick={() => handleSend(sug)}
                disabled={isLoading}
                className="whitespace-nowrap px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-full transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {sug} <ChevronRight className="w-3 h-3 text-slate-500" />
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-surface-800/90 border-t border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask SphereAI anything about events..."
              disabled={isLoading}
              className="flex-1 bg-slate-950 border border-slate-700 focus:border-brand-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="p-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-sm disabled:opacity-40 transition-all flex items-center justify-center cursor-pointer"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
