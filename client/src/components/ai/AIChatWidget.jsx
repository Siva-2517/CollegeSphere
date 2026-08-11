import React, { useState, useRef, useEffect } from 'react';
import api from '../../api/axios';
import ConfirmationCard from './ConfirmationCard';
import { Bot, Sparkles, Send, X, Minimize2, RefreshCw, ChevronRight, User, ShieldAlert } from 'lucide-react';

const AIChatWidget = ({ userRole = 'student', userName = 'User' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi ${userName}! 👋 I am your **CollegeSphere AI Assistant**.\nHow can I help you manage events or registrations today?`
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
        '🔍 Find upcoming hackathons',
        '📋 Show my registrations',
        '⚡ Approaching deadlines',
        '🎓 Recommend events'
      ];
    } else if (userRole === 'organizer') {
      return [
        '📝 Create event draft',
        '📊 Summarize event registrations',
        '💡 Generate event rules'
      ];
    } else if (userRole === 'admin') {
      return [
        '📈 Show platform analytics',
        '👥 List pending organizers',
        '⏳ List pending events'
      ];
    } else if (userRole === 'superadmin') {
      return [
        '👑 Show system health & metrics',
        '🏫 List all colleges',
        '👥 List all system users'
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

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: reply || 'Here is the response to your query.',
          pendingAction: requiresConfirmation ? serverAction : null
        }
      ]);

      if (requiresConfirmation && serverAction) {
        setPendingAction(serverAction);
      }
    } catch (err) {
      console.error('AI Chat Error:', err);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an issue processing your request. Please try again.'
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

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: reply || 'Action confirmed and executed successfully!'
        }
      ]);
      setPendingAction(null);
    } catch (err) {
      console.error('Confirm Action Error:', err);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Failed to execute confirmed action. ' + (err.response?.data?.message || err.message)
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelAction = () => {
    setPendingAction(null);
    setMessages(prev => [
      ...prev,
      {
        role: 'assistant',
        content: 'Action canceled. Let me know if you would like to do anything else!'
      }
    ]);
  };

  // Helper renderer for markdown-like formatting (bold, lists, code)
  const renderFormattedText = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Bold text formatting
      let formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Inline code
      formattedLine = formattedLine.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-slate-800 text-indigo-300 rounded font-mono text-[11px]">$1</code>');

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
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-medium rounded-full shadow-2xl hover:shadow-indigo-500/25 transition-all duration-300 transform hover:scale-105 active:scale-95 border border-white/20"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 animate-pulse text-amber-300" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900 animate-ping" />
          </div>
          <span className="text-sm font-semibold tracking-wide">SphereAI</span>
        </button>
      )}

      {/* Expanded Chat Widget */}
      {isOpen && (
        <div className="w-[380px] sm:w-[420px] h-[580px] bg-slate-950/95 border border-indigo-500/30 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="px-4 py-3.5 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-sm">SphereAI Assistant</h3>
                  <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {userRole}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Powered by LLM Tool Calling</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                title="Minimize"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 custom-scrollbar bg-gradient-to-b from-slate-950 to-slate-900/50">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 flex-shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm shadow-md ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                  }`}
                >
                  {renderFormattedText(msg.content)}

                  {/* Render confirmation card if action pending */}
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
                  <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && !pendingAction && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 flex-shrink-0">
                  <Sparkles className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-slate-900 border border-slate-800 px-4 py-3 rounded-2xl rounded-bl-none text-slate-400 text-xs flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  <span className="ml-1 text-slate-400">Thinking & executing tools...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          <div className="px-3 py-2 bg-slate-900/60 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {getSuggestions().map((sug, i) => (
              <button
                key={i}
                onClick={() => handleSend(sug)}
                disabled={isLoading}
                className="whitespace-nowrap px-2.5 py-1 text-[11px] bg-slate-800/80 hover:bg-indigo-600/30 hover:border-indigo-500/50 border border-slate-700/60 text-slate-300 hover:text-indigo-200 rounded-full transition-all flex items-center gap-1 disabled:opacity-50"
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
            className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask SphereAI anything about events..."
              disabled={isLoading}
              className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="p-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl shadow-md disabled:opacity-40 transition-all flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AIChatWidget;
