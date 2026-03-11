'use client';

import React, { useEffect, useState } from 'react';
import {
    Users, MessageSquare, Clock, CheckCircle2, Settings, ArrowRight,
    Zap, Bell, Plus, Trash2, Edit2, Loader2
} from 'lucide-react';
import { dashboardApi } from '@/lib/api';
import { Bot } from '@/lib/types';

interface TransferRule {
    id: string;
    name: string;
    type: 'keyword' | 'time' | 'manual';
    condition: string;
    action: 'transfer' | 'notify';
    agentEmail?: string;
    webhookUrl?: string;
    isActive: boolean;
}

interface Agent {
    id: string;
    name: string;
    email: string;
    status: 'online' | 'offline' | 'busy';
    avatar?: string;
}

export function AgentTransfer({ botId }: { botId: number }) {
    const [activeTab, setActiveTab] = useState<'settings' | 'rules' | 'agents'>('settings');
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

    // Settings state
    const [settings, setSettings] = useState({
        transferEnabled: false,
        autoTransfer: false,
        notifyOnTransfer: true,
        transferMessage: "I'm connecting you with a human agent who can help you better. Please wait a moment.",
        maxWaitTime: 5, // minutes
        fallbackEmail: ''
    });

    useEffect(() => {
        const loadBot = async () => {
            try {
                const res = await dashboardApi.getBot(botId);
                const bot: Bot = res.data;
                setSettings({
                    transferEnabled: bot.agent_transfer_enabled || false,
                    autoTransfer: false, // Not yet in backend
                    notifyOnTransfer: true,
                    transferMessage: "I'm connecting you with a human agent who can help you better.",
                    maxWaitTime: 5,
                    fallbackEmail: bot.agent_email || ''
                });
            } catch (err) {
                console.error('Failed to load agent settings', err);
            }
        };
        loadBot();
    }, [botId]);

    const handleSaveSettings = async () => {
        setSaving(true);
        setSaveStatus('idle');
        try {
            await dashboardApi.updateBot(botId, {
                agent_transfer_enabled: settings.transferEnabled,
                agent_email: settings.fallbackEmail
            });
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (err) {
            console.error('Failed to save settings', err);
            setSaveStatus('error');
        } finally {
            setSaving(false);
        }
    };

    const [rules, setRules] = useState<TransferRule[]>([
        {
            id: '1',
            name: 'Human agent requested',
            type: 'keyword',
            condition: 'talk to human, speak to agent, I need help',
            action: 'transfer',
            agentEmail: 'agent@company.com',
            isActive: true
        }
    ]);

    const [agents, setAgents] = useState<Agent[]>([
        { id: '1', name: 'Sarah Johnson', email: 'sarah@company.com', status: 'online' }
    ]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<TransferRule | null>(null);
    const [ruleForm, setRuleForm] = useState({
        name: '',
        type: 'keyword' as 'keyword' | 'time' | 'manual',
        condition: '',
        action: 'transfer' as 'transfer' | 'notify',
        agentEmail: '',
        webhookUrl: ''
    });

    const openAddRuleModal = () => {
        setEditingRule(null);
        setRuleForm({
            name: '',
            type: 'keyword',
            condition: '',
            action: 'transfer',
            agentEmail: '',
            webhookUrl: ''
        });
        setIsModalOpen(true);
    };

    const openEditRuleModal = (rule: TransferRule) => {
        setEditingRule(rule);
        setRuleForm({
            name: rule.name,
            type: rule.type,
            condition: rule.condition,
            action: rule.action,
            agentEmail: rule.agentEmail || '',
            webhookUrl: rule.webhookUrl || ''
        });
        setIsModalOpen(true);
    };

    const saveRule = () => {
        if (editingRule) {
            setRules(rules.map(r => r.id === editingRule.id ? {
                ...r,
                ...ruleForm,
                agentEmail: ruleForm.action === 'transfer' ? ruleForm.agentEmail : undefined,
                webhookUrl: ruleForm.action === 'notify' ? ruleForm.webhookUrl : undefined
            } : r));
        } else {
            setRules([...rules, {
                id: Date.now().toString(),
                ...ruleForm,
                agentEmail: ruleForm.action === 'transfer' ? ruleForm.agentEmail : undefined,
                webhookUrl: ruleForm.action === 'notify' ? ruleForm.webhookUrl : undefined,
                isActive: true
            }]);
        }
        setIsModalOpen(false);
    };

    const deleteRule = (id: string) => {
        if (confirm('Are you sure you want to delete this rule?')) {
            setRules(rules.filter(r => r.id !== id));
        }
    };

    const toggleRule = (id: string) => {
        setRules(rules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
    };

    const deleteAgent = (id: string) => {
        if (confirm('Are you sure you want to remove this agent?')) {
            setAgents((prevAgents) => prevAgents.filter((agent) => agent.id !== id));
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'online': return 'bg-green-500';
            case 'busy': return 'bg-red-500';
            default: return 'bg-gray-400';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                            <Users className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black">Live Chat & Agent Transfer</h2>
                            <p className="text-purple-200 mt-1">Seamlessly transfer conversations to human agents</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-3 cursor-pointer bg-white/10 px-4 py-2 rounded-xl">
                            <input
                                type="checkbox"
                                checked={settings.transferEnabled}
                                onChange={(e) => setSettings({ ...settings, transferEnabled: e.target.checked })}
                                className="w-5 h-5 rounded"
                            />
                            <span className="font-bold text-sm">Enable Transfer</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {[
                    { id: 'settings', label: 'Transfer Settings', icon: Settings },
                    { id: 'rules', label: 'Transfer Rules', icon: Zap },
                    { id: 'agents', label: 'Team Agents', icon: Users }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === tab.id
                            ? 'bg-gray-900 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-100 border'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Settings Tab */}
            {activeTab === 'settings' && (
                <div className="bg-white rounded-2xl border shadow-sm p-8 space-y-8">
                    <div className="flex items-center justify-between pb-6 border-b">
                        <div>
                            <h3 className="text-xl font-black text-gray-900">Transfer Configuration</h3>
                            <p className="text-sm text-gray-500 mt-1">Configure how agent transfers work</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${settings.transferEnabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <span className="text-sm font-bold text-gray-600">{settings.transferEnabled ? 'Active' : 'Inactive'}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <Zap className="w-5 h-5 text-amber-500" />
                                    <div>
                                        <p className="font-bold text-gray-900">Auto Transfer</p>
                                        <p className="text-xs text-gray-500">Transfer after no response</p>
                                    </div>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={settings.autoTransfer}
                                    onChange={(e) => setSettings({ ...settings, autoTransfer: e.target.checked })}
                                    className="w-5 h-5 rounded"
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <Bell className="w-5 h-5 text-blue-500" />
                                    <div>
                                        <p className="font-bold text-gray-900">Notify on Transfer</p>
                                        <p className="text-xs text-gray-500">Alert agents of new chats</p>
                                    </div>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={settings.notifyOnTransfer}
                                    onChange={(e) => setSettings({ ...settings, notifyOnTransfer: e.target.checked })}
                                    className="w-5 h-5 rounded"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                                    Max Wait Time (minutes)
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    max={30}
                                    value={settings.maxWaitTime}
                                    onChange={(e) => setSettings({ ...settings, maxWaitTime: parseInt(e.target.value) })}
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-purple-600 outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                                    Transfer Message
                                </label>
                                <textarea
                                    value={settings.transferMessage}
                                    onChange={(e) => setSettings({ ...settings, transferMessage: e.target.value })}
                                    rows={3}
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-purple-600 outline-none"
                                    placeholder="Message shown before transfer..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                                    Fallback Email
                                </label>
                                <input
                                    type="email"
                                    value={settings.fallbackEmail}
                                    onChange={(e) => setSettings({ ...settings, fallbackEmail: e.target.value })}
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-purple-600 outline-none"
                                    placeholder="support@company.com"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t flex justify-end gap-3">
                        {saveStatus === 'saved' && (
                            <span className="flex items-center gap-2 text-green-600 text-sm font-bold animate-in fade-in zoom-in">
                                <CheckCircle2 className="w-4 h-4" />
                                Settings saved!
                            </span>
                        )}
                        <button
                            onClick={handleSaveSettings}
                            disabled={saving}
                            className="flex items-center gap-2 px-8 py-3 bg-gray-900 text-white rounded-2xl font-bold text-sm shadow-lg hover:bg-gray-800 transition-all disabled:opacity-50"
                        >
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                            Save Settings
                        </button>
                    </div>
                </div>
            )}

            {/* Rules Tab */}
            {activeTab === 'rules' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-black text-gray-900">Transfer Rules</h3>
                            <p className="text-sm text-gray-500 mt-1">Define when conversations should be transferred</p>
                        </div>
                        <button
                            onClick={openAddRuleModal}
                            className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors"
                        >
                            <Plus className="w-4 h-4" /> Add Rule
                        </button>
                    </div>

                    <div className="space-y-4">
                        {rules.map(rule => (
                            <div key={rule.id} className={`bg-white rounded-2xl border p-6 transition-all ${rule.isActive ? 'border-green-200 shadow-lg shadow-green-50' : 'border-gray-100 opacity-60'}`}>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${rule.type === 'keyword' ? 'bg-blue-100 text-blue-600' :
                                            rule.type === 'time' ? 'bg-amber-100 text-amber-600' :
                                                'bg-purple-100 text-purple-600'
                                            }`}>
                                            {rule.type === 'keyword' ? <MessageSquare className="w-5 h-5" /> :
                                                rule.type === 'time' ? <Clock className="w-5 h-5" /> :
                                                    <Users className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-gray-900">{rule.name}</h4>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${rule.type === 'keyword' ? 'bg-blue-50 text-blue-700' :
                                                    rule.type === 'time' ? 'bg-amber-50 text-amber-700' :
                                                        'bg-purple-50 text-purple-700'
                                                    }`}>
                                                    {rule.type.toUpperCase()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {rule.type === 'keyword' ? `When user says: "${rule.condition}"` :
                                                    rule.type === 'time' ? `After ${rule.condition} minutes of inactivity` :
                                                        'Manual trigger by user'}
                                            </p>
                                            <div className="flex items-center gap-4 mt-3">
                                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                                    <ArrowRight className="w-3 h-3" />
                                                    {rule.action === 'transfer' ? `Transfer to: ${rule.agentEmail}` : `Notify: ${rule.webhookUrl?.substring(0, 30)}...`}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <span className="text-xs font-bold text-gray-400">{rule.isActive ? 'Active' : 'Inactive'}</span>
                                            <input
                                                type="checkbox"
                                                checked={rule.isActive}
                                                onChange={() => toggleRule(rule.id)}
                                                className="w-5 h-5 rounded"
                                            />
                                        </label>
                                        <button onClick={() => openEditRuleModal(rule)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => deleteRule(rule.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {rules.length === 0 && (
                        <div className="bg-white rounded-2xl border p-12 text-center">
                            <Zap className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                            <p className="font-bold text-gray-900">No transfer rules</p>
                            <p className="text-sm text-gray-500 mt-1">Add rules to automatically transfer conversations</p>
                        </div>
                    )}
                </div>
            )}

            {/* Agents Tab */}
            {activeTab === 'agents' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-black text-gray-900">Team Agents</h3>
                            <p className="text-sm text-gray-500 mt-1">Manage agents who can receive transferred chats</p>
                        </div>
                        <button className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors">
                            <Plus className="w-4 h-4" /> Add Agent
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {agents.map(agent => (
                            <div key={agent.id} className="bg-white rounded-2xl border p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg">
                                        {agent.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${getStatusColor(agent.status)}`} />
                                        <button
                                            onClick={() => deleteAgent(agent.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Remove agent"
                                            aria-label={`Remove ${agent.name}`}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <h4 className="font-bold text-gray-900">{agent.name}</h4>
                                <p className="text-sm text-gray-500 mt-1">{agent.email}</p>
                                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${agent.status === 'online' ? 'bg-green-100 text-green-700' :
                                        agent.status === 'busy' ? 'bg-red-100 text-red-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                        {agent.status.toUpperCase()}
                                    </span>
                                    <button className="text-xs text-blue-600 font-bold hover:underline">
                                        View Chats
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Add/Edit Rule Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-xl font-black text-gray-900">
                                    {editingRule ? 'Edit Transfer Rule' : 'Add Transfer Rule'}
                                </h2>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                                    Configure when to transfer conversations
                                </p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-2xl">
                                <XCircle className="w-6 h-6 text-gray-400" />
                            </button>
                        </div>

                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Rule Name</label>
                                <input
                                    type="text"
                                    value={ruleForm.name}
                                    onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-purple-600 outline-none"
                                    placeholder="e.g., Refund request"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Trigger Type</label>
                                    <select
                                        value={ruleForm.type}
                                        onChange={(e) => setRuleForm({ ...ruleForm, type: e.target.value as any })}
                                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3 text-sm font-medium focus:ring-2 focus:ring-purple-600 outline-none"
                                    >
                                        <option value="keyword">Keyword</option>
                                        <option value="time">Time</option>
                                        <option value="manual">Manual</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Action</label>
                                    <select
                                        value={ruleForm.action}
                                        onChange={(e) => setRuleForm({ ...ruleForm, action: e.target.value as any })}
                                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3 text-sm font-medium focus:ring-2 focus:ring-purple-600 outline-none"
                                    >
                                        <option value="transfer">Transfer to Agent</option>
                                        <option value="notify">Notify via Webhook</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                                    {ruleForm.type === 'keyword' ? 'Keywords (comma separated)' :
                                        ruleForm.type === 'time' ? 'Wait Time (minutes)' : 'Description'}
                                </label>
                                <input
                                    type="text"
                                    value={ruleForm.condition}
                                    onChange={(e) => setRuleForm({ ...ruleForm, condition: e.target.value })}
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-purple-600 outline-none"
                                    placeholder={ruleForm.type === 'keyword' ? 'refund, cancel, money back' : '5'}
                                />
                            </div>

                            {ruleForm.action === 'transfer' ? (
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Agent Email</label>
                                    <input
                                        type="email"
                                        value={ruleForm.agentEmail}
                                        onChange={(e) => setRuleForm({ ...ruleForm, agentEmail: e.target.value })}
                                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-purple-600 outline-none"
                                        placeholder="agent@company.com"
                                    />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Webhook URL</label>
                                    <input
                                        type="url"
                                        value={ruleForm.webhookUrl}
                                        onChange={(e) => setRuleForm({ ...ruleForm, webhookUrl: e.target.value })}
                                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-purple-600 outline-none"
                                        placeholder="https://hooks.slack.com/services/..."
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-3 font-bold text-sm text-gray-400 hover:text-gray-900 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveRule}
                                className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-gray-800 transition-all"
                            >
                                {editingRule ? 'Update Rule' : 'Add Rule'}
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
