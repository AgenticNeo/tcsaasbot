'use client';

import React, { useEffect, useState } from 'react';
import { dashboardApi } from '@/lib/api';
import {
    Store, MessageSquare, Link2, CheckCircle2,
    Settings, RefreshCw, AlertTriangle,
    Zap, Mail, Phone, Clock, ArrowRight, Shield
} from 'lucide-react';

interface Integration {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    enabled: boolean;
    connected?: boolean;
    lastSync?: string;
    config?: Record<string, any>;
}

interface IntegrationsProps {
    botId: number;
}

export function Integrations({ botId }: IntegrationsProps) {
    const [activeTab, setActiveTab] = useState<'all' | 'ecommerce' | 'communication' | 'automation'>('all');
    const [connectingId, setConnectingId] = useState<string | null>(null);

    // Integration states
    const [integrations, setIntegrations] = useState<Integration[]>([
        {
            id: 'shopify',
            name: 'Shopify',
            description: 'Display products, check availability, and track orders',
            icon: <Store className="w-6 h-6" />,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            enabled: false,
            connected: false
        },
        {
            id: 'slack',
            name: 'Slack',
            description: 'Get notified of new leads and conversations in Slack',
            icon: <MessageSquare className="w-6 h-6" />,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            enabled: false,
            connected: false
        },
        {
            id: 'zapier',
            name: 'Zapier',
            description: 'Connect with 5000+ apps via Zapier automation',
            icon: <Zap className="w-6 h-6" />,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
            enabled: false,
            connected: false
        },
        {
            id: 'zendesk',
            name: 'Zendesk',
            description: 'Create support tickets from conversations',
            icon: <Mail className="w-6 h-6" />,
            color: 'text-red-600',
            bgColor: 'bg-red-50',
            enabled: false,
            connected: false
        },
        {
            id: 'freshdesk',
            name: 'Freshdesk',
            description: 'Convert chats into support tickets',
            icon: <Phone className="w-6 h-6" />,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            enabled: false,
            connected: false
        },
        {
            id: 'webhook',
            name: 'Webhooks',
            description: 'Send data to your own endpoints on events',
            icon: <Link2 className="w-6 h-6" />,
            color: 'text-gray-600',
            bgColor: 'bg-gray-50',
            enabled: false,
            connected: false
        }
    ]);

    // Configuration modal
    const [configModal, setConfigModal] = useState<{ open: boolean; integration: Integration | null }>({ open: false, integration: null });
    const [configForm, setConfigForm] = useState<Record<string, string>>({});

    useEffect(() => {
        const load = async () => {
            try {
                const res = await dashboardApi.getIntegrations(botId);
                const rows = Array.isArray(res.data) ? res.data : [];
                setIntegrations(prev => prev.map(i => {
                    const matched = rows.find((row: any) => row.integration_type === i.id);
                    if (!matched) return i;
                    return {
                        ...i,
                        connected: matched.is_active,
                        enabled: matched.is_active,
                        config: matched.config || {},
                        lastSync: matched.updated_at || matched.created_at || undefined,
                    };
                }));
            } catch (err) {
                console.error('Failed to load integrations', err);
            }
        };
        void load();
    }, [botId]);

    const filteredIntegrations = integrations.filter(integration => {
        if (activeTab === 'all') return true;
        if (activeTab === 'ecommerce') return ['shopify'].includes(integration.id);
        if (activeTab === 'communication') return ['slack', 'zendesk', 'freshdesk'].includes(integration.id);
        if (activeTab === 'automation') return ['zapier', 'webhook'].includes(integration.id);
        return true;
    });

    const handleConnect = async (integration: Integration) => {
        if (integration.connected) {
            // Open config modal
            setConfigModal({ open: true, integration });
            setConfigForm(integration.config || {});
            return;
        }

        setConnectingId(integration.id);
        try {
            await dashboardApi.upsertIntegration(botId, {
                integration_type: integration.id,
                config: integration.config || {},
                is_active: true,
            });
            setIntegrations(prev => prev.map(i =>
                i.id === integration.id
                    ? { ...i, connected: true, enabled: true, lastSync: new Date().toISOString() }
                    : i
            ));
            setConfigModal({ open: true, integration: { ...integration, connected: true } });
        } catch (err) {
            console.error('Failed to connect integration', err);
            alert('Failed to connect integration');
        } finally {
            setConnectingId(null);
        }
    };

    const handleDisconnect = async (integrationId: string) => {
        if (!confirm('Are you sure you want to disconnect this integration?')) return;
        try {
            await dashboardApi.deleteIntegration(botId, integrationId);
            setIntegrations(prev => prev.map(i =>
                i.id === integrationId
                    ? { ...i, connected: false, enabled: false, lastSync: undefined, config: {} }
                    : i
            ));
        } catch (err) {
            console.error('Failed to disconnect integration', err);
            alert('Failed to disconnect integration');
        }
    };

    const handleSaveConfig = async () => {
        if (!configModal.integration) return;
        try {
            await dashboardApi.upsertIntegration(botId, {
                integration_type: configModal.integration.id,
                config: configForm,
                is_active: true,
            });
            setIntegrations(prev => prev.map(i =>
                i.id === configModal.integration!.id
                    ? { ...i, config: configForm, connected: true, enabled: true, lastSync: new Date().toISOString() }
                    : i
            ));
            setConfigModal({ open: false, integration: null });
        } catch (err) {
            console.error('Failed to save integration config', err);
            alert('Failed to save integration settings');
        }
    };

    const tabs = [
        { id: 'all', label: 'All Integrations' },
        { id: 'ecommerce', label: 'Ecommerce' },
        { id: 'communication', label: 'Communication' },
        { id: 'automation', label: 'Automation' }
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black">Connect Your Tools</h2>
                        <p className="text-gray-400 mt-2">Link your favorite apps to supercharge your chatbot</p>
                    </div>
                    <div className="hidden md:flex items-center gap-6">
                        <div className="text-center">
                            <p className="text-3xl font-black">{integrations.filter(i => i.connected).length}</p>
                            <p className="text-xs text-gray-400 uppercase tracking-wider">Connected</p>
                        </div>
                        <div className="h-12 w-px bg-gray-700" />
                        <div className="text-center">
                            <p className="text-3xl font-black">{integrations.length}</p>
                            <p className="text-xs text-gray-400 uppercase tracking-wider">Available</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === tab.id
                            ? 'bg-gray-900 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-100 border'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Integration Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredIntegrations.map(integration => (
                    <div
                        key={integration.id}
                        className={`bg-white rounded-2xl border-2 p-6 transition-all ${integration.connected
                            ? 'border-green-200 shadow-lg shadow-green-50'
                            : 'border-gray-100 hover:border-gray-200'
                            }`}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={`w-14 h-14 rounded-2xl ${integration.bgColor} flex items-center justify-center ${integration.color}`}>
                                {integration.icon}
                            </div>
                            {integration.connected && (
                                <div className="flex items-center gap-1.5 text-green-600 text-xs font-bold">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Connected
                                </div>
                            )}
                        </div>

                        <h3 className="font-black text-lg text-gray-900 mb-2">{integration.name}</h3>
                        <p className="text-sm text-gray-500 mb-6">{integration.description}</p>

                        {integration.connected ? (
                            <div className="space-y-3">
                                {integration.lastSync && (
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <Clock className="w-3 h-3" />
                                        Last sync: {new Date(integration.lastSync).toLocaleString()}
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleConnect(integration)}
                                        className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Settings className="w-4 h-4" /> Configure
                                    </button>
                                    <button
                                        onClick={() => handleDisconnect(integration.id)}
                                        className="px-4 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors"
                                    >
                                        Disconnect
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => handleConnect(integration)}
                                disabled={connectingId === integration.id}
                                className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 text-gray-900 rounded-xl text-sm font-bold hover:border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {connectingId === integration.id ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" /> Connecting...
                                    </>
                                ) : (
                                    <>
                                        <Link2 className="w-4 h-4" /> Connect
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Zapier Promo */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-8 border border-orange-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center">
                            <Zap className="w-7 h-7 text-orange-600" />
                        </div>
                        <div>
                            <h3 className="font-black text-lg text-gray-900">Need more integrations?</h3>
                            <p className="text-sm text-gray-500">Connect with 5000+ apps using Zapier</p>
                        </div>
                    </div>
                    <button className="px-6 py-3 bg-orange-600 text-white rounded-xl font-bold text-sm hover:bg-orange-700 transition-colors flex items-center gap-2">
                        Connect Zapier <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Configuration Modal */}
            {configModal.open && configModal.integration && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl ${configModal.integration.bgColor} flex items-center justify-center ${configModal.integration.color}`}>
                                    {configModal.integration.icon}
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900">Configure {configModal.integration.name}</h2>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Integration Settings</p>
                                </div>
                            </div>
                            <button onClick={() => setConfigModal({ open: false, integration: null })} className="p-2 hover:bg-gray-100 rounded-2xl">
                                <XCircle className="w-6 h-6 text-gray-400" />
                            </button>
                        </div>

                        <div className="space-y-5">
                            {configModal.integration.id === 'shopify' && (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Store URL</label>
                                        <input
                                            type="text"
                                            placeholder="your-store.myshopify.com"
                                            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-green-600 outline-none"
                                            value={configForm.storeUrl || ''}
                                            onChange={(e) => setConfigForm({ ...configForm, storeUrl: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">API Access Token</label>
                                        <input
                                            type="password"
                                            placeholder="shpat_xxxxx"
                                            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-green-600 outline-none"
                                            value={configForm.apiToken || ''}
                                            onChange={(e) => setConfigForm({ ...configForm, apiToken: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
                                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                                        <span className="text-sm text-green-800 font-medium">Product sync enabled</span>
                                    </div>
                                </>
                            )}

                            {configModal.integration.id === 'slack' && (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Webhook URL</label>
                                        <input
                                            type="text"
                                            placeholder="https://hooks.slack.com/services/..."
                                            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-purple-600 outline-none"
                                            value={configForm.webhookUrl || ''}
                                            onChange={(e) => setConfigForm({ ...configForm, webhookUrl: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Channel Name</label>
                                        <input
                                            type="text"
                                            placeholder="#leads"
                                            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-purple-600 outline-none"
                                            value={configForm.channel || ''}
                                            onChange={(e) => setConfigForm({ ...configForm, channel: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Notify on</p>
                                        <div className="flex flex-wrap gap-2">
                                            {['New Lead', 'New Message', 'Goal Completed'].map(event => (
                                                <label key={event} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                                                    <input type="checkbox" className="rounded" defaultChecked />
                                                    <span className="text-sm font-medium">{event}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {configModal.integration.id === 'webhook' && (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Endpoint URL</label>
                                        <input
                                            type="text"
                                            placeholder="https://your-server.com/webhook"
                                            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-gray-600 outline-none"
                                            value={configForm.endpoint || ''}
                                            onChange={(e) => setConfigForm({ ...configForm, endpoint: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Events to send</p>
                                        <div className="flex flex-wrap gap-2">
                                            {['conversation.started', 'message.received', 'lead.captured', 'goal.completed'].map(event => (
                                                <label key={event} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                                                    <input type="checkbox" className="rounded" defaultChecked />
                                                    <span className="text-sm font-medium text-xs">{event}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl">
                                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                        <span className="text-sm text-amber-800 font-medium">Webhook payloads include message content and user data. Ensure your endpoint handles data securely.</span>
                                    </div>
                                </>
                            )}

                            {(configModal.integration.id === 'zendesk' || configModal.integration.id === 'freshdesk') && (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                                            {configModal.integration.id === 'zendesk' ? 'Zendesk Subdomain' : 'Freshdesk Domain'}
                                        </label>
                                        <input
                                            type="text"
                                            placeholder={configModal.integration.id === 'zendesk' ? 'yourcompany' : 'yourcompany.freshdesk.com'}
                                            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-blue-600 outline-none"
                                            value={configForm.domain || ''}
                                            onChange={(e) => setConfigForm({ ...configForm, domain: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">API Token</label>
                                        <input
                                            type="password"
                                            placeholder="Enter API token"
                                            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-blue-600 outline-none"
                                            value={configForm.apiToken || ''}
                                            onChange={(e) => setConfigForm({ ...configForm, apiToken: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
                                        <Shield className="w-5 h-5 text-blue-600" />
                                        <span className="text-sm text-blue-800 font-medium">Tickets will be created automatically from conversations</span>
                                    </div>
                                </>
                            )}

                            {configModal.integration.id === 'zapier' && (
                                <div className="text-center py-8 space-y-4">
                                    <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto">
                                        <Zap className="w-8 h-8 text-orange-600" />
                                    </div>
                                    <p className="text-gray-600">Connect your Zapier account to trigger zaps based on chatbot events</p>
                                    <button className="px-6 py-3 bg-orange-600 text-white rounded-xl font-bold text-sm hover:bg-orange-700 transition-colors">
                                        Connect to Zapier
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
                            <button
                                onClick={() => setConfigModal({ open: false, integration: null })}
                                className="px-6 py-3 font-bold text-sm text-gray-400 hover:text-gray-900 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveConfig}
                                className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-gray-800 transition-all"
                            >
                                Save Configuration
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper component for XCircle
function XCircle({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
    );
}
