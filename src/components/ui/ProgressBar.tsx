interface ProgressBarProps {
  percentage: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ProgressBar({ percentage, showLabel = true, size = 'md', className = '' }: ProgressBarProps) {
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);

  const getColor = (percent: number) => {
    if (percent < 30) return 'bg-red-500';
    if (percent < 60) return 'bg-yellow-500';
    if (percent < 90) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getTextColor = (percent: number) => {
    if (percent < 30) return 'text-red-700';
    if (percent < 60) return 'text-yellow-700';
    if (percent < 90) return 'text-blue-700';
    return 'text-green-700';
  };

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Completion</span>
          <span className={`text-sm font-semibold ${getTextColor(clampedPercentage)}`}>
            {clampedPercentage}%
          </span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${heightClasses[size]}`}>
        <div
          className={`${heightClasses[size]} ${getColor(clampedPercentage)} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>
    </div>
  );
}

interface SectionProgressProps {
  percentage: number;
  className?: string;
}

export function SectionProgress({ percentage, className = '' }: SectionProgressProps) {
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);

  const getColor = (percent: number) => {
    if (percent < 30) return 'bg-red-400';
    if (percent < 60) return 'bg-yellow-400';
    if (percent < 90) return 'bg-blue-400';
    return 'bg-green-400';
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden mr-2">
        <div
          className={`h-1.5 ${getColor(clampedPercentage)} rounded-full transition-all duration-300`}
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 font-medium">{clampedPercentage}%</span>
    </div>
  );
}
