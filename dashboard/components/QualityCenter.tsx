'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { dashboardApi } from '@/lib/api';

type QualityData = {
  role?: { tenant_id: string; role: string };
  services?: { items: Array<{ service: string; port: number; status: string; last_heartbeat: string }> };
  latest?: any;
  modules?: { items: Array<{ module: string; total: number; failed: number; duration_s: number }>; failures: Array<{ test_id: string; module: string; message: string }> };
  trends?: { items: Array<{ run_id: string; finished_at: string; total: number; passed: number; failed: number; duration_s: number; coverage_pct: number }> };
  flaky?: { items: Array<{ test_id: string; runs: number; failures: number; flaky_score: number; quarantine_recommended: boolean }> };
  coverage?: { coverage: { coverage_pct: number; source: string }; gate_threshold_pct: number; gate_passed: boolean };
  metrics?: { request_total: number; error_total: number; error_rate_pct: number; latency_p95_ms: number; latency_p99_ms: number };
  logs?: { items: Array<{ timestamp: string | null; level: string; message: string; line: string }> };
  traces?: { items: Array<{ path: string; status_code: number; duration_ms: number; trace_id: string; span_id: string }> };
  alerts?: { items: Array<{ severity: string; name: string; value: number; status: string }> };
  checklist?: any;
  risk?: { risk_score: number; failed_tests: number; flaky_count: number; critical_alerts: number };
  securityChecklist?: { passed: boolean; checks: Array<{ name: string; passed: boolean }> };
};

export function QualityCenter() {
  const [data, setData] = useState<QualityData>({});
  const [loading, setLoading] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);
  const [logLevel, setLogLevel] = useState('');
  const [runInFlight, setRunInFlight] = useState(false);
  const [message, setMessage] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [role, services, latest, modules, trends, flaky, coverage, metrics, logs, traces, alerts, checklist, risk, securityChecklist] = await Promise.all([
        dashboardApi.getQualityRole(),
        dashboardApi.getQualityServices(),
        dashboardApi.getQualityLatest(),
        dashboardApi.getQualityModules(),
        dashboardApi.getQualityTrends(20),
        dashboardApi.getQualityFlaky(),
        dashboardApi.getQualityCoverage(),
        dashboardApi.getObservabilityMetrics(),
        dashboardApi.getObservabilityLogs({ limit: 40, level: logLevel || undefined }),
        dashboardApi.getObservabilityTraces(20),
        dashboardApi.getObservabilityAlerts(),
        dashboardApi.getReleaseChecklist(),
        dashboardApi.getReleaseRisk(),
        dashboardApi.getSecurityChecklist(),
      ]);
      setData({
        role: role.data,
        services: services.data,
        latest: latest.data,
        modules: modules.data,
        trends: trends.data,
        flaky: flaky.data,
        coverage: coverage.data,
        metrics: metrics.data,
        logs: logs.data,
        traces: traces.data,
        alerts: alerts.data,
        checklist: checklist.data,
        risk: risk.data,
        securityChecklist: securityChecklist.data,
      });
      setMessage('');
    } catch (err: any) {
      setMessage(err?.response?.data?.detail || 'Failed to load quality command center data');
    } finally {
      setLoading(false);
    }
  }, [logLevel]);

  useEffect(() => {
    refresh();
    const timer = globalThis.setInterval(refresh, 30000);
    return () => globalThis.clearInterval(timer);
  }, [refreshTick, refresh]);

  const passRate = useMemo(() => {
    const p = data.latest?.summary?.pytest;
    if (!p || !p.total) return 0;
    return Math.round((p.passed / p.total) * 10000) / 100;
  }, [data.latest]);

  const toggleChecklist = async (key: string, current: boolean) => {
    try {
      await dashboardApi.updateReleaseChecklist({ [key]: !current });
      setRefreshTick((x) => x + 1);
    } catch {
      setMessage('Checklist update denied. Editor or admin role required.');
    }
  };

  const runTests = async () => {
    setRunInFlight(true);
    try {
      await dashboardApi.runQualityTests({ full: true, include_security_lane: true, parallel: true, max_fail: 0 });
      setMessage('Test run queued.');
      setTimeout(() => setRefreshTick((x) => x + 1), 2000);
    } catch (err: any) {
      setMessage(err?.response?.data?.detail || 'Failed to queue test run');
    } finally {
      setRunInFlight(false);
    }
  };

  const exportEvidence = async () => {
    try {
      const res = await dashboardApi.exportReleaseEvidence();
      setMessage(`Evidence generated: ${res.data.path}`);
      setRefreshTick((x) => x + 1);
    } catch (err: any) {
      setMessage(err?.response?.data?.detail || 'Evidence export requires admin role');
    }
  };

  const applyRetention = async () => {
    try {
      await dashboardApi.applyQualityRetention(30);
      setMessage('Retention policy applied for 30 days.');
      setRefreshTick((x) => x + 1);
    } catch (err: any) {
      setMessage(err?.response?.data?.detail || 'Retention update requires admin role');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-gray-900">Quality Command Center</h3>
            <p className="text-xs text-gray-500 mt-1">
              Tenant: <span className="font-bold text-gray-700">{data.role?.tenant_id || '-'}</span> | Role: <span className="font-bold text-gray-700">{data.role?.role || '-'}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={runTests} disabled={runInFlight} className="px-4 py-2 rounded-xl bg-gray-900 text-white text-xs font-black disabled:opacity-60">
              {runInFlight ? 'QUEUEING...' : 'RUN PYTEST'}
            </button>
            <button onClick={exportEvidence} className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-black">
              EXPORT EVIDENCE
            </button>
            <button onClick={applyRetention} className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-black">
              APPLY RETENTION
            </button>
            <button onClick={() => setRefreshTick((x) => x + 1)} className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-black">
              REFRESH
            </button>
          </div>
        </div>
        {message && <p className="mt-3 text-xs font-semibold text-blue-700">{message}</p>}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="bg-white border border-gray-100 rounded-3xl p-6">
          <h4 className="text-sm font-black text-gray-900 mb-4">Application Status</h4>
          <div className="space-y-2">
            {(data.services?.items || []).map((s) => (
              <div key={s.service} className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50">
                <span className="text-xs font-bold text-gray-700">{s.service}:{s.port}</span>
                <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${s.status === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{s.status.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white border border-gray-100 rounded-3xl p-6">
          <h4 className="text-sm font-black text-gray-900 mb-4">Pytest Summary</h4>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl bg-gray-50 p-3"><p className="text-gray-500">Total</p><p className="font-black text-lg">{data.latest?.summary?.pytest?.total || 0}</p></div>
            <div className="rounded-xl bg-gray-50 p-3"><p className="text-gray-500">Passed</p><p className="font-black text-lg text-green-700">{data.latest?.summary?.pytest?.passed || 0}</p></div>
            <div className="rounded-xl bg-gray-50 p-3"><p className="text-gray-500">Failed</p><p className="font-black text-lg text-red-700">{(data.latest?.summary?.pytest?.failed || 0) + (data.latest?.summary?.pytest?.errors || 0)}</p></div>
            <div className="rounded-xl bg-gray-50 p-3"><p className="text-gray-500">Pass Rate</p><p className="font-black text-lg">{passRate}%</p></div>
          </div>
        </section>

        <section className="bg-white border border-gray-100 rounded-3xl p-6">
          <h4 className="text-sm font-black text-gray-900 mb-4">Coverage Gate</h4>
          <p className="text-xs text-gray-600">
            Coverage: <span className="font-black">{data.coverage?.coverage?.coverage_pct ?? 0}%</span> / Gate: <span className="font-black">{data.coverage?.gate_threshold_pct ?? 75}%</span>
          </p>
          <div className={`mt-3 text-xs font-black inline-flex px-3 py-1 rounded-lg ${data.coverage?.gate_passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {data.coverage?.gate_passed ? 'GATE PASSED' : 'GATE FAILED'}
          </div>
        </section>

        <section className="bg-white border border-gray-100 rounded-3xl p-6">
          <h4 className="text-sm font-black text-gray-900 mb-4">Observability Metrics</h4>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl bg-gray-50 p-3"><p className="text-gray-500">Requests</p><p className="font-black text-lg">{data.metrics?.request_total ?? 0}</p></div>
            <div className="rounded-xl bg-gray-50 p-3"><p className="text-gray-500">Error Rate</p><p className="font-black text-lg">{data.metrics?.error_rate_pct ?? 0}%</p></div>
            <div className="rounded-xl bg-gray-50 p-3"><p className="text-gray-500">P95</p><p className="font-black text-lg">{data.metrics?.latency_p95_ms ?? 0}ms</p></div>
            <div className="rounded-xl bg-gray-50 p-3"><p className="text-gray-500">P99</p><p className="font-black text-lg">{data.metrics?.latency_p99_ms ?? 0}ms</p></div>
          </div>
        </section>

        <section className="bg-white border border-gray-100 rounded-3xl p-6 xl:col-span-2">
          <h4 className="text-sm font-black text-gray-900 mb-4">Pytest Module Grid</h4>
          <div className="overflow-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2 pr-4">Module</th>
                  <th className="py-2 pr-4">Total</th>
                  <th className="py-2 pr-4">Failed</th>
                  <th className="py-2 pr-4">Duration(s)</th>
                </tr>
              </thead>
              <tbody>
                {(data.modules?.items || []).map((m) => (
                  <tr key={m.module} className="border-t border-gray-100">
                    <td className="py-2 pr-4 font-semibold">{m.module}</td>
                    <td className="py-2 pr-4">{m.total}</td>
                    <td className="py-2 pr-4">{m.failed}</td>
                    <td className="py-2 pr-4">{m.duration_s}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white border border-gray-100 rounded-3xl p-6">
          <h4 className="text-sm font-black text-gray-900 mb-4">Alerts</h4>
          <div className="space-y-2">
            {(data.alerts?.items || []).map((a, idx) => (
              <div key={`${a.name}-${idx}`} className="px-3 py-2 rounded-xl bg-gray-50">
                <p className="text-xs font-bold text-gray-800">{a.name}</p>
                <p className="text-[10px] text-gray-500 uppercase">{a.severity} | {a.status} | value {a.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white border border-gray-100 rounded-3xl p-6">
          <h4 className="text-sm font-black text-gray-900 mb-4">Release Risk</h4>
          <p className="text-3xl font-black text-gray-900">{data.risk?.risk_score ?? 0}</p>
          <p className="text-xs text-gray-500 mt-1">Failed: {data.risk?.failed_tests ?? 0} | Flaky: {data.risk?.flaky_count ?? 0} | Critical alerts: {data.risk?.critical_alerts ?? 0}</p>
        </section>

        <section className="bg-white border border-gray-100 rounded-3xl p-6">
          <h4 className="text-sm font-black text-gray-900 mb-4">Security Checklist</h4>
          <div className={`inline-flex text-[10px] font-black px-3 py-1 rounded-lg ${data.securityChecklist?.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {data.securityChecklist?.passed ? 'SECURE BASELINE PASS' : 'SECURE BASELINE FAIL'}
          </div>
          <div className="mt-3 space-y-2">
            {(data.securityChecklist?.checks || []).map((c) => (
              <div key={c.name} className="text-xs flex items-center justify-between bg-gray-50 rounded-lg px-2 py-1">
                <span>{c.name}</span>
                <span className={c.passed ? 'text-green-700 font-bold' : 'text-red-700 font-bold'}>{c.passed ? 'PASS' : 'FAIL'}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white border border-gray-100 rounded-3xl p-6">
          <h4 className="text-sm font-black text-gray-900 mb-4">Release Checklist</h4>
          <div className="space-y-2 text-xs">
            {['tests_green', 'coverage_gate_passed', 'vulnerabilities_reviewed', 'migrations_reviewed', 'rollback_ready'].map((k) => (
              <button
                key={k}
                onClick={() => toggleChecklist(k, Boolean(data.checklist?.[k]))}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50"
              >
                <span className="font-semibold">{k}</span>
                <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${data.checklist?.[k] ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{data.checklist?.[k] ? 'DONE' : 'PENDING'}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white border border-gray-100 rounded-3xl p-6 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-black text-gray-900">Logs and Traces</h4>
            <select
              value={logLevel}
              onChange={(e) => setLogLevel(e.target.value)}
              className="border border-gray-200 rounded-lg px-2 py-1 text-xs"
            >
              <option value="">ALL LEVELS</option>
              <option value="ERROR">ERROR</option>
              <option value="WARNING">WARNING</option>
              <option value="INFO">INFO</option>
            </select>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-gray-50 p-3 max-h-64 overflow-auto">
              {(data.logs?.items || []).slice(0, 15).map((l, idx) => (
                <div key={idx} className="border-b border-gray-100 py-2">
                  <p className="text-[10px] font-black text-gray-700">{l.level}</p>
                  <p className="text-[10px] text-gray-500 line-clamp-2">{l.line}</p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl bg-gray-50 p-3 max-h-64 overflow-auto">
              {(data.traces?.items || []).slice(0, 15).map((t, idx) => (
                <div key={idx} className="border-b border-gray-100 py-2 text-[10px]">
                  <p className="font-black text-gray-700">{t.path} ({t.status_code})</p>
                  <p className="text-gray-500">Duration {t.duration_ms}ms | Trace {t.trace_id || '-'}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
      {loading && <p className="text-xs text-gray-500">Loading quality command center...</p>}
    </div>
  );
}
