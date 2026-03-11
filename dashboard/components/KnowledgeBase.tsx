'use client';

import { dashboardApi } from '@/lib/api';
import { Document } from '@/lib/types';
import React, { useState, useEffect, useMemo } from 'react';
import { Upload, Trash2, FileText, Loader2, Globe, Search, Plus, ExternalLink, Sparkles, BookOpen } from 'lucide-react';

export function KnowledgeBase() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [websiteUrl, setWebsiteUrl] = useState('');
    const [maxPages, setMaxPages] = useState(3000);
    const [useSitemaps, setUseSitemaps] = useState(true);
    const [scraping, setScraping] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchDocuments = () => {
        dashboardApi.getDocuments().then(res => {
            setDocuments(res.data);
            setLoading(false);
        }).catch(err => {
            console.error("Failed to fetch documents", err);
            setLoading(false);
        });
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setUploading(true);
        try {
            await dashboardApi.uploadDocument(file);
            fetchDocuments();
        } catch (error) {
            console.error("Upload failed", error);
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleScrape = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!websiteUrl.trim()) return;
        setScraping(true);
        try {
            const res = await dashboardApi.scrapeWebsite(websiteUrl, {
                max_pages: maxPages,
                use_sitemaps: useSitemaps,
                index_sections: true,
            });
            setWebsiteUrl('');
            fetchDocuments();
            alert(
                `Crawl completed. Scraped ${res.data.pages_scraped} pages, discovered ${res.data.pages_discovered}, newly indexed ${res.data.new_pages_indexed}, section docs indexed ${res.data.section_docs_indexed}.`
            );
        } catch (error: any) {
            alert(error.response?.data?.detail || "Scraping failed.");
        } finally {
            setScraping(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure?")) return;
        try {
            await dashboardApi.deleteDocument(id);
            setDocuments(prev => prev.filter(d => d.id !== id));
        } catch (error) {
            console.error("Delete failed", error);
        }
    };

    const filteredDocs = useMemo(() => {
        return documents.filter(doc =>
            doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.content_snippet.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [documents, searchQuery]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-32 space-y-4">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Synchronizing Knowledge...</p>
        </div>
    );

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Upload Section */}
                <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm hover:shadow-xl hover:shadow-blue-50/50 transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                        <Upload className="w-24 h-24 text-blue-600" />
                    </div>
                    <div className="relative z-10 space-y-6">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                            <Plus className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900">Import Documents</h2>
                            <p className="text-xs text-gray-500 font-medium leading-relaxed mt-2">
                                Feed your AI with PDF, TXT, or MD files. Use manuals, guides, or policy documents.
                            </p>
                        </div>
                        <input
                            type="file"
                            id="file-upload"
                            className="hidden"
                            accept=".pdf,.txt,.md"
                            onChange={handleFileUpload}
                            disabled={uploading}
                        />
                        <label
                            htmlFor="file-upload"
                            className={`flex items-center justify-center gap-3 w-fit px-8 py-3 bg-gray-900 text-white rounded-2xl font-black text-xs hover:-translate-y-1 active:scale-95 cursor-pointer transition-all shadow-xl hover:shadow-gray-200 ${uploading ? 'opacity-50' : ''}`}
                        >
                            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            {uploading ? 'INGESTING...' : 'CHOOSE FILE'}
                        </label>
                    </div>
                </div>

                {/* Scrape Section */}
                <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm hover:shadow-xl hover:shadow-indigo-50/50 transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                        <Globe className="w-24 h-24 text-indigo-600" />
                    </div>
                    <div className="relative z-10 space-y-6">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                            <Globe className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900">Synchronize Website</h2>
                            <p className="text-xs text-gray-500 font-medium leading-relaxed mt-2">
                                Automatically crawl your product pages, FAQs, or blogs for real-time AI context.
                            </p>
                        </div>
                        <form onSubmit={handleScrape} className="flex gap-2">
                            <input
                                type="text"
                                className="flex-1 px-5 py-3 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-600 transition-all outline-none"
                                placeholder="https://docs.yoursite.com"
                                value={websiteUrl}
                                onChange={(e) => setWebsiteUrl(e.target.value)}
                                disabled={scraping}
                            />
                            <input
                                type="number"
                                min={1}
                                max={10000}
                                className="w-28 px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-600 transition-all outline-none"
                                value={maxPages}
                                onChange={(e) => setMaxPages(Number(e.target.value) || 1)}
                                disabled={scraping}
                                title="Max pages"
                            />
                            <button
                                type="submit"
                                disabled={scraping || !websiteUrl.trim()}
                                className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs shadow-lg shadow-indigo-200 hover:-translate-y-1 active:scale-95 transition-all"
                            >
                                {scraping ? <Loader2 className="w-4 h-4 animate-spin" /> : 'INDEX'}
                            </button>
                        </form>
                        <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
                            <input
                                type="checkbox"
                                checked={useSitemaps}
                                onChange={(e) => setUseSitemaps(e.target.checked)}
                                disabled={scraping}
                            />
                            Use sitemap discovery (recommended for large ecommerce catalogs)
                        </label>
                    </div>
                </div>
            </div>

            {/* Knowledge Ledger */}
            <div className="bg-white rounded-[2.5rem] border shadow-sm overflow-hidden">
                <div className="p-8 border-b flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                            Knowledge Ledger
                            <span className="px-2 py-0.5 bg-gray-100 text-[10px] font-black rounded-lg text-gray-500">{documents.length} ITEMS</span>
                        </h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Total intelligence synchronized for RAG</p>
                    </div>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Filter knowledge..."
                            className="w-full bg-gray-50 border-none rounded-2xl pl-11 pr-5 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-600 transition-all outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="divide-y divide-gray-50">
                    {filteredDocs.length === 0 ? (
                        <div className="p-32 text-center space-y-6">
                            <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto">
                                <BookOpen className="w-8 h-8 text-gray-200" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-gray-900">No Intelligence Found</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Start by adding documents or website URLs</p>
                            </div>
                        </div>
                    ) : (
                        filteredDocs.map((doc, i) => (
                            <div key={doc.id} className="p-8 flex items-center justify-between hover:bg-gray-50/50 transition-all group animate-in fade-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${i * 50}ms` }}>
                                <div className="flex items-start gap-6 overflow-hidden">
                                    <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-blue-600 transition-colors">
                                        {doc.source.startsWith('http')
                                            ? <Globe className="w-6 h-6 text-gray-400 group-hover:text-white" />
                                            : <FileText className="w-6 h-6 text-gray-400 group-hover:text-white" />
                                        }
                                    </div>
                                    <div className="min-w-0 space-y-1">
                                        <div className="flex items-center gap-3">
                                            <h4 className="font-black text-gray-900 truncate text-sm" title={doc.title}>{doc.title}</h4>
                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${doc.source.startsWith('http')
                                                ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                                : 'bg-blue-50 text-blue-700 border-blue-100'
                                                }`}>
                                                {doc.source.startsWith('http') ? 'WEB' : 'PDF/TXT'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 font-medium line-clamp-2 max-w-3xl leading-relaxed">
                                            {doc.content_snippet}
                                        </p>
                                        <div className="flex items-center gap-4 pt-2">
                                            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold">
                                                <Sparkles className="w-3 h-3 text-amber-400" />
                                                Ingested {new Date(doc.created_at).toLocaleDateString()}
                                            </div>
                                            {doc.source.startsWith('http') && (
                                                <a href={doc.source} target="_blank" rel="noopener" className="text-[10px] text-blue-600 font-black flex items-center gap-1 hover:underline">
                                                    Visit Source <ExternalLink className="w-2.5 h-2.5" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(doc.id)}
                                    className="p-3 text-gray-200 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {filteredDocs.length > 0 && (
                    <div className="p-6 bg-gray-50 border-t flex items-center justify-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Global RAG Synchronized for {documents.length} items</span>
                    </div>
                )}
            </div>
        </div>
    );
}
