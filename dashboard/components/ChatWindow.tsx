'use client';

import { dashboardApi } from '@/lib/api';
import { Bot } from '@/lib/types';
import { X, Send, Bot as BotIcon, CheckCircle2, MessageSquare, Sparkles } from 'lucide-react';
import Image from 'next/image';
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function getReadableTextColor(backgroundColor: string): string {
    const normalized = backgroundColor.replace('#', '').trim();
    const hex = normalized.length === 3
        ? normalized.split('').map((char) => char + char).join('')
        : normalized;

    if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
        return '#FFFFFF';
    }

    const red = parseInt(hex.slice(0, 2), 16);
    const green = parseInt(hex.slice(2, 4), 16);
    const blue = parseInt(hex.slice(4, 6), 16);
    const luminance = (0.299 * red) + (0.587 * green) + (0.114 * blue);
    return luminance > 160 ? '#0F172A' : '#FFFFFF';
}

interface ChatWindowProps {
    readonly bot: Bot;
    readonly onClose: () => void;
    readonly isSimulation?: boolean;
}

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
    actions?: Array<{ label: string; value: string }>;
    sources?: any[];
}

interface HistoryApiMessage {
    id: number;
    text: string;
    sender: 'user' | 'bot';
    created_at: string;
    actions?: any;
}

interface LeadFormField {
    name: string;
    label: string;
    type: 'text' | 'email' | 'tel' | 'textarea';
    required: boolean;
}

interface LeadFormConfig {
    title: string;
    fields: LeadFormField[];
}

export function ChatWindow({ bot, onClose, isSimulation = false }: ChatWindowProps) {
    const [isOpen, setIsOpen] = useState(isSimulation);
    const [showGreeting, setShowGreeting] = useState(true);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 0,
            text: bot.welcome_message || "Welcome to TangentCloud. Ask me anything.",
            sender: 'bot',
            timestamp: new Date(),
            actions: bot.quick_replies
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [conversationId, setConversationId] = useState<number | undefined>(undefined);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await dashboardApi.getChatHistory(bot.id);
                if (res.data && res.data.length > 0) {
                    const history = (res.data as HistoryApiMessage[]).map((msg) => ({
                        id: msg.id,
                        text: msg.text,
                        sender: msg.sender,
                        timestamp: new Date(msg.created_at)
                    }));
                    setMessages(history);
                }
            } catch (err) {
                console.error("Failed to load history", err);
            } finally {
                setIsLoadingHistory(false);
            }
        };

        if (isOpen && !isSimulation) {
            fetchHistory();
        } else if (isSimulation) {
            setIsLoadingHistory(false);
        }
    }, [bot.id, isOpen, isSimulation]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoadingHistory, isTyping]);

    const [showLeadForm, setShowLeadForm] = useState(false);
    const [leadFormConfig, setLeadFormConfig] = useState<LeadFormConfig | null>(null);
    const [leadCaptured, setLeadCaptured] = useState(false);

    useEffect(() => {
        const fetchForm = async () => {
            try {
                const res = await dashboardApi.getLeadForm(bot.id);
                if (res?.data?.fields?.length > 0) {
                    setLeadFormConfig(res.data);
                }
            } catch (e) {
                console.debug("Lead form not configured", e);
            }
        };
        fetchForm();
    }, [bot.id]);

    const handleSend = async (e?: React.FormEvent<HTMLFormElement>, textOverride?: string) => {
        if (e) e.preventDefault();
        const textToSubmit = textOverride || input;
        if (!textToSubmit.trim()) return;

        const userMsg: Message = {
            id: Date.now(),
            text: textToSubmit,
            sender: 'user',
            timestamp: new Date()
        };

        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        if (!textOverride) setInput('');
        setIsTyping(true);

        try {
            const response = await dashboardApi.chat(textToSubmit, conversationId, bot.id);
            if (response.data.conversation_id) {
                setConversationId(response.data.conversation_id);
            }

            const botMsg: Message = {
                id: Date.now() + 1,
                text: response.data.answer,
                sender: 'bot',
                timestamp: new Date(),
                actions: response.data.actions,
                sources: response.data.sources
            };
            setMessages(prev => [...prev, botMsg]);

            const userMessageCount = newMessages.filter(m => m.sender === 'user').length;
            if (!leadCaptured && leadFormConfig && userMessageCount >= 2) {
                setTimeout(() => setShowLeadForm(true), 1500);
            }

        } catch (error) {
            const status = (error as any)?.response?.status;
            if (status && status < 500) {
                console.warn("Chat request warning:", status);
            } else {
                console.error("Chat error:", error);
            }
            const errorText =
                (error as any)?.response?.data?.detail ||
                "Sorry, I encountered an error. Please try again.";
            const errorMsg: Message = {
                id: Date.now() + 1,
                text: errorText,
                sender: 'bot',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    const sendQuickReply = (text: string) => {
        handleSend(undefined, text);
    };

    const handleLeadSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data: Record<string, string> = {};
        formData.forEach((value, key) => { data[key] = typeof value === 'string' ? value : value.name; });

        setLoading(true);
        try {
            if (conversationId) {
                // Pass source as 'Chat Widget'
                await dashboardApi.submitLead(
                    bot.id,
                    conversationId,
                    data,
                    Intl.DateTimeFormat().resolvedOptions().timeZone, // Approximate location as country
                    'Chat Widget'
                );
            }
            setLeadCaptured(true);
            setShowLeadForm(false);
            setMessages(prev => [...prev, {
                id: Date.now(),
                text: "Thank you! I've shared your details with our team. They'll get back to you shortly.",
                sender: 'bot',
                timestamp: new Date()
            }]);
        } catch (err) {
            console.error("Lead submission error:", err);
        } finally {
            setLoading(false);
        }
    };

    const primaryColor = bot.primary_color || '#2563eb';
    const primaryTextColor = getReadableTextColor(primaryColor);
    const isRight = bot.position !== 'left';

    return (
        <div className={`fixed bottom-6 ${isRight ? 'right-6' : 'left-6'} z-[100] flex flex-col items-${isRight ? 'end' : 'start'} space-y-4`}>
            {/* Proactive Bubble */}
            {!isOpen && showGreeting && bot.bubble_greeting && (
                <div className="relative group">
                    <button
                        className={`bg-white px-5 py-3 rounded-2xl shadow-2xl border border-gray-100 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-700 relative text-left`}
                        onClick={() => { setIsOpen(true); setShowGreeting(false); }}
                    >
                        <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white border-r border-b border-gray-100 rotate-45" />
                        <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                        <span className="text-sm font-black text-gray-800">{bot.bubble_greeting}</span>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowGreeting(false); }}
                        className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-all hover:bg-gray-100"
                        aria-label="Close greeting"
                    >
                        <X className="w-3 h-3 text-gray-400" />
                    </button>
                </div>
            )}

            {/* Launch Bubble */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-16 h-16 rounded-3xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all animate-in zoom-in duration-500 overflow-hidden"
                    style={{
                        backgroundColor: primaryColor,
                        boxShadow: `0 20px 25px -5px ${primaryColor}40`
                    }}
                >
                    {bot.avatar_url ? (
                        <Image src={bot.avatar_url} alt={bot.name} width={64} height={64} className="w-full h-full object-cover" />
                    ) : (
                        <MessageSquare className="w-7 h-7 text-white fill-white" />
                    )}
                </button>
            )}

            {/* Actual Chat Window */}
            {isOpen && (
                <div className="w-[420px] h-[640px] bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500">
                    {/* Header */}
                    <div
                        className="p-6 flex justify-between items-center text-white"
                        style={{ backgroundColor: primaryColor }}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center overflow-hidden shadow-inner">
                                {bot.avatar_url ? (
                                    <Image src={bot.avatar_url} alt={bot.name} width={48} height={48} className="w-full h-full object-cover" />
                                ) : (
                                    <BotIcon className="w-6 h-6 fill-white" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-black text-base truncate">{bot.name}</h3>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Online & Ready</p>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => { setIsOpen(false); onClose(); }} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50 relative scroll-smooth">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                            >
                                <div className={`max-w-[85%] space-y-1`}>
                                    <div className={`rounded-3xl px-5 py-3 text-sm leading-relaxed [&_a]:underline [&_a]:underline-offset-2 [&_p]:m-0 [&_li]:my-1 [&_*]:text-inherit ${msg.sender === 'user'
                                        ? 'rounded-br-none shadow-lg'
                                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none shadow-sm'
                                        }`}
                                        style={msg.sender === 'user' ? { backgroundColor: primaryColor, boxShadow: `0 10px 15px -3px ${primaryColor}40`, color: primaryTextColor } : {}}
                                    >
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {msg.text}
                                        </ReactMarkdown>
                                    </div>

                                    {/* Actions / Quick Replies */}
                                    {msg.sender === 'bot' && msg.actions && msg.actions.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {msg.actions.map((action, idx) => (
                                                <button
                                                    key={`${msg.id}-action-${idx}`}
                                                    onClick={() => sendQuickReply(action.value)}
                                                    className="px-4 py-2 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-700 hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm active:scale-95"
                                                >
                                                    {action.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <span className={`text-[10px] font-bold uppercase tracking-tighter ${msg.sender === 'user' ? 'text-right block mr-2 text-gray-400' : 'ml-2 text-gray-400'}`}>
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex justify-start animate-in fade-in duration-300">
                                <div className="bg-white border-none py-3 px-5 rounded-3xl rounded-bl-none shadow-sm flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" />
                                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                                </div>
                            </div>
                        )}

                        {/* Lead Form Integration */}
                        {showLeadForm && leadFormConfig && (
                            <div className="absolute inset-0 bg-white/95 z-50 p-10 flex flex-col animate-in slide-in-from-bottom-full duration-500">
                                <div className="flex justify-between items-center mb-8">
                                    <div>
                                        <h3 className="text-xl font-black text-gray-900">{leadFormConfig.title}</h3>
                                        <p className="text-xs text-gray-500 font-medium">Please provide your details to continue</p>
                                    </div>
                                    <button onClick={() => setShowLeadForm(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                                        <X className="w-5 h-5 text-gray-400" />
                                    </button>
                                </div>
                                <form onSubmit={handleLeadSubmit} className="space-y-6 overflow-y-auto flex-1 pr-2 custom-scrollbar">
                                    {leadFormConfig.fields.map((field) => (
                                        <div key={field.name} className="space-y-1.5">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{field.label}</label>
                                            {field.type === 'textarea' ? (
                                                <textarea
                                                    disabled={loading}
                                                    name={field.name}
                                                    required={field.required}
                                                    className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 transition-all outline-none min-h-[100px]"
                                                    style={{ border: '2px solid transparent' }}
                                                />
                                            ) : (
                                                <input
                                                    disabled={loading}
                                                    type={field.type}
                                                    name={field.name}
                                                    required={field.required}
                                                    className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 transition-all outline-none"
                                                    style={{ border: '2px solid transparent' }}
                                                />
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-4 text-white rounded-[1.5rem] text-sm font-black shadow-2xl hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-2"
                                        style={{ backgroundColor: primaryColor, boxShadow: `0 20px 25px -5px ${primaryColor}40` }}
                                    >
                                        <CheckCircle2 className="w-5 h-5" /> Confirm Details
                                    </button>
                                </form>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-6 bg-white border-t border-gray-100">
                        <form onSubmit={handleSend} className="relative group">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={bot.placeholder_text || "Type your message..."}
                                className="w-full bg-gray-50 border-none rounded-[1.5rem] pl-6 pr-14 py-4 text-sm font-medium focus:ring-2 transition-all outline-none"
                                disabled={isTyping}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isTyping}
                                className="absolute right-2 top-2 w-10 h-10 rounded-[1rem] flex items-center justify-center text-white disabled:opacity-50 disabled:grayscale transition-all hover:scale-105 active:scale-90"
                                style={{ backgroundColor: primaryColor }}
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                        <div className="mt-4 flex items-center justify-center gap-1.5 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-default">
                            <Sparkles className="w-3 h-3 text-blue-600" />
                            <span className="text-[9px] font-black uppercase tracking-tighter text-gray-900">Powered by TangentCloud AI Bots</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
