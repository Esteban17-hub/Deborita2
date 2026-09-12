export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { apiKey, text, base64Image, mimeType } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: 'API Key is required' });
    }

    const systemInstruction = `Eres "Tesorito", el asistente de contabilidad inteligente de una iglesia.
Tu tarea es analizar el texto o la imagen de un comprobante proporcionado por el usuario y extraer los datos para registrar un asiento contable.

Debes responder SIEMPRE Y ÚNICAMENTE con un objeto JSON válido (sin formato markdown ni texto adicional).
El JSON debe tener la siguiente estructura estricta:

{
  "action": "CREATE_OFFERING" | "CREATE_TITHE" | "CREATE_MOVEMENT" | "CREATE_PROJECT" | "UNKNOWN",
  "data": {
    "amount": numero,
    "destinationCommitteeName": string o null,
    "description": string,
    "date": "YYYY-MM-DD",
    "memberOrGroupName": string,
    "type": "INGRESO" | "EGRESO",
    "committeeName": string,
    "name": string,
    "targetAmount": numero o null
  },
  "confidence": numero (0 a 100, indicando seguridad de la lectura),
  "humanSummary": "Un mensaje amigable y corto en español explicando qué entendiste."
}

REGLAS VITALES:
- Usa la fecha actual si no se especifica (asume ${new Date().toISOString().slice(0, 10)}).
- Elimina cualquier formato de moneda, solo usa números enteros.
- NUNCA devuelvas nada que no sea JSON puro.
`;

    const promptText = `Analiza la siguiente instrucción o comprobante y conviértelo a formato contable JSON.\n\nInstrucción del usuario: "${text || 'Ninguna, lee la imagen.'}"`;

    let messages = [
      { role: "system", content: systemInstruction },
      { role: "user", content: promptText }
    ];

    let url = "https://api.groq.com/openai/v1/chat/completions";
    let modelName = "llama-3.1-8b-instant";
    let bodyPayload = { model: modelName, messages: messages, temperature: 0.1 };
    let headers = { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" };

    if (apiKey.startsWith('AIzaSy')) {
      const geminiModels = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-pro'];
      let lastGeminiError = null;
      let response = null;

      for (const geminiModel of geminiModels) {
        try {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`;
          let contents = [{ role: "user", parts: [{ text: systemInstruction + "\n\n" + promptText }] }];
          if (base64Image && mimeType) {
            contents[0].parts.push({ inline_data: { mime_type: mimeType, data: base64Image.split(',').pop() } });
          }
          const res = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents })
          });
          if (res.ok) {
            response = res;
            break;
          } else {
            lastGeminiError = await res.text();
          }
        } catch (e) {
          lastGeminiError = e.message;
        }
      }

      if (!response) {
        return res.status(400).json({ error: `Gemini Provider Error: ${lastGeminiError}` });
      }

      const result = await response.json();
      let textResponse = result.candidates[0].content.parts[0].text.trim();
      textResponse = textResponse.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
      return res.status(200).json(JSON.parse(textResponse));
    } else {
      // Groq API con modelos actualizados y fallback
      const textModels = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "llama3-70b-8192", "llama3-8b-8192", "gemma2-9b-it", "mixtral-8x7b-32768"];
      const visionModels = ["llama-3.2-11b-vision-preview", "llama-3.2-90b-vision-preview"];
      const modelsToTry = (base64Image && mimeType) ? visionModels : textModels;

      let lastGroqError = null;
      let response = null;

      for (const modelToUse of modelsToTry) {
        try {
          let reqMessages = [
            { role: "system", content: systemInstruction }
          ];

          if (base64Image && mimeType) {
            reqMessages.push({
              role: "user",
              content: [
                { type: "text", text: promptText },
                { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image.split(',').pop()}` } }
              ]
            });
          } else {
            reqMessages.push({ role: "user", content: promptText });
          }

          const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: modelToUse,
              messages: reqMessages,
              temperature: 0.1
            })
          });

          if (res.ok) {
            response = res;
            break;
          } else {
            lastGroqError = await res.text();
          }
        } catch (e) {
          lastGroqError = e.message;
        }
      }

      if (!response) {
        return res.status(400).json({ error: `Groq Provider Error: ${lastGroqError}` });
      }

      const result = await response.json();
      let textResponse = result.choices[0].message.content.trim();
      textResponse = textResponse.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
      return res.status(200).json(JSON.parse(textResponse));
    }
  } catch (error) {
    console.error("Serverless API Error:", error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
