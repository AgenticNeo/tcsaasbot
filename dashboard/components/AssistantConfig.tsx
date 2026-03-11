'use client';

import React, { useState, useEffect } from 'react';
import { dashboardApi } from '@/lib/api';
import { Bot } from '@/lib/types';
import { Save, Loader2 } from 'lucide-react';

interface AssistantConfigProps {
    readonly botId: number;
    readonly bot: Bot;
}

export function AssistantConfig({ botId, bot }: AssistantConfigProps) {
    const [welcomeMessage, setWelcomeMessage] = useState(bot.welcome_message || '');
    const [description, setDescription] = useState(bot.description || '');
    const [primaryColor, setPrimaryColor] = useState(bot.primary_color || '#2563eb');
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

    const handleSave = async () => {
        setSaving(true);
        setSaveStatus('idle');
        try {
            await dashboardApi.updateBot(botId, {
                welcome_message: welcomeMessage,
                description: description,
                primary_color: primaryColor
            });
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (error) {
            console.error('Failed to update bot', error);
            setSaveStatus('error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-xl font-black text-gray-900 mb-6">Assistant Configuration</h3>
                <p className="text-sm text-gray-600 mb-8">Configure your AI assistant's basic settings and behavior.</p>
            </div>

            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-black text-gray-700">Welcome Message</label>
                    <textarea
                        value={welcomeMessage}
                        onChange={(e) => setWelcomeMessage(e.target.value)}
                        placeholder="Enter the welcome message that appears when users start a conversation"
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none min-h-[100px] resize-y"
                    />
                    <p className="text-xs text-gray-500">This message will be shown to users when they first interact with your assistant.</p>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-black text-gray-700">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe what your assistant does"
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none min-h-[80px] resize-y"
                    />
                    <p className="text-xs text-gray-500">Internal description of your assistant's purpose and capabilities.</p>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-black text-gray-700">Primary Color</label>
                    <div className="flex items-center gap-3">
                        <input
                            type="color"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer"
                        />
                        <input
                            type="text"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono"
                        />
                    </div>
                    <p className="text-xs text-gray-500">The primary color used for your assistant's interface elements.</p>
                </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2">
                    {saveStatus === 'saved' && (
                        <span className="text-sm text-green-600 font-medium">Settings saved successfully!</span>
                    )}
                    {saveStatus === 'error' && (
                        <span className="text-sm text-red-600 font-medium">Failed to save settings</span>
                    )}
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-3 bg-gray-900 text-white rounded-xl font-black text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                >
                    {saving ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            Save Configuration
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
