'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
    MessageCircle, Trash2, Edit2, X, Search, Sparkles, ChevronRight, MessageSquare, Info, Smile, Heart, HelpCircle
} from 'lucide-react';
import { dashboardApi } from '@/lib/api';

interface SmallTalkResponse {
    id: string;
    trigger: string;
    response: string;
    variations: string[];
    category: string;
    enabled: boolean;
}

const categories = ['All', 'Greetings', 'Farewell', 'Identity', 'Feelings', 'Social', 'Help', 'Jokes'];

const defaults: SmallTalkResponse[] = [
    {
        id: '1',
        trigger: 'hello',
        response: 'Hello! How can I help you today?',
        variations: ['Hi there!', 'Hey! What can I do for you?', 'Greetings!'],
        category: 'Greetings',
        enabled: true
    },
    {
        id: '2',
        trigger: 'how are you',
        response: "I'm doing great, thanks for asking! How can I assist you?",
        variations: ["I'm good! How about you?", "Excellent, ready to help!"],
        category: 'Feelings',
        enabled: true
    },
    {
        id: '3',
        trigger: 'what is your name',
        response: "I'm your AI assistant! You can call me whatever you'd like.",
        variations: ['I go by many names, but you can just call me Assistant.', "I'm the TangentCloud AI Bots helper!"],
        category: 'Identity',
        enabled: true
    },
    {
        id: '4',
        trigger: 'goodbye',
        response: 'Goodbye! Have a great day!',
        variations: ['See you later!', 'Bye! Feel free to come back if you need anything.', 'Take care!'],
        category: 'Farewell',
        enabled: true
    },
    {
        id: '5',
        trigger: 'thank you',
        response: "You're very welcome! Is there anything else I can do for you?",
        variations: ["Happy to help!", "No problem at all!", "Anytime!"],
        category: 'Social',
        enabled: true
    },
    {
        id: '6',
        trigger: 'who made you',
        response: 'I was created by the team at TangentCloud to help businesses automate their workflows.',
        variations: ['The amazing developers at TangentCloud are my creators.'],
        category: 'Identity',
        enabled: true
    },
    {
        id: '7',
        trigger: 'tell me a joke',
        response: "Why don't scientists trust atoms? Because they make up everything!",
        variations: ["I'm a better assistant than I am a comedian, but: Why did the computer show up late to work? It had a hard drive!"],
        category: 'Jokes',
        enabled: true
    }
];

export function SmallTalk({ botId }: { botId: number }) {
    const [responses, setResponses] = useState<SmallTalkResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('All');

    useEffect(() => {
        const loadResponses = async () => {
            setLoading(true);
            try {
                const res = await dashboardApi.getBot(botId);
                if (res.data.small_talk_responses && Array.isArray(res.data.small_talk_responses) && res.data.small_talk_responses.length > 0) {
                    setResponses(res.data.small_talk_responses);
                } else {
                    setResponses(defaults);
                }
            } catch (error) {
                console.error('Failed to load small talk responses', error);
                setResponses(defaults);
            } finally {
                setLoading(false);
            }
        };
        loadResponses();
    }, [botId]);

    const persistResponses = async (updatedResponses: SmallTalkResponse[]) => {
        try {
            await dashboardApi.updateBot(botId, {
                small_talk_responses: updatedResponses
            });
        } catch (error) {
            console.error('Failed to save small talk responses', error);
        }
    };

    const handleSetResponses = (newResponses: SmallTalkResponse[]) => {
        setResponses(newResponses);
        persistResponses(newResponses);
    };

    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingResponse, setEditingResponse] = useState<SmallTalkResponse | null>(null);
    const [formData, setFormData] = useState({
        trigger: '',
        response: '',
        variations: '',
        category: 'Greetings'
    });

    const openAddModal = () => {
        setEditingResponse(null);
        setFormData({ trigger: '', response: '', variations: '', category: 'Greetings' });
        setIsModalOpen(true);
    };

    const openEditModal = (item: SmallTalkResponse) => {
        setEditingResponse(item);
        setFormData({
            trigger: item.trigger,
            response: item.response,
            variations: item.variations.join('\n'),
            category: item.category || 'Greetings'
        });
        setIsModalOpen(true);
    };

    const saveResponse = () => {
        const data = {
            trigger: formData.trigger.trim().toLowerCase(),
            response: formData.response.trim(),
            variations: formData.variations.split('\n').map(v => v.trim()).filter(Boolean),
            category: formData.category
        };

        if (!data.trigger || !data.response) return;

        if (editingResponse) {
            handleSetResponses(responses.map(r => r.id === editingResponse.id ? { ...r, ...data } : r));
        } else {
            handleSetResponses([...responses, { id: Date.now().toString(), ...data, enabled: true }]);
        }
        setIsModalOpen(false);
    };

    const deleteResponse = (id: string) => {
        if (confirm('Delete this response?')) {
            handleSetResponses(responses.filter(r => r.id !== id));
        }
    };

    const toggleResponse = (id: string) => {
        handleSetResponses(responses.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
    };

    const filteredResponses = useMemo(() => responses.filter(r => {
        const matchesCategory = activeCategory === 'All' || r.category === activeCategory;
        const matchesSearch =
            r.trigger.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.response.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    }), [responses, activeCategory, searchQuery]);

    const enabledCount = responses.filter(r => r.enabled).length;

    const getCategoryIcon = (cat: string) => {
        switch (cat) {
            case 'Greetings': return <MessageSquare className="w-4 h-4 text-blue-500" />;
            case 'Farewell': return <ChevronRight className="w-4 h-4 text-orange-500" />;
            case 'Identity': return <Info className="w-4 h-4 text-purple-500" />;
            case 'Feelings': return <Heart className="w-4 h-4 text-pink-500" />;
            case 'Social': return <Smile className="w-4 h-4 text-green-500" />;
            case 'Jokes': return <Sparkles className="w-4 h-4 text-amber-500" />;
            case 'Help': return <HelpCircle className="w-4 h-4 text-indigo-500" />;
            default: return <MessageCircle className="w-4 h-4 text-gray-500" />;
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-32 space-y-4">
            <div className="w-12 h-12 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Loading Small Talk...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            {/* Header */}
            <div className="bg-gradient-to-br from-pink-600 via-rose-500 to-orange-500 rounded-3xl p-10 text-white shadow-xl shadow-rose-200/50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-inner">
                            <MessageCircle className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black tracking-tight">AI Small Talk</h2>
                            <p className="text-pink-100 mt-1 font-medium">Handle casual conversations with a human touch</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="bg-white/10 backdrop-blur-sm px-5 py-2.5 rounded-2xl border border-white/20 flex flex-col items-center">
                            <span className="text-[10px] font-black uppercase tracking-wider text-pink-200">System Ready</span>
                            <span className="text-sm font-bold">{enabledCount} Active Responses</span>
                        </div>
                        <button
                            onClick={openAddModal}
                            className="px-8 py-4 bg-white text-rose-600 rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-lg shadow-rose-900/20 active:scale-95"
                        >
                            Add Response
                        </button>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-6">
                <div className="relative flex-1 group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-rose-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search intents, triggers or responses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-300 outline-none transition-all shadow-sm font-medium"
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-6 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all border ${activeCategory === cat
                                ? 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-200'
                                : 'bg-white text-gray-500 border-gray-100 hover:border-rose-200 hover:text-rose-600'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResponses.map(item => (
                    <div
                        key={item.id}
                        className={`group relative bg-white rounded-[2rem] border overflow-hidden transition-all duration-300 ${item.enabled
                            ? 'border-gray-100 shadow-xl shadow-gray-200/50 hover:shadow-rose-200/50 hover:border-rose-100 hover:-translate-y-1'
                            : 'border-gray-50 opacity-60 grayscale'
                            }`}
                    >
                        {/* Status Light */}
                        <div className={`absolute top-6 right-6 w-2 h-2 rounded-full ${item.enabled ? 'bg-green-500' : 'bg-gray-300'}`} />

                        <div className="p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 bg-gray-50 rounded-xl group-hover:bg-rose-50 transition-colors">
                                    {getCategoryIcon(item.category)}
                                </div>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.category}</span>
                            </div>

                            <div className="mb-6">
                                <span className="inline-block px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-xs font-black mb-3">
                                    IF: "{item.trigger}"
                                </span>
                                <p className="font-bold text-gray-900 leading-relaxed min-h-[3rem]">
                                    {item.response}
                                </p>
                            </div>

                            {item.variations.length > 0 && (
                                <div className="space-y-2 mb-8">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-1 h-1 rounded-full bg-rose-300" />
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Variations</span>
                                    </div>
                                    <div className="space-y-1.5">
                                        {item.variations.slice(0, 2).map((v, i) => (
                                            <p key={i} className="text-xs text-gray-500 italic flex items-start gap-2">
                                                <span className="mt-1 flex-shrink-0 w-1 h-1 rounded-full bg-gray-200" />
                                                "{v}"
                                            </p>
                                        ))}
                                        {item.variations.length > 2 && (
                                            <p className="text-[10px] text-rose-500 font-bold">+{item.variations.length - 2} more</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                                <button
                                    onClick={() => toggleResponse(item.id)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${item.enabled
                                        ? 'bg-green-50 text-green-700 hover:bg-green-100'
                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                        }`}
                                >
                                    {item.enabled ? 'Enabled' : 'Disabled'}
                                </button>

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => openEditModal(item)}
                                        className="p-3 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => deleteResponse(item.id)}
                                        className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Empty State */}
                {filteredResponses.length === 0 && (
                    <div className="col-span-full py-24 bg-white rounded-[2rem] border border-dashed text-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <MessageCircle className="w-10 h-10 text-gray-200" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900">No intents found</h3>
                        <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">
                            Try adjusting your filters or search query to find what you're looking for.
                        </p>
                        <button
                            onClick={() => { setActiveCategory('All'); setSearchQuery(''); }}
                            className="mt-6 text-sm font-bold text-rose-600 hover:text-rose-700"
                        >
                            Reset all filters
                        </button>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900">
                                    {editingResponse ? 'Edit Intent' : 'New AI Intent'}
                                </h2>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Configure automated small talk response</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-gray-100 rounded-2xl transition-all group">
                                <X className="w-6 h-6 text-gray-400 group-hover:rotate-90 transition-transform" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6 md:col-span-2">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                        Category
                                    </label>
                                    <div className="grid grid-cols-4 gap-2 mt-2">
                                        {categories.filter(c => c !== 'All').map(cat => (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, category: cat })}
                                                className={`py-3 rounded-xl text-xs font-bold transition-all border ${formData.category === cat
                                                    ? 'bg-rose-50 border-rose-200 text-rose-600 ring-2 ring-rose-500/10'
                                                    : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'
                                                    }`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                        Trigger Pattern
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.trigger}
                                        onChange={(e) => setFormData({ ...formData, trigger: e.target.value })}
                                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-4 focus:ring-rose-500/10 transition-all outline-none mt-2"
                                        placeholder="e.g. hello"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                        Primary Response
                                    </label>
                                    <textarea
                                        value={formData.response}
                                        onChange={(e) => setFormData({ ...formData, response: e.target.value })}
                                        rows={4}
                                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-4 focus:ring-rose-500/10 transition-all outline-none mt-2"
                                        placeholder="What should the bot say back?"
                                    />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                            Variations
                                        </label>
                                        <button className="text-[10px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-1 hover:rose-700 transition-colors">
                                            <Sparkles className="w-3 h-3" /> Auto-Generate
                                        </button>
                                    </div>
                                    <textarea
                                        value={formData.variations}
                                        onChange={(e) => setFormData({ ...formData, variations: e.target.value })}
                                        rows={8}
                                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-4 focus:ring-rose-500/10 transition-all outline-none mt-2"
                                        placeholder="One variation per line..."
                                    />
                                    <p className="mt-2 text-[10px] text-gray-400 font-medium ml-1 italic">
                                        The bot will randomly pick between these to sound more natural.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 mt-12 pt-8 border-t border-gray-50">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-8 py-4 font-black text-sm text-gray-400 hover:text-gray-900 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveResponse}
                                className="px-10 py-4 bg-gray-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-gray-200 hover:bg-gray-800 hover:-translate-y-1 active:translate-y-0 transition-all"
                            >
                                {editingResponse ? 'Save Changes' : 'Create Intent'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
