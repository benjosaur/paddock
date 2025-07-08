import { useEffect, useState } from "react";

interface AnimatedCounterProps {
  targetValue: number;
  label: string;
  duration?: number;
  className?: string;
}

export function AnimatedCounter({
  targetValue,
  label,
  duration = 2000,
  className = "",
}: AnimatedCounterProps) {
  const [currentValue, setCurrentValue] = useState(0);

  useEffect(() => {
    if (targetValue === 0) {
      setCurrentValue(0);
      return;
    }

    const startTime = Date.now();
    const startValue = 0;

    const updateValue = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for deceleration (ease-out)
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      const value = Math.round(
        startValue + (targetValue - startValue) * easedProgress
      );
      setCurrentValue(value);

      if (progress < 1) {
        requestAnimationFrame(updateValue);
      }
    };

    requestAnimationFrame(updateValue);
  }, [targetValue, duration]);

  return (
    <div
      className={`bg-white rounded-lg shadow-md border border-gray-200 p-6 ${className}`}
    >
      <div className="text-3xl font-bold text-gray-800 mb-2">
        {currentValue.toLocaleString()}
      </div>
      <div className="text-sm text-gray-600 font-medium">{label}</div>
    </div>
  );
}
