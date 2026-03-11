'use client';

import React, { useState, useEffect } from 'react';
import { dashboardApi } from '@/lib/api';
import {
    MessageSquare, Activity, Clock, Zap, Smile,
    ArrowUpRight, ArrowDownRight, Download,
    ChevronRight, BrainCircuit, ZapOff, Sparkles, Target
} from 'lucide-react';

export function AIReport() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [bots, setBots] = useState<any[]>([]);
    const [selectedBotId, setSelectedBotId] = useState<string>('all');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                setError(null);
                const [statsRes, botsRes] = await Promise.all([
                    dashboardApi.getAIPerformance(selectedBotId === 'all' ? undefined : Number(selectedBotId)),
                    dashboardApi.getBots()
                ]);
                setStats(statsRes.data);
                setBots(botsRes.data);
            } catch (err) {
                console.error("AI Performance fetch failed:", err);
                setError("Unable to load AI reports. Please re-login and try again.");
                setStats(null);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [selectedBotId]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-32 space-y-4">
            <div className="w-16 h-16 relative">
                <div className="absolute inset-0 border-4 border-blue-500/10 rounded-full" />
                <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <BrainCircuit className="absolute inset-0 m-auto w-6 h-6 text-blue-600 animate-pulse" />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] animate-pulse">Calculating Deflection Neural Net...</p>
        </div>
    );

    if (!stats) {
        return (
            <div className="bg-white border rounded-3xl p-10 text-center">
                <p className="text-sm font-black text-red-600">AI Reports unavailable</p>
                <p className="text-xs text-gray-500 mt-2">{error || 'No data available.'}</p>
                <button
                    onClick={() => globalThis.location.reload()}
                    className="mt-5 px-5 py-2.5 rounded-xl bg-gray-900 text-white text-xs font-black uppercase tracking-widest"
                    type="button"
                >
                    Reload
                </button>
            </div>
        );
    }

    const metrics = [
        { label: 'Total AI Interactions', val: stats.total_ai_chats, icon: MessageSquare, color: 'blue', change: '+12%', positive: true, desc: 'sessions handled by neural bots' },
        { label: 'AI Resolution Rate', val: `${stats.resolution_rate}%`, icon: Zap, color: 'emerald', change: '+2.4%', positive: true, desc: 'percentage resolved without humans' },
        { label: 'Avg. Response Time', val: stats.avg_response_time, icon: Clock, color: 'amber', change: '-200ms', positive: true, desc: 'mean latency per transmission' },
        { label: 'Signal Satisfaction', val: stats.csat, icon: Smile, color: 'indigo', change: '+0.2', positive: true, desc: 'average CSAT (out of 5.0)' },
    ];

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {/* Command Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-200">Autonomous Unit</div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tighter">AI Agent Reports</h2>
                    </div>
                    <p className="text-gray-500 font-medium">Deep-dive analysis of autonomous agent performance and efficiency.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex bg-white border border-gray-100 p-1.5 rounded-2xl shadow-sm">
                        <select
                            value={selectedBotId}
                            onChange={(e) => setSelectedBotId(e.target.value)}
                            className="bg-transparent text-[10px] font-black uppercase tracking-widest px-4 py-2 focus:outline-none"
                        >
                            <option value="all">Global Fleet</option>
                            {bots.map(bot => (
                                <option key={`bot-opt-${bot.id}`} value={bot.id.toString()}>{bot.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="hidden md:flex bg-white border border-gray-100 p-1.5 rounded-2xl shadow-sm">
                        {['Day', 'Week', 'Month'].map((t) => (
                            <button key={`period-${t}`} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${t === 'Week' ? 'bg-gray-900 text-white shadow-xl shadow-gray-200' : 'text-gray-400 hover:text-gray-900'}`}>
                                {t}
                            </button>
                        ))}
                    </div>
                    <button className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-blue-500 transition-colors group">
                        <Download className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                    </button>
                </div>
            </div>

            {/* Neural Metric Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {metrics.map((m) => (
                    <div key={`metric-${m.label}`} className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-gray-200/40 relative overflow-hidden group hover:-translate-y-1 transition-all">
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-8">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-${m.color}-50 text-${m.color}-600 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-sm`}>
                                    <m.icon className="w-7 h-7" />
                                </div>
                                <div className={`flex items-center gap-1 text-[10px] font-black ${m.positive ? 'text-emerald-600' : 'text-rose-600'} bg-${m.positive ? 'emerald' : 'rose'}-50 px-2.5 py-1 rounded-lg border border-${m.positive ? 'emerald' : 'rose'}-100`}>
                                    {m.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                    {m.change}
                                </div>
                            </div>
                            <h3 className="text-4xl font-black text-gray-900 tracking-tighter mb-1">{m.val}</h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">{m.label}</p>
                            <div className="h-px w-full bg-gray-50 mb-4" />
                            <p className="text-[10px] text-gray-400 font-medium leading-relaxed italic">{m.desc}</p>
                        </div>
                        <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-${m.color}-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000`} />
                    </div>
                ))}
            </div>

            {/* Main Visualizations */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Deflection Stream Chart */}
                <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-gray-100 shadow-2xl shadow-gray-200/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
                        <div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Deflection Efficiency</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-1">Cross-Dimensional Resolution Analytics</p>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-600 rounded-full shadow-lg shadow-blue-200" />
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">AI Resolved</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-amber-400 rounded-full shadow-lg shadow-amber-200" />
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Transferred</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-gray-300 rounded-full shadow-lg shadow-gray-100" />
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Abandoned</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-80 flex items-end justify-between gap-4 px-2">
                        {stats.deflection_trend.map((day: any) => (
                            <div key={`trend-${day.date}`} className="flex-1 flex flex-col items-center group relative h-full">
                                <div className="flex-1 w-full flex flex-col justify-end gap-1 relative group-hover:scale-x-110 transition-transform">
                                    <div
                                        style={{ height: `${(day.ai / 250) * 100}%` }}
                                        className="w-full bg-blue-600 rounded-t-lg shadow-lg shadow-blue-100 relative group/bar hover:brightness-110"
                                    >
                                        <div className="hidden group-hover/bar:block absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] font-black px-2 py-1 rounded shadow-xl whitespace-nowrap z-50">AI: {day.ai}</div>
                                    </div>
                                    <div
                                        style={{ height: `${(day.human / 250) * 100}%` }}
                                        className="w-full bg-amber-400 rounded-sm shadow-lg shadow-amber-100 relative group/bar hover:brightness-110"
                                    >
                                        <div className="hidden group-hover/bar:block absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] font-black px-2 py-1 rounded shadow-xl whitespace-nowrap z-50">Trans: {day.human}</div>
                                    </div>
                                    <div
                                        style={{ height: `${(day.abandoned / 250) * 100}%` }}
                                        className="w-full bg-gray-200 rounded-b-lg relative group/bar"
                                    >
                                        <div className="hidden group-hover/bar:block absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] font-black px-2 py-1 rounded shadow-xl whitespace-nowrap z-50">Aband: {day.abandoned}</div>
                                    </div>
                                </div>
                                <span className="mt-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">{day.date}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CSAT Distribution */}
                <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-2xl shadow-gray-200/50 flex flex-col">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Satisfaction Heat</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Sentiment Distribution</p>
                        </div>
                        <Smile className="w-6 h-6 text-indigo-200" />
                    </div>

                    <div className="space-y-8 flex-1">
                        {[5, 4, 3, 2, 1].map((rating) => {
                            let percentage = '2%';
                            if (rating === 5) percentage = '72%';
                            if (rating === 4) percentage = '18%';
                            return (
                                <div key={`rating-${rating}`} className="space-y-3">
                                    <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-900">{rating} Star</span>
                                            <div className="flex gap-0.5">
                                                {[...new Array(5)].map((_, i) => (
                                                    <div key={`star-${rating}-${i}`} className={`w-1 h-1 rounded-full ${i < rating ? 'bg-amber-400' : 'bg-gray-100'}`} />
                                                ))}
                                            </div>
                                        </div>
                                        <span className="text-gray-900">{percentage}</span>
                                    </div>
                                    <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full bg-indigo-600 rounded-full`}
                                            style={{ width: percentage }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-10 p-6 bg-indigo-50 rounded-2xl flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Consensus</p>
                            <p className="text-xs font-bold text-indigo-700">Exceptional Clarity</p>
                        </div>
                        <Sparkles className="w-5 h-5 text-indigo-400" />
                    </div>
                </div>
            </div>

            {/* Topic Analysis & Transfers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Topic Breakdown */}
                <div className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl shadow-gray-200/50 p-10">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                                <BrainCircuit className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-900 tracking-tight">Top Intent Clusters</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Core Training Needs</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {stats.top_topics.map((t: any) => {
                            let impactStyles = 'bg-blue-50 text-blue-600 border border-blue-100';
                            if (t.impact === 'High') impactStyles = 'bg-rose-50 text-rose-600 border border-rose-100';
                            if (t.impact === 'Medium') impactStyles = 'bg-amber-50 text-amber-600 border border-amber-100';
                            return (
                                <div key={`topic-${t.topic}`} className="flex items-center justify-between p-6 bg-gray-50/50 rounded-3xl border border-transparent hover:border-gray-100 hover:bg-white transition-all group cursor-pointer">
                                    <div className="flex items-center gap-6">
                                        <div className="flex-1">
                                            <p className="text-sm font-black text-gray-900">{t.topic}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{t.count} Interactions</p>
                                        </div>
                                    </div>
                                    <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${impactStyles}`}>
                                        {t.impact} Impact
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Handover Log */}
                <div className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl shadow-gray-200/50 p-10 flex flex-col">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600">
                                <ZapOff className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-900 tracking-tight">Transfer Intelligence</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Optimization Opportunities</p>
                            </div>
                        </div>
                        <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Full Log</button>
                    </div>

                    <div className="flex-1 space-y-4">
                        {stats.recent_transfers.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-10 space-y-4 border-2 border-dashed border-gray-100 rounded-[2rem]">
                                <Target className="w-12 h-12 text-gray-100" />
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">No Recent Handovers</p>
                            </div>
                        ) : stats.recent_transfers.map((t: any) => (
                            <div key={`transfer-${t.id}`} className="flex items-center gap-6 p-6 hover:bg-gray-50 rounded-[2rem] transition-all border border-transparent hover:border-gray-100">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-400 border border-gray-100 group shadow-sm">
                                    <Target className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-sm font-black text-gray-900">{t.user}</p>
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t.time}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 font-medium truncate italic">" {t.reason} "</p>
                                </div>
                                <button className="p-3 bg-white border border-gray-50 rounded-xl hover:bg-white hover:shadow-lg transition-all">
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 pt-8 border-t border-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-green-500" />
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">System Health: 99.9%</span>
                        </div>
                        <button className="px-6 py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all">Enable Auto-Training</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
