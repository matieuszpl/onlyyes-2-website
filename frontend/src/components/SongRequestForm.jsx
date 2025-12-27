import { useState } from "react";
import { useUser } from "../contexts/UserContext";
import api from "../api";
import Card from "./Card";
import Button from "./Button";

export default function SongRequestForm() {
  const { user } = useUser();
  const [input, setInput] = useState("");
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!user) {
    return (
      <Card className="relative">
        <p className="font-mono text-sm text-text-secondary">
          ZALOGUJ SIĘ, ABY PROPONOWAĆ UTWORY
        </p>
      </Card>
    );
  }

  const handlePreview = async () => {
    if (!input.trim()) return;

    setLoading(true);
    try {
      const res = await api.post("/suggestions/preview", { input });
      setPreview(res.data);
    } catch (error) {
      console.error("Preview error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!preview) return;

    setSubmitting(true);
    try {
      await api.post("/suggestions", {
        input,
        title: preview.title,
        artist: preview.artist,
        source_type: preview.source_type,
        thumbnail_url: preview.thumbnail,
        duration_seconds: preview.duration_seconds,
      });
      setInput("");
      setPreview(null);
      alert("Propozycja wysłana!");
    } catch (error) {
      console.error("Submit error:", error);
      alert("Błąd podczas wysyłania propozycji");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="space-y-3 relative">

      <h3 className="font-header text-base text-primary uppercase tracking-wider">
        PROPONUJ UTWÓR
      </h3>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Wklej link YouTube/Spotify lub wpisz tytuł..."
          className="flex-1 bg-white/10 border border-white/10 px-4 py-2 font-mono text-sm text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none"
        />
        <Button
          onClick={handlePreview}
          disabled={loading || !input.trim()}
          variant="primary"
          size="md"
          className="bg-primary text-black"
        >
          {loading ? "..." : "PODGLĄD"}
        </Button>
      </div>

      {preview && (
        <Card className="space-y-2">
          <div className="flex items-center gap-4">
            {preview.thumbnail && (
              <img
                src={preview.thumbnail}
                alt={preview.title}
                className="w-16 h-16 border border-primary"
              />
            )}
            <div className="flex-1">
              <div className="font-header text-sm text-text-primary mb-1">
                {preview.title}
              </div>
              <div className="font-mono text-xs text-text-secondary mb-1">
                {preview.artist}
              </div>
              <div className="font-mono text-xs text-text-secondary">
                {preview.source_type} •{" "}
                {Math.floor(preview.duration_seconds / 60)}:
                {(preview.duration_seconds % 60).toString().padStart(2, "0")}
              </div>
            </div>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            variant="primary"
            size="md"
            className="bg-primary text-black"
          >
            {submitting ? "WYSYŁANIE..." : "WYŚLIJ PROPOZYCJĘ"}
          </Button>
        </Card>
      )}
    </Card>
  );
}
