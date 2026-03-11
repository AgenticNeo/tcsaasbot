'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { dashboardApi } from '@/lib/api';
import { RefreshCw, Search } from 'lucide-react';

type RealtimeRow = {
  conversation_id: number;
  customer_name: string;
  customer_email?: string | null;
  status: string;
  priority: string;
  agent_requested: boolean;
  bot_id?: number | null;
  bot_name: string;
  message_count: number;
  last_message: string;
  last_message_at: string;
  created_at: string;
  wait_seconds: number;
  country?: string | null;
  source?: string | null;
};

export function CustomersRealtimeReport() {
  const [rows, setRows] = useState<RealtimeRow[]>([]);
  const [bots, setBots] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [status, setStatus] = useState('all');
  const [botId, setBotId] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [rt, botRes] = await Promise.all([
        dashboardApi.getCustomersRealtime({
          status,
          bot_id: botId === 'all' ? undefined : Number(botId),
          q: query || undefined,
          limit: 100,
          offset: 0,
        }),
        dashboardApi.getBots(),
      ]);
      setRows(rt.data.items || []);
      setSummary(rt.data.summary || null);
      setBots(botRes.data || []);
    } finally {
      setLoading(false);
    }
  }, [botId, query, status]);

  useEffect(() => {
    fetchData();
    const timer = globalThis.setInterval(fetchData, 15000);
    return () => globalThis.clearInterval(timer);
  }, [fetchData]);

  const avgWaitLabel = useMemo(() => {
    const sec = summary?.avg_wait_seconds || 0;
    if (sec < 60) return `${sec}s`;
    return `${Math.floor(sec / 60)}m ${sec % 60}s`;
  }, [summary]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Customers Real-Time</h2>
          <p className="text-xs font-medium text-gray-500">Live customer/conversation operations view (all tenants isolated by auth).</p>
        </div>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-xs font-black"
          type="button"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <p className="text-[10px] text-gray-400 font-black uppercase">Customers</p>
          <p className="text-2xl font-black text-gray-900">{summary?.total_customers ?? 0}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <p className="text-[10px] text-gray-400 font-black uppercase">Open</p>
          <p className="text-2xl font-black text-blue-700">{summary?.open_conversations ?? 0}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <p className="text-[10px] text-gray-400 font-black uppercase">Resolved</p>
          <p className="text-2xl font-black text-green-700">{summary?.resolved_conversations ?? 0}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <p className="text-[10px] text-gray-400 font-black uppercase">Avg Wait</p>
          <p className="text-2xl font-black text-amber-700">{avgWaitLabel}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="flex items-center gap-2 flex-1 border border-gray-100 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm outline-none"
            placeholder="Search customer/email/message"
          />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-gray-100 rounded-xl px-3 py-2 text-sm">
          <option value="all">All Status</option>
          <option value="new">New</option>
          <option value="open">Open</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
        </select>
        <select value={botId} onChange={(e) => setBotId(e.target.value)} className="border border-gray-100 rounded-xl px-3 py-2 text-sm">
          <option value="all">All Bots</option>
          {bots.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Bot</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Messages</th>
              <th className="px-4 py-3 text-left">Wait</th>
              <th className="px-4 py-3 text-left">Last Message</th>
              <th className="px-4 py-3 text-left">Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.conversation_id} className="border-t border-gray-100 align-top">
                <td className="px-4 py-3">
                  <p className="font-bold text-gray-900">{r.customer_name}</p>
                  <p className="text-xs text-gray-500">{r.customer_email || '-'}</p>
                </td>
                <td className="px-4 py-3 text-gray-700">{r.bot_name}</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-black uppercase px-2 py-1 rounded-lg bg-gray-100 text-gray-700">{r.status}</span>
                  {r.agent_requested && <span className="ml-2 text-xs font-black uppercase px-2 py-1 rounded-lg bg-amber-100 text-amber-700">transfer</span>}
                </td>
                <td className="px-4 py-3 text-gray-700">{r.message_count}</td>
                <td className="px-4 py-3 text-gray-700">{r.wait_seconds}s</td>
                <td className="px-4 py-3 max-w-[28rem]">
                  <p className="text-gray-700 line-clamp-2">{r.last_message || '-'}</p>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{new Date(r.last_message_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <p className="p-4 text-xs text-gray-500">Loading real-time rows...</p>}
        {!loading && rows.length === 0 && <p className="p-4 text-xs text-gray-500">No conversations found for the selected filters.</p>}
      </div>
    </div>
  );
}
