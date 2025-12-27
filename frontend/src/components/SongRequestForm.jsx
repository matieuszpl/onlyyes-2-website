import { useState } from "react";
import { useUser } from "../contexts/UserContext";
import { useToast } from "./ToastContainer";
import api from "../api";
import Card from "./Card";
import Button from "./Button";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, CheckCircle2, Info, XCircle, Link, Search, CheckSquare, Shield, Clock, AlertCircle, Music, Folder, Upload, FileArchive } from "lucide-react";

export default function SongRequestForm() {
  const { user } = useUser();
  const { showToast } = useToast();
  const [input, setInput] = useState("");
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [error, setError] = useState(null);
  const [submittedItems, setSubmittedItems] = useState(new Map());

  if (!user) {
    return (
      <Card className="relative space-y-4">
        <h3 className="font-header text-base text-primary uppercase tracking-wider">
          PROPONUJ UTWÓR
        </h3>
        <div className="p-4 bg-yellow-500/20 border border-yellow-500/50">
          <p className="font-mono text-sm text-yellow-400 mb-2">
            ZALOGUJ SIĘ, ABY PROPONOWAĆ UTWORY
          </p>
          <p className="font-mono text-xs text-text-secondary">
            Musisz być zalogowany, aby móc zgłaszać propozycje utworów do radia.
          </p>
        </div>
      </Card>
    );
  }

  const getItemKey = (item) => {
    return item.youtube_id || item.url || item.title || "";
  };

  const handlePreview = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setError(null);
    setPreview(null);
    setSelectedItems(new Set());
    setSubmittedItems(new Map());

    try {
      const res = await api.post("/suggestions/preview", { input });
      setPreview(res.data);
      
      const newSubmitted = new Map();
      
      if (res.data.type === "playlist") {
        const allIndices = new Set(res.data.items.map((_, idx) => idx));
        setSelectedItems(allIndices);
        
        res.data.items.forEach((item) => {
          if (item.existing) {
            const key = getItemKey(item);
            newSubmitted.set(key, {
              status: "duplicate",
              title: item.title,
              existing_status: item.existing.status,
            });
          }
        });
      } else {
        if (res.data.existing) {
          const key = getItemKey(res.data);
          newSubmitted.set(key, {
            status: "duplicate",
            title: res.data.title,
            existing_status: res.data.existing.status,
          });
        }
      }
      
      setSubmittedItems(newSubmitted);
    } catch (error) {
      const message = error.response?.data?.detail || "Błąd podczas pobierania podglądu";
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleItemSelection = (index) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (preview?.type === "playlist") {
      setSelectedItems(new Set(preview.items.map((_, idx) => idx)));
    }
  };

  const deselectAll = () => {
    setSelectedItems(new Set());
  };

  const handleSubmit = async () => {
    if (!preview) return;

    setSubmitting(true);
    setError(null);

    try {
      if (preview.type === "playlist") {
        if (selectedItems.size === 0) {
          setError("Wybierz przynajmniej jeden utwór");
          showToast("Wybierz przynajmniej jeden utwór", "warning");
          setSubmitting(false);
          return;
        }

        const itemsToSubmit = preview.items
          .filter((_, idx) => selectedItems.has(idx))
          .map((item) => ({
            input: item.url || input,
            title: item.title,
            artist: item.artist,
            source_type: item.source_type || "YOUTUBE",
            thumbnail_url: item.thumbnail,
            duration_seconds: item.duration_seconds || 0,
            youtube_id: item.youtube_id,
            url: item.url,
          }));

        const res = await api.post("/suggestions/batch", { items: itemsToSubmit });
        
        const newSubmitted = new Map(submittedItems);
        itemsToSubmit.forEach((item) => {
          const key = getItemKey(item);
          newSubmitted.set(key, {
            status: "sent",
            title: item.title,
            artist: item.artist,
          });
        });
        
        if (res.data.duplicates && res.data.duplicates.length > 0) {
          res.data.duplicates.forEach((dup) => {
            const key = dup.youtube_id || dup.title || "";
            if (key) {
              newSubmitted.set(key, {
                status: "duplicate",
                title: dup.title,
                existing_status: dup.existing_status,
              });
            }
          });
        }
        
        setSubmittedItems(newSubmitted);
        
        const successCount = res.data.count || 0;
        const skippedCount = res.data.skipped || 0;
        
        if (successCount > 0) {
          showToast(
            `Wysłano ${successCount} ${successCount === 1 ? "propozycję" : "propozycji"}!`,
            "success"
          );
        }
        if (skippedCount > 0) {
          showToast(
            `${skippedCount} ${skippedCount === 1 ? "propozycja już istnieje" : "propozycje już istnieją"}`,
            "warning"
          );
        }
      } else {
        const res = await api.post("/suggestions", {
          input,
          title: preview.title,
          artist: preview.artist,
          source_type: preview.source_type,
          thumbnail_url: preview.thumbnail,
          duration_seconds: preview.duration_seconds,
          youtube_id: preview.youtube_id,
          url: preview.url,
        });
        
        const key = getItemKey(preview);
        const newSubmitted = new Map(submittedItems);
        
        if (res.data.status === "duplicate") {
          newSubmitted.set(key, {
            status: "duplicate",
            title: preview.title,
            existing_status: res.data.existing_status,
          });
          showToast("Ta propozycja została już wysłana", "warning");
        } else {
          newSubmitted.set(key, {
            status: "sent",
            title: preview.title,
            artist: preview.artist,
          });
          showToast("Propozycja wysłana!", "success");
        }
        
        setSubmittedItems(newSubmitted);
      }
    } catch (error) {
      if (error.response?.status === 429) {
        const message = error.response?.data?.detail || "Zbyt wiele propozycji";
        setError(message);
        showToast(message, "error");
      } else {
        const message = error.response?.data?.detail || "Błąd podczas wysyłania propozycji";
        setError(message);
        showToast(message, "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "PENDING":
        return "OCZEKUJE";
      case "APPROVED":
        return "ZAAKCEPTOWANA";
      case "REJECTED":
        return "ODRZUCONA";
      case "PROCESSED":
        return "PRZETWORZONA";
      default:
        return status;
    }
  };

  return (
    <Card className="space-y-4 relative">
      <div className="flex items-center gap-2">
        <Music className="w-4 h-4 text-primary" />
        <h3 className="font-header text-base text-primary uppercase tracking-wider">
          PROPONUJ UTWÓR
        </h3>
      </div>

      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-primary/20 border border-primary/40 flex items-center justify-center">
            <Info className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 space-y-3">
            <div className="font-header text-xs text-primary uppercase tracking-wider">
              JAK TO DZIAŁA?
            </div>
            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5">
                <Link className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-mono text-xs text-text-primary mb-0.5">
                    Wklej link lub wyszukaj
                  </div>
                  <div className="font-mono text-[10px] text-text-secondary">
                    YouTube, Spotify, playlisty lub tytuł utworu
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-2.5">
                <CheckSquare className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-mono text-xs text-text-primary mb-0.5">
                    Wybierz utwory
                  </div>
                  <div className="font-mono text-[10px] text-text-secondary">
                    Zaznacz utwory z playlisty i wyślij propozycje
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-mono text-xs text-text-primary mb-0.5">
                    Weryfikacja
                  </div>
                  <div className="font-mono text-[10px] text-text-secondary">
                    Propozycje są sprawdzane przez administratora
                  </div>
                </div>
              </div>
              
              <div className="pt-1.5 border-t border-white/10 space-y-2">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-mono text-xs text-yellow-400 mb-0.5">
                      Ograniczenia
                    </div>
                    <div className="font-mono text-[10px] text-text-secondary space-y-0.5">
                      <div>• Ten sam utwór: raz na 30 dni</div>
                      <div>• Limit: 5/h (bez opóźnienia), 10/h (z opóźnieniem)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError(null);
            if (!e.target.value.trim()) {
              setPreview(null);
              setSubmittedItems(new Map());
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading && input.trim()) {
              handlePreview();
            }
          }}
          placeholder="Wklej link YouTube/Spotify/playlistę lub wpisz tytuł..."
          className="flex-1 bg-white/10 border border-white/10 px-4 py-2 font-mono text-sm text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none"
        />
        <Button
          onClick={handlePreview}
          disabled={loading || !input.trim()}
          variant="primary"
          size="md"
          className="whitespace-nowrap min-w-[100px]"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>SZUKAM...</span>
            </span>
          ) : (
            "PODGLĄD"
          )}
        </Button>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <Card className="p-3 bg-red-500/20 border-red-500/50">
            <p className="font-mono text-xs text-red-400">{error}</p>
          </Card>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="space-y-3">
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                  }}
                  className="w-20 h-20 bg-white/10 border border-white/20 flex-shrink-0"
                />
                <div className="flex-1 space-y-2">
                  <motion.div
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                    }}
                    className="h-5 bg-white/20 rounded w-3/4"
                  />
                  <motion.div
                    animate={{ opacity: [0.2, 0.4, 0.2] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: 0.1,
                    }}
                    className="h-3 bg-white/10 rounded w-1/2"
                  />
                  <motion.div
                    animate={{ opacity: [0.2, 0.4, 0.2] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: 0.2,
                    }}
                    className="h-2 bg-white/10 rounded w-1/3"
                  />
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {preview && !loading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="space-y-3">
              {preview.type === "playlist" ? (
                <>
                  <div className="flex items-center justify-between">
                    <div className="font-header text-sm text-primary">
                      PLAYLIST ({preview.count} utworów)
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={selectAll}
                        className="font-mono text-[10px] px-2 py-1 border border-primary/50 text-primary hover:bg-primary/10 hover:border-primary transition-colors"
                      >
                        ZAZNACZ WSZYSTKIE
                      </button>
                      <button
                        onClick={deselectAll}
                        className="font-mono text-[10px] px-2 py-1 border border-white/20 text-text-secondary hover:bg-white/5 hover:text-text-primary transition-colors"
                      >
                        ODZNACZ
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {preview.items.map((item, idx) => {
                      const isSelected = selectedItems.has(idx);
                      const itemKey = getItemKey(item);
                      const submitted = submittedItems.get(itemKey);
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.02 }}
                        >
                          <Card
                            className={`p-2 transition-all ${
                              submitted
                                ? submitted.status === "sent"
                                  ? "border-green-500/50 bg-green-500/10"
                                  : "border-yellow-500/50 bg-yellow-500/10"
                                : isSelected
                                ? "border-primary bg-primary/10 cursor-pointer"
                                : "border-white/10 hover:border-white/20 cursor-pointer"
                            }`}
                            onClick={() => !submitted && toggleItemSelection(idx)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0">
                                {submitted ? (
                                  submitted.status === "sent" ? (
                                    <div className="w-5 h-5 bg-green-500 border border-green-500 flex items-center justify-center">
                                      <CheckCircle2 className="w-3 h-3 text-white" />
                                    </div>
                                  ) : (
                                    <div className="w-5 h-5 bg-yellow-500 border border-yellow-500 flex items-center justify-center">
                                      <XCircle className="w-3 h-3 text-white" />
                                    </div>
                                  )
                                ) : isSelected ? (
                                  <div className="w-5 h-5 bg-primary border border-primary flex items-center justify-center">
                                    <Check className="w-3 h-3 text-black" />
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 border border-white/30" />
                                )}
                              </div>
                              {item.thumbnail && (
                                <img
                                  src={item.thumbnail}
                                  alt={item.title}
                                  className="w-12 h-12 border border-white/10 flex-shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="font-header text-xs text-text-primary truncate">
                                  {item.title}
                                </div>
                                <div className="font-mono text-[10px] text-text-secondary truncate">
                                  {item.artist}
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="font-mono text-[9px] text-text-secondary">
                                    {formatDuration(item.duration_seconds)}
                                  </div>
                                  {submitted && (
                                    <div className={`font-mono text-[9px] ${
                                      submitted.status === "sent" ? "text-green-400" : "text-yellow-400"
                                    }`}>
                                      {submitted.status === "sent" ? "✓ WYSŁANO" : `⚠ JUŻ ISTNIEJE (${getStatusLabel(submitted.existing_status)})`}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <div className="font-mono text-[10px] text-text-secondary">
                      WYBRANO: {selectedItems.size} / {preview.count}
                    </div>
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting || selectedItems.size === 0}
                      variant="primary"
                      size="md"
                      className="whitespace-nowrap"
                    >
                      {submitting ? (
                        <span className="flex items-center justify-center gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>WYSYŁANIE...</span>
                        </span>
                      ) : (
                        `WYŚLIJ ${selectedItems.size} PROPOZYCJI`
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    {preview.thumbnail && (
                      <img
                        src={preview.thumbnail}
                        alt={preview.title}
                        className="w-20 h-20 border border-primary flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-header text-sm text-text-primary mb-1 truncate">
                        {preview.title}
                      </div>
                      <div className="font-mono text-xs text-text-secondary mb-1 truncate">
                        {preview.artist}
                      </div>
                      <div className="font-mono text-[10px] text-text-secondary">
                        {preview.source_type} • {formatDuration(preview.duration_seconds)}
                      </div>
                      {(() => {
                        const key = getItemKey(preview);
                        const submitted = submittedItems.get(key);
                        return submitted && (
                          <div className={`font-mono text-[10px] mt-1 ${
                            submitted.status === "sent" ? "text-green-400" : "text-yellow-400"
                          }`}>
                            {submitted.status === "sent" ? (
                              "✓ PROPOZYCJA WYSŁANA"
                            ) : (
                              `⚠ JUŻ ISTNIEJE (${getStatusLabel(submitted.existing_status)})`
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  <Button
                    onClick={handleSubmit}
                    disabled={(() => {
                      const key = getItemKey(preview);
                      const submitted = submittedItems.get(key);
                      return submitting || submitted?.status === "duplicate";
                    })()}
                    variant="primary"
                    size="md"
                    fullWidth
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>WYSYŁANIE...</span>
                      </span>
                    ) : (() => {
                      const key = getItemKey(preview);
                      const submitted = submittedItems.get(key);
                      return submitted?.status === "duplicate" ? "JUŻ WYSŁANE" : "WYŚLIJ PROPOZYCJĘ";
                    })()}
                  </Button>
                </>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
