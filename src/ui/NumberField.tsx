import { useEffect, useId, useRef, useState, type FocusEvent } from 'react';
import { readNumberDraft } from './editorFeedback';

export interface NumberFieldProps {
  label: string;
  value: number;
  onCommit: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  id?: string;
  describedBy?: string;
  compact?: boolean;
  hideLabel?: boolean;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

export type NumberFieldEvaluation =
  | { action: 'noop'; nextDraft: string; problem: null }
  | { action: 'commit'; value: number; nextDraft: string; problem: null }
  | { action: 'revert'; nextDraft: string; problem: string };

export function evaluateNumberFieldCommit(
  draftText: string,
  badInput: boolean,
  currentValue: number,
  min: number,
  max: number,
): NumberFieldEvaluation {
  if (draftText === String(currentValue) && !badInput) {
    return { action: 'noop', nextDraft: String(currentValue), problem: null };
  }
  const result = readNumberDraft(draftText, badInput, min, max);
  if (result.kind !== 'value') {
    return {
      action: 'revert',
      nextDraft: String(currentValue),
      problem:
        result.kind === 'empty'
          ? `Boş bırakılamaz. ${min} ile ${max} arasında bir sayı girin; önceki değer korundu.`
          : `${min} ile ${max} arasında bir sayı girin. Önceki değer korundu.`,
    };
  }
  if (result.value === currentValue) {
    return { action: 'noop', nextDraft: String(currentValue), problem: null };
  }
  return {
    action: 'commit',
    value: result.value,
    nextDraft: String(currentValue),
    problem: null,
  };
}

export function shouldCancelNumberFieldEscape(
  draft: string,
  currentValue: number,
  badInput: boolean,
  problem: string | null,
): boolean {
  return draft !== String(currentValue) || badInput || Boolean(problem);
}

export function NumberField({
  label,
  value,
  onCommit,
  min = 0,
  max = 20000,
  step = 1,
  id,
  describedBy,
  compact = false,
  hideLabel = false,
  className,
  inputClassName,
  disabled = false,
  ariaLabel,
}: NumberFieldProps) {
  const [draft, setDraft] = useState(String(value));
  const [problem, setProblem] = useState<string | null>(null);
  const discardOnBlur = useRef(false);
  const problemId = useId();

  useEffect(() => {
    setDraft(String(value));
    setProblem(null);
  }, [value]);

  const commit = ({ currentTarget }: FocusEvent<HTMLInputElement>) => {
    if (discardOnBlur.current) {
      discardOnBlur.current = false;
      return;
    }
    const evaluation = evaluateNumberFieldCommit(
      currentTarget.value,
      currentTarget.validity.badInput,
      value,
      min,
      max,
    );
    setDraft(evaluation.nextDraft);
    setProblem(evaluation.problem);
    if (evaluation.action === 'commit') {
      onCommit(evaluation.value);
    }
  };

  const mergedDescribedBy = [describedBy, problem ? problemId : undefined]
    .filter(Boolean)
    .join(' ') || undefined;

  const baseInputClass = compact
    ? 'min-h-[28px] w-full rounded-md border bg-slate-900/95 px-2 py-1 font-mono text-xs text-slate-50 transition focus:border-sky-400 disabled:opacity-50'
    : 'studio-input font-mono disabled:opacity-50';
  const borderStateClass = problem ? 'border-rose-500/80' : 'border-slate-700';

  return (
    <label className={`flex flex-col gap-1 ${className ?? ''}`}>
      <span className={hideLabel ? 'sr-only' : 'block text-[11px] font-medium leading-snug text-slate-300'}>
        {label}
      </span>
      <input
        id={id}
        aria-label={ariaLabel ?? label}
        aria-invalid={problem ? true : undefined}
        aria-describedby={mergedDescribedBy}
        type="number"
        min={min}
        max={max}
        step={step}
        value={draft}
        disabled={disabled}
        className={`${baseInputClass} ${borderStateClass} ${inputClassName ?? ''}`}
        onChange={(e) => {
          setDraft(e.target.value);
          setProblem(null);
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            e.currentTarget.blur();
          } else if (
            e.key === 'Escape' &&
            shouldCancelNumberFieldEscape(draft, value, e.currentTarget.validity.badInput, problem)
          ) {
            e.preventDefault();
            e.stopPropagation();
            discardOnBlur.current = true;
            setDraft(String(value));
            setProblem(null);
            e.currentTarget.blur();
          }
        }}
      />
      {problem && (
        <span id={problemId} role="alert" className="block text-[11px] leading-snug text-rose-200">
          {problem}
        </span>
      )}
    </label>
  );
}
