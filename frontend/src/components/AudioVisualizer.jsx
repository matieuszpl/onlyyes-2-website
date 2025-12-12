import { useEffect, useRef } from "react";
import { cn } from "../utils/cn";

export default function AudioVisualizer({ isPlaying, className }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!isPlaying) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    // TODO: Integracja z Web Audio API do analizy rzeczywistego streamu
    // const audioContext = new AudioContext();
    // const analyser = audioContext.createAnalyser();
    // const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const draw = () => {
      if (!isPlaying) return;

      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, width, height);

      const barCount = 32;
      const barWidth = width / barCount;

      for (let i = 0; i < barCount; i++) {
        const barHeight = Math.random() * height * 0.8;
        const x = i * barWidth;
        const y = height - barHeight;

        const gradient = ctx.createLinearGradient(x, y, x, height);
        const progress = i / barCount;
        if (progress < 0.5) {
          const cyanProgress = progress * 2;
          gradient.addColorStop(0, `rgba(0, 243, 255, ${0.8 + cyanProgress * 0.2})`);
          gradient.addColorStop(1, `rgba(0, 243, 255, ${0.3 + cyanProgress * 0.2})`);
        } else {
          const magentaProgress = (progress - 0.5) * 2;
          const cyanAmount = 1 - magentaProgress;
          const magentaAmount = magentaProgress;
          gradient.addColorStop(0, `rgba(${Math.round(0 * cyanAmount + 255 * magentaAmount)}, ${Math.round(243 * cyanAmount + 0 * magentaAmount)}, ${Math.round(255 * cyanAmount + 255 * magentaAmount)}, 0.8)`);
          gradient.addColorStop(1, `rgba(${Math.round(0 * cyanAmount + 255 * magentaAmount)}, ${Math.round(243 * cyanAmount + 0 * magentaAmount)}, ${Math.round(255 * cyanAmount + 255 * magentaAmount)}, 0.3)`);
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth - 2, barHeight);
      }

      requestAnimationFrame(draw);
    };

    const animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isPlaying]);

  if (!isPlaying) {
    return (
      <div className="bg-white/5 border border-white/10 p-4 text-center">
        <p className="font-mono text-xs text-text-secondary">
          URUCHOM STREAM, ABY ZOBACZYĆ WIZUALIZATOR
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <canvas
        ref={canvasRef}
        width={800}
        height={200}
        className="w-full bg-black border border-primary"
      />
      <p className="font-mono text-xs text-text-secondary text-center">
        [AUDIO VISUALIZER] TODO: Web Audio API integration
      </p>
    </div>
  );
}
