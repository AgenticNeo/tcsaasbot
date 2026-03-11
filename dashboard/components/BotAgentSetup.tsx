'use client';

import React, { useState } from 'react';

import {
    Bot as BotIcon,
    User,
    Shield,
    Zap,
    HelpCircle,
    ArrowRight,
    CheckCircle2
} from 'lucide-react';
import { Bot } from '@/lib/types';


interface BotAgentSetupProps {
    readonly initialData?: Partial<Bot>;
    onNext: (data: any) => void;
}


const TONES = [
    { label: 'Polite', value: 'polite' },
    { label: 'Friendly', value: 'friendly' },
    { label: 'Professional', value: 'professional' },
    { label: 'Enthusiastic', value: 'enthusiastic' },
    { label: 'Concise', value: 'concise' },
];

const CAPABILITIES = [
    { id: 'details', label: 'Collect customer details', icon: <User className="w-4 h-4" /> },
    { id: 'questions', label: 'Answer product questions', icon: <HelpCircle className="w-4 h-4" /> },
    { id: 'tickets', label: 'Handle tickets', icon: <Shield className="w-4 h-4" /> },
    { id: 'transfer', label: 'Transfer to human', icon: <Zap className="w-4 h-4" /> },
];

const TONE_INSTRUCTIONS = {
    polite: "You're a calm, reliable support assistant helping customers. Your goal is to make customers feel supported and clearly understood.\n\nKeep replies factual, clear, and grounded in the information provided by the customer or the help center. Don't invent steps, speculate about solutions, or propose actions that aren't supported by the information you have.",
    friendly: "You're a friendly and approachable assistant. Use emojis and maintain a warm, welcoming tone. Your goal is to build a positive relationship with the customer while providing accurate information from the help center.",
    professional: "You're a highly professional and efficient support expert. Maintain a formal and objective tone. Focus on accuracy and directness. Ensure all information is strictly based on the provided data without any conversational fluff.",
    enthusiastic: "You're an energetic and passionate brand advocate! Be very positive and encouraging. Use exclamations and show genuine excitement about helping the customer. Always stay grounded in the factual data provided.",
    concise: "You're a brief and to-the-point assistant. Provide the minimum necessary information required to answer the query accurately. Avoid any unnecessary greetings or closing statements. Be efficient above all else."
};

export function BotAgentSetup({ onNext, initialData }: Readonly<BotAgentSetupProps>) {

    const [form, setForm] = useState({
        name: initialData?.name || 'TangentCloud Bot',
        tone: 'polite',
        instructions: initialData?.prompt_template || TONE_INSTRUCTIONS.polite,
        capabilities: ['details', 'questions', 'tickets', 'transfer'],
    });

    // Instruction updates are now handled in the onChange handler of the tone selector to avoid sync state updates in effects.


    const previewMessage = "Hello! 👋 How can I help you today?";


    return (
        <div className="flex h-screen bg-white overflow-hidden">
            {/* Left Side: Form */}
            <div className="w-1/2 p-20 overflow-y-auto custom-scrollbar">
                <div className="max-w-md mx-auto space-y-12">
                    <header className="space-y-4">
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-tight">
                            Control how <span className="text-blue-600">{form.name}</span> solves cases
                        </h1>
                        <p className="text-gray-500 font-medium">
                            Your AI agent is ready. You can adjust its tone anytime.
                        </p>
                    </header>

                    <div className="space-y-8">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label htmlFor="agent-name" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">AI Agent Name</label>
                                <input
                                    id="agent-name"
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                                    placeholder="e.g. TangentCloud Bot"
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="agent-tone" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tone of voice</label>
                                <select
                                    id="agent-tone"
                                    value={form.tone}
                                    onChange={(e) => {
                                        const newTone = e.target.value;
                                        const isPredefined = Object.values(TONE_INSTRUCTIONS).includes(form.instructions);
                                        setForm({
                                            ...form,
                                            tone: newTone,
                                            instructions: (isPredefined || !form.instructions)
                                                ? TONE_INSTRUCTIONS[newTone as keyof typeof TONE_INSTRUCTIONS]
                                                : form.instructions
                                        });
                                    }}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-600 outline-none transition-all appearance-none cursor-pointer"
                                >

                                    {TONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="agent-instructions" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Instructions</label>
                            <textarea
                                id="agent-instructions"
                                rows={8}
                                value={form.instructions}
                                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-100 rounded-3xl px-6 py-5 text-sm font-medium leading-relaxed focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                                placeholder="How should your agent behave?"
                            />
                        </div>

                        <div className="space-y-3">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">AI agent can already</span>

                            <div className="grid grid-cols-2 gap-3">
                                {CAPABILITIES.map(cap => {
                                    const isSelected = form.capabilities.includes(cap.id);
                                    return (
                                        <button
                                            key={cap.id}
                                            onClick={() => {
                                                const newCaps = isSelected
                                                    ? form.capabilities.filter((id: string) => id !== cap.id)
                                                    : [...form.capabilities, cap.id];
                                                setForm({ ...form, capabilities: newCaps });
                                            }}
                                            className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${isSelected
                                                ? 'bg-blue-50 border-blue-200 shadow-sm'
                                                : 'bg-gray-50 border-transparent hover:border-gray-200'
                                                }`}
                                        >
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                                                }`}>
                                                {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                                            </div>
                                            <span className={`text-xs font-bold ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>{cap.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>


                        <button
                            onClick={() => onNext(form)}
                            className="bg-black text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-800 transition-all active:scale-95 shadow-xl shadow-gray-200"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Side: Preview */}
            <div className="w-1/2 bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center relative border-l border-gray-100 p-20">
                {/* Background Grid */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                {/* Preview Window Mock */}
                <div className="w-full max-w-[440px] aspect-[4/5] bg-white rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-gray-100 flex flex-col overflow-hidden relative animate-in fade-in zoom-in duration-700">
                    <div className="px-8 py-6 flex items-center justify-between border-b border-gray-50 bg-white/80 backdrop-blur-md sticky top-0 z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white">
                                <BotIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-black text-sm text-gray-900">{form.name}</h3>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Online</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-1.5">
                            <div className="w-1.5 h-1.5 bg-gray-200 rounded-full" />
                            <div className="w-1.5 h-1.5 bg-gray-200 rounded-full" />
                            <div className="w-1.5 h-1.5 bg-gray-200 rounded-full" />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-gray-50/30">
                        {/* Bot Message */}
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 flex-shrink-0">
                                <BotIcon className="w-4 h-4" />
                            </div>
                            <div className="space-y-1.5 flex-1">
                                <div className="bg-white px-5 py-3.5 rounded-3xl rounded-tl-none shadow-sm border border-gray-100 text-sm font-medium text-gray-800 leading-relaxed">
                                    {previewMessage}

                                </div>
                            </div>
                        </div>

                        {/* User Message */}
                        <div className="flex items-start justify-end gap-3">
                            <div className="space-y-1.5 flex-1 flex flex-col items-end">
                                <div className="bg-blue-600 text-white px-5 py-3.5 rounded-3xl rounded-tr-none shadow-lg shadow-blue-200 text-sm font-medium leading-relaxed">
                                    I just bought a calathea from your store and I'm not sure how often I should water it. Any tips?
                                </div>
                                <span className="text-[10px] font-bold text-gray-300 uppercase mr-3">Read</span>
                            </div>
                        </div>

                        {/* Bot Response */}
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 flex-shrink-0">
                                <BotIcon className="w-4 h-4" />
                            </div>
                            <div className="space-y-1.5 flex-1">
                                <div className="bg-white px-5 py-3.5 rounded-3xl rounded-tl-none shadow-sm border border-gray-100 text-sm font-medium text-gray-800 leading-relaxed">
                                    Water it when the top inch of soil feels dry, and try to use filtered or room-temperature water. 🌿
                                </div>
                            </div>
                        </div>

                        {/* User Feedback */}
                        <div className="flex justify-end pr-3">
                            <div className="bg-blue-600 text-white px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 flex items-center gap-2">
                                Thanks!
                            </div>
                        </div>

                        <div className="flex justify-center">
                            <div className="flex items-center gap-2 text-[10px] font-black text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 uppercase tracking-widest">
                                <CheckCircle2 className="w-3 h-3" /> Case solved!
                            </div>
                        </div>
                    </div>

                    <div className="p-8 border-t border-gray-50 bg-white shadow-[0_-1px_10px_rgba(0,0,0,0.02)]">
                        <div className="flex items-center gap-4 bg-gray-50 px-6 py-4 rounded-3xl">
                            <span className="text-gray-400 text-sm font-medium flex-1">Write a message...</span>
                            <div className="flex items-center gap-3 text-gray-300">
                                <BotIcon className="w-5 h-5" />
                                <div className="w-[1px] h-4 bg-gray-200" />
                                <ArrowRight className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Floating Preview Badge */}
                <div className="absolute top-12 bg-white/80 backdrop-blur-md px-6 py-2 rounded-full border border-gray-100 shadow-sm text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    Website widget preview
                </div>
            </div>
        </div>
    );
}
