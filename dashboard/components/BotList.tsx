'use client';

import { dashboardApi } from '@/lib/api';
import { Bot } from '@/lib/types';
import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Plus, X, Pencil, Trash2, Share2, Copy, Check, Bot as BotIcon } from 'lucide-react';
import { PrimaryButton, SecondaryButton } from './ConnecteamUIKit';
import { ChatWindow } from './ChatWindow';
import { LiveChat } from './LiveChat';
import { CannedResponses } from './CannedResponses';
import { SmallTalk } from './SmallTalk';
import { DataCollection } from './DataCollection';
import { VisualBuilder } from './VisualBuilder';
import { BotAgentSetup } from './BotAgentSetup';
import { AssistantConfig } from './AssistantConfig';
import { Integrations } from './Integrations';

interface BotListProps {
    readonly initialEditBotId?: number;
    readonly initialCreate?: boolean;
}

export function BotList({ initialEditBotId, initialCreate = false }: BotListProps) {
    const [bots, setBots] = useState<Bot[]>([]);
    const [loading, setLoading] = useState(true);

    // Create/Edit Modal
    const [isModalOpen, setIsModalOpen] = useState(initialCreate);
    const [newBotName, setNewBotName] = useState('');
    const [newBotDesc, setNewBotDesc] = useState('');
    const [newBotWelcome, setNewBotWelcome] = useState('Welcome to TangentCloud. Ask me anything.');
    const [newBotColor, setNewBotColor] = useState('#2563eb');
    const [newResponseMode, setNewResponseMode] = useState<'knowledge_only' | 'knowledge_plus_reasoning'>('knowledge_plus_reasoning');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [position, setPosition] = useState('right');
    const [placeholderText, setPlaceholderText] = useState('Type a message...');
    const [bubbleGreeting, setBubbleGreeting] = useState('');
    const [selectedTools, setSelectedTools] = useState<string[]>([]);
    const [editingBot, setEditingBot] = useState<Bot | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    // Share Modal
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [shareBot, setShareBot] = useState<Bot | null>(null);
    const [copiedLink, setCopiedLink] = useState(false);
    const [copiedEmbed, setCopiedEmbed] = useState(false);

    const [activeBot, setActiveBot] = useState<Bot | null>(null);
    const [configBot, setConfigBot] = useState<Bot | null>(null);
    const [configView, setConfigView] = useState<'assistant_config' | 'live_chat' | 'canned' | 'small_talk' | 'data_collection' | 'visual_builder' | 'integrations'>('assistant_config');
    const [autoOpenedFromQuery, setAutoOpenedFromQuery] = useState(false);
    const [highlightedBotId, setHighlightedBotId] = useState<number | null>(null);

    const openEditModal = useCallback((bot: Bot) => {
        setEditingBot(bot);
        setNewBotName(bot.name);
        setNewBotDesc(bot.description || '');
        setNewBotWelcome(bot.welcome_message || 'Welcome to TangentCloud. Ask me anything.');
        setNewBotColor(bot.primary_color || '#2563eb');
        setNewResponseMode((bot.response_mode as 'knowledge_only' | 'knowledge_plus_reasoning') || 'knowledge_plus_reasoning');
        setAvatarUrl(bot.avatar_url || '');
        setPosition(bot.position || 'right');
        setPlaceholderText(bot.placeholder_text || 'Type a message...');
        setBubbleGreeting(bot.bubble_greeting || '');
        setSelectedTools(bot.tools || []);
        setIsModalOpen(true);
    }, []);

    const fetchBots = useCallback(() => {
        dashboardApi.getBots().then((res) => {
            setBots(res.data);
            if (initialEditBotId && !autoOpenedFromQuery) {
                const matched = res.data.find((bot: Bot) => bot.id === initialEditBotId);
                if (matched) {
                    openEditModal(matched);
                    setAutoOpenedFromQuery(true);
                    setHighlightedBotId(matched.id);
                    requestAnimationFrame(() => {
                        document.getElementById(`bot-card-${matched.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    });
                }
            }
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, [initialEditBotId, autoOpenedFromQuery, openEditModal]);

    useEffect(() => {
        fetchBots();
    }, [fetchBots]);

    useEffect(() => {
        if (!highlightedBotId) return;
        const timer = globalThis.setTimeout(() => setHighlightedBotId(null), 2500);
        return () => globalThis.clearTimeout(timer);
    }, [highlightedBotId]);

    const openCreateModal = () => {
        setEditingBot(null);
        setNewBotName('');
        setNewBotDesc('');
        setNewBotWelcome('Welcome to TangentCloud. Ask me anything.');
        setNewBotColor('#2563eb');
        setNewResponseMode('knowledge_plus_reasoning');
        setAvatarUrl('');
        setPosition('right');
        setPlaceholderText('Type a message...');
        setBubbleGreeting('');
        setSelectedTools([]);
        setIsModalOpen(true);
    };

    const handleSetupNext = (formData: any) => {
        const botData = {
            name: formData.name,
            description: "AI Agent created via dashboard",
            prompt_template: formData.instructions,
            response_mode: 'knowledge_plus_reasoning' as const,
            welcome_message: "Welcome to TangentCloud. Ask me anything.",
            primary_color: '#000000',
            position: 'right',
            placeholder_text: 'Type a message...',
            bubble_greeting: 'Need help?',
            tools: []
        };

        dashboardApi.createBot(botData).then(() => {
            setIsCreating(false);
            fetchBots();
        }).catch(err => {
            console.error(err);
            alert("Failed to create agent");
        });
    };

    const openShareModal = (bot: Bot) => {
        setShareBot(bot);
        setCopiedLink(false);
        setCopiedEmbed(false);
        setIsShareModalOpen(true);
    };

    const openConfig = (bot: Bot) => {
        setConfigBot(bot);
        setConfigView('assistant_config');
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const botData = {
                name: newBotName,
                description: newBotDesc,
                welcome_message: newBotWelcome,
                primary_color: newBotColor,
                response_mode: newResponseMode,
                avatar_url: avatarUrl,
                position: position,
                placeholder_text: placeholderText,
                bubble_greeting: bubbleGreeting,
                tools: selectedTools,
                quick_replies: editingBot?.quick_replies || []
            };

            if (editingBot) {
                await dashboardApi.updateBot(editingBot.id, botData);
            } else {
                const created = await dashboardApi.createBot(botData);
                setConfigBot(created.data);
            }
            setIsModalOpen(false);
            fetchBots();
        } catch (error) {
            console.error(error);
            alert(`Failed to ${editingBot ? 'update' : 'create'} bot`);
        }
    };

    const handleDelete = async (botId: number) => {
        if (!confirm("Are you sure you want to delete this bot?")) return;
        try {
            await dashboardApi.deleteBot(botId);
            fetchBots();
        } catch (error) {
            console.error(error);
            alert("Failed to delete bot");
        }
    };

    const copyToClipboard = (text: string, type: 'link' | 'embed') => {
        navigator.clipboard.writeText(text);
        if (type === 'link') {
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2000);
        } else {
            setCopiedEmbed(true);
            setTimeout(() => setCopiedEmbed(false), 2000);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500 font-black uppercase tracking-widest text-[10px]">Synchronizing AI Registry...</div>;

    const publicLink = shareBot ? `${globalThis.location?.origin}/chat/${shareBot.id}` : '';
    const embedCode = shareBot ? `<script src="${globalThis.location?.origin}/embed.js" data-bot-id="${shareBot.id}" defer></script>` : '';

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Create Bot Card */}
                <button
                    className="card-elevated border-2 border-dashed border-primary/30 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all h-64 w-full group"
                    onClick={openCreateModal}
                    type="button"
                >
                    <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary group-hover:scale-110 transition-all">
                        <Plus className="h-6 w-6 text-primary group-hover:text-white" />
                    </div>
                    <span className="text-foreground font-bold text-xl">Create New Agent</span>
                    <span className="text-muted-foreground text-sm mt-2">Build a new AI persona</span>
                </button>

                {bots.map((bot) => (
                    <div
                        key={bot.id}
                        id={`bot-card-${bot.id}`}
                        className={`card-elevated rounded-lg p-6 shadow-md hover:shadow-lg transition-all h-64 flex flex-col justify-between group ${highlightedBotId === bot.id ? 'ring-2 ring-primary border-primary shadow-lg' : ''}`}
                    >
                        <div className="space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4 overflow-hidden">
                                    <div
                                        className="w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center text-white shadow-xl overflow-hidden"
                                        style={{ backgroundColor: bot.primary_color }}
                                    >
                                        {bot.avatar_url ? (
                                            <Image src={bot.avatar_url} alt={bot.name} width={48} height={48} className="w-full h-full object-cover" />
                                        ) : (
                                            <BotIcon className="w-6 h-6 fill-white" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-black text-gray-900 truncate text-lg tracking-tight">{bot.name}</h3>
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">{bot.position} aligned</p>
                                    </div>
                                </div>
                                <div className='flex gap-1 bg-gray-50 p-1 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity'>
                                    <button onClick={() => openShareModal(bot)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg transition-colors">
                                        <Share2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => openEditModal(bot)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg transition-colors">
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(bot.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 font-medium line-clamp-2 leading-relaxed">{bot.description || "Dedicated AI agent ready to serve your platform users."}</p>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-4 border-t border-border">
                            <div className="flex -space-x-2">
                                {bot.tools?.map(tool => (
                                    <div key={tool} className="w-8 h-8 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center" title={tool}>
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <SecondaryButton onClick={() => openConfig(bot)}>
                                    Configure
                                </SecondaryButton>
                                <PrimaryButton onClick={() => setActiveBot(bot)}>
                                    Simulate
                                </PrimaryButton>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal (Create/Edit) */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-foreground/40 backdrop-blur-md flex items-center justify-center z-[100] p-4">
                    <div className="bg-background rounded-lg p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-300 border border-border">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-3xl font-bold text-foreground">{editingBot ? 'Edit Agent' : 'Create New Agent'}</h2>
                                <p className="text-sm text-muted-foreground mt-1">Configure your AI agent's personality and behavior</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                                <X className="w-6 h-6 text-muted-foreground" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-10">
                            <section>
                                <h3 className="text-[10px] uppercase font-black text-blue-600 tracking-[0.2em] mb-6">Identity Cluster</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label htmlFor="botNameInput" className="text-[10px] font-black text-gray-400 uppercase ml-1">Visible Name</label>
                                        <input
                                            id="botNameInput"
                                            type="text"
                                            required
                                            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-sm font-medium focus:ring-2 focus:ring-blue-600 transition-all outline-none"
                                            value={newBotName}
                                            onChange={(e) => setNewBotName(e.target.value)}
                                            placeholder="e.g. Support Specialist"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="botColorInput" className="text-[10px] font-black text-gray-400 uppercase ml-1">Brand Color</label>
                                        <div className="flex gap-3">
                                            <input
                                                id="botColorInput"
                                                type="color"
                                                className="w-12 h-12 border-none bg-transparent cursor-pointer p-0"
                                                value={newBotColor}
                                                onChange={(e) => setNewBotColor(e.target.value)}
                                            />
                                            <input
                                                type="text"
                                                className="flex-1 bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-xs font-mono font-bold"
                                                value={newBotColor}
                                                onChange={(e) => setNewBotColor(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-[10px] uppercase font-black text-blue-600 tracking-[0.2em] mb-6">Personality Layers</h3>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label htmlFor="botGreetingInput" className="text-[10px] font-black text-gray-400 uppercase ml-1">Initial Shoutout</label>
                                        <input
                                            id="botGreetingInput"
                                            type="text"
                                            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-sm font-medium focus:ring-2 focus:ring-blue-600 transition-all outline-none"
                                            value={newBotWelcome}
                                            onChange={(e) => setNewBotWelcome(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="botDescInput" className="text-[10px] font-black text-gray-400 uppercase ml-1">Internal Description</label>
                                        <textarea
                                            id="botDescInput"
                                            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-sm font-medium focus:ring-2 focus:ring-blue-600 transition-all outline-none"
                                            value={newBotDesc}
                                            onChange={(e) => setNewBotDesc(e.target.value)}
                                            rows={2}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="botRespModeInput" className="text-[10px] font-black text-gray-400 uppercase ml-1">Knowledge Strategy</label>
                                        <select
                                            id="botRespModeInput"
                                            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-sm font-medium focus:ring-2 focus:ring-blue-600 outline-none"
                                            value={newResponseMode}
                                            onChange={(e) => setNewResponseMode(e.target.value as 'knowledge_only' | 'knowledge_plus_reasoning')}
                                        >
                                            <option value="knowledge_plus_reasoning">Knowledge + Model Reasoning</option>
                                            <option value="knowledge_only">Knowledge Only (Strict Ledger)</option>
                                        </select>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-[10px] uppercase font-black text-blue-600 tracking-[0.2em] mb-6">Interaction Interface</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="space-y-2">
                                        <label htmlFor="botPosInput" className="text-[10px] font-black text-gray-400 uppercase ml-1">Widget Position</label>
                                        <select
                                            id="botPosInput"
                                            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-sm font-medium focus:ring-2 focus:ring-blue-600 outline-none"
                                            value={position}
                                            onChange={(e) => setPosition(e.target.value)}
                                        >
                                            <option value="right">SLIDE-IN RIGHT</option>
                                            <option value="left">SLIDE-IN LEFT</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="botPHInput" className="text-[10px] font-black text-gray-400 uppercase ml-1">Input Placeholder</label>
                                        <input
                                            id="botPHInput"
                                            type="text"
                                            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-sm font-medium focus:ring-2 focus:ring-blue-600 outline-none"
                                            value={placeholderText}
                                            onChange={(e) => setPlaceholderText(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label htmlFor="botAvatarInput" className="text-[10px] font-black text-gray-400 uppercase ml-1">Persona Avatar (URL)</label>
                                        <input
                                            id="botAvatarInput"
                                            type="url"
                                            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-sm font-medium focus:ring-2 focus:ring-blue-600 outline-none"
                                            value={avatarUrl}
                                            onChange={(e) => setAvatarUrl(e.target.value)}
                                            placeholder="https://images.unsplash.com/photo-..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="botBubbleInput" className="text-[10px] font-black text-gray-400 uppercase ml-1">Engagement Bubble Text</label>
                                        <input
                                            id="botBubbleInput"
                                            type="text"
                                            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-sm font-medium focus:ring-2 focus:ring-blue-600 outline-none"
                                            value={bubbleGreeting}
                                            onChange={(e) => setBubbleGreeting(e.target.value)}
                                            placeholder="We're online! 👋"
                                        />
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-[10px] uppercase font-black text-blue-600 tracking-[0.2em] mb-6">Interaction Shortcuts (Quick Replies)</h3>
                                <div className="space-y-4">
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {(editingBot?.quick_replies || []).map((qr) => (
                                            <div key={`${qr.label}-${qr.value}`} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-bold border border-blue-100">
                                                <span>{qr.label}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newQr = (editingBot?.quick_replies || []).filter(q => q !== qr);
                                                        setEditingBot(prev => prev ? { ...prev, quick_replies: newQr } : null);
                                                    }}
                                                    className="hover:text-red-600"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-3">
                                        <input
                                            id="qrLabelInput"
                                            type="text"
                                            placeholder="Label (e.g. Pricing)"
                                            className="flex-1 bg-gray-50 border-none rounded-2xl px-5 py-3 text-xs font-medium focus:ring-2 focus:ring-blue-600 outline-none"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    const labelInput = e.currentTarget;
                                                    const valueInput = document.getElementById('qrValueInput') as HTMLInputElement;
                                                    if (labelInput.value && valueInput.value) {
                                                        const newQr = [...(editingBot?.quick_replies || []), { label: labelInput.value, value: valueInput.value }];
                                                        setEditingBot(prev => prev ? { ...prev, quick_replies: newQr } : null);
                                                        labelInput.value = '';
                                                        valueInput.value = '';
                                                    }
                                                }
                                            }}
                                        />
                                        <input
                                            id="qrValueInput"
                                            type="text"
                                            placeholder="Value (e.g. Tell me about pricing)"
                                            className="flex-1 bg-gray-50 border-none rounded-2xl px-5 py-3 text-xs font-medium focus:ring-2 focus:ring-blue-600 outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const labelInput = document.getElementById('qrLabelInput') as HTMLInputElement;
                                                const valueInput = document.getElementById('qrValueInput') as HTMLInputElement;
                                                if (labelInput.value && valueInput.value) {
                                                    const newQr = [...(editingBot?.quick_replies || []), { label: labelInput.value, value: valueInput.value }];
                                                    setEditingBot(prev => prev ? { ...prev, quick_replies: newQr } : null);
                                                    labelInput.value = '';
                                                    valueInput.value = '';
                                                }
                                            }}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-200"
                                        >
                                            ADD
                                        </button>
                                    </div>
                                </div>
                            </section>

                            <div className="flex justify-end gap-3 pt-8 border-t border-gray-50">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3 font-black text-[10px] text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors">
                                    Abort
                                </button>
                                <button type="submit" className="px-10 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs shadow-2xl shadow-gray-200 hover:-translate-y-1 transition-all active:scale-95 uppercase tracking-widest">
                                    {editingBot ? 'Finalize Hybrid' : 'Initialize Agent'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Share Modal */}
            {isShareModalOpen && shareBot && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-2xl shadow-2xl">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900">Agent Deployment</h2>
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Integration manifest for {shareBot.name}</p>
                            </div>
                            <button onClick={() => setIsShareModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-2xl transition-colors">
                                <X className="w-6 h-6 text-gray-400" />
                            </button>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-3">
                                <label htmlFor="shareUrlInput" className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Standalone Nexus URL</label>
                                <div className="flex gap-3">
                                    <input
                                        id="shareUrlInput"
                                        readOnly
                                        value={publicLink}
                                        className="flex-1 bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm text-blue-600 font-bold"
                                    />
                                    <button onClick={() => copyToClipboard(publicLink, 'link')} className="p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                                        {copiedLink ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5 text-gray-400" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label htmlFor="embedCodeInput" className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Embedded Widget Payload</label>
                                <div className="relative group">
                                    <textarea
                                        id="embedCodeInput"
                                        readOnly
                                        value={embedCode}
                                        className="w-full bg-gray-900 text-blue-400 border-none rounded-3xl p-8 text-xs font-mono h-36 resize-none shadow-2xl"
                                    />
                                    <button onClick={() => copyToClipboard(embedCode, 'embed')} className="absolute top-4 right-4 p-3 bg-gray-800 rounded-2xl hover:bg-gray-700 transition-all opacity-0 group-hover:opacity-100">
                                        {copiedEmbed ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5 text-gray-400" />}
                                    </button>
                                </div>
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest text-center">
                                    Inject into <code>&lt;head&gt;</code> to activate the autonomous bubble.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {configBot && (
                <div className="fixed inset-0 bg-gray-950/50 backdrop-blur-sm z-[110] p-4 md:p-8">
                    <div className="h-full w-full bg-gray-50 rounded-3xl border border-gray-200 shadow-2xl flex flex-col overflow-hidden">
                        <div className="px-6 py-4 bg-white border-b flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Bot Workspace</p>
                                <h3 className="text-lg font-black text-gray-900">{configBot.name} Configuration</h3>
                            </div>
                            <button onClick={() => setConfigBot(null)} className="p-2 hover:bg-gray-100 rounded-xl" type="button">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="px-6 py-3 bg-white border-b flex gap-2 overflow-x-auto">
                            {[
                                { id: 'assistant_config', label: 'Assistant Configuration' },
                                { id: 'live_chat', label: 'Live Chat' },
                                { id: 'visual_builder', label: 'Story Builder' },
                                { id: 'canned', label: 'Canned Responses' },
                                { id: 'small_talk', label: 'Small Talk' },
                                { id: 'data_collection', label: 'Data Collection' },
                                { id: 'integrations', label: 'Integrations' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setConfigView(tab.id as 'assistant_config' | 'live_chat' | 'canned' | 'small_talk' | 'data_collection' | 'visual_builder' | 'integrations')}
                                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap ${configView === tab.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    type="button"
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            {configView === 'assistant_config' && <AssistantConfig key={`config-${configBot.id}`} botId={configBot.id} bot={configBot} />}
                            {configView === 'live_chat' && <LiveChat key={`live-${configBot.id}`} botId={configBot.id} />}
                            {configView === 'visual_builder' && (
                                <VisualBuilder
                                    key={`flow-${configBot.id}`}
                                    botId={configBot.id}
                                    initialData={configBot.flow_data}
                                    onSave={async (data) => {
                                        await dashboardApi.updateBot(configBot.id, { flow_data: data });
                                        setConfigBot({ ...configBot, flow_data: data });
                                    }}
                                />
                            )}
                            {configView === 'canned' && <CannedResponses key={`canned-${configBot.id}`} botId={configBot.id} />}
                            {configView === 'small_talk' && <SmallTalk key={`smalltalk-${configBot.id}`} botId={configBot.id} />}
                            {configView === 'data_collection' && <DataCollection key={`datacollection-${configBot.id}`} botId={configBot.id} />}
                            {configView === 'integrations' && <Integrations key={`integrations-${configBot.id}`} botId={configBot.id} />}
                        </div>
                    </div>
                </div>
            )}

            {/* Chat Window */}
            {activeBot && (
                <ChatWindow bot={activeBot} onClose={() => setActiveBot(null)} isSimulation={true} />
            )}

            {/* Creating Flow Overlay */}
            {isCreating && (
                <div className="fixed inset-0 z-[200] bg-white animate-in fade-in duration-300">
                    <div className="absolute top-8 left-8 z-[210]">
                        <button
                            onClick={() => setIsCreating(false)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-black uppercase tracking-widest text-gray-500 transition-all"
                        >
                            <X className="w-4 h-4" /> Cancel Creation
                        </button>
                    </div>
                    <BotAgentSetup onNext={handleSetupNext} />
                </div>
            )}
        </>
    );
}
