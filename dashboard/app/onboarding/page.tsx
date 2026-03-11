'use client';

import { dashboardApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Bot, CheckCircle2, Rocket, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { BotAgentSetup } from '@/components/BotAgentSetup';

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState(1); // 1: Setup, 2: Creating, 3: Success
    const [error, setError] = useState('');
    const [createdBotId, setCreatedBotId] = useState<number | null>(null);

    const handleCreateBot = async (formData: any) => {
        try {
            setStep(2);
            setError('');

            const payload = {
                name: formData.name,
                description: "AI Agent created via onboarding",
                prompt_template: formData.instructions,
                welcome_message: "Welcome to TangentCloud. Ask me anything.",
                primary_color: '#000000',
                position: 'right',
                placeholder_text: 'Type a message...',
                bubble_greeting: 'Need help?',
                tools: []
            };

            const res = await dashboardApi.createBot(payload);
            setCreatedBotId(res.data.id);
            setStep(3);
        } catch (e: unknown) {
            setStep(1);
            const message =
                typeof e === 'object' &&
                    e !== null &&
                    'response' in e &&
                    typeof (e as { response?: { data?: { detail?: string } } }).response?.data?.detail === 'string'
                    ? (e as { response: { data: { detail: string } } }).response.data.detail
                    : 'Failed to create bot. Please try again.';
            setError(message);
        } finally {
        }
    };

    if (step === 1) {
        return (
            <div className="min-h-screen">
                {error && (
                    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] bg-red-50 border border-red-100 text-red-600 px-6 py-3 rounded-2xl font-bold text-sm shadow-xl flex items-center gap-3">
                        {error}
                        <button onClick={() => setError('')} className="p-1 hover:bg-red-100 rounded-lg">
                            <Rocket className="w-4 h-4 rotate-45" />
                        </button>
                    </div>
                )}
                <BotAgentSetup onNext={handleCreateBot} />
            </div>
        );
    }

    if (step === 2) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 space-y-8">
                <div className="w-24 h-24 bg-white rounded-[2rem] shadow-2xl flex items-center justify-center animate-pulse">
                    <Bot className="w-12 h-12 text-blue-600" />
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-black text-gray-900">Creating your agent...</h2>
                    <p className="text-gray-500 font-medium italic">Deploying brain and UI components</p>
                </div>
                <div className="flex gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
            <div className="max-w-md w-full bg-white rounded-[3rem] p-12 shadow-2xl space-y-10 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-green-50 rounded-[2rem] flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>

                <div className="space-y-3">
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Deployment Complete!</h2>
                    <p className="text-gray-500 font-medium leading-relaxed">
                        Your AI agent is now live and ready to solve cases.
                    </p>
                </div>

                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex items-center justify-between">
                    <div className="text-left">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Agent ID</p>
                        <p className="text-sm font-bold text-gray-900">{createdBotId}</p>
                    </div>
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-100">
                        <Bot className="w-5 h-5 text-gray-900" />
                    </div>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={() => router.push(`/?start=dashboard&view=bots&onboarded=1${createdBotId ? `&editBotId=${createdBotId}` : ''}`)}
                        className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-gray-200 flex items-center justify-center gap-3"
                    >
                        Go to Dashboard <Rocket className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setStep(1)}
                        className="w-full py-4 text-gray-500 font-black text-[10px] uppercase tracking-widest hover:text-gray-900 transition-colors flex items-center justify-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" /> Create Another
                    </button>
                </div>
            </div>
        </div>
    );
}
