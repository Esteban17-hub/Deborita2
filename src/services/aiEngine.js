// Motor de Inteligencia Artificial para Tesorito
// Soporta nativamente Groq (Llama 3) y como fallback Google Gemini

import { GoogleGenerativeAI } from '@google/generative-ai';

let genAIInstance = null;

export function getAI() {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  const localKey = localStorage.getItem('deborita_gemini_key');
  const key = (localKey || envKey)?.trim();
  
  if (!key) {
    throw new Error('No se encontró una clave API para Tesorito. Configúrala en el sistema.');
  }
  return key;
}

export async function processWithTesorito(text, base64Image = null, mimeType = null) {
  try {
    const apiKey = getAI();

    const response = await fetch("/api/tesorito", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        apiKey,
        text,
        base64Image,
        mimeType
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || `Error del servidor: ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    console.error("Error en Tesorito:", err);
    throw new Error(err.message || "Fallo en la comunicación con la Inteligencia Artificial.");
  }
}
