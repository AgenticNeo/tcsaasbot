'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
    MessageCircle, Search, MoreVertical, Send, Paperclip,
    Smile, Phone, Video, CheckCheck, ArrowLeft, Plus, Loader2
} from 'lucide-react';

interface Message {
    id: string;
    sender: 'user' | 'bot' | 'agent';
    content: string;
    timestamp: Date;
}

interface Conversation {
    id: string;
    userName: string;
    lastMessage: string;
    lastMessageSender?: 'user' | 'bot' | 'agent' | null;
    timestamp: Date;
    unread: number;
    status: 'new' | 'open' | 'pending' | 'resolved';
    assignedTo?: string;
    messageCount: number;
    messages: Message[];
}

import { dashboardApi } from '@/lib/api';

export function LiveChat({ botId }: { botId: number }) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    useEffect(() => {
        const fetchConvs = async () => {
            try {
                const res = await dashboardApi.getConversations();
                const mapped: Conversation[] = res.data
                    .filter((c: any) => Number(c.bot_id) === botId)
                    .map((c: any) => ({
                        id: c.id.toString(),
                        userName: `Conversation #${c.id}`,
                        lastMessage: c.last_message || 'No messages yet',
                        lastMessageSender: c.last_message_sender || null,
                        timestamp: new Date(c.created_at),
                        unread: 0,
                        status: (c.status || 'new') as any,
                        assignedTo: c.bot_name || undefined,
                        messageCount: Number(c.message_count || 0),
                        messages: []
                    }));
                setConversations((prev) => {
                    const prevById = new Map(prev.map((item) => [item.id, item]));
                    return mapped.map((item) => {
                        const existing = prevById.get(item.id);
                        const nextUnread = existing
                            ? (selectedConversationId === item.id
                                ? 0
                                : Math.max(existing.unread, item.messageCount - existing.messageCount))
                            : 0;
                        return existing
                            ? {
                                ...item,
                                unread: nextUnread,
                                messages: existing.messages,
                            }
                            : item;
                    });
                });
                setSelectedConversationId((prevSelected) => {
                    if (!mapped.length) {
                        return null;
                    }
                    if (prevSelected && mapped.some((item) => item.id === prevSelected)) {
                        return prevSelected;
                    }
                    return mapped[0].id;
                });
            } catch (err) {
                console.error('Failed to fetch conversations', err);
            } finally {
                setLoading(false);
            }
        };
        fetchConvs();
        const interval = setInterval(fetchConvs, 10000);
        return () => clearInterval(interval);
    }, [botId, selectedConversationId]);

    useEffect(() => {
        if (!selectedConversationId) return;
        const fetchMessages = async () => {
            setMessagesLoading(true);
            try {
                const res = await dashboardApi.getConversationMessages(parseInt(selectedConversationId));
                setConversations(prev => prev.map(c =>
                    c.id === selectedConversationId
                        ? {
                            ...c, messages: res.data.map((m: any) => ({
                                id: m.id.toString(),
                                sender: m.sender,
                                content: m.text,
                                timestamp: new Date(m.created_at)
                            })),
                            messageCount: res.data.length,
                            unread: 0,
                        }
                        : c
                ));
            } catch (err) {
                console.error('Failed to fetch messages', err);
            } finally {
                setMessagesLoading(false);
            }
        };
        fetchMessages();
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [selectedConversationId]);

    const selectedConversation = useMemo(
        () => conversations.find((c) => c.id === selectedConversationId) ?? null,
        [conversations, selectedConversationId]
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'new': return 'bg-blue-100 text-blue-700';
            case 'open': return 'bg-green-100 text-green-700';
            case 'pending': return 'bg-amber-100 text-amber-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const formatTime = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return date.toLocaleDateString();
    };

    const openConversation = (id: string) => {
        setSelectedConversationId(id);
        setConversations((prev) => prev.map((c) => (
            c.id === id ? { ...c, unread: 0, status: c.status === 'new' ? 'open' : c.status } : c
        )));
    };

    const createConversation = async () => {
        try {
            const res = await dashboardApi.createConversation(botId);
            const c = res.data;
            const created: Conversation = {
                id: c.id.toString(),
                userName: `Conversation #${c.id}`,
                lastMessage: c.last_message || 'No messages yet',
                lastMessageSender: c.last_message_sender || null,
                timestamp: new Date(c.created_at),
                unread: 0,
                status: 'new',
                assignedTo: c.bot_name || undefined,
                messageCount: Number(c.message_count || 0),
                messages: []
            };
            setConversations((prev) => [created, ...prev]);
            setSelectedConversationId(created.id);
        } catch (err) {
            console.error('Failed to create conversation', err);
        }
    };

    const clearCurrentBotInbox = async () => {
        if (!confirm('Clear all inbox conversations for this bot?')) return;
        try {
            await dashboardApi.clearBotConversations(botId);
            setConversations([]);
            setSelectedConversationId(null);
        } catch (err) {
            console.error('Failed to clear inbox', err);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedConversationId) return;
        const text = newMessage.trim();
        try {
            const res = await dashboardApi.sendAgentMessage(parseInt(selectedConversationId), text);
            setConversations((prev) => prev.map((c) => {
                if (c.id !== selectedConversationId) return c;
                return {
                    ...c,
                    messages: [...c.messages, {
                        id: res.data.id.toString(),
                        sender: 'agent',
                        content: text,
                        timestamp: new Date()
                    }],
                    lastMessage: text,
                    lastMessageSender: 'agent',
                    timestamp: new Date(),
                    status: 'pending',
                    messageCount: c.messageCount + 1,
                    unread: 0,
                };
            }));
            setNewMessage('');
        } catch (err) {
            console.error('Failed to send agent message', err);
        }
    };
    const formatPreview = (conversation: Conversation) => {
        const senderLabel = conversation.lastMessageSender === 'user'
            ? 'Visitor'
            : conversation.lastMessageSender === 'agent'
                ? 'Agent'
                : conversation.lastMessageSender === 'bot'
                    ? 'Assistant'
                    : '';
        if (!conversation.lastMessage || conversation.lastMessage === 'No messages') {
            return 'No messages yet';
        }
        return senderLabel ? `${senderLabel}: ${conversation.lastMessage}` : conversation.lastMessage;
    };
    const filteredConversations = conversations.filter(c => {
        const q = searchQuery.toLowerCase();
        const matchesSearch = (c.userName || '').toLowerCase().includes(q)
            || (c.lastMessage || '').toLowerCase().includes(q)
            || (c.assignedTo || '').toLowerCase().includes(q);
        const matchesFilter = filterStatus === 'all' || c.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const newCount = conversations.filter(c => c.status === 'new').length;

    if (loading) {
        return (
            <div className="h-[calc(100vh-200px)] flex items-center justify-center bg-white rounded-2xl border">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-200px)] flex bg-white rounded-2xl border overflow-hidden">
            <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col border-r`}>
                <div className="p-4 border-b">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-black text-gray-900">Inbox</h2>
                        <button
                            onClick={createConversation}
                            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                            type="button"
                            title="New conversation"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-gray-50 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div className="flex gap-1 flex-wrap">
                        {['all', 'new', 'open', 'pending', 'resolved'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-2 py-1 rounded text-xs font-bold capitalize ${filterStatus === status ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                type="button"
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="px-4 py-2 bg-gray-50 flex gap-4 text-xs items-center justify-between">
                    <span className="text-blue-600 font-bold">{newCount} new</span>
                    <button
                        onClick={clearCurrentBotInbox}
                        className="text-[10px] font-bold text-gray-500 hover:text-red-600 uppercase tracking-widest"
                        type="button"
                    >
                        Clear Inbox
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {!filteredConversations.length ? (
                        <div className="p-6 text-center text-sm text-gray-500">
                            {conversations.length
                                ? 'No conversations match the current filters.'
                                : 'No conversations yet. Start one from the + button.'}
                        </div>
                    ) : filteredConversations.map(conv => (
                        <button
                            key={conv.id}
                            onClick={() => openConversation(conv.id)}
                            className={`w-full p-4 border-b text-left cursor-pointer hover:bg-gray-50 ${selectedConversation?.id === conv.id ? 'bg-blue-50' : ''}`}
                            type="button"
                        >
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                    {conv.userName.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-gray-900 truncate">{conv.userName}</span>
                                        <span className="text-xs text-gray-400">{formatTime(conv.timestamp)}</span>
                                    </div>
                                    {conv.assignedTo && (
                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 truncate">
                                            {conv.assignedTo}
                                        </p>
                                    )}
                                    <p className="text-sm text-gray-500 truncate">{formatPreview(conv)}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${getStatusBadge(conv.status)}`}>
                                            {conv.status}
                                        </span>
                                        {conv.unread > 0 && (
                                            <span className="w-5 h-5 bg-blue-500 text-white rounded-full text-xs font-bold flex items-center justify-center">
                                                {conv.unread}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
            {selectedConversation ? (
                <div className="flex-1 flex flex-col">
                    <div className="p-4 border-b flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setSelectedConversationId(null)} className="md:hidden p-2 hover:bg-gray-100 rounded-lg" type="button">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                {selectedConversation.userName.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">{selectedConversation.userName}</h3>
                                <span className="text-xs text-gray-500 capitalize">{selectedConversation.status}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="p-2 hover:bg-gray-100 rounded-lg" type="button"><Phone className="w-5 h-5 text-gray-600" /></button>
                            <button className="p-2 hover:bg-gray-100 rounded-lg" type="button"><Video className="w-5 h-5 text-gray-600" /></button>
                            <button className="p-2 hover:bg-gray-100 rounded-lg" type="button"><MoreVertical className="w-5 h-5 text-gray-600" /></button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messagesLoading && !selectedConversation.messages.length ? (
                            <div className="h-full flex items-center justify-center text-sm text-gray-500">
                                Loading conversation...
                            </div>
                        ) : selectedConversation.messages.length ? selectedConversation.messages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] px-4 py-2 ${msg.sender === 'agent' ? 'bg-blue-500 text-white rounded-2xl rounded-br-md' : msg.sender === 'bot' ? 'bg-gray-100 text-gray-900 rounded-2xl' : 'bg-gray-900 text-white rounded-2xl rounded-bl-md'}`}>
                                    <p className="text-sm">{msg.content}</p>
                                    <div className={`flex items-center gap-1 mt-1 ${msg.sender === 'agent' ? 'justify-end' : ''}`}>
                                        <span className={`text-[10px] ${msg.sender === 'agent' ? 'text-blue-200' : 'text-gray-400'}`}>
                                            {formatTime(msg.timestamp)}
                                        </span>
                                        {msg.sender === 'agent' && <CheckCheck className="w-3 h-3 text-blue-200" />}
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="h-full flex items-center justify-center text-sm text-gray-500">
                                No messages in this conversation yet.
                            </div>
                        )}
                    </div>
                    <form
                        className="p-4 border-t"
                        onSubmit={(e) => {
                            e.preventDefault();
                            sendMessage();
                        }}
                    >
                        <div className="flex items-center gap-2">
                            <button className="p-2 hover:bg-gray-100 rounded-lg" type="button"><Paperclip className="w-5 h-5 text-gray-600" /></button>
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 px-4 py-2 bg-gray-50 rounded-full focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <button className="p-2 hover:bg-gray-100 rounded-lg" type="button"><Smile className="w-5 h-5 text-gray-600" /></button>
                            <button type="submit" className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600">
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="hidden md:flex flex-1 items-center justify-center">
                    <div className="text-center">
                        <MessageCircle className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                        <p className="font-bold text-gray-900">Select a conversation</p>
                        <p className="text-sm text-gray-500">Choose from your existing conversations</p>
                    </div>
                </div>
            )}
        </div>
    );
}
