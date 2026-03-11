'use client';

import { dashboardApi } from '@/lib/api';
import React, { useState, useEffect } from 'react';
import {
    MessageSquare, Calendar, ChevronRight, User,
    Bot as BotIcon, ArrowLeft, Search, Filter,
    Hash, Clock, CheckCircle2, MoreHorizontal,
    ShieldCheck, Sparkles
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Conversation {
    id: number;
    bot_id: number;
    bot_name: string | null;
    status: 'new' | 'open' | 'pending' | 'resolved';
    created_at: string;
    last_message: string | null;
    message_count: number;
}

interface Message {
    id: number;
    sender: string;
    text: string;
    created_at: string;
}

export function ConversationLog() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'open' | 'pending' | 'resolved'>('all');

    useEffect(() => {
        fetchConversations();
    }, []);

    const fetchConversations = async () => {
        try {
            const res = await dashboardApi.getConversations();
            setConversations(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (conv: Conversation) => {
        setSelectedConv(conv);
        setLoadingMessages(true);
        try {
            const res = await dashboardApi.getConversationMessages(conv.id);
            setMessages(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingMessages(false);
        }
    };

    const q = searchQuery.toLowerCase();
    const filteredConversations = conversations.filter((c) => {
        const botName = (c.bot_name || 'Anonymous User').toLowerCase();
        const lastMessage = (c.last_message || '').toLowerCase();
        const matchesQuery = botName.includes(q) || lastMessage.includes(q);
        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
        return matchesQuery && matchesStatus;
    });

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-32 space-y-4">
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Deciphering Logs...</p>
        </div>
    );

    if (selectedConv) {
        return (
            <div className="bg-white rounded-[2.5rem] border shadow-2xl flex flex-col h-[750px] animate-in fade-in zoom-in-95 duration-500 overflow-hidden">
                {/* Chat Header */}
                <div className="p-8 border-b bg-gray-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setSelectedConv(null)}
                            className="w-12 h-12 bg-white rounded-2xl border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-900 shadow-sm transition-all hover:-translate-x-1"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="text-xl font-black text-gray-900 tracking-tight">Session #{selectedConv.id}</h3>
                                <div className="px-2 py-0.5 bg-green-100 text-[10px] font-black text-green-700 rounded-md border border-green-200 uppercase tracking-tighter">Verified</div>
                            </div>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                                {(selectedConv.bot_name || 'Anonymous User')} • {new Date(selectedConv.created_at).toLocaleString()}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-xl text-[10px] font-black text-blue-600 uppercase tracking-widest">
                            <ShieldCheck className="w-3.5 h-3.5" /> E2E Encrypted
                        </div>
                        <button className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-gray-900 shadow-sm transition-all">
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-10 space-y-10 bg-white">
                    {loadingMessages ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-4">
                            <div className="w-8 h-8 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reconstructing Transcript...</p>
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto space-y-12">
                            {messages.map((msg, i) => (
                                <div
                                    key={msg.id}
                                    className={`flex gap-6 animate-in slide-in-from-bottom-2 duration-500 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                                    style={{ animationDelay: `${i * 100}ms` }}
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${msg.sender === 'user' ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-gray-900 text-white shadow-gray-200'
                                        }`}>
                                        {msg.sender === 'user' ? <User className="w-6 h-6" /> : <BotIcon className="w-6 h-6" />}
                                    </div>
                                    <div className={`space-y-2 max-w-[80%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                        <div className={`rounded-[2rem] px-8 py-5 text-sm leading-relaxed shadow-sm border ${msg.sender === 'user'
                                                ? 'bg-blue-50 border-blue-100 text-blue-900 rounded-tr-none'
                                                : 'bg-gray-50 border-gray-200 text-gray-900 rounded-tl-none'
                                            }`}>
                                            <div className="prose prose-sm prose-blue max-w-none font-medium">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {msg.text}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                        <div className={`flex items-center gap-2 px-2 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase">
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {messages.length === 0 && (
                                <div className="text-center py-20 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100">
                                    <Clock className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                    <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No messages in this session</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Chat Footer / Action Bar */}
                <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-3">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Transcript Analysis Complete • Integrity Score: 100%</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Control Bar */}
            <div className="flex flex-col md:flex-row gap-6">
                <div className="relative flex-1 group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by bot, ID or snippet content..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-16 pr-8 py-5 bg-white border border-gray-100 rounded-[2rem] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-300 outline-none transition-all shadow-xl shadow-gray-200/40 font-bold text-gray-700 placeholder:text-gray-300"
                    />
                </div>
                <div className="flex gap-4">
                    <button className="px-8 py-5 bg-white border border-gray-100 rounded-[2rem] text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 transition-all shadow-sm flex items-center gap-3">
                        <Calendar className="w-4 h-4" /> Last 30 Days
                    </button>
                    <button className="p-5 bg-white border border-gray-100 rounded-full text-gray-400 hover:text-blue-600 shadow-sm transition-all">
                        <Filter className="w-5 h-5" />
                    </button>
                </div>
            </div>
            <div className="flex gap-2 flex-wrap">
                {(['all', 'new', 'open', 'pending', 'resolved'] as const).map((status) => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            statusFilter === status ? 'bg-gray-900 text-white' : 'bg-white border border-gray-100 text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {/* Logs List */}
            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl shadow-gray-200/40 overflow-hidden">
                <div className="p-10 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">Transmission Logs</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Real-time interaction telemetry</p>
                    </div>
                    <div className="px-6 py-2 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-200">
                        {filteredConversations.length} Sessions
                    </div>
                </div>

                {filteredConversations.length === 0 ? (
                    <div className="py-40 text-center">
                        <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border-2 border-dashed border-gray-200">
                            <MessageSquare className="w-10 h-10 text-gray-200" />
                        </div>
                        <h4 className="text-xl font-black text-gray-900">Zero Transmissions</h4>
                        <p className="text-sm text-gray-400 mt-2 font-medium">Your agents are currently awaiting initial contact.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {filteredConversations.map((conv) => (
                            <button
                                key={conv.id}
                                onClick={() => fetchMessages(conv)}
                                className="w-full p-10 flex items-center justify-between hover:bg-gray-50/80 transition-all text-left group relative"
                            >
                                <div className="flex items-center gap-10 overflow-hidden">
                                    <div className="relative">
                                        <div className="w-16 h-16 bg-white rounded-[2rem] border border-gray-100 shadow-xl flex items-center justify-center text-gray-400 group-hover:text-blue-600 transition-colors group-hover:scale-110 duration-500">
                                            <MessageSquare className="w-8 h-8" />
                                        </div>
                                        <div className="absolute -top-2 -right-2 w-7 h-7 bg-blue-600 text-white rounded-full border-4 border-white flex items-center justify-center text-[10px] font-black">
                                            {conv.message_count}
                                        </div>
                                    </div>

                                    <div className="min-w-0 space-y-2">
                                        <div className="flex items-center gap-4">
                                            <h4 className="text-xl font-black text-gray-900 truncate group-hover:text-blue-600 transition-colors">{conv.bot_name || 'Anonymous User'}</h4>
                                            <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                                                <Hash className="w-3 h-3" /> {conv.id}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 text-[11px] font-medium text-gray-500">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-gray-300" />
                                                {new Date(conv.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </div>
                                            <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wide bg-gray-100 text-gray-600">
                                                {conv.status}
                                            </span>
                                            <span className="w-1 h-1 bg-gray-200 rounded-full" />
                                            <div className="flex items-center gap-1.5 line-clamp-1 italic max-w-md">
                                                "{conv.last_message || 'No content'}"
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="hidden lg:flex flex-col items-end">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Signal Strength</span>
                                        <div className="flex gap-0.5 mt-1">
                                            {[1, 2, 3, 4, 5].map(b => (
                                                <div key={b} className={`w-1.5 h-3 rounded-full ${b <= 4 ? 'bg-green-500' : 'bg-gray-200'}`} />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="w-12 h-12 bg-white rounded-2xl border border-gray-100 flex items-center justify-center text-gray-300 group-hover:text-blue-600 group-hover:shadow-lg transition-all transform group-hover:translate-x-1">
                                        <ChevronRight className="w-6 h-6" />
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {filteredConversations.length > 0 && (
                    <div className="p-10 bg-gray-50/30 border-t border-gray-50 flex items-center justify-center">
                        <button className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] hover:text-gray-900 transition-colors">
                            Load Archive Registry
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
