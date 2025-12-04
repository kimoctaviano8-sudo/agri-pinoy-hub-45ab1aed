import { useEffect, useState } from "react";

interface ScanningAnimationProps {
  isScanning: boolean;
}

export const ScanningAnimation = ({ isScanning }: ScanningAnimationProps) => {
  const [scanPosition, setScanPosition] = useState(0);

  useEffect(() => {
    if (!isScanning) {
      setScanPosition(0);
      return;
    }

    const interval = setInterval(() => {
      setScanPosition((prev) => {
        if (prev >= 100) return 0;
        return prev + 2;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [isScanning]);

  if (!isScanning) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
      {/* Scanning overlay */}
      <div className="absolute inset-0 bg-black/5 animate-pulse" />
      
      {/* Scanning line */}
      <div
        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-success to-transparent shadow-[0_0_15px_rgba(34,197,94,0.8)] transition-all duration-300"
        style={{
          top: `${scanPosition}%`,
          boxShadow: "0 0 20px rgba(34, 197, 94, 0.8), 0 0 40px rgba(34, 197, 94, 0.4)"
        }}
      />
      
      {/* Secondary scanning line for depth effect */}
      <div
        className="absolute left-0 right-0 h-px bg-success/30"
        style={{
          top: `${(scanPosition + 10) % 100}%`
        }}
      />
      
      {/* Corner indicators */}
      <div className="absolute top-2 left-2 w-8 h-8 border-l-2 border-t-2 border-success animate-pulse" />
      <div className="absolute top-2 right-2 w-8 h-8 border-r-2 border-t-2 border-success animate-pulse" />
      <div className="absolute bottom-2 left-2 w-8 h-8 border-l-2 border-b-2 border-success animate-pulse" />
      <div className="absolute bottom-2 right-2 w-8 h-8 border-r-2 border-b-2 border-success animate-pulse" />
      
      {/* Scanning text */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-success/90 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg animate-pulse">
        Analyzing Plant Disease...
      </div>
    </div>
  );
};
