"use client";

import { useTranslations } from "next-intl";
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

interface ViewportRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PADDING = 8;
const TOOLTIP_GAP = 12;
const VIEWPORT_MARGIN = 16;

export function TourOverlay({
  step,
  stepIndex,
  totalSteps,
  onNext,
  onSkip,
}: TourOverlayProps) {
  const [rect, setRect] = useState<ViewportRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipPosition, setTooltipPosition] = useState<"below" | "above">(
    "below",
  );

  const measure = useCallback(() => {
    const el = document.querySelector(step.target);
    if (!el) return;
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });

    const spaceBelow = window.innerHeight - r.bottom;
    const spaceAbove = r.top;
    setTooltipPosition(
      spaceBelow > 200 || spaceBelow >= spaceAbove ? "below" : "above",
    );

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

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const t = useTranslations("onboarding");

  if (!rect) return null;

  const isLastStep = stepIndex === totalSteps - 1;

  const spotlightTop = rect.top - PADDING;
  const spotlightLeft = rect.left - PADDING;
  const spotlightWidth = rect.width + PADDING * 2;
  const spotlightHeight = rect.height + PADDING * 2;

  let tooltipTop: number;
  let tooltipTransform: string | undefined;

  if (tooltipPosition === "below") {
    tooltipTop = rect.top + rect.height + PADDING + TOOLTIP_GAP;
    tooltipTransform = undefined;

    const tooltipEstimatedHeight = 180;
    if (
      tooltipTop + tooltipEstimatedHeight >
      window.innerHeight - VIEWPORT_MARGIN
    ) {
      tooltipTop =
        window.innerHeight - VIEWPORT_MARGIN - tooltipEstimatedHeight;
    }
  } else {
    tooltipTop = rect.top - PADDING - TOOLTIP_GAP;
    tooltipTransform = "translateY(-100%)";

    if (tooltipTop < VIEWPORT_MARGIN) {
      tooltipTop = VIEWPORT_MARGIN;
      tooltipTransform = undefined;
    }
  }

  const overlay = (
    <div className="fixed inset-0 z-[9999]" aria-modal="true" role="dialog">
      {/* Backdrop using clip-path to cut out the spotlight */}
      <button
        type="button"
        aria-label="Close tour"
        className="fixed inset-0 bg-black/70 transition-opacity duration-300"
        onClick={onSkip}
        style={{
          clipPath: `polygon(
            0% 0%, 0% 100%, 100% 100%, 100% 0%,
            0% 0%,
            0% ${spotlightTop}px,
            ${spotlightLeft}px ${spotlightTop}px,
            ${spotlightLeft}px ${spotlightTop + spotlightHeight}px,
            ${spotlightLeft + spotlightWidth}px ${spotlightTop + spotlightHeight}px,
            ${spotlightLeft + spotlightWidth}px ${spotlightTop}px,
            0% ${spotlightTop}px
          )`,
        }}
      />

      {/* Spotlight ring */}
      <div
        className="fixed rounded-xl ring-2 ring-primary/60 pointer-events-none transition-all duration-300"
        style={{
          top: spotlightTop,
          left: spotlightLeft,
          width: spotlightWidth,
          height: spotlightHeight,
        }}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed left-4 right-4 max-w-sm mx-auto rounded-2xl border border-border bg-card/95 backdrop-blur-xl p-5 shadow-xl transition-all duration-300"
        style={{ top: tooltipTop, transform: tooltipTransform }}
      >
        <p className="text-xs font-semibold text-primary mb-1">
          {t("stepOf", { current: stepIndex + 1, total: totalSteps })}
        </p>
        <h3 className="text-base font-bold text-foreground mb-2">
          {t(step.titleKey)}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t(step.descriptionKey)}
        </p>

        <div className="flex items-center justify-between mt-4">
          <button
            type="button"
            onClick={onSkip}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
          >
            {t("skip")}
          </button>
          <button
            type="button"
            onClick={onNext}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 active:opacity-80"
          >
            {isLastStep ? t("done") : t("next")}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
