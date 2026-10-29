import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  Loader2,
  Sparkles,
  Tag,
  AlignLeft,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { generateAiDescription } from '../api/taskApi';

export default function TaskForm({ onAddTask, isSubmitting }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [error, setError] = useState('');

  // Practical 13: AI State Management
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [isAiFallback, setIsAiFallback] = useState(false);
  const [aiSuggested, setAiSuggested] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Rate-limiting cooldown countdown (max 1 AI request per minute)
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // Practical 13: Trigger AI description generation via Express backend
  const handleGenerateDescription = async () => {
    if (!title.trim()) {
      setError('Please enter a task title first before generating an AI description.');
      return;
    }

    if (cooldown > 0) {
      setIsAiFallback(true);
      setAiMessage(`Rate limit active: Please wait ${cooldown}s before requesting AI description again.`);
      return;
    }

    setError('');
    setAiMessage('');
    setIsAiFallback(false);
    setIsGeneratingAi(true);

    try {
      const result = await generateAiDescription(title.trim());

      if (result.rateLimited) {
        setIsAiFallback(true);
        setAiMessage(
          result.message || 'Rate limit: Max 1 AI request per task per minute.'
        );
        setCooldown(60);
      } else if (result.fallback) {
        // Graceful degradation when AI fails or key is missing/invalid
        setIsAiFallback(true);
        setAiSuggested(false);
        setAiMessage(
          result.message ||
            'AI service temporarily unavailable (graceful fallback). You can write the description manually.'
        );
      } else if (result.description) {
        // Editable suggestion: populated directly into state so user can accept or modify
        setDescription(result.description);
        setAiSuggested(true);
        setIsAiFallback(false);
        setAiMessage('');
        // Enforce 60-second client-side cooldown per task
        setCooldown(60);
      }
    } catch (err) {
      // Ensure failure never crashes the application
      setIsAiFallback(true);
      setAiSuggested(false);
      setAiMessage('Failed to connect to AI service. Please enter description manually.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title cannot be empty.');
      return;
    }

    setError('');
    const success = await onAddTask({
      title: title.trim(),
      description: description.trim(),
      priority,
      completed: false,
    });

    if (success) {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setAiSuggested(false);
      setAiMessage('');
      setIsAiFallback(false);
    }
  };

  return (
    <div className="task-form-card">
      <div className="form-header">
        <div className="form-title-wrap">
          <Sparkles className="form-icon" size={18} />
          <h2>Create New Task</h2>
        </div>
        <span className="form-hint">Practical 13 • AI Powered</span>
      </div>

      <form onSubmit={handleSubmit} className="task-form">
        {error && <div className="form-error-banner">{error}</div>}

        <div className="form-group">
          <label htmlFor="task-title" className="form-label">
            Task Title <span className="required-star">*</span>
          </label>
          <input
            id="task-title"
            type="text"
            className="form-input"
            placeholder="e.g., Integrate OpenAI / Gemini API into Express backend..."
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError('');
            }}
            disabled={isSubmitting}
            maxLength={120}
          />
        </div>

        <div className="form-group">
          <div className="desc-label-row">
            <label htmlFor="task-desc" className="form-label">
              <AlignLeft size={14} style={{ display: 'inline', marginRight: '4px' }} />
              Description (Optional)
            </label>

            {/* Practical 13 Step 4: 'Generate description' Button */}
            <button
              type="button"
              className="btn-ai-generate"
              onClick={handleGenerateDescription}
              disabled={isGeneratingAi || isSubmitting || !title.trim() || cooldown > 0}
              title={
                !title.trim()
                  ? 'Enter a task title to generate description'
                  : cooldown > 0
                  ? `Please wait ${cooldown}s (rate limit: 1 request/min)`
                  : 'Auto-generate description with AI (OpenAI/Gemini)'
              }
            >
              {isGeneratingAi ? (
                <>
                  <Loader2 className="spinner" size={13} />
                  <span>Generating description...</span>
                </>
              ) : cooldown > 0 ? (
                <>
                  <Sparkles size={13} />
                  <span>Cooldown ({cooldown}s)</span>
                </>
              ) : (
                <>
                  <Sparkles size={13} />
                  <span>Generate description</span>
                </>
              )}
            </button>
          </div>

          {/* Editable suggestion input (Step 5) */}
          <textarea
            id="task-desc"
            className="form-textarea"
            placeholder="Add detailed task notes or click 'Generate description' for an AI suggestion..."
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSubmitting}
          />

          {/* Practical 13: Clear disclaimer in UI that suggestion is AI-generated and editable */}
          {aiSuggested && !isAiFallback && (
            <div className="ai-disclaimer-banner">
              <Sparkles size={15} className="ai-disclaimer-icon" />
              <div className="ai-disclaimer-text">
                <strong>AI-Generated Suggestion:</strong> This description was generated by AI. Please review and modify it to ensure accuracy before saving.
              </div>
            </div>
          )}

          {/* Practical 13: Graceful degradation fallback notification if AI call fails or times out */}
          {isAiFallback && aiMessage && (
            <div className="ai-fallback-banner">
              <AlertCircle size={15} className="ai-fallback-icon" />
              <div className="ai-fallback-text">{aiMessage}</div>
            </div>
          )}
        </div>

        <div className="form-row-priority">
          <label className="form-label">
            <Tag size={14} style={{ display: 'inline', marginRight: '4px' }} />
            Priority Level
          </label>
          <div className="priority-chips">
            {['low', 'medium', 'high'].map((lvl) => (
              <button
                type="button"
                key={lvl}
                className={`priority-chip ${lvl} ${priority === lvl ? 'selected' : ''}`}
                onClick={() => setPriority(lvl)}
                disabled={isSubmitting}
              >
                <span className="dot"></span>
                {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="btn-submit-task"
          disabled={isSubmitting || !title.trim()}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="spinner" size={18} />
              <span>Saving Task...</span>
            </>
          ) : (
            <>
              <PlusCircle size={18} />
              <span>Add Task</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
