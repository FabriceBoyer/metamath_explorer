import { Play, Pause, SkipBack, SkipForward, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PlaybackControlsProps {
  stepIndex: number;
  playing: boolean;
  atEnd: boolean;
  onReset: () => void;
  onPrev: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
  labels: {
    reset: string;
    prev: string;
    next: string;
    play: string;
    pause: string;
    stepOf: string;
  };
}

export function PlaybackControls({
  stepIndex,
  playing,
  atEnd,
  onReset,
  onPrev,
  onNext,
  onTogglePlay,
  labels,
}: PlaybackControlsProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={onReset}
          aria-label={labels.reset}
        >
          <RotateCcw />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onPrev}
          disabled={stepIndex === 0}
          aria-label={labels.prev}
        >
          <SkipBack />
        </Button>
        <Button
          size="icon"
          onClick={() => (atEnd ? onReset() : onTogglePlay())}
          aria-label={playing ? labels.pause : labels.play}
        >
          {playing ? <Pause /> : <Play />}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onNext}
          disabled={atEnd}
          aria-label={labels.next}
        >
          <SkipForward />
        </Button>
      </div>
      <span className="font-mono text-xs text-muted-foreground">
        {labels.stepOf}
      </span>
    </div>
  );
}
