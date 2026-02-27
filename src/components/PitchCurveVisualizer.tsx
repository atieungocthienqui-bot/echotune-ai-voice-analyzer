import React, { useRef, useEffect } from 'react';

interface PitchCurveVisualizerProps {
  pitchData: number[]; // Array of pitch values (e.g., frequencies or normalized values)
  width?: number;
  height?: number;
}

export const PitchCurveVisualizer: React.FC<PitchCurveVisualizerProps> = ({ pitchData, width = 600, height = 150 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'rgb(20, 20, 20)';
    ctx.fillRect(0, 0, width, height);

    if (!pitchData || pitchData.length === 0) return;

    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgb(255, 68, 68)'; // Red for pitch
    ctx.beginPath();

    const sliceWidth = width / pitchData.length;
    let x = 0;

    for (let i = 0; i < pitchData.length; i++) {
      // Normalize pitch value to fit canvas height (0-1000Hz -> 0-height)
      const pitch = pitchData[i];
      const normalizedPitch = Math.min(Math.max(pitch / 1000, 0), 1);
      const y = height - (normalizedPitch * height);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.stroke();
  }, [pitchData, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="rounded-xl border border-white/10 shadow-lg w-full"
    />
  );
};
