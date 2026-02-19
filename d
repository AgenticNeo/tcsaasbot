'use client';

import React, { useState } from 'react';
import {
    MessageCircle, Search, Filter, MoreVertical, Send, Paperclip,
    Smile, Phone, Video, Circle, CheckCheck, Clock, Star, Archive,
    User, ArrowLeft, Plus
} from 'lucide-react';

interface Message {
    id: string;
    sender: 'user' | 'bot' | 'agent';
    content: string;
    timestamp: Date;
    read?: boolean;
}

interface Conversation {
    id: string;
    userName: string;
    userAvatar?: string;
    lastMessage: string;
    timestamp: Date;
    unread: number;
    status: 'new' | 'open' | 'pending' | 'resolved';
    assignedTo?: string;
    messages: Message[];
}

export function LiveChat({ botId }: { botId: number }) {
    const [conversations, setConversations] = useState<Conversation[]>([
        {
            id: '1',
            userName: 'John Smith',
            lastMessage: 'I need help with my order',
            timestamp: new Date(Date.now() - 1000 * 60 * 5),
            unread: 2,
            status: 'new',
            messages: [
                { id: '1', sender: 'user', content: 'Hi, I placed an order yesterday', timestamp: new Date(Date.now() - 1000 * 60 * 10) },
                { id: '2', sender: 'bot', content: 'Hello John! I can help you with your order. Can you please provide your order number?', timestamp: new Date(Date.now() - 1000 * 60 * 9) },
                { id: '3', sender: 'user', content: 'I need help with my order', timestamp: new Date(Date.now() - 1000 * 60 * 5) }
            ]
        },
        {
            id: '2',
            userName: 'Sarah Johnson',
            lastMessage: 'Thank you for your help!',
            timestamp: new Date(Date.now() - 1000 * 60 * 30),
            unread: 0,
            status: 'resolved',
            assignedTo: 'Agent Mike',
            messages: [
                { id: '1', sender: 'user', content: 'I have a question about pricing', timestamp: new Date(Date.now() - 1000 * 60 * 45) },
                { id: '2', sender: 'agent', content: 'Hi Sarah! I would be happy to help. What would you like to know?', timestamp: new Date(Date.now() - 1000 * 60 * 40) },
                { id: '3', sender: 'user', content: 'Thank you for your help!', timestamp: new Date(Date.now() - 1000 * 60 * 30) }
            ]
        },
        {
            id: '3',
            userName: 'Mike Chen',
            lastMessage: 'When will my refund be processed?',
            timestamp: new Date(Date.now() - 1000 * 60 * 60),
            unread: 1,
            status: 'pending',
            assignedTo: 'Agent Emily',
            messages: [
                { id: '1', sender: 'user', content: 'When will my refund be processed?', timestamp: new Date(Date.now() - 1000 * 60 * 60) }
            ]
        }
    ]);

    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'new': return 'bg-blue-500';
            case 'open': return 'bg-green-500';
            case 'pending': return 'bg-amber-500';
            case 'resolved': return 'bg-gray-500';
            default: return 'bg-gray-500';
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'new': return 'bg-blue-100 text-blue-700';
            case 'open': return 'bg-green-100 text-green-700';
            case 'pending': return 'bg-amber-100 text-amber-700';
            case 'resolved': return 'bg-gray-100 text-gray-700';
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

    const sendMessage = () => {
        if (!newMessage.trim() || !selectedConversation) return;

        const message: Message = {
            id: Date.now().toString(),
            sender: 'agent',
            content: newMessage,
            timestamp: new Date()
        };

        setConversations(conversations.map(c => {
            if (c.id === selectedConversation.id) {
                return {
                    ...c,
                    messages: [...c.messages, message],
                    lastMessage: newMessage,
                    timestamp: new Date(),
                    status: 'open' as const
                };
            }
            return c;
        }));

        setNewMessage('');
    };

    const filteredConversations = conversations.filter(c => {
        const matchesSearch = c.userName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterStatus === 'all' || c.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const newCount = conversations.filter(c => c.status === 'new').length;
    const openCount = conversations.filter(c => c.status === 'open').length;

    return (
        <div className= "h-[calc(100vh-200px)] flex bg-white rounded-2xl border overflow-hidden" >
        {/* Conversation List */ }
        < div className = {`${selectedConversation ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col border-r`
}>
    {/* Header */ }
    < div className = "p-4 border-b" >
        <div className="flex items-center justify-between mb-4" >
            <h2 className="text-lg font-black text-gray-900" > Inbox </h2>
                < button className = "p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600" >
                    <Plus className="w-4 h-4" />
                        </button>
                        </div>

{/* Search */ }
<div className="relative mb-3" >
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
                            type="text"
placeholder = "Search conversations..."
value = { searchQuery }
onChange = {(e) => setSearchQuery(e.target.value)}
className = "w-full pl-9 pr-3 py-2 bg-gray-50 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
    />
    </div>

{/* Filter */ }
<div className="flex gap-1" >
{
    ['all', 'new', 'open', 'pending', 'resolved'].map(status => (
        <button
                                key= { status }
                                onClick = {() => setFilterStatus(status)}
className = {`px-2 py-1 rounded text-xs font-bold capitalize ${filterStatus === status
        ? 'bg-gray-900 text-white'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`}
                            >
    { status }
    </button>
                        ))}
</div>
    </div>

{/* Stats */ }
<div className="px-4 py-2 bg-gray-50 flex gap-4 text-xs" >
    <span className="text-blue-600 font-bold" > { newCount } new</span>
        < span className = "text-green-600 font-bold" > { openCount } open </span>
            </div>

{/* Conversations */ }
<div className="flex-1 overflow-y-auto" >
{
    filteredConversations.map(conv => (
        <div
                            key= { conv.id }
                            onClick = {() => setSelectedConversation(conv)}
className = {`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${selectedConversation?.id === conv.id ? 'bg-blue-50' : ''
    }`}
                        >
    <div className="flex items-start gap-3" >
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm" >
            { conv.userName.split(' ').map(n => n[0]).join('') }
            </div>
            < div className = "flex-1 min-w-0" >
                <div className="flex items-center justify-between" >
                    <span className="font-bold text-gray-900 truncate" > { conv.userName } </span>
                        < span className = "text-xs text-gray-400" > { formatTime(conv.timestamp) } </span>
                            </div>
                            < p className = "text-sm text-gray-500 truncate" > { conv.lastMessage } </p>
                                < div className = "flex items-center gap-2 mt-1" >
                                    <span className={ `px-1.5 py-0.5 rounded text-[10px] font-bold ${getStatusBadge(conv.status)}` }>
                                        { conv.status }
                                        </span>
{
    conv.unread > 0 && (
        <span className="w-5 h-5 bg-blue-500 text-white rounded-full text-xs font-bold flex items-center justify-center" >
            { conv.unread }
            </span>
                                        )
}
</div>
    </div>
    </div>
    </div>
                    ))}
</div>
    </div>

{/* Chat Area */ }
{
    selectedConversation ? (
        <div className= "flex-1 flex flex-col" >
        {/* Chat Header */ }
        < div className = "p-4 border-b flex items-center justify-between" >
            <div className="flex items-center gap-3" >
                <button 
                                onClick={ () => setSelectedConversation(null) }
    className = "md:hidden p-2 hover:bg-gray-100 rounded-lg"
        >
        <ArrowLeft className="w-5 h-5" />
            </button>
            < div className = "w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm" >
                { selectedConversation.userName.split(' ').map(n => n[0]).join('') }
                </div>
                < div >
                <h3 className="font-bold text-gray-900" > { selectedConversation.userName } </h3>
                    < div className = "flex items-center gap-2" >
                        <span className={ `w-2 h-2 rounded-full ${getStatusColor(selectedConversation.status)}` } />
                            < span className = "text-xs text-gray-500 capitalize" > { selectedConversation.status } </span>
    {
        selectedConversation.assignedTo && (
            <span className="text-xs text-gray-400" >• { selectedConversation.assignedTo } </span>
                                    )
    }
    </div>
        </div>
        </div>
        < div className = "flex items-center gap-2" >
            <button className="p-2 hover:bg-gray-100 rounded-lg" >
                <Phone className="w-5 h-5 text-gray-600" />
                    </button>
                    < button className = "p-2 hover:bg-gray-100 rounded-lg" >
                        <Video className="w-5 h-5 text-gray-600" />
                            </button>
                            < button className = "p-2 hover:bg-gray-100 rounded-lg" >
                                <MoreVertical className="w-5 h-5 text-gray-600" />
                                    </button>
                                    </div>
                                    </div>

    {/* Messages */ }
    <div className="flex-1 overflow-y-auto p-4 space-y-4" >
    {
        selectedConversation.messages.map(msg => (
            <div key= { msg.id } className = {`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`} >
        <div className={
            `max-w-[70%] ${msg.sender === 'agent'
                ? 'bg-blue-500 text-white rounded-2xl rounded-br-md'
                : msg.sender === 'bot'
                    ? 'bg-gray-100 text-gray-900 rounded-2xl'
                    : 'bg-gray-900 text-white rounded-2xl rounded-bl-md'
            } px-4 py-2`
    }>
        <p className="text-sm" > { msg.content } </p>
            < div className = {`flex items-center gap-1 mt-1 ${msg.sender === 'agent' ? 'justify-end' : ''
                }`
}>
    <span className={ `text-[10px] ${msg.sender === 'agent' ? 'text-blue-200' : 'text-gray-400'}` }>
        { formatTime(msg.timestamp) }
        </span>
{
    msg.sender === 'agent' && (
        <CheckCheck className="w-3 h-3 text-blue-200" />
                                        )
}
</div>
    </div>
    </div>
                        ))}
</div>

{/* Input */ }
<div className="p-4 border-t" >
    <div className="flex items-center gap-2" >
        <button className="p-2 hover:bg-gray-100 rounded-lg" >
            <Paperclip className="w-5 h-5 text-gray-600" />
                </button>
                < input
type = "text"
value = { newMessage }
onChange = {(e) => setNewMessage(e.target.value)}
onKeyPress = {(e) => e.key === 'Enter' && sendMessage()}
placeholder = "Type a message..."
className = "flex-1 px-4 py-2 bg-gray-50 rounded-full focus:ring-2 focus:ring-blue-500 outline-none"
    />
    <button className="p-2 hover:bg-gray-100 rounded-lg" >
        <Smile className="w-5 h-5 text-gray-600" />
            </button>
            < button
onClick = { sendMessage }
className = "p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
    >
    <Send className="w-5 h-5" />
        </button>
        </div>
        </div>
        </div>
            ) : (
    <div className= "hidden md:flex flex-1 items-center justify-center" >
    <div className="text-center" >
        <MessageCircle className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="font-bold text-gray-900" > Select a conversation </p>
                < p className = "text-sm text-gray-500" > Choose from your existing conversations </p>
                    </div>
                    </div>
            )}
</div>
    );
}
