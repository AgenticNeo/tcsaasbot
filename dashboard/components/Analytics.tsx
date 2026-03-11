'use client';

import React, { useState, useEffect } from 'react';
import { dashboardApi } from '@/lib/api';
import {
    TrendingUp, MessageSquare, Target, Activity,
    ArrowUpRight, Bot, Sparkles,
    Calendar, Download, MousePointer2,
    Zap, Shield, Globe
} from 'lucide-react';

export function Analytics() {
    const [summary, setSummary] = useState<any>(null);
    const [trends, setTrends] = useState<any[]>([]);
    const [botPerformance, setBotPerformance] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        try {
            const [sumRes, trendRes, perfRes] = await Promise.all([
                dashboardApi.getAnalyticsSummary(),
                dashboardApi.getAnalyticsTrends(),
                dashboardApi.getBotPerformance()
            ]);
            setSummary(sumRes.data);
            setTrends(trendRes.data);
            setBotPerformance(perfRes.data);
        } catch (err) {
            console.error("Analytics failure:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-32 space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Aggregating Global Trends...</p>
        </div>
    );

    const maxVal = Math.max(...trends.flatMap(t => [t.leads, t.conversations]), 1);

    const metrics = [
        { id: 'leads', label: 'Captured Leads', val: summary?.total_leads || 0, icon: Target, color: 'blue', desc: 'verified conversions' },
        { id: 'convs', label: 'Total Sessions', val: summary?.total_conversations || 0, icon: MessageSquare, color: 'indigo', desc: 'signal throughput' },
        { id: 'rate', label: 'Conversion Rate', val: `${summary?.conversion_rate || 0}%`, icon: TrendingUp, color: 'emerald', desc: 'visit-to-lead efficiency' },
        { id: 'msgs', label: 'Signal Volume', val: summary?.messages_sent || 0, icon: Activity, color: 'amber', desc: 'total neural packets' }
    ];

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Control Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Intelligence Report</h2>
                    <p className="text-gray-500 font-medium">Global performance and conversion metrics</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-6 py-3 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 transition-all shadow-sm flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> 7 Days
                    </button>
                    <button className="px-6 py-3 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-gray-200 flex items-center gap-2">
                        <Download className="w-4 h-4" /> Export
                    </button>
                </div>
            </div>

            {/* Metric Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {metrics.map((stat) => (
                    <div key={stat.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/40 relative overflow-hidden group">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 bg-${stat.color}-50 text-${stat.color}-600 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-3xl font-black text-gray-900 tracking-tight mb-1">{stat.val}</h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">{stat.label}</p>
                            <div className="h-px w-full bg-gray-50 mb-3" />
                            <p className="text-[10px] text-gray-400 font-medium flex items-center gap-1.5 uppercase tracking-tighter italic">
                                <Sparkles className="w-3 h-3 text-amber-400" />
                                {stat.desc}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Engagement Area Chart (Bar Representation) */}
                <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-gray-100 shadow-2xl shadow-gray-200/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
                        <div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Signal Periodicity</h3>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mt-1">Cross-Dimensional Activity</p>
                        </div>
                        <div className="flex gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-indigo-600 rounded-full shadow-lg shadow-indigo-200" />
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Sessions</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-lg shadow-emerald-200" />
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Conversions</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-72 flex items-end justify-between gap-6 px-4">
                        {trends.map((day) => (
                            <div
                                key={day.date}
                                className="flex-1 flex flex-col items-center gap-4 group relative h-full justify-end"
                            >
                                <div className="w-full flex items-end justify-center h-full relative">
                                    {/* Session Bar */}
                                    <div
                                        style={{ height: `${(day.conversations / maxVal) * 100}%` }}
                                        className="w-4 bg-indigo-600/90 rounded-full hover:bg-indigo-600 transition-all cursor-pointer relative z-10 hover:shadow-2xl hover:shadow-indigo-400 shadow-sm"
                                    >
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] font-black px-2 py-1 rounded-lg pointer-events-none shadow-xl z-30">
                                            {day.conversations}
                                        </div>
                                    </div>
                                    {/* Lead Bar */}
                                    <div
                                        style={{ height: `${(day.leads / maxVal) * 100}%` }}
                                        className="w-4 bg-emerald-500/90 rounded-full hover:bg-emerald-500 transition-all cursor-pointer relative -ml-1 hover:shadow-2xl hover:shadow-emerald-400 shadow-sm"
                                    >
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] font-black px-2 py-1 rounded-lg pointer-events-none shadow-xl z-30">
                                            {day.leads}
                                        </div>
                                    </div>

                                    {/* Grid Lines */}
                                    <div className="absolute bottom-0 w-[200%] h-px bg-gray-50 -z-0" />
                                </div>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest transform group-hover:scale-110 group-hover:text-gray-900 transition-all">
                                    {new Date(day.date).toLocaleDateString([], { weekday: 'short' })}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Performance Rankings */}
                <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-2xl shadow-gray-200/50 flex flex-col">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Agent Rankings</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Production Hierarchy</p>
                        </div>
                        <Shield className="w-6 h-6 text-gray-200" />
                    </div>

                    <div className="space-y-8 flex-1">
                        {botPerformance.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-10 space-y-4 border-2 border-dashed border-gray-100 rounded-[2rem]">
                                <Bot className="w-12 h-12 text-gray-100" />
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Telemetry Offline</p>
                            </div>
                        ) : botPerformance.map((bot, i) => (
                            <div key={bot.id} className="group relative">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black transition-all duration-500 ${i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-50 text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                                            }`}>
                                            {i === 0 ? <Zap className="w-4 h-4 fill-amber-500" /> : i + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-gray-900 tracking-tight">{bot.bot_name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{bot.conversations} Sessions</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-emerald-600 flex items-center gap-1">
                                            +{bot.leads} <ArrowUpRight className="w-3 h-3" />
                                        </p>
                                    </div>
                                </div>
                                <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden shadow-inner">
                                    <div
                                        className={`h-full transition-all duration-1000 rounded-full ${i === 0 ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-indigo-600'
                                            }`}
                                        style={{ width: `${(bot.leads / (summary?.total_leads || 1)) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-10 pt-8 border-t border-gray-50 flex items-center justify-center gap-2">
                        <MousePointer2 className="w-3 h-3 text-gray-300" />
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Neural Ranking Finalized</span>
                    </div>
                </div>
            </div>

            {/* Bottom Meta */}
            <div className="flex flex-col md:flex-row gap-6">
                {[
                    { label: 'Real-time Processing', val: 'Active', icon: Activity, color: 'text-green-500' },
                    { label: 'Latency Node', val: 'US-East-1', icon: Globe, color: 'text-blue-500' },
                    { label: 'RAG Synchronization', val: 'Verified', icon: Sparkles, color: 'text-amber-500' }
                ].map((item, i) => (
                    <div key={i} className="flex-1 bg-white p-6 rounded-[1.5rem] border border-gray-100 flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                            <item.icon className={`w-4 h-4 ${item.color}`} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{item.label}</p>
                            <p className="text-xs font-black text-gray-900 uppercase tracking-tighter">{item.val}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
