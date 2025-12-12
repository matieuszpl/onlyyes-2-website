import { useState, useEffect } from "react";
import api from "../api";

export default function RadioInfo() {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInfo = async () => {
      try {
        const res = await api.get("/radio/info");
        setInfo(res.data);
      } catch (error) {
        console.error("Load radio info error:", error);
      } finally {
        setLoading(false);
      }
    };
    loadInfo();
  }, []);

  return (
    <div className="glass-panel p-4 space-y-3">
      <h3 className="font-header text-sm text-primary uppercase tracking-wider">
        INFORMACJE O STACJI
      </h3>

      <div className="space-y-1.5">
        <p className="font-mono text-xs text-text-primary">
          <span className="text-primary">ONLY YES RADIO</span> - Twoja ulubiona
          stacja internetowa
        </p>
        <p className="font-mono text-[10px] text-text-secondary">
          Słuchaj najlepszej muzyki, głosuj na ulubione utwory i proponuj nowe!
        </p>
      </div>
    </div>
  );
}
