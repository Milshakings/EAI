// Cliente mínimo para el servidor local de Ollama (http://localhost:11434).
// Todo el procesamiento ocurre en la red local del establecimiento: ningún
// dato del estudiante sale a internet ni a un proveedor externo de IA.

export const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.1:8b";

export async function generarConOllama({ system, prompt, model = OLLAMA_MODEL }) {
  const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      system,
      prompt,
      stream: false,
      options: { temperature: 0.3 },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Ollama respondió con error ${res.status}. ¿Está corriendo "ollama serve" y descargado el modelo "${model}"? ${text}`
    );
  }

  const data = await res.json();
  return data.response?.trim() || "";
}
