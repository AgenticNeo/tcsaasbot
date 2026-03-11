'use client';

import { dashboardApi } from '@/lib/api';
import { Bot } from '@/lib/types';
import { Send, Bot as BotIcon, X, Sparkles, CheckCheck } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Image from 'next/image';

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

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
    actions?: Array<{ label: string; value: string }>;
}

export default function PublicChatPage() {
    const params = useParams();
    const botId = params.id ? Number.parseInt(params.id as string, 10) : null;

    const [bot, setBot] = useState<Bot | null>(null);
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [conversationId, setConversationId] = useState<number | undefined>(undefined);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (botId) {
            dashboardApi.getBotPublic(botId).then(res => {
                setBot(res.data);
                if (typeof document !== 'undefined') {
                    document.title = `${res.data.name} | TangentCloud AI Bots`;
                }
                const welcome = res.data.welcome_message || "Welcome to TangentCloud. Ask me anything.";
                setMessages([
                    {
                        id: 0,
                        text: welcome,
                        sender: 'bot',
                        timestamp: new Date(),
                        actions: res.data.quick_replies
                    }
                ]);
            }).catch(err => {
                console.error("Failed to load bot", err);
            }).finally(() => {
                setLoading(false);
            });
        }
    }, [botId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = async (textToSend?: string) => {
        const text = textToSend || input;
        if (!text.trim() || !botId) return;

        const userMsg: Message = {
            id: Date.now(),
            text: text,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        if (!textToSend) setInput('');
        setIsTyping(true);

        try {
            const response = await dashboardApi.chatPublic(text, botId, conversationId);

            if (response.data.conversation_id) {
                setConversationId(response.data.conversation_id);
            }

            const botMsg: Message = {
                id: Date.now() + 1,
                text: response.data.answer,
                sender: 'bot',
                timestamp: new Date(),
                actions: response.data.actions
            };
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            const status = (error as any)?.response?.status;
            if (status && status < 500) {
                console.warn('Chat request warning:', status);
            } else {
                console.error('Chat error:', error);
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

    const onClose = () => {
        if (typeof globalThis.window !== 'undefined' && globalThis.window.parent) {
            globalThis.window.parent.postMessage('tangentcloud-close', '*');
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white">
            <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center mb-4 animate-pulse">
                <BotIcon className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">Syncing Agent DNA</p>
        </div>
    );

    if (!bot) return (
        <div className="flex items-center justify-center min-h-screen bg-white text-gray-400 font-bold text-sm">
            404 | AGENT_NOT_FOUND
        </div>
    );

    const primaryColor = bot.primary_color || '#2563eb';
    const primaryTextColor = getReadableTextColor(primaryColor);

    return (
        <div className="flex flex-col h-screen bg-white selection:bg-blue-100 overflow-hidden">
            {/* Premium Header */}
            <header
                className="px-6 py-5 flex items-center justify-between shadow-2xl relative z-20"
                style={{ backgroundColor: primaryColor }}
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center overflow-hidden shadow-inner border border-white/10">
                        {bot.avatar_url ? (
                            <Image src={bot.avatar_url} alt={bot.name} width={48} height={48} className="w-full h-full object-cover" />
                        ) : (
                            <BotIcon className="w-6 h-6 text-white fill-white/20" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <h1 className="font-black text-white text-lg tracking-tight truncate leading-tight">{bot.name}</h1>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                            <p className="text-[9px] font-black text-white/80 uppercase tracking-widest leading-none">Online & Active</p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2.5 hover:bg-white/10 rounded-2xl transition-all active:scale-95 group"
                >
                    <X className="w-6 h-6 text-white opacity-80 group-hover:opacity-100" />
                </button>

                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
            </header>

            {/* Chat Messages Area */}
            <main className="flex-1 overflow-y-auto p-5 bg-[#F9FAFB] space-y-6 scroll-smooth custom-scrollbar relative">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none overflow-hidden flex flex-wrap gap-20 p-20 items-center justify-center">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <BotIcon key={`bg-icon-${i}`} className="w-40 h-40 text-gray-900 rotate-12" />
                    ))}
                </div>

                <div className="flex flex-col space-y-6 relative z-10">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}
                        >
                            <div className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`relative px-5 py-3.5 text-sm leading-relaxed shadow-sm transition-all hover:shadow-md [&_a]:underline [&_a]:underline-offset-2 [&_p]:m-0 [&_li]:my-1 [&_*]:text-inherit ${msg.sender === 'user'
                                    ? 'rounded-[1.5rem] rounded-br-none font-medium'
                                    : 'bg-white text-gray-800 border border-gray-100 rounded-[1.5rem] rounded-bl-none shadow-[0_2px_10px_rgba(0,0,0,0.03)]'
                                    }`}
                                    style={msg.sender === 'user' ? { backgroundColor: primaryColor, boxShadow: `0 10px 15px -3px ${primaryColor}30`, color: primaryTextColor } : {}}
                                >
                                    <div className="max-w-none">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {msg.text}
                                        </ReactMarkdown>
                                    </div>
                                </div>

                                {/* Actions / Quick Replies */}
                                {msg.sender === 'bot' && msg.actions && msg.actions.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {msg.actions.map((action, idx) => (
                                            <button
                                                key={`${msg.id}-action-${idx}`}
                                                onClick={() => handleSend(action.value)}
                                                className="px-4 py-2 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-700 hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm active:scale-95"
                                            >
                                                {action.label}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <div className={`mt-1.5 flex items-center gap-1.5 px-2 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <span className="text-[9px] font-black uppercase text-gray-400 tracking-tighter">
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {msg.sender === 'user' && <CheckCheck className="w-3 h-3 text-blue-500" />}
                                </div>
                            </div>
                        </div>
                    ))}

                    {isTyping && (
                        <div className="flex justify-start animate-in fade-in slide-in-from-left-2 duration-300">
                            <div className="bg-white px-5 py-3.5 rounded-[1.5rem] rounded-bl-none shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-gray-50 flex gap-1.5 items-center">
                                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} className="h-4" />
                </div>
            </main>

            {/* Input Footer */}
            <footer className="p-5 bg-white border-t border-gray-100 relative z-20">
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="max-w-4xl mx-auto flex items-end gap-3"
                >
                    <div className="flex-1 relative group">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder={bot.placeholder_text || "Type your message..."}
                            className="w-full bg-[#F3F4F6] border-none rounded-[1.5rem] px-5 py-3.5 text-sm font-medium focus:ring-2 transition-all outline-none resize-none max-h-32 min-h-[52px]"
                            style={{ '--tw-ring-color': `${primaryColor}40` } as any}
                            disabled={isTyping}
                            rows={1}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!input.trim() || isTyping}
                        className="text-white w-12 h-12 rounded-[1rem] flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50 disabled:grayscale shrink-0"
                        style={{ backgroundColor: primaryColor, boxShadow: `0 10px 15px -3px ${primaryColor}40` }}
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>

                <div className="flex items-center justify-center gap-1.5 mt-4 opacity-40 hover:opacity-100 transition-opacity cursor-pointer group">
                    <Sparkles className="w-3 h-3 text-blue-600 group-hover:animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-900">Powered by TangentCloud AI Bots</span>
                </div>
            </footer>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #E5E7EB;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #D1D5DB;
                }
            `}</style>
        </div>
    );
}
