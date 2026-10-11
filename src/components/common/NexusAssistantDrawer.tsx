import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  X,
  Send,
  Sparkles,
  Info,
  ChevronRight,
  RotateCcw,
  Building2,
  AlertTriangle,
  MapPin,
  Layers,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { AssistantContext, ChatMessage } from '../../types';
import { generateLocalAssistantResponse } from '../../utils/assistantEngine';

interface NexusAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  context: AssistantContext;
}

export const NexusAssistantDrawer: React.FC<NexusAssistantDrawerProps> = ({
  isOpen,
  onClose,
  context,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      role: 'assistant',
      text: `Greetings, Director. NEXUS Intelligence Assistant is online and synchronizing with your current operations view. 

I am tracking live telemetry for ${context.districtName || 'Metro Aggregate'}${
        context.selectedBuilding ? `, focusing on ${context.selectedBuilding.name}` : ''
      }${context.selectedAlert ? `, with active incident ${context.selectedAlert.id}` : ''}.

You can ask me questions about urban bottlenecks, building vulnerability scores, policy experiments, or incident protocols.`,
      timestamp: 'Just now',
      isAiGenerated: false,
      modelUsed: 'nexus-intelligence-core',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Context-aware suggested quick prompts
  const suggestedPrompts = [
    context.selectedBuilding
      ? `Audit maintenance risk for ${context.selectedBuilding.name}`
      : 'Which buildings have elevated maintenance risk?',
    context.selectedAlert
      ? `Explain incident ${context.selectedAlert.id} protocol`
      : 'Summarize active operational alerts',
    `Why is ${context.districtName || 'the city'} showing congestion?`,
    'What are the key policy trade-offs in the simulator?',
    'Summarize current environmental air quality telemetry',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // Attempt server-side API call (supports Gemini if GEMINI_API_KEY is configured on server)
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          context,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          text: data.reply || data.text,
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
          isAiGenerated: data.isAiGenerated ?? true,
          modelUsed: data.modelUsed || 'gemini-3.8-flash',
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error('Server assistant unavailable');
      }
    } catch (err) {
      // Local deterministic fallback
      const fallbackReply = generateLocalAssistantResponse(query, context);
      const localMsg: ChatMessage = {
        id: `local-${Date.now()}`,
        role: 'assistant',
        text: fallbackReply,
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        isAiGenerated: false,
        modelUsed: 'nexus-local-reasoning-engine',
      };
      setMessages((prev) => [...prev, localMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `msg-reset-${Date.now()}`,
        role: 'assistant',
        text: `Session cleared. Context synchronized with ${context.districtName || 'Metro Sphere'}. How can I assist with your operations analysis?`,
        timestamp: 'Just now',
        isAiGenerated: false,
        modelUsed: 'nexus-intelligence-core',
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#10182A] border-l border-[#23354D] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-250"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Assistant Header */}
        <div className="p-4 bg-[#15243A] border-b border-[#23354D] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#37D7FF] to-[#9B7BFF] p-[1px] flex items-center justify-center">
              <div className="w-full h-full bg-[#10182A] rounded-[7px] flex items-center justify-center">
                <Bot className="w-4 h-4 text-[#37D7FF]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#F3F7FF]">NEXUS Assistant</h3>
                <span className="text-[9px] font-mono bg-[#37D7FF]/10 text-[#37D7FF] px-1.5 py-0.2 rounded border border-[#37D7FF]/30">
                  CONTEXT-AWARE
                </span>
              </div>
              <p className="text-[11px] text-[#8EA2BE]">
                Operations & Scenario Decision Support
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleClearChat}
              title="Reset conversation"
              className="p-1.5 text-[#8EA2BE] hover:text-[#F3F7FF] hover:bg-[#10182A] rounded transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#8EA2BE] hover:text-[#F3F7FF] hover:bg-[#10182A] rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Context Telemetry Ribbon */}
        <div className="px-4 py-2 bg-[#0B1120] border-b border-[#23354D]/70 text-[11px] text-[#8EA2BE] flex flex-wrap items-center gap-2">
          <span className="text-[#37D7FF] font-semibold flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {context.districtName || 'Metro'}
          </span>
          <span>·</span>
          <span>Screen: {context.currentScreen}</span>
          {context.selectedBuilding && (
            <>
              <span>·</span>
              <span className="text-[#F3F7FF] truncate max-w-[140px] flex items-center gap-1">
                <Building2 className="w-3 h-3 text-[#37D7FF]" />
                {context.selectedBuilding.name}
              </span>
            </>
          )}
          {context.selectedAlert && (
            <>
              <span>·</span>
              <span className="text-[#FF5D73] flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {context.selectedAlert.id}
              </span>
            </>
          )}
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[88%] rounded-xl p-3 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#37D7FF] text-[#070B14] font-medium rounded-tr-none'
                    : 'bg-[#15243A] text-[#F3F7FF] border border-[#23354D] rounded-tl-none'
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>
              </div>

              <div className="mt-1 flex items-center gap-2 text-[10px] text-[#8EA2BE] font-mono px-1">
                <span>{msg.timestamp}</span>
                {msg.role === 'assistant' && (
                  <>
                    <span>·</span>
                    <span className="text-[#37D7FF]">
                      {msg.isAiGenerated ? 'Gemini 3.8 Flash' : 'NEXUS Local Rules Engine'}
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 p-3 bg-[#15243A] border border-[#23354D] rounded-xl rounded-tl-none w-fit text-xs text-[#8EA2BE]">
              <Sparkles className="w-3.5 h-3.5 text-[#37D7FF] animate-spin" />
              <span>Synthesizing city telemetry context...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Context Prompt Chips */}
        <div className="p-3 bg-[#0B1120] border-t border-[#23354D] space-y-2">
          <div className="text-[10px] font-mono text-[#8EA2BE] uppercase tracking-wider">
            Suggested Context Inquiries
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {suggestedPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                disabled={isLoading}
                className="text-[11px] px-2.5 py-1 rounded-md bg-[#15243A] hover:bg-[#1f3656] text-[#37D7FF] border border-[#23354D] transition-colors text-left truncate max-w-full"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input Box */}
        <div className="p-3 bg-[#15243A] border-t border-[#23354D]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask NEXUS Assistant about city telemetry..."
              disabled={isLoading}
              className="flex-1 bg-[#0B1120] border border-[#23354D] rounded-lg px-3 py-2 text-xs text-[#F3F7FF] placeholder-[#8EA2BE] focus:outline-none focus:border-[#37D7FF]"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="p-2 bg-[#37D7FF] hover:bg-[#28bade] disabled:opacity-50 text-[#070B14] rounded-lg transition-colors font-bold"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-2 text-[10px] text-[#8EA2BE] flex items-center justify-between">
            <span>Simulation Decision Support · Synthetic Readings</span>
            <span className="font-mono text-[9px] text-[#39D98A]">CORE 100% NOMINAL</span>
          </div>
        </div>
      </div>
    </div>
  );
};
