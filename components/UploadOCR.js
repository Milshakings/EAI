import { useRef, useState } from "react";
import { Camera, Image as ImageIcon, FileText, Loader2 } from "lucide-react";

export default function UploadOCR({ onTextExtracted }) {
  const [modo, setModo] = useState("foto");
  const [imagenPreview, setImagenPreview] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [error, setError] = useState("");
  const [textoPegado, setTextoPegado] = useState("");
  const fileInputRef = useRef(null);

  async function procesarImagen(file) {
    setError("");
    setProcesando(true);
    setProgreso(0);
    setImagenPreview(URL.createObjectURL(file));

    try {
      const Tesseract = (await import("tesseract.js")).default;
      const { data } = await Tesseract.recognize(file, "spa", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgreso(Math.round(m.progress * 100));
          }
        },
      });

      const text = data.text?.trim() || "";
      const confidence = typeof data.confidence === "number" ? data.confidence / 100 : null;
      onTextExtracted({ text, confidence });
    } catch (err) {
      console.error(err);
      setError(
        "No se pudo procesar la imagen con OCR. Revisa tu conexión (la primera vez descarga el modelo) o usa la opción 'Pegar texto'."
      );
    } finally {
      setProcesando(false);
    }
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) procesarImagen(file);
  }

  function handleTextoPegado() {
    if (textoPegado.trim().length < 5) return;
    onTextExtracted({ text: textoPegado.trim(), confidence: null });
  }

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          className={modo === "foto" ? "btn-primary" : "btn-secondary"}
          onClick={() => setModo("foto")}
          style={{ flex: 1 }}
        >
          Foto / Escaneo (OCR)
        </button>
        <button
          type="button"
          className={modo === "texto" ? "btn-primary" : "btn-secondary"}
          onClick={() => setModo("texto")}
          style={{ flex: 1 }}
        >
          Pegar texto
        </button>
      </div>

      {modo === "foto" && (
        <>
          <div
            style={{
              border: "1px dashed var(--navy-700)",
              borderRadius: 12,
              padding: 18,
              textAlign: "center",
            }}
          >
            {imagenPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imagenPreview}
                alt="Documento cargado"
                style={{ maxWidth: "100%", maxHeight: 220, borderRadius: 8, marginBottom: 12 }}
              />
            ) : (
              <ImageIcon size={34} color="var(--ink-400)" style={{ marginBottom: 8 }} />
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <label className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Camera size={16} /> Tomar foto
                <input type="file" accept="image/*" capture="environment" hidden onChange={handleFileChange} />
              </label>
              <label className="btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <ImageIcon size={16} /> Elegir de galería
                <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleFileChange} />
              </label>
            </div>
          </div>

          {procesando && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--ink-200)", fontSize: 13 }}>
              <Loader2 size={16} className="spin" />
              Extrayendo texto con OCR… {progreso}%
            </div>
          )}
        </>
      )}

      {modo === "texto" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <label style={{ fontSize: 13, color: "var(--ink-200)", display: "flex", alignItems: "center", gap: 6 }}>
            <FileText size={15} /> Pega aquí el texto del documento
          </label>
          <textarea
            rows={8}
            value={textoPegado}
            onChange={(e) => setTextoPegado(e.target.value)}
            placeholder="Copia y pega las observaciones clínicas o pedagógicas..."
          />
          <button
            className="btn-primary"
            disabled={textoPegado.trim().length < 5}
            onClick={handleTextoPegado}
            style={{ alignSelf: "flex-start" }}
          >
            Usar este texto
          </button>
        </div>
      )}

      {error && <div className="error-box">{error}</div>}
    </div>
  );
}
