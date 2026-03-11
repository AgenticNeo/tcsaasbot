'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { dashboardApi } from '@/lib/api';
import { Bot, Document } from '@/lib/types';
import {
    Activity,
    AlertTriangle,
    CheckCircle2,
    ExternalLink,
    FileText,
    Globe,
    Loader2,
    PlayCircle,
    ShieldCheck
} from 'lucide-react';

type CrawlAuditSummary = {
    total_documents: number;
    web_documents: number;
    file_documents: number;
    unique_web_sources: number;
    duplicate_web_documents: number;
    last_crawl_at?: string | null;
    last_upload_at?: string | null;
    top_domains: Array<{ domain: string; pages: number }>;
};

export function KnowledgeAudit() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [bots, setBots] = useState<Bot[]>([]);
    const [summary, setSummary] = useState<CrawlAuditSummary | null>(null);
    const [loading, setLoading] = useState(true);

    const [testBotId, setTestBotId] = useState<number | ''>('');
    const [testQuestion, setTestQuestion] = useState('');
    const [expectedKeyword, setExpectedKeyword] = useState('');
    const [runningTest, setRunningTest] = useState(false);
    const [testResult, setTestResult] = useState<{
        answer: string;
        passed: boolean | null;
        responseMs: number;
    } | null>(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [docsRes, botsRes, summaryRes] = await Promise.all([
                    dashboardApi.getDocuments(),
                    dashboardApi.getBots(),
                    dashboardApi.getCrawlAuditSummary(),
                ]);
                setDocuments(docsRes.data);
                setBots(botsRes.data);
                setSummary(summaryRes.data);
            } catch (err) {
                console.error('Failed to load audit view', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const webDocs = useMemo(
        () => documents.filter((d) => d.source.startsWith('http://') || d.source.startsWith('https://')),
        [documents]
    );
    const sectionDocs = useMemo(
        () => documents.filter((d) => d.source.includes('/__tc_section/')),
        [documents]
    );

    const coverage = useMemo(() => {
        const lower = (v: string) => v.toLowerCase();
        const has = (keys: string[]) =>
            documents.some((d) => {
                const text = `${lower(d.title)} ${lower(d.content_snippet)} ${lower(d.source)}`;
                return keys.some((k) => text.includes(k));
            });
        return {
            products: has(['product', 'catalog', 'sku', 'shop', 'store']),
            services: has(['service', 'solution']),
            faqs: has(['faq', 'frequently asked', 'question']),
            contact: has(['contact', 'phone', 'email', 'address']),
            about: has(['about', 'company', 'team']),
        };
    }, [documents]);

    const runChatbotTest = async () => {
        if (!testBotId || !testQuestion.trim()) return;
        setRunningTest(true);
        setTestResult(null);
        try {
            const res = await dashboardApi.runAuditTest({
                bot_id: Number(testBotId),
                question: testQuestion.trim(),
                expected_keyword: expectedKeyword.trim(),
            });
            setTestResult({
                answer: res.data.answer || '',
                passed: typeof res.data.passed === 'boolean' ? res.data.passed : null,
                responseMs: Number(res.data.response_ms || 0),
            });
        } catch (err: any) {
            const detail = err?.response?.data?.detail || 'Test failed due to API error.';
            setTestResult({ answer: detail, passed: false, responseMs: 0 });
        } finally {
            setRunningTest(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-24">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="bg-white rounded-3xl border p-8">
                <h2 className="text-2xl font-black text-gray-900">Crawl Audit</h2>
                <p className="text-sm text-gray-500 mt-1">Track crawling volume, duplicates, and freshness.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
                    <div className="rounded-2xl border p-4 bg-gray-50">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Docs</p>
                        <p className="text-2xl font-black text-gray-900 mt-1">{summary?.total_documents || 0}</p>
                    </div>
                    <div className="rounded-2xl border p-4 bg-gray-50">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Web Docs</p>
                        <p className="text-2xl font-black text-gray-900 mt-1">{summary?.web_documents || 0}</p>
                    </div>
                    <div className="rounded-2xl border p-4 bg-gray-50">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Unique Pages</p>
                        <p className="text-2xl font-black text-gray-900 mt-1">{summary?.unique_web_sources || 0}</p>
                    </div>
                    <div className="rounded-2xl border p-4 bg-gray-50">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Duplicates</p>
                        <p className="text-2xl font-black text-gray-900 mt-1">{summary?.duplicate_web_documents || 0}</p>
                    </div>
                    <div className="rounded-2xl border p-4 bg-gray-50">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Section Docs</p>
                        <p className="text-2xl font-black text-gray-900 mt-1">{sectionDocs.length}</p>
                    </div>
                    <div className="rounded-2xl border p-4 bg-gray-50">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Last Crawl</p>
                        <p className="text-sm font-bold text-gray-900 mt-2">
                            {summary?.last_crawl_at ? new Date(summary.last_crawl_at).toLocaleString() : 'N/A'}
                        </p>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="rounded-2xl border p-5">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Top Domains</h3>
                        <div className="space-y-3 mt-4">
                            {(summary?.top_domains || []).length === 0 && (
                                <p className="text-sm text-gray-500">No crawled domains yet.</p>
                            )}
                            {(summary?.top_domains || []).map((entry) => (
                                <div key={entry.domain} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <Globe className="w-4 h-4 text-indigo-500" />
                                        <p className="text-sm font-semibold text-gray-800 truncate">{entry.domain}</p>
                                    </div>
                                    <span className="text-xs font-black text-gray-500">{entry.pages} pages</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border p-5">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Coverage Health</h3>
                        <div className="mt-4 space-y-3">
                            <div className="flex items-center gap-2 text-sm">
                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                <span className="text-gray-700">
                                    Crawl consistency: {summary?.duplicate_web_documents ? 'Needs cleanup' : 'Healthy'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Activity className="w-4 h-4 text-blue-500" />
                                <span className="text-gray-700">Indexed web pages visible to RAG: {webDocs.length}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                {summary?.duplicate_web_documents ? (
                                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                                ) : (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                )}
                                <span className="text-gray-700">
                                    Duplicate prevention is now enabled for website sync.
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-3">
                                {[
                                    { label: 'Products', ok: coverage.products },
                                    { label: 'Services', ok: coverage.services },
                                    { label: 'FAQs', ok: coverage.faqs },
                                    { label: 'Contact', ok: coverage.contact },
                                    { label: 'About', ok: coverage.about },
                                ].map((item) => (
                                    <div key={item.label} className="flex items-center gap-2 text-xs">
                                        {item.ok ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                                        <span className="text-gray-700">{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl border p-8">
                <h2 className="text-2xl font-black text-gray-900">Chatbot Test Runner</h2>
                <p className="text-sm text-gray-500 mt-1">Run grounded QA checks against your live bot.</p>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mt-6">
                    <select
                        value={testBotId}
                        onChange={(e) => setTestBotId(e.target.value ? Number(e.target.value) : '')}
                        className="bg-gray-50 border rounded-2xl px-4 py-3 text-sm font-medium"
                    >
                        <option value="">Select bot</option>
                        {bots.map((bot) => (
                            <option key={bot.id} value={bot.id}>{bot.name}</option>
                        ))}
                    </select>
                    <input
                        value={testQuestion}
                        onChange={(e) => setTestQuestion(e.target.value)}
                        placeholder="Ask a knowledge-grounded question"
                        className="lg:col-span-2 bg-gray-50 border rounded-2xl px-4 py-3 text-sm font-medium"
                    />
                    <input
                        value={expectedKeyword}
                        onChange={(e) => setExpectedKeyword(e.target.value)}
                        placeholder="Expected keyword (optional)"
                        className="bg-gray-50 border rounded-2xl px-4 py-3 text-sm font-medium"
                    />
                </div>

                <button
                    onClick={runChatbotTest}
                    disabled={runningTest || !testBotId || !testQuestion.trim()}
                    className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest disabled:opacity-50"
                >
                    {runningTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                    Run Test
                </button>

                {testResult && (
                    <div className="mt-6 rounded-2xl border p-5 bg-gray-50">
                        <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest">
                            <span className="text-gray-500">Latency: {testResult.responseMs}ms</span>
                            {testResult.passed === null && <span className="text-blue-600">Completed</span>}
                            {testResult.passed === true && <span className="text-emerald-600">Pass</span>}
                            {testResult.passed === false && <span className="text-amber-600">Check Failed</span>}
                        </div>
                        <p className="text-sm text-gray-800 mt-3 leading-relaxed whitespace-pre-wrap">{testResult.answer}</p>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-3xl border overflow-hidden">
                <div className="px-8 py-6 border-b">
                    <h3 className="text-lg font-black text-gray-900">Indexed Web Pages</h3>
                    <p className="text-xs text-gray-500 mt-1">Review what is currently available for chatbot retrieval.</p>
                </div>
                <div className="divide-y">
                    {webDocs.length === 0 && (
                        <div className="p-8 text-sm text-gray-500">No web pages indexed yet.</div>
                    )}
                    {webDocs.map((doc) => (
                        <div key={doc.id} className="p-6 flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-gray-400" />
                                    <p className="text-sm font-bold text-gray-900 truncate">{doc.title}</p>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{new Date(doc.created_at).toLocaleString()}</p>
                            </div>
                            <a
                                href={doc.source}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-black text-blue-600"
                            >
                                Source <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
