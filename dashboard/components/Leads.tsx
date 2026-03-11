'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { dashboardApi } from '@/lib/api';
import {
    Mail, Plus, Trash2, Save, CheckCircle2, AlertCircle,
    Phone, Type, Users, Filter, Download, ArrowUpRight,
    Settings, Shield, Bell, Send, Clipboard
} from 'lucide-react';

export function Leads() {
    const [leads, setLeads] = useState<any[]>([]);
    const [bots, setBots] = useState<any[]>([]);
    const [selectedBotId, setSelectedBotId] = useState<number | null>(null);
    const [formConfig, setFormConfig] = useState<any>({ title: 'Contact Us', fields: [] });
    const [emailSettings, setEmailSettings] = useState<any>({
        smtp_host: '', smtp_port: 587, smtp_user: '', smtp_pass: '', sender_email: '', is_enabled: false
    });
    const [activeTab, setActiveTab] = useState<'leads' | 'forms' | 'notifications'>('leads');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const statCards = useMemo(() => [
        { id: 'total-leads', label: 'Total Leads', value: leads.length, icon: Users, color: 'blue' },
        { id: 'conv-rate', label: 'Conversion Rate', value: '18.4%', icon: ArrowUpRight, color: 'emerald' },
        { id: 'form-comp', label: 'Form Completion', value: '62%', icon: Clipboard, color: 'purple' }
    ], [leads.length]);

    const loadFormConfig = useCallback(async (botId: number) => {
        try {
            const res = await dashboardApi.getLeadForm(botId);
            if (res.data) {
                setFormConfig(res.data);
            } else {
                setFormConfig({ title: 'Contact Us', fields: [] });
            }
        } catch (err) {
            console.error("No lead form found for this bot, showing default:", err);
            setFormConfig({ title: 'Contact Us', fields: [] });
        }
    }, []);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [leadsRes, botsRes, emailRes] = await Promise.all([
                dashboardApi.getLeads(),
                dashboardApi.getBots(),
                dashboardApi.getEmailSettings()
            ]);
            setLeads(leadsRes.data);
            setBots(botsRes.data);
            setEmailSettings(emailRes.data);
            if (botsRes.data.length > 0) {
                const firstBotId = botsRes.data[0].id;
                setSelectedBotId(firstBotId);
                loadFormConfig(firstBotId);
            }
        } catch (err) {
            console.error("Failed to load dashboard data:", err);
        } finally {
            setLoading(false);
        }
    }, [loadFormConfig]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const handleSaveForm = async () => {
        if (!selectedBotId) return;
        setLoading(true);
        try {
            await dashboardApi.createLeadForm({
                bot_id: selectedBotId,
                title: formConfig.title,
                fields: formConfig.fields
            });
            setMessage({ type: 'success', text: 'Form configuration saved!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            console.error("Save form error:", err);
            setMessage({ type: 'error', text: 'Failed to save form.' });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveEmail = async () => {
        setLoading(true);
        try {
            await dashboardApi.updateEmailSettings(emailSettings);
            setMessage({ type: 'success', text: 'Email settings updated!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            console.error("Save email error:", err);
            setMessage({ type: 'error', text: 'Failed to update email settings.' });
        } finally {
            setLoading(false);
        }
    };

    const addField = () => {
        setFormConfig({
            ...formConfig,
            fields: [...formConfig.fields, { id: Math.random().toString(36).slice(2, 11), name: 'new_field', label: 'New Field', type: 'text', required: true }]
        });
    };

    const getFieldIcon = (type: string) => {
        if (type === 'email') return <Mail className="w-4 h-4 text-blue-500" />;
        if (type === 'tel') return <Phone className="w-4 h-4 text-green-500" />;
        return <Type className="w-4 h-4 text-purple-500" />;
    };

    if (loading && leads.length === 0) return (
        <div className="flex flex-col items-center justify-center p-32 space-y-4">
            <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Mining Data Gold...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Navigation & Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Lead Intelligence</h2>
                    <p className="text-gray-500 font-medium">Capture, manage, and convert your bot's interactions</p>
                </div>

                <div className="flex bg-gray-100/80 p-1.5 rounded-2xl gap-1">
                    {[
                        { id: 'leads', icon: Users, label: 'Pipeline' },
                        { id: 'forms', icon: Clipboard, label: 'Form Builder' },
                        { id: 'notifications', icon: Bell, label: 'Alerts' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-[2rem] flex items-center justify-between px-8 animate-in slide-in-from-top-4 duration-300 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                    }`}>
                    <div className="flex items-center gap-3">
                        {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <span className="text-sm font-bold">{message.text}</span>
                    </div>
                </div>
            )}

            {activeTab === 'leads' && (
                <div className="space-y-6">
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {statCards.map((stat) => (
                            <div key={stat.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                                <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-${stat.color}-50 rounded-full blur-2xl group-hover:scale-110 transition-transform`} />
                                <div className="relative z-10">
                                    <div className={`w-12 h-12 bg-${stat.color}-50 rounded-2xl flex items-center justify-center mb-6 text-${stat.color}-600`}>
                                        <stat.icon className="w-6 h-6" />
                                    </div>
                                    <p className="text-3xl font-black text-gray-900 mb-1">{stat.value}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{stat.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Table Control */}
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden">
                        <div className="p-8 border-b flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <h3 className="font-extrabold text-gray-900 tracking-tight">Active Pipeline</h3>
                                <span className="px-3 py-1 bg-gray-100 text-gray-400 rounded-lg text-[10px] font-black uppercase tracking-widest">{leads.length} Records</span>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all">
                                    <Filter className="w-5 h-5" />
                                </button>
                                <button className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all">
                                    <Download className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Entry Date</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Lead Identification</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {leads.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-8 py-20 text-center">
                                                <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-4 text-gray-200">
                                                    <Users className="w-8 h-8" />
                                                </div>
                                                <p className="text-sm font-bold text-gray-300 uppercase tracking-widest">Pipeline Empty</p>
                                            </td>
                                        </tr>
                                    ) : leads.map((lead) => (
                                        <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-8 py-6">
                                                <p className="text-sm font-black text-gray-900">{new Date(lead.created_at).toLocaleDateString()}</p>
                                                <p className="text-[10px] font-bold text-gray-400">{new Date(lead.created_at).toLocaleTimeString()}</p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-wrap gap-2">
                                                    {Object.entries(lead.data).map(([key, val]: [string, any]) => (
                                                        <div key={key} className="flex flex-col px-4 py-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">{key}</span>
                                                            <span className="text-xs font-bold text-gray-900">{val}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <button className="p-3 text-gray-300 hover:text-indigo-600 hover:bg-white rounded-2xl transition-all shadow-sm opacity-0 group-hover:opacity-100 border border-transparent hover:border-indigo-100">
                                                    <Send className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'forms' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Configuration Panel */}
                    <div className="space-y-6">
                        <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/40 space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
                                    <Settings className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-black text-gray-900 tracking-tight">Form Config</h3>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label htmlFor="bot-select" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Target Robot</label>
                                    <select
                                        id="bot-select"
                                        className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                        value={selectedBotId || ''}
                                        onChange={(e) => {
                                            const id = Number(e.target.value);
                                            setSelectedBotId(id);
                                            loadFormConfig(id);
                                        }}
                                    >
                                        <option value="">Select a bot</option>
                                        {bots.map(bot => <option key={bot.id} value={bot.id}>{bot.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="form-title" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Display Title</label>
                                    <input
                                        id="form-title"
                                        type="text"
                                        className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                        value={formConfig.title}
                                        onChange={(e) => setFormConfig({ ...formConfig, title: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleSaveForm}
                                disabled={loading}
                                className="w-full py-5 bg-gray-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-gray-200 hover:-translate-y-1 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Schema
                            </button>
                        </div>
                    </div>

                    {/* Visual Field Builder */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex justify-between items-center bg-white px-8 py-5 rounded-[1.5rem] border border-gray-100 shadow-sm">
                            <h3 className="font-extrabold text-gray-900 tracking-tight">Data Field Architecture</h3>
                            <button
                                onClick={addField}
                                className="px-5 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                            >
                                <Plus className="w-4 h-4 inline-block mr-1 -mt-0.5" /> Inject Field
                            </button>
                        </div>

                        {formConfig.fields.length === 0 && (
                            <div className="p-24 border-2 border-dashed border-gray-100 rounded-[2.5rem] text-center bg-white">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200">
                                    <Clipboard className="w-10 h-10" />
                                </div>
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No definitions found</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-4">
                            {formConfig.fields.map((field: any, index: number) => (
                                <div key={field.id || index} className="group bg-white p-6 rounded-[2rem] border border-gray-50 shadow-sm hover:shadow-xl hover:shadow-gray-200/30 transition-all flex items-center gap-6 animate-in slide-in-from-right-4 duration-300">
                                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center shrink-0">
                                        {getFieldIcon(field.type)}
                                    </div>
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-tighter">Field Label</span>
                                            <input
                                                aria-label="Field Label"
                                                className="w-full text-base font-black text-gray-900 border-none p-0 focus:ring-0 bg-transparent"
                                                value={field.label}
                                                placeholder="e.g. Corporate Email"
                                                onChange={(e) => {
                                                    const news = [...formConfig.fields];
                                                    news[index].label = e.target.value;
                                                    news[index].name = e.target.value.toLowerCase().split(' ').join('_');
                                                    setFormConfig({ ...formConfig, fields: news });
                                                }}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-tighter">Validator Type</span>
                                            <select
                                                aria-label="Field Type"
                                                className="w-full text-xs font-bold text-gray-500 p-0 border-none focus:ring-0 bg-transparent cursor-pointer"
                                                value={field.type}
                                                onChange={(e) => {
                                                    const news = [...formConfig.fields];
                                                    news[index].type = e.target.value;
                                                    setFormConfig({ ...formConfig, fields: news });
                                                }}
                                            >
                                                <option value="text">Alphanumeric</option>
                                                <option value="email">Email Address</option>
                                                <option value="tel">Phone (E.164)</option>
                                                <option value="textarea">Rich Textarea</option>
                                            </select>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const news = formConfig.fields.filter((_: any, i: number) => i !== index);
                                            setFormConfig({ ...formConfig, fields: news });
                                        }}
                                        className="p-4 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'notifications' && (
                <div className="max-w-3xl mx-auto space-y-8">
                    <div className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl shadow-gray-200/50 overflow-hidden">
                        <div className="p-12 bg-indigo-600 text-white relative overflow-hidden">
                            <div className="relative z-10 flex justify-between items-start">
                                <div>
                                    <h3 className="text-3xl font-black tracking-tight mb-2">SMTP Relay</h3>
                                    <p className="text-indigo-100 font-medium">Configure high-priority email notifications</p>
                                </div>
                                <button
                                    onClick={() => setEmailSettings({ ...emailSettings, is_enabled: !emailSettings.is_enabled })}
                                    className={`px-6 py-2 rounded-full text-[10px] font-black transition-all border-2 ${emailSettings.is_enabled
                                        ? 'bg-white text-indigo-600 border-white'
                                        : 'bg-transparent text-white border-white/30 hover:bg-white/10'
                                        }`}
                                >
                                    {emailSettings.is_enabled ? 'SYSTEM ONLINE' : 'SYSTEM OFFLINE'}
                                </button>
                            </div>
                            <Send className="absolute -right-8 -bottom-8 w-48 h-48 text-white/10 -rotate-12" />
                        </div>

                        <div className="p-12 space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-2">
                                    <label htmlFor="smtp-host" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Host Gateway</label>
                                    <input
                                        id="smtp-host"
                                        type="text"
                                        placeholder="e.g. smtp.gmail.com"
                                        className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                        value={emailSettings.smtp_host}
                                        onChange={(e) => setEmailSettings({ ...emailSettings, smtp_host: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="smtp-port" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Secure Port</label>
                                    <input
                                        id="smtp-port"
                                        type="number"
                                        placeholder="587"
                                        className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                        value={emailSettings.smtp_port}
                                        onChange={(e) => setEmailSettings({ ...emailSettings, smtp_port: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="smtp-user" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Username / Auth</label>
                                    <input
                                        id="smtp-user"
                                        type="text"
                                        className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                        value={emailSettings.smtp_user}
                                        onChange={(e) => setEmailSettings({ ...emailSettings, smtp_user: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="smtp-pass" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Encrypted Secret</label>
                                    <input
                                        id="smtp-pass"
                                        type="password"
                                        className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                        value={emailSettings.smtp_pass}
                                        onChange={(e) => setEmailSettings({ ...emailSettings, smtp_pass: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-1 md:col-span-2 space-y-2">
                                    <label htmlFor="sender-email" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Origin Identifier (Sender)</label>
                                    <input
                                        id="sender-email"
                                        type="email"
                                        placeholder="notifications@yourdomain.com"
                                        className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                        value={emailSettings.sender_email}
                                        onChange={(e) => setEmailSettings({ ...emailSettings, sender_email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="pt-6">
                                <button
                                    onClick={handleSaveEmail}
                                    disabled={loading}
                                    className="w-full py-5 bg-gray-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-gray-200 hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
                                >
                                    <Shield className="w-4 h-4" />
                                    Persistent Settings
                                </button>
                            </div>

                            <div className="p-8 bg-indigo-50 rounded-[2rem] border border-indigo-100 flex gap-6">
                                <AlertCircle className="w-8 h-8 text-indigo-400 shrink-0" />
                                <div className="space-y-1">
                                    <p className="text-xs font-black text-indigo-900 uppercase tracking-tight">System Notice</p>
                                    <p className="text-[11px] text-indigo-700 leading-relaxed font-medium">
                                        SMTP credentials are required for real-time lead escalation. For high-security environments, use isolated App Passwords or dedicated relay services.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
