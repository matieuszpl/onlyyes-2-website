import { useState, useEffect } from "react";
import { Copy, Check } from "lucide-react";
import api from "../api";
import Button from "./Button";
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
    <Button
      onClick={handleCopy}
      variant={copied ? "cyan" : "default"}
      size="md"
      className="w-full sm:w-auto flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm px-4 py-2.5 sm:px-5 sm:py-2.5"
      title={streamUrl || "Kopiuj stream URL"}
    >
      {copied ? (
        <>
          <Check size={16} className="sm:w-4 sm:h-4" />
          <span>SKOPIOWANO</span>
        </>
      ) : (
        <>
          <Copy size={16} className="sm:w-4 sm:h-4" />
          <span>STREAM</span>
        </>
      )}
    </Button>
  );
}
