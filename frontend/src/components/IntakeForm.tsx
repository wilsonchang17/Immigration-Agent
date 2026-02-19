import React, { useEffect, useRef, useState } from 'react';
import { Briefcase, Calendar, GraduationCap, AlertCircle, CheckCircle, Loader2, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';

type OptStage = 'Pre' | 'Post' | 'STEM';
type DegreeLevel = 'Bachelor' | 'Master' | 'PhD';

interface UserState {
    degree_level: DegreeLevel;
    is_stem_degree: boolean;
    program_end_date: string;
    opt_stage: OptStage;
    unemployment_days_used: number;
    opt_start_date?: string | null;
    i20_issuance_date?: string | null;
    application_submission_date?: string | null;
    has_one_year_enrollment?: boolean;
}

interface OptTimeline {
    earliest_filing: string;
    program_end: string;
    latest_filing: string;
    grace_period_end: string;
    reporting_period_6_month?: string | null;
    reporting_period_12_month?: string | null;
}

interface RagContextItem {
    text: string;
    metadata: {
        source: string;
        breadcrumbs: string;
        original_text: string;
    };
    distance: number;
}

interface ValidateSuccessResponse {
    status: 'valid';
    user_state: UserState;
    timeline: OptTimeline | null;
    timeline_message?: string | null;
    rag_warning?: string | null;
    rag_context: RagContextItem[];
}

interface ValidateErrorResponse {
    detail: {
        status: 'invalid';
        errors: { field: string; message: string }[];
    };
}

interface ValidationResult {
    status: 'valid' | 'invalid';
    data?: {
        user_state: UserState;
        timeline: OptTimeline | null;
        timeline_message?: string | null;
        rag_warning?: string | null;
        rag_context: RagContextItem[];
    };
    errors?: { field: string; message: string }[];
}

const IntakeForm: React.FC = () => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    const [formData, setFormData] = useState({
        degree_level: 'Master',
        is_stem_degree: false,
        program_end_date: '',
        opt_stage: 'Post',
        unemployment_days_used: '' as number | '',
    });

    const [validation, setValidation] = useState<ValidationResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });
    const datePickerRef = useRef<HTMLDivElement | null>(null);

    const formatDate = (isoDate: string) => {
        const [year, month, day] = isoDate.split('-');
        return `${month}/${day}/${year}`;
    };

    const isoToDate = (isoDate: string) => {
        if (!isoDate) return null;
        const [year, month, day] = isoDate.split('-').map(Number);
        return new Date(year, month - 1, day);
    };

    const dateToIso = (date: Date) => {
        const year = date.getFullYear();
        const month = `${date.getMonth() + 1}`.padStart(2, '0');
        const day = `${date.getDate()}`.padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getMonthGrid = (month: Date) => {
        const year = month.getFullYear();
        const monthIndex = month.getMonth();
        const firstDay = new Date(year, monthIndex, 1);
        const firstWeekday = firstDay.getDay();
        const gridStart = new Date(year, monthIndex, 1 - firstWeekday);

        return Array.from({ length: 42 }, (_, i) => {
            const date = new Date(gridStart);
            date.setDate(gridStart.getDate() + i);
            return {
                date,
                inCurrentMonth: date.getMonth() === monthIndex,
            };
        });
    };

    useEffect(() => {
        const onPointerDown = (event: MouseEvent) => {
            if (!datePickerRef.current) return;
            if (!datePickerRef.current.contains(event.target as Node)) {
                setIsDatePickerOpen(false);
            }
        };

        document.addEventListener('mousedown', onPointerDown);
        return () => document.removeEventListener('mousedown', onPointerDown);
    }, []);

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
            .sort((a, b) => a.date.localeCompare(b.date));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]:
                type === 'checkbox'
                    ? (e.target as HTMLInputElement).checked
                    : name === 'unemployment_days_used'
                      ? value === ''
                          ? ''
                          : Math.max(0, parseInt(value, 10) || 0)
                      : value,
        }));
        setValidation(null);
    };

    const handleValidate = async () => {
        setLoading(true);
        setError(null);
        setValidation(null);

        try {
            const payload = {
                ...formData,
                unemployment_days_used:
                    formData.unemployment_days_used === '' ? 0 : formData.unemployment_days_used,
            };

            const response = await fetch(`${apiBaseUrl}/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data: ValidateSuccessResponse | ValidateErrorResponse = await response.json();

            if (response.ok) {
                setValidation({ status: 'valid', data: data as ValidateSuccessResponse });
            } else {
                setValidation({ status: 'invalid', errors: (data as ValidateErrorResponse).detail.errors });
            }
        } catch (err) {
            setError('Failed to connect to the validation server. Is the backend running?');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mx-auto w-full max-w-3xl rounded-3xl border border-stone-300/70 bg-white/75 p-6 shadow-[0_20px_70px_-35px_rgba(87,83,78,0.35)] backdrop-blur-xl transition-colors duration-300 dark:border-stone-700 dark:bg-stone-900/75 dark:shadow-[0_20px_80px_-45px_rgba(0,0,0,0.55)] md:p-8">
            <div className="mb-8 flex items-center gap-3 border-b border-stone-300/80 pb-5 dark:border-stone-700/70">
                <div className="rounded-xl bg-stone-200 p-3 dark:bg-stone-700/60">
                    <Briefcase className="h-6 w-6 text-stone-700 dark:text-stone-200" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">Immigration Intake</h2>
                    <p className="text-sm text-stone-600 dark:text-stone-300">Validate your OPT eligibility status</p>
                </div>
            </div>

            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-stone-700 dark:text-stone-200">
                        <GraduationCap className="h-4 w-4" /> Degree Level
                    </label>
                    <select
                        name="degree_level"
                        value={formData.degree_level}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none ring-stone-400 transition focus:ring-2 dark:border-stone-600 dark:bg-stone-900/90 dark:text-stone-100"
                    >
                        <option value="Bachelor">Bachelor</option>
                        <option value="Master">Master</option>
                        <option value="PhD">PhD</option>
                    </select>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-stone-300 bg-stone-100/80 p-4 dark:border-stone-700 dark:bg-stone-800/70">
                    <input
                        type="checkbox"
                        name="is_stem_degree"
                        checked={formData.is_stem_degree}
                        onChange={handleChange}
                        id="stem-check"
                        className="h-5 w-5 rounded border-stone-400 bg-white text-sky-500 focus:ring-sky-500 dark:border-stone-600 dark:bg-stone-700"
                    />
                    <label htmlFor="stem-check" className="flex-1 cursor-pointer text-sm font-medium text-stone-800 dark:text-stone-100">
                        This is a STEM Degree
                        <span className="mt-0.5 block text-xs text-stone-500 dark:text-stone-300">Required for STEM Extension</span>
                    </label>
                </div>

                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-stone-700 dark:text-stone-200">
                        <Calendar className="h-4 w-4" /> Program End Date
                    </label>
                    <div ref={datePickerRef} className="relative">
                        <button
                            type="button"
                            onClick={() => {
                                const selected = isoToDate(formData.program_end_date);
                                if (selected) {
                                    setCalendarMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
                                }
                                setIsDatePickerOpen((prev) => !prev);
                            }}
                            className="flex w-full items-center justify-between rounded-xl border border-stone-300 bg-white px-4 py-3 text-left text-stone-900 outline-none ring-stone-400 transition focus:ring-2 dark:border-stone-600 dark:bg-stone-900/90 dark:text-stone-100"
                        >
                            <span className={formData.program_end_date ? '' : 'text-stone-400 dark:text-stone-500'}>
                                {formData.program_end_date ? formatDate(formData.program_end_date) : 'MM/DD/YYYY'}
                            </span>
                            <Calendar className="h-5 w-5 text-stone-600 dark:text-stone-300" />
                        </button>

                        {isDatePickerOpen && (
                            <div className="absolute z-30 mt-2 w-[320px] rounded-2xl border border-stone-300 bg-white p-4 shadow-xl dark:border-stone-700 dark:bg-stone-900">
                                <div className="mb-3 flex items-center justify-between">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCalendarMonth(
                                                new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1),
                                            )
                                        }
                                        className="rounded-lg border border-stone-300 p-1.5 text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">
                                        {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCalendarMonth(
                                                new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1),
                                            )
                                        }
                                        className="rounded-lg border border-stone-300 p-1.5 text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase text-stone-500 dark:text-stone-400">
                                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                                        <div key={day} className="py-1">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-7 gap-1">
                                    {getMonthGrid(calendarMonth).map(({ date, inCurrentMonth }) => {
                                        const iso = dateToIso(date);
                                        const isSelected = iso === formData.program_end_date;
                                        return (
                                            <button
                                                key={iso}
                                                type="button"
                                                onClick={() => {
                                                    setFormData((prev) => ({ ...prev, program_end_date: iso }));
                                                    setValidation(null);
                                                    setIsDatePickerOpen(false);
                                                }}
                                                className={`rounded-lg py-2 text-sm transition ${
                                                    isSelected
                                                        ? 'bg-stone-700 text-white dark:bg-stone-300 dark:text-stone-900'
                                                        : inCurrentMonth
                                                          ? 'text-stone-800 hover:bg-stone-100 dark:text-stone-100 dark:hover:bg-stone-800'
                                                          : 'text-stone-400 hover:bg-stone-100 dark:text-stone-600 dark:hover:bg-stone-800'
                                                }`}
                                            >
                                                {date.getDate()}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="mt-3 flex justify-between">
                                    <button
                                        type="button"
                                        className="text-xs font-medium text-stone-600 hover:text-stone-800 dark:text-stone-300 dark:hover:text-stone-100"
                                        onClick={() => {
                                            setFormData((prev) => ({ ...prev, program_end_date: '' }));
                                            setValidation(null);
                                        }}
                                    >
                                        Clear
                                    </button>
                                    <button
                                        type="button"
                                        className="text-xs font-medium text-stone-600 hover:text-stone-800 dark:text-stone-300 dark:hover:text-stone-100"
                                        onClick={() => {
                                            const today = new Date();
                                            const iso = dateToIso(today);
                                            setFormData((prev) => ({ ...prev, program_end_date: iso }));
                                            setValidation(null);
                                            setCalendarMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                                            setIsDatePickerOpen(false);
                                        }}
                                    >
                                        Today
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-300">Must be within 1 year future or 60 days past.</p>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-stone-700 dark:text-stone-200">OPT Stage</label>
                    <div className="grid grid-cols-3 gap-2">
                        {(['Pre', 'Post', 'STEM'] as OptStage[]).map((stage) => (
                            <button
                                key={stage}
                                type="button"
                                onClick={() => setFormData((prev) => ({ ...prev, opt_stage: stage }))}
                                className={`rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                                    formData.opt_stage === stage
                                        ? 'bg-stone-700 text-white shadow-lg shadow-stone-500/25 dark:bg-stone-500 dark:text-stone-950 dark:shadow-stone-900/40'
                                        : 'border border-stone-300 bg-stone-100 text-stone-700 hover:bg-stone-200 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800'
                                }`}
                            >
                                {stage === 'STEM' ? 'STEM Ext' : `${stage}-Completion`}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-stone-700 dark:text-stone-200">Unemployment Days Used</label>
                    <input
                        type="number"
                        name="unemployment_days_used"
                        value={formData.unemployment_days_used}
                        onChange={handleChange}
                        min="0"
                        max="150"
                        className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none ring-stone-400 transition focus:ring-2 dark:border-stone-600 dark:bg-stone-900/90 dark:text-stone-100"
                    />
                </div>

                <button
                    onClick={handleValidate}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-stone-700 to-stone-800 py-4 font-semibold text-white shadow-lg shadow-stone-600/30 transition-all hover:from-stone-600 hover:to-stone-700 disabled:cursor-not-allowed disabled:opacity-50 dark:from-stone-500 dark:to-stone-600 dark:text-stone-100"
                >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Validate Eligibility'}
                </button>

                {error && (
                    <div className="flex items-start gap-2 rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-200">
                        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                        {error}
                    </div>
                )}

                {validation?.status === 'valid' && (
                    <div className="space-y-5">
                        <div className="flex items-start gap-2 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
                            <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                            <div>
                                <p className="font-semibold">Validation Successful!</p>
                                <p className="mt-1 text-sm opacity-80">Your data conforms to all immigration rules.</p>
                            </div>
                        </div>

                        {validation.data?.timeline && (
                            <div className="rounded-2xl border border-stone-300/80 bg-gradient-to-b from-stone-100 to-stone-50 p-5 dark:border-stone-700 dark:from-stone-900/95 dark:to-stone-900/60">
                                <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">OPT Timeline</h3>
                                <div className="relative mt-4 space-y-4 pl-6">
                                    <div className="absolute bottom-2 left-[9px] top-2 w-px bg-stone-300 dark:bg-stone-700" />
                                    {getTimelineEvents(validation.data.timeline).map((event, idx) => (
                                        <div key={event.key} className="relative rounded-xl border border-stone-300 bg-white/85 p-3 shadow-sm dark:border-stone-700 dark:bg-stone-900/75">
                                            <span className="absolute -left-[22px] top-4 h-3.5 w-3.5 rounded-full border-2 border-white bg-stone-600 shadow dark:border-stone-950 dark:bg-stone-300" />
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <div>
                                                    <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">{event.label}</p>
                                                    <p className="text-xs text-stone-500 dark:text-stone-400">Step {idx + 1}</p>
                                                </div>
                                                <span className="rounded-full bg-stone-200 px-3 py-1 text-sm font-semibold text-stone-800 dark:bg-stone-700 dark:text-stone-100">
                                                    {formatDate(event.date)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {validation.data?.timeline_message && (
                            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200">
                                {validation.data.timeline_message}
                            </div>
                        )}

                        {validation.data?.rag_warning && (
                            <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-200">
                                {validation.data.rag_warning}
                            </div>
                        )}

                        {validation.data?.rag_context && validation.data.rag_context.length > 0 && (
                            <div className="mt-6 space-y-4 border-t border-slate-300 pt-6 dark:border-slate-700">
                                <h3 className="flex items-center gap-2 text-lg font-bold text-slate-700 dark:text-slate-200">
                                    <BookOpen className="h-5 w-5" />
                                    Regulatory Reference
                                </h3>
                                <div className="space-y-3">
                                    {validation.data.rag_context.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="rounded-xl border border-slate-300 bg-slate-50/80 p-4 transition-all hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/65 dark:hover:bg-slate-800"
                                        >
                                            <div className="mb-2 flex items-start justify-between">
                                                <span className="rounded bg-slate-200 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-slate-700 dark:bg-slate-700 dark:text-slate-100">
                                                    {item.metadata.source}
                                                </span>
                                                <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">Score: {(1 - item.distance).toFixed(2)}</span>
                                            </div>
                                            <p className="mb-2 font-mono text-xs italic text-slate-500 dark:text-slate-400">{item.metadata.breadcrumbs}</p>
                                            <p className="line-clamp-4 text-sm leading-relaxed text-slate-700 transition-all hover:line-clamp-none dark:text-slate-200">
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
                    <div className="space-y-2 rounded-xl border border-rose-300 bg-rose-50 p-4 text-rose-800 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-200">
                        <div className="flex items-center gap-2 font-semibold">
                            <AlertCircle className="h-5 w-5" />
                            Validation Failed
                        </div>
                        <ul className="list-inside list-disc space-y-1 pl-2 text-sm opacity-90">
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
