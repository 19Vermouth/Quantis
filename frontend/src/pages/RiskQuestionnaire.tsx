import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getQuestionnaire, submitQuestionnaire } from '../services/api';
import type { QuestionnaireQuestion, QuestionnaireResponse } from '../types';
import { CheckCircle, AlertTriangle, Activity } from 'lucide-react';

export default function RiskQuestionnaire() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<QuestionnaireQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuestionnaireResponse | null>(null);

  useEffect(() => {
    loadQuestionnaire();
  }, []);

  const loadQuestionnaire = async () => {
    try {
      const data = await getQuestionnaire();
      setQuestions(data);
    } catch (e) {
      console.error('Failed to load questionnaire:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      alert('Please answer all questions');
      return;
    }
    setSubmitting(true);
    try {
      const response = await submitQuestionnaire(answers);
      setResult(response);
    } catch (e) {
      alert('Failed to submit questionnaire');
    } finally {
      setSubmitting(false);
    }
  };

  const getScoreSummary = () => {
    if (!result) return null;
    if (result.risk_profile === 'conservative') return { color: 'text-blue-400', desc: 'Conservative investors prioritize capital preservation over growth.' };
    if (result.risk_profile === 'moderate') return { color: 'text-yellow-400', desc: 'Moderate investors seek a balance between growth and stability.' };
    return { color: 'text-green-400', desc: 'Aggressive investors are comfortable with volatility for higher potential returns.' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-quantis-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-quantis-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (result) {
    const summary = getScoreSummary();
    return (
      <div className="min-h-screen bg-quantis-bg">
        <nav className="border-b border-quantis-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-4">
                <Link to="/" className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-quantis-accent rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-bold text-quantis-text">Quantis</span>
                </Link>
                <span className="text-quantis-text-muted">/ Risk Assessment</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-quantis-text-muted text-sm">{user?.email}</span>
                <button onClick={logout} className="text-quantis-text-muted hover:text-quantis-text text-sm">Logout</button>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="card p-8 text-center">
            <CheckCircle className={`w-16 h-16 mx-auto mb-4 ${summary?.color || 'text-quantis-accent'}`} />
            <h2 className="text-2xl font-bold text-quantis-text mb-2">Your Risk Profile</h2>
            <p className={`text-3xl font-bold mb-4 ${summary?.color}`}>
              {result.risk_profile.toUpperCase()}
            </p>
            <p className="text-quantis-text-muted mb-6">
              Score: {result.score} / 100
            </p>
            <p className="text-quantis-text-muted mb-6">
              {summary?.desc}
            </p>
            <div className="flex gap-4 justify-center">
              <button onClick={() => navigate('/portfolio')} className="btn-primary">
                Create Portfolio
              </button>
              <button onClick={() => { setResult(null); setAnswers({}); }} className="btn-secondary">
                Retake Assessment
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-quantis-bg">
      <nav className="border-b border-quantis-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-quantis-accent rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-quantis-text">Quantis</span>
              </Link>
              <span className="text-quantis-text-muted">/ Risk Questionnaire</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-quantis-text-muted text-sm">{user?.email}</span>
              <button onClick={logout} className="text-quantis-text-muted hover:text-quantis-text text-sm">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <AlertTriangle className="w-6 h-6 text-yellow-400" />
          <h1 className="text-2xl font-bold text-quantis-text">Risk Assessment Questionnaire</h1>
        </div>
        
        <div className="card p-4 mb-6">
          <p className="text-quantis-text-muted text-sm">
            This questionnaire helps us understand your risk tolerance and recommend suitable investments.
            Your responses are stored securely and used only for portfolio recommendations.
          </p>
        </div>
        
        <div className="space-y-6">
          {questions.map((q, idx) => (
            <div key={q.id} className="card p-6">
              <h3 className="text-lg font-semibold text-quantis-text mb-4">
                {idx + 1}. {q.question}
              </h3>
              <div className="space-y-2">
                {q.options.map((opt, i) => (
                  <label 
                    key={i}
                    className={`block p-3 rounded-lg border cursor-pointer transition-colors ${
                      answers[q.id.toString()] === opt.text
                        ? 'border-quantis-accent bg-quantis-accent/10'
                        : 'border-quantis-border hover:border-quantis-text-muted'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q${q.id}`}
                      value={opt.text}
                      checked={answers[q.id.toString()] === opt.text}
                      onChange={() => setAnswers({ ...answers, [q.id.toString()]: opt.text })}
                      className="sr-only"
                    />
                    <span className="text-quantis-text">{opt.text}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8">
          <button 
            onClick={handleSubmit}
            disabled={submitting || Object.keys(answers).length < questions.length}
            className="btn-primary w-full py-3 text-lg"
          >
            {submitting ? 'Submitting...' : 'Submit Assessment'}
          </button>
          {Object.keys(answers).length < questions.length && (
            <p className="text-center text-quantis-text-muted text-sm mt-2">
              Please answer all {questions.length} questions
            </p>
          )}
        </div>
      </div>
    </div>
  );
}