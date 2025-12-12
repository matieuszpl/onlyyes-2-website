import { useState, useEffect, useRef } from "react";

const DEFAULT_ALBUM_ART = "https://azura.matieusz.pl/static/uploads/kana%C5%82_g%C5%82%C3%B3wny/album_art.1763409726.png";

let defaultImageData = null;
let defaultImageLoaded = false;

const loadDefaultImage = () => {
  return new Promise((resolve) => {
    if (defaultImageLoaded) {
      resolve(defaultImageData);
      return;
    }
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const size = 50;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);
        defaultImageData = ctx.getImageData(0, 0, size, size);
        defaultImageLoaded = true;
        resolve(defaultImageData);
      } catch (e) {
        defaultImageLoaded = true;
        resolve(null);
      }
    };
    
    img.onerror = () => {
      defaultImageLoaded = true;
      resolve(null);
    };
    
    img.src = DEFAULT_ALBUM_ART;
  });
};

const compareImages = (imgData1, imgData2, threshold = 0.90) => {
  if (!imgData1 || !imgData2) return false;
  if (imgData1.data.length !== imgData2.data.length) return false;
  
  let matches = 0;
  const total = imgData1.data.length / 4;
  
  for (let i = 0; i < imgData1.data.length; i += 4) {
    const r1 = imgData1.data[i];
    const g1 = imgData1.data[i + 1];
    const b1 = imgData1.data[i + 2];
    
    const r2 = imgData2.data[i];
    const g2 = imgData2.data[i + 1];
    const b2 = imgData2.data[i + 2];
    
    const diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
    if (diff < 30) matches++;
  }
  
  return matches / total >= threshold;
};

const isBlackOrWhite = (r, g, b, threshold = 40) => {
  const brightness = (r + g + b) / 3;
  const isBlack = brightness < threshold;
  const isWhite = brightness > 255 - threshold;
  return isBlack || isWhite;
};

const getBrightness = (r, g, b) => {
  return (r * 299 + g * 587 + b * 114) / 1000;
};

const brightenColor = (r, g, b, factor = 1.6) => {
  const baseBrightness = (r + g + b) / 3;
  const targetBrightness = Math.min(255, baseBrightness * factor);
  const ratio = targetBrightness / (baseBrightness || 1);
  
  return {
    r: Math.min(255, Math.round(r * ratio)),
    g: Math.min(255, Math.round(g * ratio)),
    b: Math.min(255, Math.round(b * ratio))
  };
};

const checkIfDefault = (imageUrl) => {
  return new Promise(async (resolve) => {
    if (!imageUrl) {
      resolve(true);
      return;
    }

    const defaultImgData = await loadDefaultImage();
    if (!defaultImgData) {
      resolve(false);
      return;
    }
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const size = 100;
        canvas.width = size;
        canvas.height = size;
        
        ctx.drawImage(img, 0, 0, size, size);
        
        const imageData = ctx.getImageData(0, 0, size, size);
        
        const defaultCanvas = document.createElement("canvas");
        const defaultCtx = defaultCanvas.getContext("2d");
        defaultCanvas.width = size;
        defaultCanvas.height = size;
        defaultCtx.putImageData(defaultImgData, 0, 0);
        const scaledDefault = defaultCtx.getImageData(0, 0, size, size);
        
        const isDefault = compareImages(imageData, scaledDefault);
        resolve(isDefault);
      } catch (e) {
        resolve(false);
      }
    };
    
    img.onerror = () => {
      resolve(true);
    };
    
    img.src = imageUrl;
  });
};

export const useAlbumColors = (thumbnail) => {
  const [isDefault, setIsDefault] = useState(false);
  
  useEffect(() => {
    if (!thumbnail) {
      setIsDefault(true);
      return;
    }
    
    checkIfDefault(thumbnail).then((defaultImg) => {
      setIsDefault(defaultImg);
    });
  }, [thumbnail]);
  
  return { isDefault, thumbnail };
};

