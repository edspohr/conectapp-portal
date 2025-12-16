/* eslint-env node */
/* eslint-env node */
export default async function handler(req, res) {
  // Configuración de CORS
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Para el chat, esperamos 'contents' directamente o un prompt estructurado
    // El usuario pidió: "reciba solo el prompt directo".
    // Vamos a ser flexibles: esperamos { contents } compatible con la API de Gemini
    const { contents } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY no está configurada en el servidor.");
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents }),
    });

    const data = await response.json();

    if (!data.candidates || !data.candidates[0].content) {
      console.error("Gemini API Error:", data);
      throw new Error("Error en la respuesta de Gemini API");
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    res.status(200).json({ result: generatedText });
  } catch (error) {
    console.error("Server Error:", error);
    res
      .status(500)
      .json({ error: error.message || "Error interno del servidor" });
  }
}
