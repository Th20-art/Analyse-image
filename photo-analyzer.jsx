import { useState, useRef, useCallback } from "react";

const PROMPTS = {
  general: "Analyse cette image en détail. Décris ce que tu vois : éléments principaux, contexte, ambiance, couleurs dominantes, et tout détail notable. Fournis une analyse structurée et approfondie en français.",
  composition: "Analyse la composition artistique : règle des tiers, lignes directrices, équilibre, profondeur, perspective, cadrage, points d'intérêt. Réponds en français.",
  objects: "Identifie et décris tous les objets, personnes, animaux et éléments présents. Pour chaque élément, donne sa position et son rôle dans la scène. Réponds en français.",
  text: "Lis et transcris tout le texte visible. Identifie aussi les graphiques, tableaux, données chiffrées ou logos. Analyse leur signification. Réponds en français.",
  emotions: "Analyse les émotions, l'atmosphère et le ressenti général. Si des personnes sont présentes, décris leurs expressions. Quel message émotionnel l'image communique-t-elle ? Réponds en français.",
  technique: "Analyse les aspects techniques : exposition, profondeur de champ, mise au point, balance des blancs, éclairage, type d'objectif probable. Réponds en français.",
};

const TYPE_LABELS = {
  general: "Analyse générale",
  composition: "Composition",
  objects: "Objets & scène",
  text: "Texte & données",
  emotions: "Émotions",
  technique: "Technique photo",
  custom: "Personnalisé",
};

const PILLS = ["general", "composition", "objects", "text", "emotions", "technique", "custom"];

export default function LensApp() {
  const [image, setImage] = useState(null); // { base64, mediaType, preview }
  const [selectedType, setSelectedType] = useState("general");
  const [customPrompt, setCustomPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [copied, setCopied] = useState(false);
  const [elapsed, setElapsed] = useState(null);
  const fileRef = useRef();
  const dropRef = useRef();

  const loadFile = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage({
        base64: e.target.result.split(",")[1],
        mediaType: file.type,
        preview: e.target.result,
      });
      setResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    loadFile(e.dataTransfer.files[0]);
  };

  const analyze = async () => {
    if (!image) return;
    const prompt =
      selectedType === "custom"
        ? customPrompt.trim() || PROMPTS.general
        : PROMPTS[selectedType];

    setLoading(true);
    setError(null);
    setResult(null);
    const t0 = Date.now();

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: image.mediaType,
                    data: image.base64,
                  },
                },
                { type: "text", text: prompt },
              ],
            },
          ],
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const text = data.content?.[0]?.text || "";
      setResult(text);
      setElapsed(((Date.now() - t0) / 1000).toFixed(1));
    } catch (err) {
      setError(err.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(result || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f4f0e8",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      color: "#0a0a0f",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "baseline", justifyContent: "space-between",
        padding: "20px 32px", borderBottom: "1px solid rgba(10,10,15,0.1)",
        background: "#f4f0e8", position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{
          fontFamily: "Georgia, serif", fontWeight: 900,
          fontSize: "2rem", letterSpacing: "0.06em", lineHeight: 1,
        }}>
          LEN<span style={{ color: "#e84b2f" }}>S</span>
        </div>
        <div style={{
          fontSize: "0.65rem", letterSpacing: "0.2em",
          textTransform: "uppercase", color: "#8a8478",
        }}>
          Analyse IA · Claude Vision
        </div>
      </div>

      {/* Main */}
      <div style={{
        maxWidth: 1000, margin: "0 auto", padding: "40px 32px",
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40,
      }}>

        {/* LEFT */}
        <div>
          <Label>01 — Image</Label>

          {/* Drop zone */}
          <div
            ref={dropRef}
            onClick={() => fileRef.current.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              border: `1.5px dashed ${dragOver ? "#e84b2f" : "rgba(10,10,15,0.2)"}`,
              borderRadius: 2,
              minHeight: 260,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
              background: dragOver ? "rgba(232,75,47,0.04)" : "#ede8dc",
              overflow: "hidden", position: "relative",
              transition: "all 0.2s",
            }}
          >
            {image ? (
              <>
                <img
                  src={image.preview}
                  alt="preview"
                  style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
                />
                <div style={{
                  position: "absolute", inset: 0,
                  background: "rgba(10,10,15,0.45)",
                  display: "flex", alignItems: "flex-end", padding: 12,
                }}>
                  <span style={{
                    padding: "5px 12px", background: "#f4f0e8",
                    fontSize: "0.72rem", fontWeight: 500, borderRadius: 100,
                  }}>
                    Changer l'image
                  </span>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: 32, pointerEvents: "none" }}>
                <div style={{
                  width: 56, height: 56, border: "1.5px solid rgba(10,10,15,0.15)",
                  borderRadius: 2, display: "flex", alignItems: "center",
                  justifyContent: "center", margin: "0 auto 16px",
                }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#8a8478" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="M21 15l-5-5L5 21"/>
                  </svg>
                </div>
                <div style={{ fontWeight: 500, fontSize: "0.95rem", marginBottom: 4 }}>Dépose une image ici</div>
                <div style={{ fontSize: "0.78rem", color: "#8a8478" }}>ou clique pour parcourir<br/><span style={{ fontSize: "0.7rem", opacity: 0.7 }}>JPG · PNG · WEBP · GIF</span></div>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={(e) => loadFile(e.target.files[0])} />

          {/* Pills */}
          <div style={{ marginTop: 20 }}>
            <Label>02 — Type d'analyse</Label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {PILLS.map((t) => (
                <button key={t} onClick={() => setSelectedType(t)} style={{
                  padding: "6px 14px",
                  border: `1px solid ${selectedType === t ? "#0a0a0f" : "rgba(10,10,15,0.15)"}`,
                  borderRadius: 100, fontSize: "0.75rem", cursor: "pointer",
                  background: selectedType === t ? "#0a0a0f" : "transparent",
                  color: selectedType === t ? "#f4f0e8" : "#0a0a0f",
                  fontFamily: "inherit", transition: "all 0.18s",
                }}>
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Custom prompt */}
          {selectedType === "custom" && (
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Décris ce que tu veux analyser…"
              style={{
                marginTop: 14, width: "100%", padding: "12px 14px",
                border: "1px solid rgba(10,10,15,0.15)", borderRadius: 2,
                background: "#ede8dc", fontFamily: "inherit", fontSize: "0.85rem",
                resize: "none", height: 72, outline: "none", color: "#0a0a0f",
              }}
            />
          )}

          {/* Button */}
          <button
            onClick={analyze}
            disabled={!image || loading}
            style={{
              marginTop: 16, width: "100%", padding: "15px",
              background: loading ? "#444" : (!image ? "rgba(10,10,15,0.3)" : "#0a0a0f"),
              color: "#f4f0e8", border: "none", borderRadius: 2,
              fontFamily: "Georgia, serif", fontWeight: 900,
              fontSize: "1.15rem", letterSpacing: "0.15em",
              cursor: image && !loading ? "pointer" : "not-allowed",
              transition: "background 0.2s", display: "flex",
              alignItems: "center", justifyContent: "center", gap: 10,
            }}
          >
            {loading ? (
              <>
                <Spinner />
                <span style={{ fontSize: "0.85rem", letterSpacing: "0.1em" }}>Analyse en cours…</span>
              </>
            ) : "ANALYSER L'IMAGE"}
          </button>

          {/* Error */}
          {error && (
            <div style={{
              marginTop: 12, padding: "12px 14px",
              background: "rgba(232,75,47,0.08)",
              border: "1px solid rgba(232,75,47,0.25)",
              borderRadius: 2, fontSize: "0.82rem", color: "#e84b2f",
            }}>
              ⚠ {error}
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div>
          <Label>03 — Résultats</Label>

          {!result && !loading && (
            <div style={{
              minHeight: 400, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              border: "1px solid rgba(10,10,15,0.1)", borderRadius: 2,
              background: "#ede8dc", padding: 40, textAlign: "center",
            }}>
              <div style={{
                fontFamily: "Georgia, serif", fontWeight: 900,
                fontSize: "6rem", lineHeight: 1, color: "rgba(10,10,15,0.06)",
              }}>∅</div>
              <p style={{ fontSize: "0.82rem", color: "#8a8478", marginTop: 8 }}>
                Les résultats apparaîtront ici<br/>après l'analyse
              </p>
            </div>
          )}

          {loading && (
            <div style={{
              minHeight: 400, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              border: "1px solid rgba(10,10,15,0.1)", borderRadius: 2,
              background: "#ede8dc", gap: 16,
            }}>
              <Spinner size={28} />
              <p style={{ fontSize: "0.8rem", color: "#8a8478", letterSpacing: "0.1em" }}>ANALYSE EN COURS…</p>
            </div>
          )}

          {result && (
            <div style={{
              border: "1px solid rgba(10,10,15,0.12)", borderRadius: 2,
              overflow: "hidden", background: "white",
              animation: "fadeUp 0.35s ease",
            }}>
              <div style={{
                padding: "16px 20px", background: "#0a0a0f",
                color: "#f4f0e8", display: "flex",
                alignItems: "center", justifyContent: "space-between",
              }}>
                <span style={{ fontSize: "0.62rem", letterSpacing: "0.25em", opacity: 0.7, textTransform: "uppercase", fontFamily: "monospace" }}>
                  {TYPE_LABELS[selectedType]}
                </span>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#e84b2f" }} />
              </div>

              <div style={{ padding: "24px 20px", maxHeight: 440, overflowY: "auto" }}>
                <p style={{ fontSize: "0.88rem", lineHeight: 1.8, whiteSpace: "pre-wrap", color: "#1a1a20" }}>
                  {result}
                </p>
              </div>

              <div style={{
                padding: "12px 20px", borderTop: "1px solid rgba(10,10,15,0.08)",
                background: "#ede8dc", display: "flex",
                alignItems: "center", justifyContent: "space-between",
              }}>
                <span style={{ fontSize: "0.62rem", color: "#8a8478", fontFamily: "monospace" }}>
                  {elapsed}s · {result.split(" ").length} mots
                </span>
                <button onClick={copy} style={{
                  padding: "5px 12px", border: "1px solid rgba(10,10,15,0.15)",
                  borderRadius: 100, background: "transparent",
                  fontSize: "0.72rem", cursor: "pointer", fontFamily: "inherit",
                  color: "#0a0a0f", transition: "all 0.18s",
                }}>
                  {copied ? "Copié ✓" : "Copier"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function Label({ children }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      fontSize: "0.62rem", letterSpacing: "0.28em",
      textTransform: "uppercase", color: "#8a8478",
      fontFamily: "monospace", marginBottom: 14,
    }}>
      {children}
      <div style={{ flex: 1, height: 1, background: "rgba(10,10,15,0.1)" }} />
    </div>
  );
}

function Spinner({ size = 16 }) {
  return (
    <div style={{
      width: size, height: size,
      border: `2px solid rgba(10,10,15,0.15)`,
      borderTopColor: "#0a0a0f",
      borderRadius: "50%",
      animation: "spin 0.7s linear infinite",
    }} />
  );
}
