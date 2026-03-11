'use client';

import { dashboardApi } from '@/lib/api';
import { PaginatedRateLimitAudit, PaginatedRateLimitDeliveries, RateLimitAlert, RateLimitNotificationSettings, RateLimitOverview, RateLimitPolicy, TenantSettings } from '@/lib/types';
import { ONBOARDING_BANNER_DISMISSED_KEY } from '@/lib/uiFlags';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Gauge, RefreshCcw, Settings as SettingsIcon, Shield, Siren, TriangleAlert, Zap } from 'lucide-react';

type RoleContext = { tenant_id: string; role: string };

type PolicyDraft = {
    tenant_id: string;
    plan: '' | 'starter' | 'pro' | 'enterprise';
    route_key: string;
    rpm_limit: string;
    is_active: boolean;
};

type PolicyFilters = {
    tenant_filter: string;
    plan: '' | 'starter' | 'pro' | 'enterprise';
    route_key: string;
};

const EMPTY_POLICY: PolicyDraft = {
    tenant_id: '',
    plan: '',
    route_key: 'chat',
    rpm_limit: '',
    is_active: true,
};

const ROUTE_HINTS: Record<string, string> = {
    default: 'Fallback budget for any route without a dedicated policy',
    chat: 'Authenticated chat requests',
    chat_public: 'Public widget traffic',
    dashboard_conversations: 'Dashboard conversation listing',
    ingest_scrape: 'Website scrape and ingest jobs',
    auth: 'Login and token issuance',
};

export function Settings() {
    const [settings, setSettings] = useState<TenantSettings | null>(null);
    const [rateOverview, setRateOverview] = useState<RateLimitOverview | null>(null);
    const [role, setRole] = useState<RoleContext | null>(null);
    const [policies, setPolicies] = useState<RateLimitPolicy[]>([]);
    const [alerts, setAlerts] = useState<RateLimitAlert[]>([]);
    const [deliveries, setDeliveries] = useState<PaginatedRateLimitDeliveries | null>(null);
    const [auditLog, setAuditLog] = useState<PaginatedRateLimitAudit | null>(null);
    const [notificationSettings, setNotificationSettings] = useState<RateLimitNotificationSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [upgrading, setUpgrading] = useState(false);
    const [tipsResetDone, setTipsResetDone] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [upgradeNotice, setUpgradeNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [policyDraft, setPolicyDraft] = useState<PolicyDraft>(EMPTY_POLICY);
    const [policySaving, setPolicySaving] = useState(false);
    const [editingPolicyId, setEditingPolicyId] = useState<number | null>(null);
    const [policyFilters, setPolicyFilters] = useState<PolicyFilters>({ tenant_filter: '', plan: '', route_key: '' });
    const [notificationSaving, setNotificationSaving] = useState(false);
    const [deliveryOffset, setDeliveryOffset] = useState(0);
    const [auditOffset, setAuditOffset] = useState(0);

    const isAdmin = role?.role === 'admin';

    const loadData = useCallback(async (options?: { quiet?: boolean; policyFilters?: PolicyFilters }) => {
        const appliedFilters = options?.policyFilters || policyFilters;
        setRefreshing(true);
        try {
            const [settingsRes, overviewRes, roleRes] = await Promise.all([
                dashboardApi.getSettings(),
                dashboardApi.getDashboardRateLimits(),
                dashboardApi.getQualityRole(),
            ]);
            setSettings(settingsRes.data);
            setRateOverview(overviewRes.data);
            setRole(roleRes.data);

            if ((roleRes.data?.role || '').toLowerCase() === 'admin') {
                const [policiesRes, alertsRes, notificationRes, deliveriesRes, auditRes] = await Promise.all([
                    dashboardApi.getRateLimitPolicies({
                        tenant_filter: appliedFilters.tenant_filter || undefined,
                        plan: appliedFilters.plan || undefined,
                        route_key: appliedFilters.route_key || undefined,
                    }),
                    dashboardApi.getRateLimitAlerts({ window_hours: 24, min_hits: 3 }),
                    dashboardApi.getRateLimitNotificationSettings(),
                    dashboardApi.getRateLimitDeliveries({
                        tenant_filter: appliedFilters.tenant_filter || undefined,
                        route_key: appliedFilters.route_key || undefined,
                        offset: deliveryOffset,
                        limit: 20,
                    }),
                    dashboardApi.getRateLimitAudit({ offset: auditOffset, limit: 10 }),
                ]);
                setPolicies(policiesRes.data.items || []);
                setAlerts(alertsRes.data.items || []);
                setNotificationSettings(notificationRes.data);
                setDeliveries(deliveriesRes.data);
                setAuditLog(auditRes.data);
            } else {
                setPolicies([]);
                setAlerts([]);
                setNotificationSettings(null);
                setDeliveries(null);
                setAuditLog(null);
            }
        } catch (err: any) {
            console.error(err);
            if (!options?.quiet) {
                setNotice({ type: 'error', text: err?.response?.data?.detail || 'Failed to load settings and rate limit data.' });
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [policyFilters, deliveryOffset, auditOffset]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const messageUsageHash = settings && settings.message_limit > 0 ? (settings.messages_sent / settings.message_limit) * 100 : 0;
    const documentUsageHash = settings && settings.document_limit > 0 ? (settings.documents_indexed / settings.document_limit) * 100 : 0;

    const sortedRateLimits = useMemo(() => {
        const entries = Object.entries(rateOverview?.effective_limits || settings?.rate_limits || {});
        return entries.sort((a, b) => a[0].localeCompare(b[0]));
    }, [rateOverview, settings]);

    const getPlanBadgeClass = (plan: string) => {
        if (plan === 'pro') return 'bg-blue-100 text-blue-600';
        if (plan === 'enterprise') return 'bg-emerald-100 text-emerald-700';
        return 'bg-gray-100 text-gray-600';
    };

    const handleUpgrade = async () => {
        setUpgrading(true);
        setUpgradeNotice(null);
        try {
            const res = await dashboardApi.createCheckout('pro');
            if (res.data.url) {
                setUpgradeNotice({ type: 'success', text: 'Redirecting to secure checkout...' });
                globalThis.location.href = res.data.url;
                return;
            }
            setUpgradeNotice({ type: 'error', text: 'Checkout URL was not returned. Please retry.' });
        } catch (err: any) {
            console.error('Upgrade failed:', err);
            const detail = err?.response?.data?.detail || 'Checkout failed. Please ensure billing configuration is valid.';
            setUpgradeNotice({ type: 'error', text: detail });
        } finally {
            setUpgrading(false);
        }
    };

    const handleResetOnboardingTips = () => {
        globalThis.localStorage.removeItem(ONBOARDING_BANNER_DISMISSED_KEY);
        setTipsResetDone(true);
        globalThis.setTimeout(() => setTipsResetDone(false), 3000);
    };

    const resetPolicyEditor = () => {
        setPolicyDraft(EMPTY_POLICY);
        setEditingPolicyId(null);
    };

    const showToast = (type: 'success' | 'error', text: string) => {
        setNotice({ type, text });
        globalThis.setTimeout(() => {
            setNotice((current) => (current?.text === text ? null : current));
        }, 3000);
    };

    const refetchAdminRateLimitData = async (filters?: PolicyFilters) => {
        if (!isAdmin) {
            return;
        }
        const appliedFilters = filters || policyFilters;
        const [policiesRes, alertsRes, notificationRes, deliveriesRes, auditRes] = await Promise.all([
            dashboardApi.getRateLimitPolicies({
                tenant_filter: appliedFilters.tenant_filter || undefined,
                plan: appliedFilters.plan || undefined,
                route_key: appliedFilters.route_key || undefined,
            }),
            dashboardApi.getRateLimitAlerts({ window_hours: 24, min_hits: 3 }),
            dashboardApi.getRateLimitNotificationSettings(),
            dashboardApi.getRateLimitDeliveries({
                tenant_filter: appliedFilters.tenant_filter || undefined,
                route_key: appliedFilters.route_key || undefined,
                offset: deliveryOffset,
                limit: 20,
            }),
            dashboardApi.getRateLimitAudit({ offset: auditOffset, limit: 10 }),
        ]);
        setPolicies(policiesRes.data.items || []);
        setAlerts(alertsRes.data.items || []);
        setNotificationSettings(notificationRes.data);
        setDeliveries(deliveriesRes.data);
        setAuditLog(auditRes.data);
    };

    const handlePolicySubmit = async () => {
        setPolicySaving(true);
        try {
            const payload = {
                tenant_id: policyDraft.tenant_id.trim() || null,
                plan: policyDraft.plan || null,
                route_key: policyDraft.route_key.trim(),
                rpm_limit: Number(policyDraft.rpm_limit),
                is_active: policyDraft.is_active,
            };
            if (!payload.route_key || !payload.rpm_limit) {
                throw new Error('Route key and RPM limit are required.');
            }
            if (editingPolicyId) {
                setPolicies((current) => current.map((policy) => (
                    policy.id === editingPolicyId
                        ? {
                            ...policy,
                            tenant_id: payload.tenant_id,
                            plan: payload.plan,
                            route_key: payload.route_key,
                            rpm_limit: payload.rpm_limit,
                            is_active: payload.is_active,
                            scope: payload.tenant_id ? 'tenant' : 'plan',
                        }
                        : policy
                )));
                const response = await dashboardApi.updateRateLimitPolicy(editingPolicyId, payload);
                setPolicies((current) => current.map((policy) => (policy.id === editingPolicyId ? response.data : policy)));
                showToast('success', 'Rate limit policy updated.');
            } else {
                const optimisticId = -Date.now();
                const optimisticPolicy: RateLimitPolicy = {
                    id: optimisticId,
                    tenant_id: payload.tenant_id,
                    plan: payload.plan,
                    route_key: payload.route_key,
                    rpm_limit: payload.rpm_limit,
                    is_active: payload.is_active,
                    scope: payload.tenant_id ? 'tenant' : 'plan',
                };
                setPolicies((current) => [optimisticPolicy, ...current]);
                const response = await dashboardApi.createRateLimitPolicy(payload);
                setPolicies((current) => current.map((policy) => (policy.id === optimisticId ? response.data : policy)));
                showToast('success', 'Rate limit policy created.');
            }
            resetPolicyEditor();
            await Promise.all([
                dashboardApi.getSettings().then((res) => setSettings(res.data)),
                dashboardApi.getDashboardRateLimits().then((res) => setRateOverview(res.data)),
                refetchAdminRateLimitData(),
            ]);
        } catch (err: any) {
            const detail = err?.response?.data?.detail || err?.message || 'Failed to save rate limit policy.';
            await refetchAdminRateLimitData().catch(() => undefined);
            showToast('error', detail);
        } finally {
            setPolicySaving(false);
        }
    };

    const handleEditPolicy = (policy: RateLimitPolicy) => {
        setEditingPolicyId(policy.id);
        setPolicyDraft({
            tenant_id: policy.tenant_id || '',
            plan: (policy.plan as PolicyDraft['plan']) || '',
            route_key: policy.route_key,
            rpm_limit: String(policy.rpm_limit),
            is_active: policy.is_active,
        });
    };

    const handleDeletePolicy = async (policyId: number) => {
        const previousPolicies = policies;
        setPolicies((current) => current.filter((policy) => policy.id !== policyId));
        try {
            await dashboardApi.deleteRateLimitPolicy(policyId);
            if (editingPolicyId === policyId) {
                resetPolicyEditor();
            }
            showToast('success', 'Rate limit policy deleted.');
            await Promise.all([
                dashboardApi.getSettings().then((res) => setSettings(res.data)),
                dashboardApi.getDashboardRateLimits().then((res) => setRateOverview(res.data)),
                refetchAdminRateLimitData(),
            ]);
        } catch (err: any) {
            setPolicies(previousPolicies);
            showToast('error', err?.response?.data?.detail || 'Failed to delete rate limit policy.');
        }
    };

    const handleNotificationSettingsSave = async () => {
        if (!notificationSettings) {
            return;
        }
        const previous = notificationSettings;
        setNotificationSaving(true);
        try {
            const response = await dashboardApi.updateRateLimitNotificationSettings(notificationSettings);
            setNotificationSettings(response.data);
            showToast('success', 'Alert notification settings updated.');
            await refetchAdminRateLimitData();
        } catch (err: any) {
            setNotificationSettings(previous);
            showToast('error', err?.response?.data?.detail || 'Failed to update alert notification settings.');
        } finally {
            setNotificationSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading settings...</div>;
    if (!settings) return <div className="p-8 text-center text-red-500">Failed to load settings</div>;

    return (
        <div className="max-w-6xl space-y-8">
            <section className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                <div className="p-6 border-b bg-gray-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                            <SettingsIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Account Settings</h2>
                            <p className="text-sm text-gray-500">Manage subscription, usage, and tenant-level traffic controls.</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            void loadData({ quiet: true });
                        }}
                        disabled={refreshing}
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        <RefreshCcw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 divide-x divide-gray-100">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-gray-800">Current Plan</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getPlanBadgeClass(settings.plan)}`}>
                                {settings.plan}
                            </span>
                        </div>

                        <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100 flex items-start gap-4">
                            <div className="p-2.5 bg-white rounded-lg border border-blue-100 shadow-sm shrink-0">
                                <Zap className="w-5 h-5 text-blue-600 fill-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-blue-900 mb-1">
                                    {settings.plan === 'starter' ? 'Ready to Scale?' : 'Managed Capacity Active'}
                                </p>
                                <p className="text-xs text-blue-700 leading-relaxed">
                                    {settings.plan === 'starter'
                                        ? 'Upgrade to Pro for higher throughput and larger operational budgets.'
                                        : 'Your current plan already supports advanced operations and higher request budgets.'}
                                </p>
                                {settings.plan === 'starter' && (
                                    <button
                                        onClick={handleUpgrade}
                                        disabled={upgrading}
                                        className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group disabled:opacity-50"
                                    >
                                        {upgrading ? 'Opening checkout...' : 'Upgrade now'}
                                        <Zap className="w-3 h-3 group-hover:scale-110 transition-transform" />
                                    </button>
                                )}
                                {upgradeNotice && (
                                    <p className={`mt-3 text-[11px] font-bold ${upgradeNotice.type === 'success' ? 'text-green-700' : 'text-red-600'}`}>
                                        {upgradeNotice.text}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Organization ID</span>
                                <code className="bg-gray-100 px-2 py-1 rounded text-gray-600 font-mono text-xs">{settings.id}</code>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Tenant Role</span>
                                <span className="flex items-center gap-1.5 text-gray-700 font-medium">
                                    <Shield className="w-4 h-4 text-green-600" /> {(role?.role || 'unknown').toUpperCase()}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Support</span>
                                <a href={settings.support?.url || '#'} className="text-blue-600 font-medium hover:underline">
                                    {settings.support?.email || 'Contact support'}
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="md:pl-8 space-y-8">
                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <div>
                                    <h4 className="text-sm font-bold text-gray-800">Messages</h4>
                                    <p className="text-[10px] text-gray-500">Monthly AI response usage</p>
                                </div>
                                <span className="text-sm font-bold text-gray-900">
                                    {settings.messages_sent} / {settings.message_limit}
                                </span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full transition-all duration-500 ${messageUsageHash > 80 ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${Math.min(messageUsageHash, 100)}%` }} />
                            </div>
                            {messageUsageHash > 80 && (
                                <p className="mt-1.5 text-[10px] text-red-500 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" /> Almost out of messages
                                </p>
                            )}
                        </div>

                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <div>
                                    <h4 className="text-sm font-bold text-gray-800">Knowledge Base</h4>
                                    <p className="text-[10px] text-gray-500">Source documents indexed</p>
                                </div>
                                <span className="text-sm font-bold text-gray-900">
                                    {settings.documents_indexed} / {settings.document_limit}
                                </span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full transition-all duration-500 ${documentUsageHash > 80 ? 'bg-red-500' : 'bg-indigo-600'}`} style={{ width: `${Math.min(documentUsageHash, 100)}%` }} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
                <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-bold text-gray-900">Rate Limit Overview</h3>
                            <p className="text-sm text-gray-500">Effective limits and recent throttle activity for this tenant.</p>
                        </div>
                        <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold ${settings.rate_limit_summary?.upgrade_recommended ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                            <Gauge className="h-3.5 w-3.5" />
                            {settings.rate_limit_summary?.upgrade_recommended ? 'Review Capacity' : 'Healthy Capacity'}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Throttled 24h</p>
                            <p className="mt-2 text-3xl font-black text-gray-900">{settings.rate_limit_summary?.total_throttled_requests || 0}</p>
                        </div>
                        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Support Channel</p>
                            <p className="mt-2 text-sm font-bold text-gray-900">{settings.support?.email || 'Not configured'}</p>
                        </div>
                        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Window</p>
                            <p className="mt-2 text-3xl font-black text-gray-900">{rateOverview?.window_hours || settings.rate_limit_summary?.window_hours || 24}h</p>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-gray-100">
                        <div className="grid grid-cols-[1fr_auto] bg-gray-50 px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-gray-500">
                            <span>Route Budget</span>
                            <span>RPM</span>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {sortedRateLimits.map(([routeKey, limit]) => (
                                <div key={routeKey} className="grid grid-cols-[1fr_auto] items-center px-4 py-3">
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{routeKey}</p>
                                        <p className="text-xs text-gray-500">{ROUTE_HINTS[routeKey] || 'Custom route policy'}</p>
                                    </div>
                                    <span className="rounded-full bg-gray-900 px-3 py-1 text-xs font-black text-white">{limit}</span>
                                </div>
                            ))}
                            {sortedRateLimits.length === 0 && (
                                <div className="px-4 py-6 text-sm text-gray-500">No rate limit policies resolved for this tenant.</div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="text-sm font-bold text-gray-900">Top Throttled Routes</h4>
                            <div className="mt-3 space-y-3">
                                {(rateOverview?.top_throttled_routes || settings.rate_limit_summary?.top_throttled_routes || []).slice(0, 5).map((item) => (
                                    <div key={item.route_key} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">{item.route_key}</p>
                                            <p className="text-[11px] text-gray-500">{ROUTE_HINTS[item.route_key] || 'Tenant traffic bucket'}</p>
                                        </div>
                                        <span className="text-sm font-black text-gray-900">{item.count}</span>
                                    </div>
                                ))}
                                {(!rateOverview?.top_throttled_routes || rateOverview.top_throttled_routes.length === 0) && (
                                    <p className="rounded-xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">No throttling recorded for this tenant in the selected window.</p>
                                )}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-gray-900">Recent Throttle Events</h4>
                            <div className="mt-3 space-y-3">
                                {(rateOverview?.recent_events || []).slice(0, 5).map((item, idx) => (
                                    <div key={`${item.route_key}-${item.exceeded_at || idx}`} className="rounded-xl border border-gray-100 px-4 py-3">
                                        <div className="flex items-center justify-between gap-4">
                                            <p className="text-sm font-bold text-gray-800">{item.route_key}</p>
                                            <span className="text-[11px] font-black text-red-600">retry {item.retry_after_seconds}s</span>
                                        </div>
                                        <p className="mt-1 text-[11px] text-gray-500">{item.request_path}</p>
                                        <p className="mt-1 text-[11px] text-gray-500">{item.exceeded_at ? new Date(item.exceeded_at).toLocaleString() : 'Unknown time'}</p>
                                    </div>
                                ))}
                                {(!rateOverview?.recent_events || rateOverview.recent_events.length === 0) && (
                                    <p className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-500">No recent throttle events recorded.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-1 gap-4">
                        {[
                            { id: 'isolation', name: 'Multi-Tenant Isolation', status: true },
                            { id: 'custom-bots', name: 'Custom Bots', status: true },
                            { id: 'crawling', name: 'Recursive Crawling', status: settings.plan !== 'starter' },
                            { id: 'tools', name: 'Tool Integration', status: settings.plan !== 'starter' },
                            { id: 'support', name: 'Priority Support', status: settings.plan === 'enterprise' }
                        ].map((feature) => (
                            <div key={feature.id} className={`p-4 rounded-xl border flex items-center gap-3 transition-colors ${feature.status ? 'bg-white border-gray-100' : 'bg-gray-50 border-dashed text-gray-400'}`}>
                                {feature.status ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                ) : (
                                    <div className="w-5 h-5 rounded-full border-2 border-gray-200" />
                                )}
                                <span className="text-sm font-medium">{feature.name}</span>
                            </div>
                        ))}
                    </div>

                    <section className="bg-white rounded-2xl border shadow-sm p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Product Tips</h3>
                                <p className="text-sm text-gray-500">Reset onboarding tips and banners so they appear again.</p>
                            </div>
                            <button
                                type="button"
                                onClick={handleResetOnboardingTips}
                                className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold uppercase tracking-widest text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Reset Onboarding Tips
                            </button>
                        </div>
                        {tipsResetDone && (
                            <p className="mt-4 text-xs font-bold text-green-600">Onboarding tips reset. They will show again on next onboarding completion.</p>
                        )}
                    </section>
                </div>
            </section>

            {notice && (
                <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${notice.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                    {notice.text}
                </div>
            )}

            {isAdmin && (
                <section className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
                    <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-5">
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-amber-100 p-2 text-amber-700">
                                <Siren className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Throttle Alerts</h3>
                                <p className="text-sm text-gray-500">Repeated limit breaches that need operator attention.</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {alerts.map((alert) => (
                                <div key={`${alert.tenant_id}-${alert.route_key}-${alert.last_seen || 'na'}`} className={`rounded-2xl border p-4 ${alert.severity === 'high' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-black text-gray-900">{alert.tenant_name}</p>
                                            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">{alert.plan} · {alert.route_key}</p>
                                        </div>
                                        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${alert.severity === 'high' ? 'bg-red-600 text-white' : 'bg-amber-200 text-amber-800'}`}>
                                            {alert.severity}
                                        </span>
                                    </div>
                                    <p className="mt-3 text-sm text-gray-700">{alert.message}</p>
                                    <p className="mt-2 text-xs font-semibold text-gray-600">{alert.next_action}</p>
                                    <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
                                        <span>{alert.hits} hits</span>
                                        <span>{alert.last_seen ? new Date(alert.last_seen).toLocaleString() : 'Unknown time'}</span>
                                    </div>
                                </div>
                            ))}
                            {alerts.length === 0 && (
                                <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">
                                    No repeated-throttle alerts in the last 24 hours.
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <h4 className="text-sm font-black text-gray-900">Delivery History</h4>
                            <p className="mt-1 text-xs text-gray-500">Latest alert email and webhook deliveries with server-side pagination and filter counts.</p>
                            {deliveries && (
                                <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                                    <div className="rounded-xl bg-gray-50 p-3"><p className="text-gray-500">Recent</p><p className="font-black text-lg">{deliveries.counts.recent}</p></div>
                                    <div className="rounded-xl bg-gray-50 p-3"><p className="text-gray-500">Email</p><p className="font-black text-lg">{deliveries.counts.email}</p></div>
                                    <div className="rounded-xl bg-gray-50 p-3"><p className="text-gray-500">Webhook</p><p className="font-black text-lg">{deliveries.counts.webhook}</p></div>
                                </div>
                            )}
                            <div className="mt-3 space-y-3">
                                {(deliveries?.items || []).map((delivery) => (
                                    <div key={`${delivery.tenant_id}-${delivery.route_key}-${delivery.channel}`} className="rounded-2xl border border-gray-100 p-4">
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <p className="text-sm font-black text-gray-900">{delivery.tenant_name}</p>
                                                <p className="text-xs text-gray-500">{delivery.route_key} · {delivery.channel}</p>
                                            </div>
                                            <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${delivery.recent ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {delivery.recent ? 'recent' : 'older'}
                                            </span>
                                        </div>
                                        <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                                            <span>{delivery.hits} hits at send time</span>
                                            <span>{delivery.last_sent_at ? new Date(delivery.last_sent_at).toLocaleString() : 'Never sent'}</span>
                                        </div>
                                    </div>
                                ))}
                                {(!deliveries || deliveries.items.length === 0) && (
                                    <div className="rounded-2xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">
                                        No alert deliveries recorded yet.
                                    </div>
                                )}
                            </div>
                            {deliveries && (
                                <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                                    <span>{deliveries.pagination.returned} of {deliveries.pagination.total} records</span>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            disabled={deliveries.pagination.offset === 0}
                                            onClick={() => setDeliveryOffset((current) => Math.max(0, current - deliveries.pagination.limit))}
                                            className="rounded-lg border border-gray-200 px-3 py-1.5 font-black uppercase tracking-widest text-gray-700 disabled:opacity-40"
                                        >
                                            Prev
                                        </button>
                                        <button
                                            type="button"
                                            disabled={!deliveries.pagination.has_more}
                                            onClick={() => setDeliveryOffset((current) => current + deliveries.pagination.limit)}
                                            className="rounded-lg border border-gray-200 px-3 py-1.5 font-black uppercase tracking-widest text-gray-700 disabled:opacity-40"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <h4 className="text-sm font-black text-gray-900">Admin Audit Trail</h4>
                            <p className="mt-1 text-xs text-gray-500">Recent policy and notification-setting changes by admin operators.</p>
                            <div className="mt-3 space-y-3">
                                {(auditLog?.items || []).map((entry) => (
                                    <div key={entry.id} className="rounded-2xl border border-gray-100 p-4">
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <p className="text-sm font-black text-gray-900">{entry.action}</p>
                                                <p className="text-xs text-gray-500">{entry.actor_tenant_id} · {entry.target_type}</p>
                                            </div>
                                            <span className="text-[11px] text-gray-500">{entry.created_at ? new Date(entry.created_at).toLocaleString() : 'Unknown time'}</span>
                                        </div>
                                    </div>
                                ))}
                                {(!auditLog || auditLog.items.length === 0) && (
                                    <div className="rounded-2xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">
                                        No audit entries recorded yet.
                                    </div>
                                )}
                            </div>
                            {auditLog && (
                                <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                                    <span>{auditLog.pagination.returned} of {auditLog.pagination.total} audit entries</span>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            disabled={auditLog.pagination.offset === 0}
                                            onClick={() => setAuditOffset((current) => Math.max(0, current - auditLog.pagination.limit))}
                                            className="rounded-lg border border-gray-200 px-3 py-1.5 font-black uppercase tracking-widest text-gray-700 disabled:opacity-40"
                                        >
                                            Prev
                                        </button>
                                        <button
                                            type="button"
                                            disabled={!auditLog.pagination.has_more}
                                            onClick={() => setAuditOffset((current) => current + auditLog.pagination.limit)}
                                            className="rounded-lg border border-gray-200 px-3 py-1.5 font-black uppercase tracking-widest text-gray-700 disabled:opacity-40"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-5">
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-gray-900 p-2 text-white">
                                <TriangleAlert className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Policy Control</h3>
                                <p className="text-sm text-gray-500">Manage plan defaults and tenant-specific overrides.</p>
                            </div>
                        </div>

                        <div className="space-y-3 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                    Filter Tenant
                                    <input
                                        value={policyFilters.tenant_filter}
                                        onChange={(e) => setPolicyFilters((prev) => ({ ...prev, tenant_filter: e.target.value }))}
                                        className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900"
                                        placeholder="tenant@example.com"
                                    />
                                </label>
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                    Filter Plan
                                    <select
                                        value={policyFilters.plan}
                                        onChange={(e) => setPolicyFilters((prev) => ({ ...prev, plan: e.target.value as PolicyFilters['plan'] }))}
                                        className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900"
                                    >
                                        <option value="">all</option>
                                        <option value="starter">starter</option>
                                        <option value="pro">pro</option>
                                        <option value="enterprise">enterprise</option>
                                    </select>
                                </label>
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                    Filter Route
                                    <input
                                        value={policyFilters.route_key}
                                        onChange={(e) => setPolicyFilters((prev) => ({ ...prev, route_key: e.target.value }))}
                                        className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900"
                                        placeholder="chat_public"
                                    />
                                </label>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                    Scope
                                    <div className="mt-2 grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setPolicyDraft((prev) => ({ ...prev, tenant_id: '', plan: 'starter' }))}
                                            className={`rounded-xl border px-3 py-2 text-xs font-black ${policyDraft.plan ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-700'}`}
                                        >
                                            Plan Default
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPolicyDraft((prev) => ({ ...prev, plan: '', tenant_id: settings.id }))}
                                            className={`rounded-xl border px-3 py-2 text-xs font-black ${policyDraft.tenant_id ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-700'}`}
                                        >
                                            Tenant Override
                                        </button>
                                    </div>
                                </label>

                                {policyDraft.plan ? (
                                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                        Plan
                                        <select
                                            value={policyDraft.plan}
                                            onChange={(e) => setPolicyDraft((prev) => ({ ...prev, plan: e.target.value as PolicyDraft['plan'], tenant_id: '' }))}
                                            className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900"
                                        >
                                            <option value="starter">starter</option>
                                            <option value="pro">pro</option>
                                            <option value="enterprise">enterprise</option>
                                        </select>
                                    </label>
                                ) : (
                                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                        Tenant ID
                                        <input
                                            value={policyDraft.tenant_id}
                                            onChange={(e) => setPolicyDraft((prev) => ({ ...prev, tenant_id: e.target.value, plan: '' }))}
                                            className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900"
                                            placeholder="tenant@example.com"
                                        />
                                    </label>
                                )}

                                <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                    Route Key
                                    <input
                                        value={policyDraft.route_key}
                                        onChange={(e) => setPolicyDraft((prev) => ({ ...prev, route_key: e.target.value }))}
                                        className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900"
                                        placeholder="chat_public"
                                    />
                                </label>

                                <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                    RPM Limit
                                    <input
                                        value={policyDraft.rpm_limit}
                                        onChange={(e) => setPolicyDraft((prev) => ({ ...prev, rpm_limit: e.target.value }))}
                                        type="number"
                                        min="1"
                                        className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900"
                                        placeholder="60"
                                    />
                                </label>

                                <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={policyDraft.is_active}
                                        onChange={(e) => setPolicyDraft((prev) => ({ ...prev, is_active: e.target.checked }))}
                                        className="h-4 w-4 rounded border-gray-300"
                                    />
                                    Policy active
                                </label>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={handlePolicySubmit}
                                    disabled={policySaving}
                                    className="rounded-xl bg-gray-900 px-4 py-2 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50"
                                >
                                    {policySaving ? 'Saving...' : editingPolicyId ? 'Update Policy' : 'Create Policy'}
                                </button>
                                {editingPolicyId && (
                                    <button
                                        type="button"
                                        onClick={resetPolicyEditor}
                                        className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-black uppercase tracking-widest text-gray-700"
                                    >
                                        Cancel Edit
                                    </button>
                                )}
                            </div>
                        </div>

                        {notificationSettings && (
                            <div className="space-y-3 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                                <div>
                                    <h4 className="text-sm font-black text-gray-900">Alert Delivery</h4>
                                    <p className="text-xs text-gray-500">High-severity throttling can notify operators by email and webhook.</p>
                                </div>
                                <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={notificationSettings.rate_limit_email_enabled}
                                        onChange={(e) => setNotificationSettings((prev) => prev ? { ...prev, rate_limit_email_enabled: e.target.checked } : prev)}
                                        className="h-4 w-4 rounded border-gray-300"
                                    />
                                    Email alerts
                                </label>
                                <input
                                    value={notificationSettings.rate_limit_email_recipient || ''}
                                    onChange={(e) => setNotificationSettings((prev) => prev ? { ...prev, rate_limit_email_recipient: e.target.value } : prev)}
                                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900"
                                    placeholder="ops@example.com"
                                />
                                <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={notificationSettings.rate_limit_webhook_enabled}
                                        onChange={(e) => setNotificationSettings((prev) => prev ? { ...prev, rate_limit_webhook_enabled: e.target.checked } : prev)}
                                        className="h-4 w-4 rounded border-gray-300"
                                    />
                                    Webhook alerts
                                </label>
                                <input
                                    value={notificationSettings.rate_limit_webhook_url || ''}
                                    onChange={(e) => setNotificationSettings((prev) => prev ? { ...prev, rate_limit_webhook_url: e.target.value } : prev)}
                                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900"
                                    placeholder="https://hooks.example.com/rate-limit"
                                />
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                        Min Hits
                                        <input
                                            type="number"
                                            min="1"
                                            value={notificationSettings.rate_limit_min_hits}
                                            onChange={(e) => setNotificationSettings((prev) => prev ? { ...prev, rate_limit_min_hits: Number(e.target.value) } : prev)}
                                            className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900"
                                        />
                                    </label>
                                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                        Window Minutes
                                        <input
                                            type="number"
                                            min="1"
                                            value={notificationSettings.rate_limit_window_minutes}
                                            onChange={(e) => setNotificationSettings((prev) => prev ? { ...prev, rate_limit_window_minutes: Number(e.target.value) } : prev)}
                                            className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900"
                                        />
                                    </label>
                                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                        Cooldown Minutes
                                        <input
                                            type="number"
                                            min="1"
                                            value={notificationSettings.rate_limit_cooldown_minutes}
                                            onChange={(e) => setNotificationSettings((prev) => prev ? { ...prev, rate_limit_cooldown_minutes: Number(e.target.value) } : prev)}
                                            className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900"
                                        />
                                    </label>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleNotificationSettingsSave}
                                    disabled={notificationSaving}
                                    className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50"
                                >
                                    {notificationSaving ? 'Saving...' : 'Save Alert Delivery'}
                                </button>
                            </div>
                        )}

                        <div className="space-y-3 max-h-[480px] overflow-auto pr-1">
                            {policies.map((policy) => (
                                <div key={policy.id} className="rounded-2xl border border-gray-100 p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-black text-gray-900">{policy.route_key}</p>
                                            <p className="text-xs text-gray-500">
                                                {policy.scope === 'tenant' ? `Tenant override: ${policy.tenant_id}` : `Plan default: ${policy.plan}`}
                                            </p>
                                        </div>
                                        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${policy.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {policy.is_active ? 'active' : 'inactive'}
                                        </span>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between">
                                        <span className="text-sm font-semibold text-gray-700">{policy.rpm_limit} rpm</span>
                                        <div className="flex gap-2">
                                            <button type="button" onClick={() => handleEditPolicy(policy)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-gray-700">
                                                Edit
                                            </button>
                                            <button type="button" onClick={() => handleDeletePolicy(policy.id)} className="rounded-lg border border-red-200 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-red-600">
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {policies.length === 0 && (
                                <div className="rounded-2xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">
                                    No policies found. Start with a plan default or tenant override.
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
