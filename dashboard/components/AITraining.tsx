'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Brain, Plus, Trash2, Edit2, X, Search,
    CheckCircle2, XCircle, AlertTriangle, MessageSquare,
    ThumbsUp, ThumbsDown, RefreshCw, Sparkles, Info
} from 'lucide-react';
import { dashboardApi } from '@/lib/api';

interface FAQ {
    id: number;
    question: string;
    answer: string;
    keywords: string[];
    category: string;
    is_active: boolean;
    usage_count: number;
    success_rate: number;
    created_at: string;
    updated_at: string;
}

interface AITrainingProps {
    botId: number;
}

export function AITraining({ botId }: AITrainingProps) {
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
    const [formData, setFormData] = useState({
        question: '',
        answer: '',
        keywords: '',
        category: 'General'
    });

    // AI Suggestions
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<{ question: string; answer: string }[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    const categories = ['General', 'Support', 'Pricing', 'Billing', 'Technical', 'Sales', 'Other'];

    const fetchFAQs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await dashboardApi.getBotFAQs(botId);
            setFaqs(res.data);
        } catch (error) {
            console.error('Failed to fetch FAQs', error);
        } finally {
            setLoading(false);
        }
    }, [botId]);

    useEffect(() => {
        fetchFAQs();
    }, [fetchFAQs]);

    const handleSaveFAQ = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const faqData = {
                question: formData.question,
                answer: formData.answer,
                keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean),
                category: formData.category,
                is_active: true
            };

            if (editingFaq) {
                await dashboardApi.updateBotFAQ(botId, editingFaq.id, faqData);
            } else {
                await dashboardApi.createBotFAQ(botId, faqData);
            }
            setIsModalOpen(false);
            fetchFAQs();
        } catch (error) {
            console.error('Failed to save FAQ', error);
        }
    };

    const handleDeleteFAQ = async (faqId: number) => {
        if (!confirm('Are you sure you want to delete this FAQ?')) return;
        try {
            await dashboardApi.deleteBotFAQ(botId, faqId);
            fetchFAQs();
        } catch (error) {
            console.error('Failed to delete FAQ', error);
        }
    };

    const toggleFAQStatus = async (faq: FAQ) => {
        try {
            await dashboardApi.updateBotFAQ(botId, faq.id, { is_active: !faq.is_active });
            fetchFAQs();
        } catch (error) {
            console.error('Failed to toggle FAQ status', error);
        }
    };

    const generateAISuggestions = async () => {
        setLoadingSuggestions(true);
        setShowSuggestions(true);
        try {
            const res = await dashboardApi.getFaqSuggestions(botId, 8);
            const items = Array.isArray(res.data) ? res.data : [];
            setSuggestions(items.map((item: any) => ({
                question: item.question,
                answer: item.answer
            })));
        } catch (error) {
            console.error('Failed to generate suggestions', error);
            setSuggestions([]);
        } finally {
            setLoadingSuggestions(false);
        }
    };

    const filteredFAQs = useMemo(() => {
        return faqs.filter(faq => {
            const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = filterCategory === 'all' || faq.category === filterCategory;
            const matchesStatus = filterStatus === 'all' ||
                (filterStatus === 'active' && faq.is_active) ||
                (filterStatus === 'inactive' && !faq.is_active);

            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [faqs, searchQuery, filterCategory, filterStatus]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-32 space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Training AI Brain...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Hero Header */}
            <div className="relative overflow-hidden bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-200">
                            <Brain className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-gray-900 tracking-tight">AI Training Center</h2>
                            <p className="text-gray-500 font-medium mt-1">Refine your bot's intelligence with custom Q&A</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={generateAISuggestions}
                            className="px-6 py-3 bg-indigo-50 text-indigo-700 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center gap-2"
                        >
                            <Sparkles className="w-4 h-4" /> Analyze Chats
                        </button>
                        <button
                            onClick={() => {
                                setEditingFaq(null);
                                setFormData({ question: '', answer: '', keywords: '', category: 'General' });
                                setIsModalOpen(true);
                            }}
                            className="px-8 py-3 bg-gray-900 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-gray-200 hover:-translate-y-1 transition-all flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Add FAQ
                        </button>
                    </div>
                </div>
                {/* Decorative backgrounds */}
                <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-60" />
            </div>

            {/* Content Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total FAQs', value: faqs.length, icon: MessageSquare, color: 'blue' },
                    { label: 'Success Rate', value: '94%', icon: CheckCircle2, color: 'green' },
                    { label: 'Helpful Hits', value: '1.2k', icon: ThumbsUp, color: 'indigo' },
                    { label: 'Need Review', value: '3', icon: AlertTriangle, color: 'amber' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-2 bg-${stat.color}-50 rounded-lg text-${stat.color}-600`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-bold text-gray-400">Monthly</span>
                        </div>
                        <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-6">
                <div className="relative flex-1 group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search questions or answers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-medium"
                    />
                </div>
                <div className="flex gap-4">
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="px-6 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-gray-600 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    >
                        <option value="all">Categories: All</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-6 py-4 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-gray-600 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    >
                        <option value="all">Status: All</option>
                        <option value="active">Active Only</option>
                        <option value="inactive">Inactive Only</option>
                    </select>
                </div>
            </div>

            {/* FAQ List */}
            <div className="space-y-4">
                {filteredFAQs.map(faq => (
                    <div key={faq.id} className="group bg-white border border-gray-100 rounded-3xl p-6 hover:shadow-xl hover:shadow-gray-200/50 transition-all">
                        <div className="flex items-start justify-between gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${faq.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'
                                        }`}>
                                        {faq.is_active ? 'Active' : 'Archived'}
                                    </span>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate max-w-[100px]">
                                        {faq.category}
                                    </span>
                                    <div className="h-1 w-1 bg-gray-200 rounded-full" />
                                    <span className="text-[10px] font-bold text-gray-400">Used {faq.usage_count} times</span>
                                </div>
                                <h3 className="text-lg font-black text-gray-900 mb-2 leading-tight">Q: {faq.question}</h3>
                                <p className="text-gray-500 text-sm font-medium leading-relaxed">A: {faq.answer}</p>

                                <div className="flex flex-wrap gap-2 mt-4">
                                    {faq.keywords.map((kw, i) => (
                                        <span key={i} className="px-2 py-0.5 bg-gray-50 text-gray-400 rounded-md text-[10px] font-bold border border-gray-100">
                                            #{kw}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-4">
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => toggleFAQStatus(faq)}
                                        className={`p-2 rounded-xl transition-colors ${faq.is_active ? 'text-green-500 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}
                                        title={faq.is_active ? "Deactivate" : "Activate"}
                                    >
                                        {faq.is_active ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditingFaq(faq);
                                            setFormData({
                                                question: faq.question,
                                                answer: faq.answer,
                                                keywords: faq.keywords.join(', '),
                                                category: faq.category
                                            });
                                            setIsModalOpen(true);
                                        }}
                                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                                    >
                                        <Edit2 className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteFAQ(faq.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-black text-gray-900">{faq.success_rate}%</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Score</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredFAQs.length === 0 && (
                    <div className="bg-white border border-dashed rounded-[2.5rem] py-24 text-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-gray-200">
                            <Brain className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900">No training data found</h3>
                        <p className="text-sm text-gray-500 mt-2">Adjust your filters or add your first Q&A pair.</p>
                        <button
                            onClick={() => { setFilterCategory('all'); setSearchQuery(''); }}
                            className="mt-6 text-indigo-600 font-bold hover:underline"
                        >
                            Reset all filters
                        </button>
                    </div>
                )}
            </div>

            {/* AI Suggestions Sidebar */}
            {showSuggestions && (
                <div className="fixed inset-y-0 right-0 w-[450px] bg-white shadow-[-20px_0_40px_rgba(0,0,0,0.05)] border-l z-[110] flex flex-col animate-in slide-in-from-right duration-500">
                    <div className="p-8 border-b bg-indigo-600 text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-2xl font-black tracking-tight">AI Insights</h3>
                            <p className="text-indigo-100 text-xs font-medium mt-1">Found in recent chat history</p>
                        </div>
                        <button
                            onClick={() => setShowSuggestions(false)}
                            className="absolute top-8 right-8 p-2 hover:bg-white/20 rounded-xl transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <Sparkles className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10" />
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gray-50">
                        {loadingSuggestions ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                                <p className="text-xs font-black uppercase tracking-widest text-gray-400">Analyzing patterns...</p>
                            </div>
                        ) : (
                            suggestions.map((s, i) => (
                                <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 hover:border-indigo-200 transition-colors">
                                    <div className="flex items-center gap-2 text-indigo-600">
                                        <Sparkles className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Suggested FAQ</span>
                                    </div>
                                    <p className="font-black text-gray-900">"{s.question}"</p>
                                    <p className="text-sm text-gray-500 leading-relaxed italic">"{s.answer}"</p>
                                    <div className="flex gap-2 pt-2">
                                        <button
                                            onClick={() => {
                                                setFormData({ question: s.question, answer: s.answer, keywords: '', category: 'General' });
                                                setEditingFaq(null);
                                                setIsModalOpen(true);
                                            }}
                                            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100"
                                        >
                                            Add to Brain
                                        </button>
                                        <button className="px-4 py-2.5 bg-gray-100 text-gray-400 rounded-xl hover:text-red-500 transition-colors">
                                            <ThumbsDown className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                        {!loadingSuggestions && (
                            <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 flex items-start gap-4">
                                <Info className="w-6 h-6 text-indigo-500 shrink-0 mt-1" />
                                <p className="text-[11px] text-indigo-700 font-medium leading-relaxed">
                                    Our AI automatically analyzes conversations to identify questions your bot couldn't answer or recurring themes.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* FAQ Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[120] p-4">
                    <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900">{editingFaq ? 'Edit Intelligence' : 'New Knowledge Node'}</h2>
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Define bot behavior for specific queries</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-2xl transition-colors">
                                <X className="w-6 h-6 text-gray-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveFAQ} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Category</label>
                                    <div className="flex flex-wrap gap-2">
                                        {categories.map(cat => (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, category: cat })}
                                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${formData.category === cat
                                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100'
                                                    : 'bg-white border-gray-100 text-gray-400 hover:border-indigo-200 hover:text-indigo-600'
                                                    }`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <label htmlFor="faq-question" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">User Question</label>
                                    <input
                                        id="faq-question"
                                        type="text"
                                        required
                                        value={formData.question}
                                        onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                                        placeholder="What is your most frequent question?"
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <label htmlFor="faq-answer" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">AI Answer</label>
                                    <textarea
                                        id="faq-answer"
                                        required
                                        rows={4}
                                        value={formData.answer}
                                        onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                                        placeholder="Provide a clear, helpful response..."
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <label htmlFor="faq-keywords" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Alt Keywords / Phrasings</label>
                                    <input
                                        id="faq-keywords"
                                        type="text"
                                        value={formData.keywords}
                                        onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                                        placeholder="Comma separated: help, support, assist..."
                                    />
                                    <p className="text-[10px] text-gray-400 italic ml-1">Helps the bot identify this intent even if the question is slightly different.</p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-8 border-t">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3 font-black text-gray-400 hover:text-gray-900 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" className="px-10 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-gray-200 hover:-translate-y-1 transition-all active:translate-y-0">
                                    {editingFaq ? 'Save Upgrades' : 'Install Memory'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
