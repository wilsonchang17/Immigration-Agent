import React, { useState } from 'react';
import { Briefcase, Calendar, GraduationCap, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

// Types matching our Backend Pydantic models
type DegreeLevel = 'Bachelor' | 'Master' | 'PhD';
type OptStage = 'Pre' | 'Post' | 'STEM';

interface ValidationResult {
    status: 'valid' | 'invalid';
    data?: any;
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
                setValidation({ status: 'valid', data: data.data });
            } else {
                setValidation({ status: 'invalid', errors: data.detail.errors });
            }
        } catch (err) {
            setError('Failed to connect to the validation server. Is the backend running?');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-xl text-white">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/10">
                <div className="p-3 bg-blue-600/20 rounded-xl">
                    <Briefcase className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold">Immigration Intake</h2>
                    <p className="text-sm text-gray-400">Validate your OPT eligibility status</p>
                </div>
            </div>

            <div className="space-y-6">
                {/* Degree Level */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                        <GraduationCap className="w-4 h-4" /> Degree Level
                    </label>
                    <select
                        name="degree_level"
                        value={formData.degree_level}
                        onChange={handleChange}
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    >
                        <option value="Bachelor">Bachelor</option>
                        <option value="Master">Master</option>
                        <option value="PhD">PhD</option>
                    </select>
                </div>

                {/* STEM Degree Checkbox */}
                <div className="flex items-center gap-3 p-4 bg-black/20 rounded-lg border border-white/5">
                    <input
                        type="checkbox"
                        name="is_stem_degree"
                        checked={formData.is_stem_degree}
                        onChange={handleChange}
                        id="stem-check"
                        className="w-5 h-5 rounded border-gray-600 text-blue-500 focus:ring-blue-500 bg-gray-700"
                    />
                    <label htmlFor="stem-check" className="text-sm font-medium cursor-pointer flex-1">
                        This is a STEM Degree
                        <span className="block text-xs text-gray-500 mt-0.5">Required for STEM Extension</span>
                    </label>
                </div>

                {/* Program End Date */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                        <Calendar className="w-4 h-4" /> Program End Date
                    </label>
                    <input
                        type="date"
                        name="program_end_date"
                        value={formData.program_end_date}
                        onChange={handleChange}
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all [color-scheme:dark]"
                    />
                    <p className="text-xs text-gray-500">Must be within 1 year future or 60 days past.</p>
                </div>

                {/* OPT Stage */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">OPT Stage</label>
                    <div className="grid grid-cols-3 gap-2">
                        {(['Pre', 'Post', 'STEM'] as OptStage[]).map((stage) => (
                            <button
                                key={stage}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, opt_stage: stage }))}
                                className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${formData.opt_stage === stage
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                        : 'bg-black/20 text-gray-400 hover:bg-black/30'
                                    }`}
                            >
                                {stage === 'STEM' ? 'STEM Ext' : `${stage}-Completion`}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Unemployment Days */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">
                        Unemployment Days Used
                    </label>
                    <input
                        type="number"
                        name="unemployment_days_used"
                        value={formData.unemployment_days_used}
                        onChange={handleChange}
                        min="0"
                        max="150"
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>

                {/* Action Button */}
                <button
                    onClick={handleValidate}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        'Validate Eligibility'
                    )}
                </button>

                {/* Validation Feedback */}
                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        {error}
                    </div>
                )}

                {validation?.status === 'valid' && (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 flex items-start gap-2 animate-in fade-in slide-in-from-bottom-2">
                        <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold">Validation Successful!</p>
                            <p className="text-sm opacity-80 mt-1">Your data conforms to all immigration rules.</p>
                        </div>
                    </div>
                )}

                {validation?.status === 'invalid' && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 space-y-2 animate-in fade-in slide-in-from-bottom-2">
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
