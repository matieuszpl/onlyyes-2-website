import { motion } from "framer-motion";
import { Copy, Share2, Download, Volume2 } from "lucide-react";
import { useGlobalAudio } from "../contexts/GlobalAudioContext";
import CopyStreamButton from "./CopyStreamButton";

export default function QuickActions() {
  const { volume, setVolume } = useGlobalAudio();

  return (
    <div className="space-y-2">
      <h3 className="font-header text-xs text-primary uppercase tracking-wider">
        SZYBKIE AKCJE
      </h3>
      <CopyStreamButton />
    </div>
  );
}

