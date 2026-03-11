'use client';

import { dashboardApi } from '@/lib/api';
import React, { useEffect, useMemo, useState } from 'react';
import {
    FormInput, ToggleLeft, ToggleRight, Trash2, Edit2, Plus,
    CheckCircle2, XCircle, Mail, Phone, User, FileText, Calendar, Loader2
} from 'lucide-react';

interface FormField {
    id: string;
    name: string;
    label: string;
    type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'checkbox' | 'date';
    required: boolean;
    placeholder?: string;
    options?: string[];
}

interface Segment {
    id: string;
    name: string;
    criteria: string;
    count: number;
}


interface DataCollectionProps {
    botId: number;
}

const supportedLeadTypes = new Set<FormField['type']>(['text', 'email', 'tel', 'textarea']);
type ApiLeadField = { name: string; label: string; type: string; required?: boolean };

const normalizeLeadFieldType = (value: string): FormField['type'] =>
    supportedLeadTypes.has(value as FormField['type']) ? (value as FormField['type']) : 'text';

export function DataCollection({ botId }: Readonly<DataCollectionProps>) {

    const [activeTab, setActiveTab] = useState<'form' | 'attributes' | 'segments'>('form');
    const [collectName, setCollectName] = useState(true);
    const [collectEmail, setCollectEmail] = useState(true);
    const [collectPhone, setCollectPhone] = useState(false);

    const [fields, setFields] = useState<FormField[]>([]);


    const [segments, setSegments] = useState([
        { id: '1', name: 'High Intent', criteria: 'Spent > $100', count: 156 },
        { id: '2', name: 'Need Support', criteria: '3+ messages', count: 42 },
        { id: '3', name: 'New Users', criteria: '< 7 days', count: 89 }
    ]);

    const [quickFieldsConfig, setQuickFieldsConfig] = useState({
        name: { label: 'Full Name', required: true, placeholder: 'Enter your name' },
        email: { label: 'Email Address', required: true, placeholder: 'Enter your email' },
        phone: { label: 'Phone Number', required: false, placeholder: 'Enter your phone number' }
    });

    const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
    const [editingField, setEditingField] = useState<FormField | null>(null);
    const [fieldForm, setFieldForm] = useState({
        name: '',
        label: '',
        type: 'text' as FormField['type'],
        required: false,
        placeholder: '',
        options: ''
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

    const [isSegmentModalOpen, setIsSegmentModalOpen] = useState(false);
    const [editingSegment, setEditingSegment] = useState<Segment | null>(null);
    const [segmentForm, setSegmentForm] = useState({
        name: '',
        criteria: ''
    });


    const normalizedLeadFields = useMemo(() => {
        const quickFields: FormField[] = [];
        if (collectName && !fields.some((f) => f.name === 'name')) {
            quickFields.push({ id: 'quick-name', name: 'name', type: 'text', ...quickFieldsConfig.name });
        }
        if (collectEmail && !fields.some((f) => f.name === 'email')) {
            quickFields.push({ id: 'quick-email', name: 'email', type: 'email', ...quickFieldsConfig.email });
        }
        if (collectPhone && !fields.some((f) => f.name === 'phone')) {
            quickFields.push({ id: 'quick-phone', name: 'phone', type: 'tel', ...quickFieldsConfig.phone });
        }
        return [...quickFields, ...fields].map((field) => ({
            ...field,
            type: normalizeLeadFieldType(field.type)
        }));
    }, [collectName, collectEmail, collectPhone, fields, quickFieldsConfig]);

    useEffect(() => {
        const loadForm = async () => {
            setLoading(true);
            try {
                const res = await dashboardApi.getLeadForm(botId);
                const leadFields: ApiLeadField[] = Array.isArray(res.data?.fields) ? res.data.fields : [];
                const mapped: FormField[] = leadFields.map((field, index) => ({
                    id: `${index}-${field.name}`,
                    name: field.name,
                    label: field.label,
                    type: normalizeLeadFieldType(field.type),
                    required: Boolean(field.required),
                    placeholder: ''
                }));

                setCollectName(mapped.some((f) => f.name === 'name'));
                setCollectEmail(mapped.some((f) => f.name === 'email'));
                setCollectPhone(mapped.some((f) => f.name === 'phone'));

                const customOnly = mapped.filter((f) => !['name', 'email', 'phone'].includes(f.name));
                setFields(customOnly);

            } catch {
                // no configured form yet
            } finally {
                setLoading(false);
            }
        };

        loadForm();
    }, [botId]);

    const persistLeadForm = async () => {
        setSaving(true);
        setSaveStatus('idle');
        try {
            await dashboardApi.createLeadForm({
                bot_id: botId,
                title: 'Contact Us',
                fields: normalizedLeadFields.map((field) => ({
                    name: field.name,
                    label: field.label,
                    type: field.type,
                    required: field.required
                }))
            });
            setSaveStatus('saved');
        } catch {
            setSaveStatus('error');
        } finally {
            setSaving(false);
            setTimeout(() => setSaveStatus('idle'), 2200);
        }
    };

    const openAddFieldModal = () => {
        setEditingField(null);
        setFieldForm({
            name: '',
            label: '',
            type: 'text',
            required: false,
            placeholder: '',
            options: ''
        });
        setIsFieldModalOpen(true);
    };

    const openEditFieldModal = (field: FormField) => {
        setEditingField(field);
        setFieldForm({
            name: field.name,
            label: field.label,
            type: field.type,
            required: field.required,
            placeholder: field.placeholder || '',
            options: field.options?.join('\n') || ''
        });
        setIsFieldModalOpen(true);
    };

    const openSegmentModal = (segment?: Segment) => {

        if (segment) {
            setEditingSegment(segment);
            setSegmentForm({ name: segment.name, criteria: segment.criteria });
        } else {
            setEditingSegment(null);
            setSegmentForm({ name: '', criteria: '' });
        }
        setIsSegmentModalOpen(true);
    };

    const saveField = () => {
        const trimmedName = fieldForm.name.trim();
        const trimmedLabel = fieldForm.label.trim();
        if (!trimmedName || !trimmedLabel) return;

        const fieldData: FormField = {
            id: editingField?.id || Date.now().toString(),
            name: trimmedName,
            label: trimmedLabel,
            type: fieldForm.type,
            required: fieldForm.required,
            placeholder: fieldForm.placeholder,
            options: fieldForm.options ? fieldForm.options.split('\n').filter(o => o.trim()) : undefined
        };

        if (editingField?.id?.startsWith('quick-')) {
            const fieldKey = editingField.id.replace('quick-', '') as keyof typeof quickFieldsConfig;
            setQuickFieldsConfig(prev => ({
                ...prev,
                [fieldKey]: {
                    label: fieldData.label,
                    required: fieldData.required,
                    placeholder: fieldData.placeholder
                }
            }));
        } else if (editingField) {
            setFields(fields.map(f => f.id === editingField.id ? fieldData : f));
        } else {
            setFields([...fields, fieldData]);
        }
        setIsFieldModalOpen(false);
    };

    const saveSegment = () => {
        if (!segmentForm.name.trim()) return;

        if (editingSegment) {
            setSegments(segments.map(s => s.id === editingSegment.id ? { ...s, ...segmentForm } : s));
        } else {
            setSegments([...segments, { id: Date.now().toString(), ...segmentForm, count: 0 }]);
        }
        setIsSegmentModalOpen(false);
    };

    const deleteSegment = (id: string) => {
        if (confirm('Are you sure you want to delete this segment?')) {
            setSegments(segments.filter(s => s.id !== id));
        }
    };

    const deleteField = (id: string) => {
        if (confirm('Are you sure you want to delete this field?')) {
            setFields(fields.filter(f => f.id !== id));
        }
    };

    const getFieldIcon = (type: string) => {
        switch (type) {
            case 'text': return <FormInput className="w-4 h-4" />;
            case 'email': return <Mail className="w-4 h-4" />;
            case 'tel': return <Phone className="w-4 h-4" />;
            case 'textarea': return <FileText className="w-4 h-4" />;
            case 'date': return <Calendar className="w-4 h-4" />;
            default: return <FormInput className="w-4 h-4" />;
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border p-12 text-center">
                <Loader2 className="w-8 h-8 text-teal-600 mx-auto animate-spin" />
                <p className="mt-3 text-sm font-bold text-gray-500">Loading lead form settings...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl p-8 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                            <FormInput className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black">Data Collection</h2>
                            <p className="text-teal-200 mt-1">Collect and manage user data during conversations</p>
                        </div>
                    </div>
                    <button
                        onClick={persistLeadForm}
                        disabled={saving}
                        className="px-6 py-3 bg-white text-teal-700 rounded-xl font-bold text-sm hover:bg-teal-50 disabled:opacity-70"
                        type="button"
                    >
                        {saving ? 'Saving...' : 'Save Form'}
                    </button>
                </div>
                {saveStatus === 'saved' && <p className="text-xs font-bold mt-3 text-teal-100">Lead form saved successfully.</p>}
                {saveStatus === 'error' && <p className="text-xs font-bold mt-3 text-red-100">Failed to save lead form. Try again.</p>}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
                {[
                    { id: 'form', label: 'Lead Form' },
                    { id: 'attributes', label: 'User Attributes' },
                    { id: 'segments', label: 'Segments' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as 'form' | 'attributes' | 'segments')}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === tab.id
                            ? 'bg-gray-900 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-100 border'
                            }`}
                        type="button"
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'form' && (
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Collection</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <User className="w-5 h-5 text-blue-500" />
                                    <span className="font-bold text-gray-900">Name</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => openEditFieldModal({ id: 'quick-name', name: 'name', type: 'text', ...quickFieldsConfig.name })}
                                        className="p-1 px-2 text-[10px] font-black uppercase text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-100"
                                        type="button"
                                    >
                                        Edit
                                    </button>
                                    <button onClick={() => setCollectName(!collectName)} type="button">
                                        {collectName ? (
                                            <ToggleRight className="w-10 h-6 text-green-500" />
                                        ) : (
                                            <ToggleLeft className="w-10 h-6 text-gray-300" />
                                        )}
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <Mail className="w-5 h-5 text-purple-500" />
                                    <span className="font-bold text-gray-900">Email</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => openEditFieldModal({ id: 'quick-email', name: 'email', type: 'email', ...quickFieldsConfig.email })}
                                        className="p-1 px-2 text-[10px] font-black uppercase text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-100"
                                        type="button"
                                    >
                                        Edit
                                    </button>
                                    <button onClick={() => setCollectEmail(!collectEmail)} type="button">
                                        {collectEmail ? (
                                            <ToggleRight className="w-10 h-6 text-green-500" />
                                        ) : (
                                            <ToggleLeft className="w-10 h-6 text-gray-300" />
                                        )}
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <Phone className="w-5 h-5 text-green-500" />
                                    <span className="font-bold text-gray-900">Phone</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => openEditFieldModal({ id: 'quick-phone', name: 'phone', type: 'tel', ...quickFieldsConfig.phone })}
                                        className="p-1 px-2 text-[10px] font-black uppercase text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-100"
                                        type="button"
                                    >
                                        Edit
                                    </button>
                                    <button onClick={() => setCollectPhone(!collectPhone)} type="button">
                                        {collectPhone ? (
                                            <ToggleRight className="w-10 h-6 text-green-500" />
                                        ) : (
                                            <ToggleLeft className="w-10 h-6 text-gray-300" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-900">Custom Form Fields</h3>
                            <button
                                onClick={openAddFieldModal}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800"
                                type="button"
                            >
                                <Plus className="w-4 h-4" /> Add Field
                            </button>
                        </div>

                        <div className="space-y-3">
                            {fields.map(field => (
                                <div key={field.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-gray-500">
                                            {getFieldIcon(field.type)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-gray-900">{field.label}</span>
                                                {field.required && (
                                                    <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full">Required</span>
                                                )}
                                            </div>
                                            <span className="text-xs text-gray-500">{field.type} {field.placeholder && `• ${field.placeholder}`}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => openEditFieldModal(field)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" type="button">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => deleteField(field.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" type="button">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {fields.length === 0 && (
                            <div className="text-center py-12">
                                <FormInput className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                <p className="font-bold text-gray-900">No custom fields</p>
                                <p className="text-sm text-gray-500 mt-1">Add fields to collect more data</p>
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl border p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Form Preview</h3>
                        <div className="max-w-md mx-auto bg-gray-50 rounded-xl p-6 border-2 border-dashed border-gray-200">
                            <div className="space-y-4">
                                {normalizedLeadFields.map(field => (
                                    <div key={field.id} className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">{field.label}{field.required && ' *'}</label>
                                        {field.type === 'textarea' ? (
                                            <textarea
                                                disabled
                                                placeholder={field.placeholder}
                                                className="w-full px-4 py-3 bg-white border rounded-lg text-sm"
                                                rows={3}
                                            />
                                        ) : (
                                            <input
                                                type={field.type}
                                                disabled
                                                placeholder={field.placeholder}
                                                className="w-full px-4 py-3 bg-white border rounded-lg text-sm"
                                            />
                                        )}
                                    </div>
                                ))}
                                <button disabled className="w-full py-3 bg-gray-900 text-white rounded-lg font-bold text-sm mt-4" type="button">
                                    Submit
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'attributes' && (
                <div className="bg-white rounded-2xl border p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">User Attributes</h3>
                    <p className="text-sm text-gray-500 mb-6">These attributes are automatically collected from users</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                            { name: 'email', type: 'string', collected: collectEmail },
                            { name: 'name', type: 'string', collected: collectName },
                            { name: 'phone', type: 'string', collected: collectPhone },
                            { name: 'country', type: 'string', collected: true },
                            { name: 'city', type: 'string', collected: true },
                            { name: 'device', type: 'string', collected: true },
                            { name: 'browser', type: 'string', collected: true },
                            { name: 'first_seen', type: 'date', collected: true },
                            { name: 'last_seen', type: 'date', collected: true },
                            { name: 'total_messages', type: 'number', collected: true },
                            { name: 'total_conversations', type: 'number', collected: true },
                            { name: 'spent', type: 'number', collected: false }
                        ].map(attr => (
                            <div key={attr.name} className="p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-bold text-gray-900">{attr.name}</span>
                                    <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-[10px] font-bold rounded">{attr.type}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">Auto-collected</span>
                                    {attr.collected ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <XCircle className="w-4 h-4 text-gray-300" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'segments' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">User Segments</h3>
                            <p className="text-sm text-gray-500">Group users based on behavior and attributes</p>
                        </div>
                        <button onClick={() => openSegmentModal()} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800" type="button">
                            <Plus className="w-4 h-4" /> Create Segment
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {segments.map(segment => (
                            <div key={segment.id} className="bg-white rounded-2xl border p-6 hover:shadow-lg transition-shadow">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center text-white font-bold">
                                        {segment.count}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => openSegmentModal(segment)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" type="button">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => deleteSegment(segment.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" type="button">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <h4 className="font-bold text-gray-900">{segment.name}</h4>
                                <p className="text-sm text-gray-500 mt-1">{segment.criteria}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {isFieldModalOpen && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-gray-900">
                                {editingField ? 'Edit Field' : 'Add Field'}
                            </h2>
                            <button onClick={() => setIsFieldModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-2xl" type="button">
                                <XCircle className="w-6 h-6 text-gray-400" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="field-name" className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Field Name</label>
                                <input
                                    id="field-name"
                                    type="text"
                                    value={fieldForm.name}
                                    onChange={(e) => setFieldForm({ ...fieldForm, name: e.target.value })}
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-teal-600 outline-none mt-1"
                                    placeholder="e.g., company_name"
                                />
                            </div>
                            <div>
                                <label htmlFor="field-label" className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Label</label>
                                <input
                                    id="field-label"
                                    type="text"
                                    value={fieldForm.label}
                                    onChange={(e) => setFieldForm({ ...fieldForm, label: e.target.value })}
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-teal-600 outline-none mt-1"
                                    placeholder="e.g., Company Name"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="field-type" className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Type</label>
                                    <select
                                        id="field-type"
                                        value={fieldForm.type}
                                        onChange={(e) => setFieldForm({ ...fieldForm, type: e.target.value as FormField['type'] })}
                                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3 text-sm font-medium focus:ring-2 focus:ring-teal-600 outline-none mt-1"
                                    >
                                        <option value="text">Text</option>
                                        <option value="email">Email</option>
                                        <option value="tel">Phone</option>
                                        <option value="textarea">Textarea</option>
                                        <option value="select">Select</option>
                                        <option value="date">Date</option>
                                        <option value="checkbox">Checkbox</option>
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <label htmlFor="field-required" className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            id="field-required"
                                            type="checkbox"
                                            checked={fieldForm.required}
                                            onChange={(e) => setFieldForm({ ...fieldForm, required: e.target.checked })}
                                            className="w-5 h-5 rounded"
                                        />
                                        <span className="text-sm font-bold text-gray-700">Required</span>
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="field-placeholder" className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Placeholder</label>
                                <input
                                    id="field-placeholder"
                                    type="text"
                                    value={fieldForm.placeholder}
                                    onChange={(e) => setFieldForm({ ...fieldForm, placeholder: e.target.value })}
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-teal-600 outline-none mt-1"
                                    placeholder="Placeholder text..."
                                />
                            </div>
                            {fieldForm.type === 'select' && (
                                <div>
                                    <label htmlFor="field-options" className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Options (one per line)</label>
                                    <textarea
                                        id="field-options"
                                        value={fieldForm.options}
                                        onChange={(e) => setFieldForm({ ...fieldForm, options: e.target.value })}
                                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-teal-600 outline-none mt-1"
                                        rows={3}
                                        placeholder="Option 1&#10;Option 2&#10;Option 3"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button
                                onClick={() => setIsFieldModalOpen(false)}
                                className="px-6 py-3 font-bold text-sm text-gray-400 hover:text-gray-900"
                                type="button"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveField}
                                className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-gray-800"
                                type="button"
                            >
                                {editingField ? 'Update' : 'Add'} Field
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isSegmentModalOpen && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-gray-900">
                                {editingSegment ? 'Edit Segment' : 'Create Segment'}
                            </h2>
                            <button onClick={() => setIsSegmentModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-2xl" type="button">
                                <XCircle className="w-6 h-6 text-gray-400" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="segment-name" className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Segment Name</label>
                                <input
                                    id="segment-name"
                                    type="text"
                                    value={segmentForm.name}
                                    onChange={(e) => setSegmentForm({ ...segmentForm, name: e.target.value })}
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-teal-600 outline-none mt-1"
                                    placeholder="e.g., High Intent Users"
                                />
                            </div>
                            <div>
                                <label htmlFor="segment-criteria" className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Criteria</label>
                                <textarea
                                    id="segment-criteria"
                                    value={segmentForm.criteria}
                                    onChange={(e) => setSegmentForm({ ...segmentForm, criteria: e.target.value })}
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-teal-600 outline-none mt-1"
                                    rows={3}
                                    placeholder="e.g., Greeted > 3 times"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button
                                onClick={() => setIsSegmentModalOpen(false)}
                                className="px-6 py-3 font-bold text-sm text-gray-400 hover:text-gray-900"
                                type="button"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveSegment}
                                className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-gray-800"
                                type="button"
                            >
                                {editingSegment ? 'Update' : 'Create'} Segment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
