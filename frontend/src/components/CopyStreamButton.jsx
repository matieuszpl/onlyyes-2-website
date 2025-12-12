import { useState, useEffect } from "react";
import { Copy, Check } from "lucide-react";
import api from "../api";
import { cn } from "../utils/cn";

export default function CopyStreamButton() {
  const [streamUrl, setStreamUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadStreamUrl = async () => {
      try {
        const res = await api.get("/radio/stream-url");
        setStreamUrl(res.data.streamUrl);
      } catch (error) {
        console.error("Load stream URL error:", error);
      }
    };

    loadStreamUrl();
  }, []);

  const handleCopy = async () => {
    if (!streamUrl) return;

    try {
      await navigator.clipboard.writeText(streamUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy error:", error);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "btn-cut px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 font-mono text-[10px] sm:text-xs md:text-sm font-bold flex items-center gap-1.5 sm:gap-2 transition-all",
        copied
          ? "bg-primary text-black"
          : "bg-white/10 text-text-secondary hover:bg-primary hover:text-black"
      )}
      title={streamUrl || "Kopiuj stream URL"}
    >
      {copied ? (
        <>
          <Check size={12} className="sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">SKOPIOWANO</span>
        </>
      ) : (
        <>
          <Copy size={12} className="sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">STREAM</span>
        </>
      )}
    </button>
  );
}
