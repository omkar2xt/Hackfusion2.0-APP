import React, { useEffect, useState } from 'react';
import { Award, CheckCircle, ChevronRight, HelpCircle, Sparkles, X } from 'lucide-react';
import Header from '../components/Header';
import { api } from '../services/api';
import type { LearningModule, LearningProgress, QuizSubmissionResponse } from '../types';

export const CoachPage: React.FC = () => {
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [progress, setProgress] = useState<LearningProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState<LearningModule | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizSubmissionResponse | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [modulesData, progressData] = await Promise.all([
        api.getLearningModules(),
        api.getLearningProgress(),
      ]);
      setModules(modulesData);
      setProgress(progressData);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleOpenQuiz = (module: LearningModule) => {
    setActiveModule(module);
    setSelectedAnswers({});
    setQuizResult(null);
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeModule) return;
    setSubmitting(true);
    try {
      const result = await api.submitQuiz({
        module_slug: activeModule.slug,
        answers: selectedAnswers,
      });
      setQuizResult(result);
      fetchData(); // Refresh score & badges
    } catch (err: any) {
      alert(err.message || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-100 pb-24">
      <Header
        title="Adaptive Safety Coach"
        subtitle="Scenario quizzes & cybersecurity posture"
        showBack
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">

      {/* Progress & Badges Card */}
      {progress && (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800/80 border border-slate-700/60 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Security Posture Level</span>
              <div className="text-2xl font-bold text-teal-300 mt-1">{progress.security_level}</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-2xl text-teal-400 text-center min-w-[90px]">
                <div className="text-2xl font-bold">{progress.total_score}</div>
                <div className="text-xs text-teal-300/80">Total Points</div>
              </div>
            </div>
          </div>

          {progress.badges && progress.badges.length > 0 && (
            <div className="pt-4 border-t border-slate-700/60">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 block mb-2.5">Earned Badges</span>
              <div className="flex flex-wrap gap-2.5">
                {progress.badges.map((b, idx) => (
                  <span
                    key={idx}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold shadow-sm"
                  >
                    <Award className="w-4 h-4 text-amber-400" />
                    {b}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modules List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-200">Recommended Learning & Training Modules</h2>
          <span className="text-xs text-slate-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
            {modules.length} Modules Available
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
            Loading learning modules...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {modules.map((mod) => {
              const isCompleted = progress?.completed_module_slugs.includes(mod.slug);
              return (
                <div
                  key={mod.id}
                  className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-teal-500/40 transition space-y-3.5 shadow-md flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-sm text-slate-100">{mod.title}</span>
                      {isCompleted && (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30 shrink-0 font-medium">
                          <CheckCircle className="w-3 h-3" /> Completed
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{mod.description}</p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                      <span className="capitalize">{mod.difficulty} • {mod.read_time_minutes} min read</span>
                      <span className="text-amber-400 font-semibold">+{mod.points_reward} pts</span>
                    </div>

                    <button
                      onClick={() => handleOpenQuiz(mod)}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 hover:text-white text-teal-300 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow"
                    >
                      <span>{isCompleted ? 'Retake Module Quiz' : 'Start Training & Quiz'}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quiz Modal */}
      {activeModule && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-slate-100">{activeModule.title}</h3>
                <span className="text-[11px] text-slate-400">Answer scenario questions to earn badge</span>
              </div>
              <button
                onClick={() => setActiveModule(null)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Micro lesson text */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1.5">
              <span className="font-bold text-teal-400 text-[11px] block uppercase tracking-wider">Campus Insight</span>
              <p>{activeModule.content_markdown}</p>
            </div>

            {/* Quiz Questions */}
            <div className="space-y-4 pt-2">
              {activeModule.questions.map((q, qidx) => (
                <div key={q.id} className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-700/50 space-y-2">
                  <div className="flex items-start gap-2 text-xs font-semibold text-slate-200">
                    <HelpCircle className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                    <span>{qidx + 1}. {q.question}</span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {q.options.map((opt, oidx) => {
                      const isSelected = selectedAnswers[q.id] === oidx;
                      return (
                        <button
                          key={oidx}
                          type="button"
                          onClick={() => handleSelectOption(q.id, oidx)}
                          className={`w-full text-left p-2.5 rounded-lg text-xs transition border ${
                            isSelected
                              ? 'bg-teal-500/20 border-teal-500/60 text-teal-200 font-semibold'
                              : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Quiz Result View */}
            {quizResult && (
              <div
                className={`p-4 rounded-xl border space-y-2 text-xs ${
                  quizResult.passed
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                    : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span>Score: {quizResult.score}%</span>
                  <span>{quizResult.correct_answers} / {quizResult.total_questions} Correct</span>
                </div>
                <p>{quizResult.feedback}</p>
                {quizResult.badge_awarded && (
                  <div className="flex items-center gap-1.5 font-bold text-amber-300 pt-1">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Unlocked Badge: {quizResult.badge_awarded}!</span>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleSubmitQuiz}
              disabled={submitting || Object.keys(selectedAnswers).length < activeModule.questions.length}
              className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? 'Evaluating Answers...' : 'Submit Quiz & Check Posture'}
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

