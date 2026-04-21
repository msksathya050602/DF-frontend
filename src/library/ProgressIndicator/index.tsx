import './progressIndicator.scss';

import React from 'react';

type ProgressIndicatorProps = {
  /** Shown under the bar (e.g. “Saving…”). */
  label?: string;
  className?: string;
  /** Smaller bar and text. */
  compact?: boolean;
};

/**
 * Indeterminate horizontal progress — use while waiting on async work (no known %).
 */
export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  label,
  className = '',
  compact = false,
}) => {
  return (
    <div
      className={`progress-indicator ${compact ? 'progress-indicator--compact' : ''} ${className}`.trim()}
      role="progressbar"
      aria-busy="true"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={label || 'Loading'}
    >
      <div className="progress-indicator-track">
        <div className="progress-indicator-bar" aria-hidden />
      </div>
      {label ? <span className="progress-indicator-label">{label}</span> : null}
    </div>
  );
};
