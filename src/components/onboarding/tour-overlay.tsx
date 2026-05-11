"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { TourStep } from "@/lib/onboarding-steps";

interface TourOverlayProps {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PADDING = 8;
const TOOLTIP_GAP = 12;

export function TourOverlay({
  step,
  stepIndex,
  totalSteps,
  onNext,
  onSkip,
}: TourOverlayProps) {
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipPosition, setTooltipPosition] = useState<"below" | "above">(
    "below",
  );

  const measure = useCallback(() => {
    const el = document.querySelector(step.target);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setTargetRect({
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      height: rect.height,
    });

    const spaceBelow = window.innerHeight - rect.bottom;
    setTooltipPosition(spaceBelow > 200 ? "below" : "above");

    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [step.target]);

  useEffect(() => {
    const timer = setTimeout(measure, 100);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [measure]);

  if (!targetRect) return null;

  const isLastStep = stepIndex === totalSteps - 1;

  const spotlightStyle = {
    top: targetRect.top - PADDING,
    left: targetRect.left - PADDING,
    width: targetRect.width + PADDING * 2,
    height: targetRect.height + PADDING * 2,
  };

  const tooltipTop =
    tooltipPosition === "below"
      ? targetRect.top + targetRect.height + PADDING + TOOLTIP_GAP
      : targetRect.top - PADDING - TOOLTIP_GAP;

  const overlay = (
    <div className="fixed inset-0 z-[9999]" aria-modal="true" role="dialog">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close tour"
        className="absolute inset-0 bg-black/70 transition-opacity duration-300"
        onClick={onSkip}
      />

      {/* Spotlight cutout */}
      <div
        className="absolute rounded-xl ring-2 ring-primary/60 transition-all duration-300 pointer-events-none"
        style={{
          ...spotlightStyle,
          boxShadow: "0 0 0 9999px rgba(0,0,0,0.7)",
        }}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="absolute left-4 right-4 max-w-sm mx-auto rounded-2xl border border-white/10 bg-card/95 backdrop-blur-xl p-5 shadow-xl transition-all duration-300"
        style={{
          top: tooltipTop,
          transform:
            tooltipPosition === "above" ? "translateY(-100%)" : undefined,
        }}
      >
        <p className="text-xs font-semibold text-primary mb-1">
          {stepIndex + 1} of {totalSteps}
        </p>
        <h3 className="text-base font-bold text-foreground mb-2">
          {step.title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {step.description}
        </p>

        <div className="flex items-center justify-between mt-4">
          <button
            type="button"
            onClick={onSkip}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={onNext}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 active:opacity-80"
          >
            {isLastStep ? "Done" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
