import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  progress: number;
  threshold?: number;
}

export function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  progress,
  threshold = 80,
}: PullToRefreshIndicatorProps) {
  const isActive = pullDistance > 10 || isRefreshing;
  const isTriggered = progress >= 1;

  return (
    <div
      className={cn(
        "absolute left-0 right-0 flex items-center justify-center pointer-events-none z-50 transition-opacity duration-200",
        isActive ? "opacity-100" : "opacity-0"
      )}
      style={{
        top: 0,
        height: `${Math.max(pullDistance, isRefreshing ? threshold : 0)}px`,
        transform: `translateY(${isRefreshing ? 0 : -10}px)`,
      }}
    >
      <div
        className={cn(
          "flex flex-col items-center justify-center transition-all duration-300",
          isTriggered || isRefreshing ? "scale-100" : "scale-75"
        )}
      >
        {/* Spinner container */}
        <div
          className={cn(
            "relative w-8 h-8 flex items-center justify-center",
            isRefreshing && "animate-spin"
          )}
          style={{
            transform: isRefreshing 
              ? undefined 
              : `rotate(${progress * 360}deg)`,
          }}
        >
          {isRefreshing ? (
            <Loader2 className="w-6 h-6 text-primary" />
          ) : (
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Circular progress indicator */}
              <circle
                cx="12"
                cy="12"
                r="10"
                className="text-muted-foreground/20"
                strokeWidth="2"
              />
              <circle
                cx="12"
                cy="12"
                r="10"
                className="text-primary"
                strokeWidth="2"
                strokeDasharray={`${progress * 63} 63`}
                strokeDashoffset="0"
                style={{
                  transform: 'rotate(-90deg)',
                  transformOrigin: 'center',
                }}
              />
              {/* Arrow indicator */}
              {isTriggered && (
                <path
                  d="M12 8v8M8 12l4-4 4 4"
                  className="text-primary animate-pulse"
                />
              )}
            </svg>
          )}
        </div>

        {/* Status text */}
        <span
          className={cn(
            "text-xs text-muted-foreground mt-1 transition-opacity duration-200",
            pullDistance > 30 || isRefreshing ? "opacity-100" : "opacity-0"
          )}
        >
          {isRefreshing 
            ? "Refreshing..." 
            : isTriggered 
              ? "Release to refresh" 
              : "Pull to refresh"}
        </span>
      </div>
    </div>
  );
}
