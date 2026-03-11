'use client';

import { dashboardApi } from '@/lib/api';
import { AnalyticsSummary } from '@/lib/types';
import { useEffect, useState } from 'react';
import { StatCard } from './ConnecteamUIKit';
import {
    MessageSquare, Bot as BotIcon, Zap,
    Activity
} from 'lucide-react';

export function Stats() {
    const [stats, setStats] = useState<AnalyticsSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        dashboardApi.getAnalytics().then((res) => {
            setStats(res.data);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, []);

    const items = [
        {
            label: 'Total Conversations',
            value: stats?.total_conversations || 0,
            icon: MessageSquare,
            change: { value: 0, isPositive: true }
        },
        {
            label: 'Active Agents',
            value: stats?.active_bots || 0,
            icon: BotIcon,
            change: { value: 0, isPositive: true }
        },
        {
            label: 'Network Load',
            value: stats?.total_messages || 0,
            icon: Activity,
            change: { value: 0, isPositive: true }
        },
        {
            label: 'Avg Response Time',
            value: `${stats?.avg_response_time || 0}s`,
            icon: Zap,
            change: { value: 0, isPositive: false }
        },
    ];

    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="card-elevated animate-pulse">
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4" />
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
                        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {items.map((item, i) => (
                <div
                    key={item.label}
                    style={{ animationDelay: `${i * 100}ms` }}
                    className="animate-in fade-in slide-in-from-bottom-4"
                >
                    <StatCard
                        label={item.label}
                        value={item.value}
                        icon={item.icon}
                        change={item.change}
                    />
                </div>
            ))}
        </div>
    );
}
