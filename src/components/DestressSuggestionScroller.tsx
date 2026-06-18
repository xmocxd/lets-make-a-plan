import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import type { DestressSuggestion } from '../types/plan';

const MAX_VISIBLE = 8;
const SWIPE_THRESHOLD_PX = 36;

function opacityForPosition(position: number): number {
  if (position === 0) return 1;
  return Math.max(0, 0.8 - (0.8 / (MAX_VISIBLE - 1)) * (position - 1));
}

function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(hover: none), (pointer: coarse)').matches
      : false,
  );

  useEffect(() => {
    const mq = window.matchMedia('(hover: none), (pointer: coarse)');
    const sync = () => setCoarse(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  return coarse;
}

interface DestressSuggestionScrollerProps {
  items: DestressSuggestion[];
}

export function DestressSuggestionScroller({ items }: DestressSuggestionScrollerProps) {
  const [focusIndex, setFocusIndex] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const touchHandled = useRef(false);
  const touchScrollEnabled = useCoarsePointer();

  const focusIndexClamped = useMemo(
    () => (items.length === 0 ? 0 : Math.min(focusIndex, items.length - 1)),
    [focusIndex, items.length],
  );

  const step = useCallback(
    (direction: 1 | -1) => {
      setFocusIndex((i) => {
        if (direction === 1) return Math.min(i + 1, items.length - 1);
        return Math.max(i - 1, 0);
      });
    },
    [items.length],
  );

  const stepNext = useCallback(() => step(1), [step]);
  const stepPrev = useCallback(() => step(-1), [step]);

  useEffect(() => {
    if (!touchScrollEnabled) return;
    const el = scrollerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
      touchHandled.current = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (touchStartY.current !== null) e.preventDefault();
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (touchStartY.current === null || touchHandled.current) return;
      const delta = touchStartY.current - e.changedTouches[0].clientY;
      touchStartY.current = null;
      if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
      touchHandled.current = true;
      // Swipe up → previous; swipe down → next
      step(delta > 0 ? -1 : 1);
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [touchScrollEnabled, step]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      stepPrev();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      stepNext();
    }
  };

  if (items.length === 0) {
    return <p className="hint">No calm activities yet.</p>;
  }

  const visible = items.slice(focusIndexClamped, focusIndexClamped + MAX_VISIBLE);
  const canGoNext = focusIndexClamped < items.length - 1;
  const canGoPrev = focusIndexClamped > 0;

  return (
    <div className="destress-scroller-wrap">
      {items.length > 1 && (
        <button
          type="button"
          className="destress-scroller-arrow"
          onClick={stepPrev}
          disabled={!canGoPrev}
          aria-label="Previous suggestion"
        >
          ↑
        </button>
      )}

      <div
        ref={scrollerRef}
        className={`destress-scroller${touchScrollEnabled ? ' touch-scroll' : ''}`}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="listbox"
        aria-label="Calm activity suggestions"
        aria-activedescendant={visible[0] ? `destress-item-${visible[0].id}` : undefined}
      >
        {visible.map((item, position) => (
          <p
            key={item.id}
            id={`destress-item-${item.id}`}
            className={`destress-scroller-item${position === 0 ? ' featured' : ''}`}
            style={{ opacity: opacityForPosition(position) }}
            role="option"
            aria-selected={position === 0}
          >
            {item.text}
          </p>
        ))}
      </div>

      {items.length > 1 && (
        <button
          type="button"
          className="destress-scroller-arrow"
          onClick={stepNext}
          disabled={!canGoNext}
          aria-label="Next suggestion"
        >
          ↓
        </button>
      )}
    </div>
  );
}
