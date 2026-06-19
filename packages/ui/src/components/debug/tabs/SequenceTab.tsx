import { useInterview } from "@/interview/InterviewContext";
import type { AttributeValues } from "@imminently/interview-sdk";
import { Download, Loader2, Upload, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface ReplayScreen {
  id?: string;
  title?: string;
}

interface ReplayQuestion {
  asking: { screen: ReplayScreen };
  response?: { data?: AttributeValues };
}

interface ReplayTimeline {
  questions?: ReplayQuestion[];
  /** Legacy field — older exports may use `timeline` instead of `questions`. */
  timeline?: ReplayQuestion[];
}

const resolveQuestions = (t: ReplayTimeline): ReplayQuestion[] =>
  t.questions ?? t.timeline ?? [];

// Module-level so state survives re-mounts (same pattern as panelMemory).
const sequenceMemory = {
  timeline: null as ReplayTimeline | null,
  questionIndex: 0,
};

const SectionHeader = ({
  label,
  action,
}: {
  label: string;
  action?: React.ReactNode;
}): React.ReactElement => (
  <div className="flex items-center justify-between">
    <h3 className="font-semibold text-xs uppercase tracking-wide text-gray-500">{label}</h3>
    {action}
  </div>
);

export const SequenceTab = (): React.ReactElement => {
  const { manager, session } = useInterview();
  const [loadedTimeline, setLoadedTimeline] = useState<ReplayTimeline | null>(
    () => sequenceMemory.timeline,
  );
  const [questionIndex, setQuestionIndex] = useState(() => sequenceMemory.questionIndex);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  // When true, triggers manager.reset() in an effect so React commits state first.
  const [pendingReset, setPendingReset] = useState(false);

  // Deferred reset: runs after React commits the state update that set pendingReset.
  useEffect(() => {
    if (!pendingReset) return;
    setPendingReset(false);
    manager.reset().catch((err) => {
      console.error("Reset failed:", err);
      setError("Failed to reset session.");
    });
  }, [pendingReset, manager]);

  const loadFile = useCallback((file: File): void => {
    const reader = new FileReader();
    reader.onload = (ev): void => {
      try {
        const data = JSON.parse(ev.target?.result as string) as ReplayTimeline;
        sequenceMemory.timeline = data;
        sequenceMemory.questionIndex = 0;
        setLoadedTimeline(data);
        setQuestionIndex(0);
        setError(null);
        setPendingReset(true);
      } catch {
        setError("Failed to parse sequence file.");
      }
    };
    reader.readAsText(file);
  }, []);

  const handleDropzoneDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>): void => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) loadFile(file);
    },
    [loadFile],
  );

  const handleDropzoneClick = useCallback((): void => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e): void => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) loadFile(file);
    };
    input.click();
  }, [loadFile]);

  const handleClear = (): void => {
    sequenceMemory.timeline = null;
    sequenceMemory.questionIndex = 0;
    setLoadedTimeline(null);
    setQuestionIndex(0);
    setError(null);
  };

  const questions = loadedTimeline ? resolveQuestions(loadedTimeline) : [];
  const currentQuestion = questions[questionIndex];
  const nextQuestion = questions[questionIndex + 1];
  const isLastQuestion = questions.length > 0 && questionIndex === questions.length - 1;

  const expectedScreen = currentQuestion?.asking.screen;
  const actualScreenTitle = session?.screen?.title;
  const screenMismatch =
    !submitting &&
    loadedTimeline !== null &&
    !!expectedScreen &&
    (expectedScreen.id
      ? expectedScreen.id !== session?.screen?.id
      : expectedScreen.title !== actualScreenTitle);

  const handleNext = async (): Promise<void> => {
    if (!currentQuestion) return;
    setSubmitting(true);
    setError(null);
    const next = questionIndex + 1;
    sequenceMemory.questionIndex = next;
    setQuestionIndex(next);
    try {
      await manager.next(currentQuestion.response?.data ?? {});
    } catch (err) {
      console.error("Replay next failed:", err);
      sequenceMemory.questionIndex = questionIndex;
      setQuestionIndex(questionIndex);
      setError("Failed to advance to next step.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async (): Promise<void> => {
    setSubmitting(true);
    setError(null);
    try {
      await manager.reset();
      sequenceMemory.questionIndex = 0;
      setQuestionIndex(0);
    } catch (err) {
      console.error("Reset failed:", err);
      setError("Failed to reset session.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportSequence = async (): Promise<void> => {
    setError(null);
    try {
      await manager.downloadTimeline();
    } catch (err) {
      console.error("Export sequence failed:", err);
      setError("Failed to export sequence.");
    }
  };

  const handleExportPlaywright = async (): Promise<void> => {
    setError(null);
    try {
      await manager.downloadPlaywrightTest();
    } catch (err) {
      console.error("Export Playwright failed:", err);
      setError("Failed to export Playwright test.");
    }
  };

  return (
    <div className="p-4 flex flex-col gap-4 text-sm">
      {/* Export */}
      <section className="flex flex-col gap-2">
        <SectionHeader
          label="Export"
          action={
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={handleExportSequence}
                disabled={!session}
                className="flex items-center gap-1.5 px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download size={11} />
                Sequence
              </button>
              <button
                type="button"
                onClick={handleExportPlaywright}
                disabled={!session}
                className="flex items-center gap-1.5 px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download size={11} />
                Playwright
              </button>
            </div>
          }
        />
      </section>

      <hr className="border-gray-200" />

      {/* Replay */}
      <section className="flex flex-col gap-3">
        <SectionHeader
          label="Replay"
          action={
            loadedTimeline ? (
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-1 px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50"
              >
                <X size={11} />
                Clear
              </button>
            ) : undefined
          }
        />

        {!loadedTimeline ? (
          <div
            role="button"
            tabIndex={0}
            onClick={handleDropzoneClick}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleDropzoneClick(); }}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDropzoneDrop}
            className={`flex flex-col items-center justify-center gap-1.5 rounded border-2 border-dashed px-4 py-5 text-xs text-center cursor-pointer transition-colors select-none
              ${dragging
                ? "border-gray-500 bg-gray-100 text-gray-700"
                : "border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-500 hover:bg-gray-50"
              }`}
          >
            <Upload size={16} />
            <span>Drop a sequence file or click to browse</span>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Step {questions.length > 0 ? questionIndex + 1 : 0} / {questions.length}</span>
              {submitting && <Loader2 size={12} className="animate-spin" />}
            </div>

            {/* Always-visible screen status */}
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs">
              <dt className="text-gray-500">Expected</dt>
              <dd className="font-mono truncate">{expectedScreen?.title ?? "—"}</dd>
              <dt className={screenMismatch ? "text-red-600 font-semibold" : "text-gray-500"}>Actual</dt>
              <dd className={`font-mono truncate ${screenMismatch ? "text-red-600 font-semibold" : ""}`}>
                {actualScreenTitle ?? "—"}
              </dd>
            </dl>

            {screenMismatch && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">
                Screen mismatch — the interview may have diverged from the sequence.
              </p>
            )}

            {!isLastQuestion && nextQuestion && (
              <p className="text-xs text-gray-500">
                Next: {nextQuestion.asking.screen.title ?? "—"}
              </p>
            )}
            {isLastQuestion && (
              <p className="text-xs text-gray-500 italic">Last step</p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleNext}
                disabled={submitting || !session || !currentQuestion}
                className="flex-1 px-3 py-1.5 text-xs rounded bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={submitting || !session}
                className="flex-1 px-3 py-1.5 text-xs rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Reset
              </button>
            </div>
          </>
        )}

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</p>
        )}
      </section>
    </div>
  );
};
