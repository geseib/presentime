import { useState, useEffect } from 'react';
import type { ThemeConfig } from '../components/presenter/themeConfig';

interface ResponsiveSizes {
  overallSize: number;
  sectionSize: number;
  overallStroke: number;
  sectionStroke: number;
}

const MIN_OVERALL = 150;
const MIN_SECTION = 120;
const MIN_OVERALL_STROKE = 3;
const MIN_SECTION_STROKE = 2;

function computeSizes(config: ThemeConfig): ResponsiveSizes {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Determine sidebar width at this viewport
  let sidebarWidth = 0;
  if (vw >= 1200) sidebarWidth = 380;
  else if (vw >= 900) sidebarWidth = 300;

  const availableWidth = vw - sidebarWidth;
  const availableHeight = vh;

  // Force stacked layout below 600px regardless of theme
  const isStacked = vw < 600 || !config.timersHorizontal;

  let overallSize: number;
  let sectionSize: number;

  if (isStacked) {
    // Stacked: overall gets 55% of vertical budget, section gets 38%
    // Also constrained by horizontal space (with padding)
    const horizontalBudget = availableWidth - 48; // padding
    const verticalBudget = availableHeight - 160; // controls + padding

    overallSize = Math.min(
      config.overallSize,
      verticalBudget * 0.55,
      horizontalBudget,
    );
    sectionSize = Math.min(
      config.sectionSize,
      verticalBudget * 0.38,
      horizontalBudget,
    );
  } else {
    // Side-by-side: each ring gets half the horizontal space minus gap
    const gap = 64; // 4rem gap
    const halfWidth = (availableWidth - gap - 48) / 2; // padding
    const verticalBudget = availableHeight - 160;

    overallSize = Math.min(config.overallSize, halfWidth, verticalBudget * 0.7);
    sectionSize = Math.min(config.sectionSize, halfWidth, verticalBudget * 0.7);
  }

  // Never scale up past theme config
  overallSize = Math.min(overallSize, config.overallSize);
  sectionSize = Math.min(sectionSize, config.sectionSize);

  // Enforce minimums
  overallSize = Math.max(MIN_OVERALL, Math.floor(overallSize));
  sectionSize = Math.max(MIN_SECTION, Math.floor(sectionSize));

  // Scale strokes proportionally
  const overallRatio = overallSize / config.overallSize;
  const sectionRatio = sectionSize / config.sectionSize;

  const overallStroke = Math.max(
    MIN_OVERALL_STROKE,
    Math.round(config.overallStroke * overallRatio),
  );
  const sectionStroke = Math.max(
    MIN_SECTION_STROKE,
    Math.round(config.sectionStroke * sectionRatio),
  );

  return { overallSize, sectionSize, overallStroke, sectionStroke };
}

export function useResponsiveSize(config: ThemeConfig): ResponsiveSizes {
  const [sizes, setSizes] = useState(() => computeSizes(config));

  useEffect(() => {
    const handleResize = () => setSizes(computeSizes(config));

    // Recompute on config change
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [config]);

  return sizes;
}
