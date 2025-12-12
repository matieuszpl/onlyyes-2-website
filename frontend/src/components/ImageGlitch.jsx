import { useEffect, useRef } from "react";

export default function ImageGlitch({ src, alt, className = "", shouldGlitch = false }) {
  const rootRef = useRef(null);
  const glitchRef = useRef(null);

  useEffect(() => {
    if (!rootRef.current) return;

    class ImageGlitchClass {
      constructor(root) {
        this._root = root;
        this._elClips = root.querySelectorAll(".ImageGlitch-clip");
        this._frame = this._frame.bind(this);
        this._unglitch = this._unglitch.bind(this);
        this._frameId = null;
        Object.seal(this);
      }

      on() {
        if (!this._frameId) {
          this._frame();
        }
      }
      off() {
        clearTimeout(this._frameId);
        this._frameId = null;
        this._unglitch();
      }

      _frame() {
        this._glitch();
        setTimeout(this._unglitch, 50 + Math.random() * 200);
        this._frameId = setTimeout(this._frame, 250 + Math.random() * 500);
      }
      _glitch() {
        this._addClipCSS();
        this._root.classList.add("ImageGlitch-blended");
      }
      _unglitch() {
        this._removeClipCSS();
        this._root.classList.remove("ImageGlitch-blended");
      }

      _addClipCSS() {
        const clips = this._elClips,
          clip1 = this._randDouble(0.1),
          clip2 = this._randDouble(0.1);

        clips[0].style.transform = `translate(${this._randDouble(0.3)}em, .02em)`;
        clips[2].style.transform = `translate(${this._randDouble(0.3)}em, -.02em)`;
        clips[0].style.clipPath = `inset( 0 0 ${0.6 + clip1}em 0 )`;
        clips[1].style.clipPath = `inset( ${0.4 - clip1}em 0 ${0.3 - clip2}em 0 )`;
        clips[2].style.clipPath = `inset( ${0.7 + clip2}em 0 0 0 )`;
      }
      _removeClipCSS() {
        this._elClips.forEach(el => {
          el.style.clipPath = "";
          el.style.transform = "";
        });
      }

      _randDouble(d) {
        return Math.random() * d - d / 2;
      }
      _randInt(n) {
        return Math.random() * n | 0;
      }
    }

    if (shouldGlitch) {
      const glitch = new ImageGlitchClass(rootRef.current);
      glitch.on();
      glitchRef.current = glitch;

      return () => {
        glitch.off();
      };
    } else {
      if (glitchRef.current) {
        glitchRef.current.off();
        glitchRef.current = null;
      }
    }
  }, [shouldGlitch]);

  return (
    <div ref={rootRef} className={`ImageGlitch ${className}`}>
      <div className="ImageGlitch-clip">
        <img src={src} alt={alt} className="w-full h-full object-cover" />
        <div className="ImageGlitch-blend ImageGlitch-blendA">
          <img src={src} alt={alt} className="w-full h-full object-cover" />
        </div>
        <div className="ImageGlitch-blend ImageGlitch-blendB">
          <img src={src} alt={alt} className="w-full h-full object-cover" />
        </div>
      </div>
      <div className="ImageGlitch-clip">
        <img src={src} alt={alt} className="w-full h-full object-cover" />
        <div className="ImageGlitch-blend ImageGlitch-blendA">
          <img src={src} alt={alt} className="w-full h-full object-cover" />
        </div>
        <div className="ImageGlitch-blend ImageGlitch-blendB">
          <img src={src} alt={alt} className="w-full h-full object-cover" />
        </div>
      </div>
      <div className="ImageGlitch-clip">
        <img src={src} alt={alt} className="w-full h-full object-cover" />
        <div className="ImageGlitch-blend ImageGlitch-blendA">
          <img src={src} alt={alt} className="w-full h-full object-cover" />
        </div>
        <div className="ImageGlitch-blend ImageGlitch-blendB">
          <img src={src} alt={alt} className="w-full h-full object-cover" />
        </div>
      </div>
    </div>
  );
}

