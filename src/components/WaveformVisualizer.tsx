import React, { useRef, useEffect } from 'react';

interface WaveformVisualizerProps {
  data: Uint8Array | null;
  width?: number;
  height?: number;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({ data, width = 600, height = 150 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'rgb(20, 20, 20)'; // Dark background
    ctx.fillRect(0, 0, width, height);

    if (!data) return;

    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgb(0, 255, 0)'; // Neon green
    ctx.beginPath();

    const sliceWidth = width * 1.0 / data.length;
    let x = 0;

    for (let i = 0; i < data.length; i++) {
      const v = data[i] / 128.0;
      const y = v * height / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  }, [data, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="rounded-xl border border-white/10 shadow-lg w-full"
    />
  );
};
