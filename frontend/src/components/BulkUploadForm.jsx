import { useState } from "react";
import { useUser } from "../contexts/UserContext";
import { useToast } from "./ToastContainer";
import api from "../api";
import Card from "./Card";
import Button from "./Button";
import { motion } from "framer-motion";
import { Loader2, Folder, Upload, AlertCircle, CheckCircle2, Info } from "lucide-react";

export default function BulkUploadForm() {
  const { user } = useUser();
  const { showToast } = useToast();
  const [driveLink, setDriveLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!user) {
    return null;
  }

  const isValidGoogleDriveLink = (url) => {
    if (!url || !url.trim()) return false;
    
    const patterns = [
      /^https?:\/\/(drive\.google\.com|docs\.google\.com)/,
      /^https?:\/\/.*google.*drive/,
    ];
    
    return patterns.some(pattern => pattern.test(url.trim()));
  };

  const handleSubmit = async () => {
    if (!driveLink.trim()) {
      setError("Wklej link do Google Drive");
      return;
    }

    if (!isValidGoogleDriveLink(driveLink)) {
      setError("Akceptujemy tylko linki do Google Drive");
      showToast("Akceptujemy tylko linki do Google Drive", "error");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      await api.post("/suggestions/bulk-upload", {
        drive_link: driveLink.trim(),
      });
      
      setSuccess(true);
      setDriveLink("");
      showToast("Propozycja wysłana! Administrator przetworzy pliki.", "success");
      
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      const message = error.response?.data?.detail || "Błąd podczas wysyłania propozycji";
      setError(message);
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="space-y-4 relative">
      <div className="flex items-center gap-2">
        <Folder className="w-4 h-4 text-primary" />
        <h3 className="font-header text-base text-primary uppercase tracking-wider">
          WYSYŁANIE PACZKI UTWORÓW
        </h3>
      </div>

      <div className="p-4 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-primary/20 border border-primary/40 flex items-center justify-center">
            <Info className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="font-header text-xs text-primary uppercase tracking-wider">
              JAK TO DZIAŁA?
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2.5">
                <Upload className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-mono text-[10px] text-text-primary mb-0.5">
                    Przygotuj pliki
                  </div>
                  <div className="font-mono text-[9px] text-text-secondary">
                    Spakuj utwory do ZIP lub wrzuć folder na Google Drive
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-2.5">
                <Folder className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-mono text-[10px] text-text-primary mb-0.5">
                    Udostępnij link
                  </div>
                  <div className="font-mono text-[9px] text-text-secondary">
                    Skopiuj link do folderu/pliku na Google Drive (z uprawnieniami do odczytu)
                  </div>
                </div>
              </div>
              
              <div className="pt-1.5 border-t border-white/10">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-mono text-[10px] text-yellow-400 mb-0.5">
                      Ważne
                    </div>
                    <div className="font-mono text-[9px] text-text-secondary space-y-0.5">
                      <div>• Akceptujemy tylko linki do Google Drive</div>
                      <div>• Folder/plik musi być publicznie dostępny lub udostępniony</div>
                      <div>• Obsługiwane formaty: MP3, FLAC, WAV, M4A</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block font-mono text-[10px] text-text-secondary mb-1.5">
            LINK DO GOOGLE DRIVE
          </label>
          <input
            type="text"
            value={driveLink}
            onChange={(e) => {
              setDriveLink(e.target.value);
              setError(null);
              setSuccess(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !submitting && driveLink.trim()) {
                handleSubmit();
              }
            }}
            placeholder="https://drive.google.com/..."
            className="w-full bg-white/10 border border-white/10 px-4 py-2 font-mono text-sm text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none"
            disabled={submitting}
          />
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="p-3 bg-red-500/20 border-red-500/50">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="font-mono text-xs text-red-400">{error}</p>
              </div>
            </Card>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="p-3 bg-green-500/20 border-green-500/50">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                <p className="font-mono text-xs text-green-400">
                  Propozycja wysłana! Administrator przetworzy pliki.
                </p>
              </div>
            </Card>
          </motion.div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={submitting || !driveLink.trim()}
          variant="primary"
          size="md"
          fullWidth
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>WYSYŁANIE...</span>
            </span>
          ) : (
            "WYŚLIJ LINK"
          )}
        </Button>
      </div>
    </Card>
  );
}

