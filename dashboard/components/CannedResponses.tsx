'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
    Zap, Edit2, Search, Trash2, X, Plus,
    Tag, Bookmark, Check, Shield
} from 'lucide-react';
import { dashboardApi } from '@/lib/api';

interface CannedResponse {
    id: string;
    title: string;
    shortcut: string;
    content: string;
    category: string;
    tags: string[];
    enabled: boolean;
}

const defaults: CannedResponse[] = [
    {
        id: '1',
        title: 'Greeting',
        shortcut: '/hello',
        content: 'Hello! Welcome to our service. How can I assist you today?',
        category: 'General',
        tags: ['greeting', 'welcome'],
        enabled: true
    },
    {
        id: '2',
        title: 'Business Hours',
        shortcut: '/hours',
        content: 'Our business hours are:\nMonday - Friday: 9 AM - 6 PM\nSaturday: 10 AM - 4 PM\nSunday: Closed',
        category: 'Support',
        tags: ['hours', 'timing'],
        enabled: true
    },
    {
        id: '3',
        title: 'Refund Policy',
        shortcut: '/refund',
        content: 'Our refund policy allows returns within 30 days of purchase. Please provide your order number and we will process your request.',
        category: 'Billing',
        tags: ['refund', 'money', 'return'],
        enabled: true
    }
];

const categories = ['All', 'General', 'Support', 'Billing', 'Sales', 'Technical'];

export function CannedResponses({ botId }: Readonly<{ botId: number }>) {
    const [responses, setResponses] = useState<CannedResponse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadResponses = async () => {
            setLoading(true);
            try {
                const res = await dashboardApi.getBot(botId);
                if (res.data.canned_responses && Array.isArray(res.data.canned_responses) && res.data.canned_responses.length > 0) {
                    setResponses(res.data.canned_responses);
                } else {
                    setResponses(defaults);
                }
            } catch (error) {
                console.error('Failed to load canned responses', error);
                setResponses(defaults);
            } finally {
                setLoading(false);
            }
        };
        loadResponses();
    }, [botId]);

    const persistResponses = async (updatedResponses: CannedResponse[]) => {
        try {
            await dashboardApi.updateBot(botId, {
                canned_responses: updatedResponses
            });
        } catch (error) {
            console.error('Failed to save canned responses', error);
        }
    };

    const handleSetResponses = (newResponses: CannedResponse[]) => {
        setResponses(newResponses);
        persistResponses(newResponses);
    };

    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingResponse, setEditingResponse] = useState<CannedResponse | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        shortcut: '',
        content: '',
        category: 'General',
        tags: ''
    });

    const openAddModal = () => {
        setEditingResponse(null);
        setFormData({ title: '', shortcut: '', content: '', category: 'General', tags: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (item: CannedResponse) => {
        setEditingResponse(item);
        setFormData({
            title: item.title,
            shortcut: item.shortcut,
            content: item.content,
            category: item.category,
            tags: item.tags.join(', ')
        });
        setIsModalOpen(true);
    };

    const saveResponse = (e: React.FormEvent) => {
        e.preventDefault();
        const data = {
            title: formData.title,
            shortcut: formData.shortcut.startsWith('/') ? formData.shortcut : `/${formData.shortcut}`,
            content: formData.content,
            category: formData.category,
            tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
        };

        if (editingResponse) {
            handleSetResponses(responses.map(r => r.id === editingResponse.id ? { ...r, ...data } : r));
        } else {
            handleSetResponses([...responses, { id: Date.now().toString(), ...data, enabled: true }]);
        }
        setIsModalOpen(false);
    };

    const deleteResponse = (id: string) => {
        if (confirm('Delete this canned response?')) {
            handleSetResponses(responses.filter(r => r.id !== id));
        }
    };

    const toggleResponse = (id: string) => {
        handleSetResponses(responses.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
    };

    const filteredResponses = useMemo(() => responses.filter(r => {
        const matchesCategory = activeCategory === 'All' || r.category === activeCategory;
        const matchesSearch =
            r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.shortcut.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.content.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    }), [responses, activeCategory, searchQuery]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-32 space-y-4">
            <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Loading Shortcuts...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header */}
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-[2.5rem] p-10 text-white shadow-xl shadow-amber-200/50 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-inner">
                            <Zap className="w-8 h-8 text-white fill-white" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black tracking-tight">Canned Responses</h2>
                            <p className="text-amber-100 mt-1 font-medium">Lightning-fast replies with keyboard shortcuts</p>
                        </div>
                    </div>
                    <button
                        onClick={openAddModal}
                        className="px-8 py-4 bg-white text-orange-600 rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-lg shadow-orange-900/20 active:scale-95 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Create Shortcut
                    </button>
                </div>
                <Zap className="absolute -right-8 -bottom-8 w-64 h-64 text-white/10 rotate-12" />
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-6">
                <div className="relative flex-1 group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by title, shortcut or content..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-300 outline-none transition-all shadow-sm font-medium"
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-6 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all border ${activeCategory === cat
                                    ? 'bg-amber-600 text-white border-amber-600 shadow-lg shadow-amber-200'
                                    : 'bg-white text-gray-500 border-gray-100 hover:border-amber-200 hover:text-amber-600'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredResponses.map(item => (
                    <div
                        key={item.id}
                        className={`group relative bg-white rounded-[2.5rem] border overflow-hidden transition-all duration-300 h-full flex flex-col ${item.enabled
                                ? 'border-gray-100 shadow-xl shadow-gray-200/50 hover:shadow-amber-200/50 hover:border-amber-100 hover:-translate-y-1'
                                : 'border-gray-50 opacity-60 grayscale'
                            }`}
                    >
                        <div className="p-8 flex-1 flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-amber-50 rounded-xl">
                                        <Bookmark className="w-4 h-4 text-amber-600" />
                                    </div>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.category}</span>
                                </div>
                                <div className={`w-2 h-2 rounded-full ${item.enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                            </div>

                            <h3 className="text-lg font-black text-gray-900 mb-3">{item.title}</h3>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white rounded-xl text-xs font-mono font-bold mb-6 self-start">
                                <Zap className="w-3 h-3 fill-amber-400 text-amber-400" />
                                {item.shortcut}
                            </div>

                            <p className="text-gray-500 text-sm font-medium leading-relaxed line-clamp-4 flex-1">
                                {item.content}
                            </p>

                            <div className="flex flex-wrap gap-2 mt-6">
                                {item.tags.map(tag => (
                                    <span key={tag} className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 text-gray-400 rounded-lg text-[10px] font-bold border border-gray-100">
                                        <Tag className="w-3 h-3" />
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between">
                            <button
                                onClick={() => toggleResponse(item.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${item.enabled
                                        ? 'bg-green-50 text-green-700 hover:bg-green-100'
                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                    }`}
                            >
                                {item.enabled ? <Check className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                                {item.enabled ? 'Enabled' : 'Disabled'}
                            </button>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => openEditModal(item)}
                                    className="p-3 text-gray-400 hover:text-amber-600 hover:bg-white rounded-xl transition-all shadow-sm"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => deleteResponse(item.id)}
                                    className="p-3 text-gray-400 hover:text-red-600 hover:bg-white rounded-xl transition-all shadow-sm"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Empty State */}
                {filteredResponses.length === 0 && (
                    <div className="col-span-full py-24 bg-white rounded-[2.5rem] border border-dashed text-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-gray-200">
                            <Zap className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900">No shortcuts found</h3>
                        <p className="text-sm text-gray-500 mt-2">Try searching for something else or create a new response.</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[130] p-4">
                    <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900">{editingResponse ? 'Edit Shortcut' : 'New Fast Reply'}</h2>
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Predefined response architecture</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-2xl transition-colors">
                                <X className="w-6 h-6 text-gray-400" />
                            </button>
                        </div>

                        <form onSubmit={saveResponse} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label htmlFor="res-title" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Internal Title</label>
                                    <input
                                        id="res-title"
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-amber-500/10 transition-all outline-none"
                                        placeholder="e.g. Sales Greeting"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="res-shortcut" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Keyboard Shortcut</label>
                                    <div className="relative">
                                        <Zap className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                                        <input
                                            id="res-shortcut"
                                            type="text"
                                            required
                                            value={formData.shortcut}
                                            onChange={(e) => setFormData({ ...formData, shortcut: e.target.value })}
                                            className="w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-amber-500/10 transition-all outline-none"
                                            placeholder="/hello"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <label htmlFor="res-category" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Category</label>
                                    <div className="flex flex-wrap gap-2">
                                        {categories.filter(c => c !== 'All').map(cat => (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, category: cat })}
                                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${formData.category === cat
                                                        ? 'bg-amber-600 border-amber-600 text-white shadow-lg shadow-amber-100'
                                                        : 'bg-white border-gray-100 text-gray-400 hover:border-amber-200 hover:text-amber-600'
                                                    }`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <label htmlFor="res-content" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Response Content</label>
                                    <textarea
                                        id="res-content"
                                        required
                                        rows={6}
                                        value={formData.content}
                                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-medium focus:ring-4 focus:ring-amber-500/10 transition-all outline-none"
                                        placeholder="What should the bot say when this shortcut is used?"
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <label htmlFor="res-tags" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Tags (Comma Separated)</label>
                                    <input
                                        id="res-tags"
                                        type="text"
                                        value={formData.tags}
                                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-medium focus:ring-4 focus:ring-amber-500/10 transition-all outline-none"
                                        placeholder="sales, landing, welcome"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-8 border-t">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3 font-black text-gray-400 hover:text-gray-900 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" className="px-10 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-gray-200 hover:-translate-y-1 transition-all active:scale-95">
                                    {editingResponse ? 'Update Registry' : 'Deploy Shortcut'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
