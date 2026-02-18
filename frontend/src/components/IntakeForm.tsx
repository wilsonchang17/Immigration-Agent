import React, { useState } from 'react';
import { Briefcase, Calendar, GraduationCap, AlertCircle, CheckCircle, Loader2, BookOpen } from 'lucide-react';

// Types matching our Backend Pydantic models
type OptStage = 'Pre' | 'Post' | 'STEM';

interface OptTimeline {
    earliest_filing: string;
    program_end: string;
    latest_filing: string;
    grace_period_end: string;
    reporting_period_6_month?: string | null;
    reporting_period_12_month?: string | null;
}

interface ValidationResult {
    status: 'valid' | 'invalid';
    data?: {
        user_state: any;
        timeline: OptTimeline | null;
        timeline_message?: string | null;
        rag_warning?: string | null;
        rag_context: {
            text: string;
            metadata: {
                source: string;
                breadcrumbs: string;
                original_text: string;
            };
            distance: number;
        }[];
    };
    errors?: { field: string; message: string }[];
}

const IntakeForm: React.FC = () => {
    const [formData, setFormData] = useState({
        degree_level: 'Master',
        is_stem_degree: false,
        program_end_date: '',
        opt_stage: 'Post',
        unemployment_days_used: 0,
    });

    const [validation, setValidation] = useState<ValidationResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const formatDate = (isoDate: string) =>
        new Date(isoDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });

    const getTimelineEvents = (timeline: OptTimeline) => {
        const labels: Record<string, string> = {
            earliest_filing: 'Earliest Filing Date',
            program_end: 'Program End Date',
            latest_filing: 'Latest Filing Date',
            grace_period_end: 'Grace Period End Date',
            reporting_period_6_month: '6-Month Reporting Due',
            reporting_period_12_month: '12-Month Reporting Due',
        };

        return Object.entries(timeline)
            .filter(([, value]) => Boolean(value))
            .map(([key, value]) => ({
                key,
                label: labels[key] || key,
                date: value as string,
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
                name === 'unemployment_days_used' ? parseInt(value) || 0 : value
        }));
        // Clear validation on change to encourage re-validation
        setValidation(null);
    };

    const handleValidate = async () => {
        setLoading(true);
        setError(null);
        setValidation(null);

        try {
            const response = await fetch('http://localhost:8000/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                // Now data contains { status, user_state, timeline }
                setValidation({ status: 'valid', data: data });
            } else {
                // Handling FastAPI's validation error structure
                setValidation({ status: 'invalid', errors: data.detail.errors });
            }
        } catch (err) {
            setError('Failed to connect to the validation server. Is the backend running?');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white/60 dark:bg-stone-800/60 backdrop-blur-lg border border-stone-300 dark:border-stone-700 rounded-2xl shadow-xl text-stone-800 dark:text-stone-100 transition-colors duration-300">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-stone-300 dark:border-stone-700">
                <div className="p-3 bg-stone-200 dark:bg-stone-700 rounded-xl">
                    <Briefcase className="w-6 h-6 text-stone-600 dark:text-stone-300" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold">Immigration Intake</h2>
                    <p className="text-sm text-stone-500 dark:text-stone-400">Validate your OPT eligibility status</p>
                </div>
            </div>

            <div className="space-y-6">
                {/* Degree Level */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-stone-600 dark:text-stone-300">
                        <GraduationCap className="w-4 h-4" /> Degree Level
                    </label>
                    <select
                        name="degree_level"
                        value={formData.degree_level}
                        onChange={handleChange}
                        className="w-full bg-stone-100 dark:bg-stone-900/50 border border-stone-300 dark:border-stone-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-stone-500 outline-none transition-all text-stone-800 dark:text-stone-100"
                    >
                        <option value="Bachelor">Bachelor</option>
                        <option value="Master">Master</option>
                        <option value="PhD">PhD</option>
                    </select>
                </div>

                {/* STEM Degree Checkbox */}
                <div className="flex items-center gap-3 p-4 bg-stone-100 dark:bg-stone-900/50 rounded-lg border border-stone-200 dark:border-stone-700">
                    <input
                        type="checkbox"
                        name="is_stem_degree"
                        checked={formData.is_stem_degree}
                        onChange={handleChange}
                        id="stem-check"
                        className="w-5 h-5 rounded border-stone-400 dark:border-stone-600 text-stone-600 focus:ring-stone-500 bg-stone-200 dark:bg-stone-700"
                    />
                    <label htmlFor="stem-check" className="text-sm font-medium cursor-pointer flex-1">
                        This is a STEM Degree
                        <span className="block text-xs text-stone-500 dark:text-stone-400 mt-0.5">Required for STEM Extension</span>
                    </label>
                </div>

                {/* Program End Date */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-stone-600 dark:text-stone-300">
                        <Calendar className="w-4 h-4" /> Program End Date
                    </label>
                    <input
                        type="date"
                        name="program_end_date"
                        value={formData.program_end_date}
                        onChange={handleChange}
                        className="w-full bg-stone-100 dark:bg-stone-900/50 border border-stone-300 dark:border-stone-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-stone-500 outline-none transition-all text-stone-800 dark:text-stone-100 dark:[color-scheme:dark]"
                    />
                    <p className="text-xs text-stone-500 dark:text-stone-400">Must be within 1 year future or 60 days past.</p>
                </div>

                {/* OPT Stage */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-600 dark:text-stone-300">OPT Stage</label>
                    <div className="grid grid-cols-3 gap-2">
                        {(['Pre', 'Post', 'STEM'] as OptStage[]).map((stage) => (
                            <button
                                key={stage}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, opt_stage: stage }))}
                                className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${formData.opt_stage === stage
                                    ? 'bg-stone-600 dark:bg-stone-500 text-white shadow-lg shadow-stone-400/30 dark:shadow-stone-900/50'
                                    : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-300 dark:hover:bg-stone-700 border border-stone-300 dark:border-stone-600'
                                    }`}
                            >
                                {stage === 'STEM' ? 'STEM Ext' : `${stage}-Completion`}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Unemployment Days */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-600 dark:text-stone-300">
                        Unemployment Days Used
                    </label>
                    <input
                        type="number"
                        name="unemployment_days_used"
                        value={formData.unemployment_days_used}
                        onChange={handleChange}
                        min="0"
                        max="150"
                        className="w-full bg-stone-100 dark:bg-stone-900/50 border border-stone-300 dark:border-stone-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-stone-500 outline-none transition-all text-stone-800 dark:text-stone-100"
                    />
                </div>

                {/* Action Button */}
                <button
                    onClick={handleValidate}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-stone-600 to-stone-700 hover:from-stone-500 hover:to-stone-600 dark:from-stone-500 dark:to-stone-600 dark:hover:from-stone-400 dark:hover:to-stone-500 text-white font-semibold py-4 rounded-xl shadow-lg shadow-stone-400/30 dark:shadow-stone-900/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        'Validate Eligibility'
                    )}
                </button>

                {/* Validation Feedback */}
                {error && (
                    <div className="p-4 bg-red-100 dark:bg-red-500/10 border border-red-300 dark:border-red-500/20 rounded-xl text-red-700 dark:text-red-400 text-sm flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        {error}
                    </div>
                )}

                {validation?.status === 'valid' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 flex items-start gap-2">
                            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold">Validation Successful!</p>
                                <p className="text-sm opacity-80 mt-1">Your data conforms to all immigration rules.</p>
                            </div>
                        </div>

                        {validation.data?.timeline && (
                            <div className="space-y-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-900/40 p-4">
                                <h3 className="text-base font-semibold text-stone-700 dark:text-stone-200">OPT Timeline</h3>
                                <div className="space-y-2">
                                    {getTimelineEvents(validation.data.timeline).map((event) => (
                                        <div
                                            key={event.key}
                                            className="flex items-center justify-between rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-2 text-sm"
                                        >
                                            <span className="text-stone-600 dark:text-stone-300">{event.label}</span>
                                            <span className="font-medium text-stone-800 dark:text-stone-100">{formatDate(event.date)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {validation.data?.timeline_message && (
                            <div className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-100 dark:bg-amber-900/20 p-4 text-sm text-amber-800 dark:text-amber-200">
                                {validation.data.timeline_message}
                            </div>
                        )}

                        {validation.data?.rag_warning && (
                            <div className="rounded-xl border border-yellow-300 dark:border-yellow-700 bg-yellow-100 dark:bg-yellow-900/20 p-4 text-sm text-yellow-800 dark:text-yellow-200">
                                {validation.data.rag_warning}
                            </div>
                        )}

                        {/* RAG Reference Section */}
                        {validation.data?.rag_context && validation.data.rag_context.length > 0 && (
                            <div className="mt-6 space-y-4 border-t border-stone-300 dark:border-white/10 pt-6">
                                <h3 className="flex items-center gap-2 text-lg font-bold text-blue-700 dark:text-blue-400">
                                    <BookOpen className="w-5 h-5" />
                                    Regulatory Reference / 法規引用
                                </h3>
                                <div className="space-y-3">
                                    {validation.data.rag_context.map((item, idx) => (
                                        <div key={idx} className="p-4 bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-xl hover:bg-stone-100 dark:hover:bg-white/10 transition-all">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[10px] font-mono bg-blue-600/20 dark:bg-blue-600/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded uppercase tracking-wider">
                                                    {item.metadata.source}
                                                </span>
                                                <span className="text-[10px] text-stone-500 font-mono">
                                                    Score: {(1 - item.distance).toFixed(2)}
                                                </span>
                                            </div>
                                            <p className="text-xs text-stone-500 dark:text-stone-400 font-mono mb-2 italic">
                                                {item.metadata.breadcrumbs}
                                            </p>
                                            <p className="text-sm text-stone-700 dark:text-stone-200 leading-relaxed line-clamp-4 hover:line-clamp-none transition-all">
                                                {item.metadata.original_text}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {validation?.status === 'invalid' && (
                    <div className="p-4 bg-red-100 dark:bg-red-500/10 border border-red-300 dark:border-red-500/20 rounded-xl text-red-700 dark:text-red-400 space-y-2 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-2 font-semibold">
                            <AlertCircle className="w-5 h-5" />
                            Validation Failed
                        </div>
                        <ul className="list-disc list-inside text-sm space-y-1 opacity-90 pl-2">
                            {validation.errors?.map((err, idx) => (
                                <li key={idx}>{err.message}</li>
                            ))}
                        </ul>
                    </div>
                )}

            </div>
        </div>
    );
};

export default IntakeForm;
