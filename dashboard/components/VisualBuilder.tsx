'use client';

import React, { useMemo, useState, useEffect } from 'react';
import {
  MessageSquare, Play, Plus,
  Save, Trash2, Zap, Box, Split, Clock, User,
  Settings, ChevronRight, X, Sparkles, Database, Layers, Rocket
} from 'lucide-react';
import { dashboardApi } from '@/lib/api';

interface FlowNode {
  id: string;
  type: 'trigger' | 'message' | 'question' | 'condition' | 'action' | 'delay' | 'transfer' | 'ai_response';
  data: {
    label: string;
    message?: string;
    options?: string[];
    condition?: string;
    action_type?: string;
    delay_ms?: number;
    prompt?: string;
  };
  position: { x: number; y: number };
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

interface FlowData {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

interface VisualBuilderProps {
  botId: number;
  initialData?: FlowData;
  onSave?: (data: FlowData) => void;
  onTest?: (data: FlowData) => void;
}

const defaultFlowData: FlowData = {
  nodes: [
    {
      id: 'trigger-1',
      type: 'trigger',
      data: {
        label: 'User starts chat',
      },
      position: { x: 100, y: 100 }
    },
    {
      id: 'message-1',
      type: 'message',
      data: {
        label: 'Welcome Greeting',
        message: 'Hello! I am your AI assistant. How can I help you today?',
      },
      position: { x: 100, y: 250 }
    },
  ],
  edges: [{ id: 'edge-1', source: 'trigger-1', target: 'message-1' }],
};

export function VisualBuilder({ botId, initialData, onSave }: Readonly<VisualBuilderProps>) {
  const [flowData, setFlowData] = useState<FlowData>(initialData?.nodes ? initialData : defaultFlowData);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(flowData.nodes[0]?.id ?? null);
  const [isTestPanelOpen, setIsTestPanelOpen] = useState(false);
  const [testInput, setTestInput] = useState('');
  const [testMessages, setTestMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([]);
  const [flowId, setFlowId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  useEffect(() => {
    const loadFlow = async () => {
      try {
        const res = await dashboardApi.getFlows(botId);
        const flows = Array.isArray(res.data) ? res.data : [];
        if (flows.length > 0 && flows[0]?.flow_data?.nodes) {
          setFlowId(flows[0].id);
          setFlowData(flows[0].flow_data);
          setSelectedNodeId(flows[0].flow_data.nodes[0]?.id ?? null);
          return;
        }
      } catch (err) {
        console.error('Failed to load flows', err);
      }
      if (initialData?.nodes?.length) {
        setFlowData(initialData);
        setSelectedNodeId(initialData.nodes[0]?.id ?? null);
      } else {
        setFlowData(defaultFlowData);
        setSelectedNodeId(defaultFlowData.nodes[0]?.id ?? null);
      }
    };
    void loadFlow();
  }, [botId, initialData]);

  const selectedNode = useMemo(
    () => flowData.nodes.find((node) => node.id === selectedNodeId) ?? null,
    [flowData.nodes, selectedNodeId]
  );

  const addNode = (type: FlowNode['type']) => {
    const lastNode = flowData.nodes.at(-1);
    const nodeId = `${type}-${Date.now()}`;
    const newNode: FlowNode = {
      id: nodeId,
      type,
      data: {
        label: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        message: type === 'message' ? 'Your message here...' : undefined,
        prompt: type === 'ai_response' ? 'Generate a response based on context...' : undefined,
      },
      position: { x: (lastNode?.position?.x ?? 0) + 50, y: (lastNode?.position?.y ?? 0) + 100 }
    };

    const nextFlow: FlowData = {
      nodes: [...flowData.nodes, newNode],
      edges: lastNode
        ? [...flowData.edges, { id: `edge-${Date.now()}`, source: lastNode.id, target: nodeId }]
        : flowData.edges,
    };

    setFlowData(nextFlow);
    setSelectedNodeId(nodeId);
  };

  const updateNodeData = (nodeId: string, data: Partial<FlowNode['data']>) => {
    setFlowData(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n)
    }));
  };

  const deleteNode = (id: string) => {
    setFlowData(prev => ({
      nodes: prev.nodes.filter(n => n.id !== id),
      edges: prev.edges.filter(e => e.source !== id && e.target !== id)
    }));
    if (selectedNodeId === id) setSelectedNodeId(null);
  };

  const saveFlow = async () => {
    try {
      setSaving(true);
      setSaveStatus('idle');
      const payload = {
        name: 'Main Story',
        description: 'Primary bot story flow',
        flow_data: flowData,
        is_active: true
      };
      if (flowId) {
        await dashboardApi.updateFlow(botId, flowId, payload);
      } else {
        const created = await dashboardApi.createFlow(botId, payload);
        if (created?.data?.id) setFlowId(created.data.id);
      }
      onSave?.(flowData);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to save flow', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } finally {
      setSaving(false);
    }
  };

  const testFlow = () => {
    if (!testInput.trim()) return;
    setTestMessages(prev => [...prev, { sender: 'user', text: testInput }]);

    // Simple simulation
    setTimeout(() => {
      setTestMessages(prev => [...prev, { sender: 'bot', text: "Story flow simulation processed. Bot would respond based on your builder logic." }]);
    }, 1000);
    setTestInput('');
  };

  return (
    <div className="h-[700px] flex flex-col bg-gray-50 rounded-[2.5rem] border border-gray-200 overflow-hidden shadow-2xl animate-in fade-in duration-500">
      {/* Header */}
      <div className="h-20 bg-white border-b px-8 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900 tracking-tight">Main Story</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Story ID: FLOW-{botId}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsTestPanelOpen(!isTestPanelOpen)}
            className={`px-6 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all ${isTestPanelOpen ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            {isTestPanelOpen ? 'Close Simulator' : 'Simulation'}
          </button>
          <button
            onClick={saveFlow}
            disabled={saving}
            className="px-8 py-2.5 bg-gray-900 text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-gray-200 hover:-translate-y-1 transition-all active:translate-y-0 flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Story'}
          </button>
        </div>
      </div>
      {saveStatus !== 'idle' && (
        <div className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest ${saveStatus === 'saved' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {saveStatus === 'saved' ? 'Story saved successfully' : 'Failed to save story'}
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Toolbox */}
        <div className="w-20 bg-white border-r flex flex-col items-center py-6 gap-6">
          <button onClick={() => addNode('message')} className="group relative" title="Bot Message">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="absolute left-16 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity z-20">Bot Message</span>
          </button>
          <button onClick={() => addNode('question')} className="group relative" title="User Input">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center hover:bg-purple-600 hover:text-white transition-all shadow-sm">
              <User className="w-5 h-5" />
            </div>
            <span className="absolute left-16 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity z-20">Ask Question</span>
          </button>
          <button onClick={() => addNode('condition')} className="group relative" title="Logic Split">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center hover:bg-amber-600 hover:text-white transition-all shadow-sm">
              <Split className="w-5 h-5" />
            </div>
            <span className="absolute left-16 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity z-20">Decision Tree</span>
          </button>
          <button onClick={() => addNode('ai_response')} className="group relative" title="AI Generation">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="absolute left-16 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity z-20">AI Generation</span>
          </button>
          <button onClick={() => addNode('delay')} className="group relative" title="Delay">
            <div className="w-12 h-12 bg-gray-50 text-gray-600 rounded-2xl flex items-center justify-center hover:bg-gray-900 hover:text-white transition-all shadow-sm">
              <Clock className="w-5 h-5" />
            </div>
            <span className="absolute left-16 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity z-20">Wait / Delay</span>
          </button>
          <button onClick={() => addNode('action')} className="group relative" title="Integration Action">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center hover:bg-green-600 hover:text-white transition-all shadow-sm">
              <Zap className="w-5 h-5" />
            </div>
            <span className="absolute left-16 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity z-20">System Action</span>
          </button>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] overflow-auto p-20">
          <div className="flex flex-col items-center gap-12 min-w-max">
            {flowData.nodes.map((node, index) => (
              <div key={node.id} className="relative flex flex-col items-center">
                <div
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`w-72 bg-white rounded-3xl border-2 p-6 cursor-pointer text-left transition-all ${selectedNodeId === node.id
                    ? 'border-indigo-600 shadow-2xl shadow-indigo-100 scale-105'
                    : 'border-gray-100 shadow-lg shadow-gray-200/50 hover:border-gray-300'
                    }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${node.type === 'trigger' ? 'bg-indigo-50 text-indigo-600' :
                        node.type === 'message' ? 'bg-blue-50 text-blue-600' :
                          node.type === 'question' ? 'bg-purple-50 text-purple-600' :
                            node.type === 'condition' ? 'bg-amber-50 text-amber-600' :
                              node.type === 'ai_response' ? 'bg-rose-50 text-rose-600' :
                                node.type === 'delay' ? 'bg-gray-50 text-gray-600' :
                                  'bg-green-50 text-green-600'
                        }`}>
                        {node.type === 'trigger' ? <Database className="w-4 h-4" /> :
                          node.type === 'message' ? <MessageSquare className="w-4 h-4" /> :
                            node.type === 'question' ? <User className="w-4 h-4" /> :
                              node.type === 'condition' ? <Split className="w-4 h-4" /> :
                                node.type === 'ai_response' ? <Sparkles className="w-4 h-4" /> :
                                  node.type === 'delay' ? <Clock className="w-4 h-4" /> :
                                    <Zap className="w-4 h-4" />}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{node.type}</span>
                    </div>
                    {node.type !== 'trigger' && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }}
                        className="p-2 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors text-gray-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">{node.data.label}</h4>
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {node.data.message || node.data.prompt || node.data.condition || (node.type === 'trigger' && 'Flow entry point') || 'No content configured'}
                  </p>
                </div>

                {index < flowData.nodes.length - 1 && (
                  <div className="h-12 w-0.5 bg-gray-200 relative">
                    <div className="absolute -bottom-1 -left-[3px] border-t-4 border-l-4 border-r-4 border-l-transparent border-r-transparent border-t-gray-200" />
                  </div>
                )}
              </div>
            ))}

            <button
              onClick={() => addNode('message')}
              className="mt-4 w-12 h-12 bg-white rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 hover:scale-110 transition-all shadow-sm"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Properties Panel */}
        <div className="w-96 bg-white border-l flex flex-col overflow-hidden">
          <div className="p-8 border-b">
            <h4 className="font-black text-gray-900 tracking-tight flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-600" />
              Node Properties
            </h4>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            {selectedNode ? (
              <>
                <div className="space-y-2">
                  <label htmlFor="node-label" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Node Title</label>
                  <input
                    id="node-label"
                    type="text"
                    value={selectedNode.data.label}
                    onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                  />
                </div>

                {selectedNode.type === 'message' && (
                  <div className="space-y-2">
                    <label htmlFor="node-message" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Bot Message</label>
                    <textarea
                      id="node-message"
                      value={selectedNode.data.message || ''}
                      onChange={(e) => updateNodeData(selectedNode.id, { message: e.target.value })}
                      rows={6}
                      className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                    />
                  </div>
                )}

                {selectedNode.type === 'ai_response' && (
                  <div className="space-y-2">
                    <label htmlFor="node-prompt" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">AI System Prompt</label>
                    <textarea
                      id="node-prompt"
                      value={selectedNode.data.prompt || ''}
                      onChange={(e) => updateNodeData(selectedNode.id, { prompt: e.target.value })}
                      rows={6}
                      className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                      placeholder="Instruct the AI on how to handle this node..."
                    />
                  </div>
                )}

                {selectedNode.type === 'condition' && (
                  <div className="space-y-2">
                    <label htmlFor="node-condition" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Logical Condition</label>
                    <textarea
                      id="node-condition"
                      value={selectedNode.data.condition || ''}
                      onChange={(e) => updateNodeData(selectedNode.id, { condition: e.target.value })}
                      rows={3}
                      className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                      placeholder="e.g. user_input and 'price' in user_input.lower()"
                    />
                  </div>
                )}

                {selectedNode.type === 'delay' && (
                  <div className="space-y-2">
                    <label htmlFor="node-delay" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Delay Duration (ms)</label>
                    <input
                      id="node-delay"
                      type="number"
                      value={selectedNode.data.delay_ms || 1000}
                      onChange={(e) => updateNodeData(selectedNode.id, { delay_ms: Number.parseInt(e.target.value) })}
                      className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                    />
                  </div>
                )}

                <div className="pt-8 border-t">
                  <p className="text-[10px] text-gray-400 font-medium italic leading-relaxed">
                    Changes are automatically staged. Click "Save Story" to persist to the server.
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-20">
                <Box className="w-12 h-12 text-gray-100 mx-auto mb-4" />
                <p className="text-sm font-bold text-gray-400">Select a node to configure</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Test Panel Overlay */}
      {isTestPanelOpen && (
        <div className="absolute right-0 top-0 bottom-0 w-[400px] bg-white shadow-2xl z-20 border-l flex flex-col animate-in slide-in-from-right duration-300">
          <div className="p-8 border-b flex justify-between items-center bg-gray-900 text-white">
            <h4 className="font-black tracking-tight flex items-center gap-2">
              <Play className="w-4 h-4 text-green-400 fill-green-400" />
              Story Simulator
            </h4>
            <button onClick={() => setIsTestPanelOpen(false)}>
              <X className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
            {testMessages.length === 0 && (
              <div className="text-center py-20 text-gray-400">
                <Rocket className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest">Awaiting interaction...</p>
              </div>
            )}
            {testMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium shadow-sm ${msg.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-800 border'
                  }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 border-t bg-white">
            <div className="flex gap-2">
              <input
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && testFlow()}
                placeholder="Talk to your flow..."
                className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-600 outline-none"
              />
              <button
                onClick={testFlow}
                className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
