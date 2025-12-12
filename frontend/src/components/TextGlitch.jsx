import { useEffect, useRef } from "react";

export default function TextGlitch({ text, altTexts = [], className = "" }) {
  const rootRef = useRef(null);
  const glitchRef = useRef(null);

  useEffect(() => {
    if (!rootRef.current) return;

    class TextGlitchClass {
      constructor(root) {
        this._root = root;
        this._elClips = root.querySelectorAll(".TextGlitch-clip");
        this._elWords = root.querySelectorAll(".TextGlitch-word");
        this._frame = this._frame.bind(this);
        this._unglitch = this._unglitch.bind(this);
        this._frameId = null;
        this._text = text;
        this._textAlt = altTexts.length > 0 ? altTexts : [
          text.toUpperCase(),
          text.split("").map((c, i) => {
            if (c === " ") return " ";
            const chars = "0123456789!@#$%^&*()[]{}|\\/<>?~`";
            return Math.random() > 0.6 ? chars[Math.floor(Math.random() * chars.length)] : c;
          }).join(""),
          text.split("").map((c, i) => {
            if (c === " ") return " ";
            return String.fromCharCode(48 + Math.floor(Math.random() * 10));
          }).join(""),
        ];
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
      setTexts([text, ...alt]) {
        this._text = text;
        this._textAlt = alt;
      }

      _frame() {
        this._glitch();
        setTimeout(this._unglitch, 50 + Math.random() * 200);
        this._frameId = setTimeout(this._frame, 250 + Math.random() * 500);
      }
      _glitch() {
        this._addClipCSS();
        this._textContent(this._randText());
        this._root.classList.add("TextGlitch-blended");
      }
      _unglitch() {
        this._removeClipCSS();
        this._textContent(this._text);
        this._root.classList.remove("TextGlitch-blended");
      }
      _textContent(txt) {
        this._elWords.forEach(el => el.textContent = txt);
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

      _randText() {
        const txt = Array.from(this._text);
        for (let i = 0; i < 12; ++i) {
          const ind = this._randInt(this._text.length);
          if (this._textAlt.length > 0 && this._textAlt[0] && this._textAlt[0][ind]) {
            txt[ind] = this._textAlt[this._randInt(this._textAlt.length)][ind];
          }
        }
        return txt.join("");
      }

      _randDouble(d) {
        return Math.random() * d - d / 2;
      }
      _randInt(n) {
        return Math.random() * n | 0;
      }
    }

    const glitch = new TextGlitchClass(rootRef.current);
    glitch.on();
    glitchRef.current = glitch;

    const handleTestGlitch = () => {
      if (glitchRef.current) {
        glitchRef.current.off();
        setTimeout(() => {
          if (glitchRef.current) {
            glitchRef.current.on();
          }
        }, 100);
      }
    };

    window.addEventListener("testGlitch", handleTestGlitch);

    return () => {
      glitch.off();
      window.removeEventListener("testGlitch", handleTestGlitch);
    };
  }, [text, altTexts]);

  return (
    <div ref={rootRef} className={`TextGlitch ${className}`}>
      <div className="TextGlitch-clip">
        <div className="TextGlitch-word">{text}</div>
        <div className="TextGlitch-word TextGlitch-blend TextGlitch-blendA">{text}</div>
        <div className="TextGlitch-word TextGlitch-blend TextGlitch-blendB">{text}</div>
      </div>
      <div className="TextGlitch-clip">
        <div className="TextGlitch-word">{text}</div>
        <div className="TextGlitch-word TextGlitch-blend TextGlitch-blendA">{text}</div>
        <div className="TextGlitch-word TextGlitch-blend TextGlitch-blendB">{text}</div>
      </div>
      <div className="TextGlitch-clip">
        <div className="TextGlitch-word">{text}</div>
        <div className="TextGlitch-word TextGlitch-blend TextGlitch-blendA">{text}</div>
        <div className="TextGlitch-word TextGlitch-blend TextGlitch-blendB">{text}</div>
      </div>
    </div>
  );
}

