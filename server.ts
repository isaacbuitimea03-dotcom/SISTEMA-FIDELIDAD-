import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  query, 
  where 
} from "firebase/firestore";
import webPush from "web-push";
import firebaseConfig from "./firebase-applet-config.json";
import { GoogleGenAI } from "@google/genai";

// Initialize Firebase with config
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

// Initialize GoogleGenAI SDK with recommended user-agent header
const ai_genai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const app = express();
const PORT = 3000;

app.use(express.json());

// Stable memory container for VAPID Keys
let vapidKeys: { publicKey: string; privateKey: string } | null = null;

// Retrieve or dynamically generate stable VAPID key pairs within Firestore configuration space
async function getOrCreateVapidKeys() {
  if (vapidKeys) return vapidKeys;
  try {
    const docRef = doc(db, "config", "vapid_keys");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      vapidKeys = docSnap.data() as { publicKey: string; privateKey: string };
      console.log("[SERVER] VAPID keys loaded from Firestore configuration documents.");
    } else {
      const generated = webPush.generateVAPIDKeys();
      vapidKeys = {
        publicKey: generated.publicKey,
        privateKey: generated.privateKey
      };
      await setDoc(docRef, vapidKeys);
      console.log("[SERVER] VAPID keys generated and persisted successfully inside Firestore config.");
    }
  } catch (error) {
    console.error("[SERVER] Error retrieving stable VAPID config:", error);
    // Temporary fallback on absolute emergency database lookup failures
    if (!vapidKeys) {
      const generated = webPush.generateVAPIDKeys();
      vapidKeys = { publicKey: generated.publicKey, privateKey: generated.privateKey };
    }
  }
  return vapidKeys;
}

// Setup global webpush keys
async function configureWebPush() {
  try {
    const keys = await getOrCreateVapidKeys();
    webPush.setVapidDetails(
      "mailto:soporte@bistromicafecito.com",
      keys.publicKey,
      keys.privateKey
    );
    console.log("[SERVER] Web Push module initialized successfully.");
  } catch (err) {
    console.error("[SERVER] Failed to configure push credentials:", err);
  }
}

// API: Get VAPID Public Key for client browser subscriptions
app.get("/api/push-public-key", async (req, res) => {
  try {
    const keys = await getOrCreateVapidKeys();
    res.json({ publicKey: keys.publicKey });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to retrieve public key" });
  }
});

// API: Broadcast real Web Push notifications instantly to target client devices.
// This handles sending push updates to browsers when they are fully minimized, closed, or locked in iOS/Android.
app.post("/api/send-push", async (req, res) => {
  const { title, body, targetCustomerFolio, icon } = req.body;

  if (!title || !body) {
    return res.status(400).json({ error: "Missing notification parameters" });
  }

  try {
    await configureWebPush();

    // Fetch active push subscriptions from Firestore
    const subscriptionsRef = collection(db, "push_subscriptions");
    let snapshot;

    if (targetCustomerFolio && targetCustomerFolio !== "all") {
      // Query specific customer folio
      const q = query(subscriptionsRef, where("folio", "==", targetCustomerFolio));
      snapshot = await getDocs(q);
    } else {
      // Fetch all customer subscriptions
      snapshot = await getDocs(subscriptionsRef);
    }

    const recipients: any[] = [];
    snapshot.forEach((docSnap) => {
      recipients.push({ docId: docSnap.id, ...docSnap.data() });
    });

    console.log(`[PUSH] Found ${recipients.length} target subscriptions for folio [${targetCustomerFolio}].`);

    if (recipients.length === 0) {
      return res.json({ status: "success", deliveredCount: 0, message: "No subscribers found" });
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: icon || "coffee",
      url: "/"
    });

    const sendPromises = recipients.map(async (rec) => {
      if (!rec.subscription) return;
      try {
        await webPush.sendNotification(rec.subscription, payload);
        console.log(`[PUSH] Success payload delivery to subscription user: [${rec.folio}]`);
      } catch (err: any) {
        console.warn(`[PUSH] Subscription error or expired token for User ${rec.folio}:`, err.message);
        // Note: In a production environment we can optionally purge stale subscriptions
      }
    });

    await Promise.all(sendPromises);
    res.json({ status: "success", deliveredCount: recipients.length });
  } catch (err: any) {
    console.error("[SERVER] Error sending web push notifications:", err);
    res.status(500).json({ error: err.message || "Push dispatch failed" });
  }
});

// Helper to generate dynamic, contextual fallback marketing conclusion in case of Gemini API unavailability
function getFallbackConclusion(surveys: any[], surveyAnswers: any[]) {
  const activeSurveys = (surveys || []).filter(s => s && s.active);
  const activeSurveyIds = new Set(activeSurveys.map(s => s.id));
  const activeAnswers = (surveyAnswers || []).filter(ans => ans && activeSurveyIds.has(ans.surveyId));

  const totalSurveys = activeSurveys.length;
  const totalAnswers = activeAnswers.length;

  let positiveChoices = 0;
  let totalMCOptionsCount = 0;

  const strengthsSet = new Set<string>();
  const opportunitiesSet = new Set<string>();
  const answerFrequencies: Record<string, Record<string, number>> = {};

  activeAnswers.forEach(ans => {
    if (!ans || !ans.answers || !Array.isArray(ans.answers)) return;
    ans.answers.forEach((sub: any) => {
      const qText = sub.questionText;
      const aText = sub.answerText;
      if (!qText || !aText) return;

      if (!answerFrequencies[qText]) {
        answerFrequencies[qText] = {};
      }
      answerFrequencies[qText][aText] = (answerFrequencies[qText][aText] || 0) + 1;

      totalMCOptionsCount++;
      const lowerAns = aText.toLowerCase();
      if (
        lowerAns.includes("excelente") || 
        lowerAns.includes("bueno") || 
        lowerAns.includes("rápido") || 
        lowerAns.includes("inmediato") || 
        lowerAns.includes("estándar") || 
        lowerAns.includes("sí") ||
        lowerAns.includes("si") ||
        lowerAns.includes("satisfecho") ||
        lowerAns.includes("leal") ||
        lowerAns.includes("5") ||
        lowerAns.includes("4")
      ) {
        positiveChoices++;
      }
    });
  });

  // Populate dynamic strengths and opportunities based on percentage distribution of actual questions
  Object.entries(answerFrequencies).forEach(([qText, freqMap]) => {
    const answersList = Object.entries(freqMap);
    const qTotal = answersList.reduce((sum, [_, count]) => sum + count, 0);
    
    answersList.forEach(([aText, count]) => {
      const pct = (count / qTotal) * 100;
      const lowerAns = aText.toLowerCase();
      
      if (pct >= 50) {
        if (
          lowerAns.includes("excelente") || 
          lowerAns.includes("bueno") || 
          lowerAns.includes("rápido") || 
          lowerAns.includes("inmediato") || 
          lowerAns.includes("sí") ||
          lowerAns.includes("si")
        ) {
          strengthsSet.add(`La mayoría (${Math.round(pct)}%) percibe de manera óptima el aspecto de "${qText}".`);
        } else if (
          lowerAns.includes("malo") || 
          lowerAns.includes("lento") || 
          lowerAns.includes("no") || 
          lowerAns.includes("insatisfecho")
        ) {
          opportunitiesSet.add(`Foco de atención en "${qText}": un ${Math.round(pct)}% de socios califica desfavorablemente.`);
        }
      } else if (pct >= 20) {
        if (
          lowerAns.includes("lento") || 
          lowerAns.includes("malo") || 
          lowerAns.includes("no")
        ) {
          opportunitiesSet.add(`Sugerencia de optimización en "${qText}": ${Math.round(pct)}% menciona áreas de mejora.`);
        }
      }
    });
  });

  if (strengthsSet.size === 0) {
    if (totalSurveys > 0) {
      strengthsSet.add(`Medición en curso para ${totalSurveys} campaña(s) activa(s).`);
    } else {
      strengthsSet.add("Análisis de experiencia del socio y hábitos de visita activo.");
    }
  }
  if (opportunitiesSet.size === 0) {
    opportunitiesSet.add("Ampliar el volumen de respuestas recolectadas para maximizar precisión.");
  }

  const keyStrengths = Array.from(strengthsSet).slice(0, 3);
  const keyOpportunities = Array.from(opportunitiesSet).slice(0, 3);

  const rawPct = totalMCOptionsCount > 0 ? (positiveChoices / totalMCOptionsCount) * 100 : 85;
  const acceptanceScore = Math.round(rawPct);
  
  let satisfactionLevel: "Excelente" | "Favorable" | "En Observación" | "Atención Requerida" = "Favorable";
  if (acceptanceScore >= 90) satisfactionLevel = "Excelente";
  else if (acceptanceScore >= 75) satisfactionLevel = "Favorable";
  else if (acceptanceScore >= 60) satisfactionLevel = "En Observación";
  else satisfactionLevel = "Atención Requerida";

  let generalConclusion = "";
  if (totalAnswers > 0) {
    generalConclusion = `Según el reporte de ${totalAnswers} respuesta(s) recolectada(s), los socios de "Mi Cafecito" expresan un promedio de satisfacción del ${acceptanceScore}%, resultando en un estatus ${satisfactionLevel.toLowerCase()}. `;
    if (keyStrengths.length > 0) {
      generalConclusion += `Se valida un desempeño sobresaliente en métricas de fidelización y servicio. `;
    }
    if (keyOpportunities.length > 0) {
      generalConclusion += `Se aconseja implementar las prioridades de mejora señaladas para consolidar la retención de clientes frecuentes.`;
    }
  } else {
    generalConclusion = `Con ${totalSurveys} campañas activas, el sistema está listo para recopilar datos. Se generará un análisis de mercadeo detallado una vez que los primeros clientes respondan.`;
  }

  const actionableInsights = [
    "Vincular los incentivos configurados con cuestionarios ágiles al momento del registro.",
    "Atender puntualmente los comentarios críticos reportados en el portal.",
    "Proyectar capacitaciones al personal basadas en las fortalezas percibidas por la clientela."
  ];

  return {
    acceptanceScore,
    satisfactionLevel,
    keyStrengths,
    keyOpportunities,
    generalConclusion,
    actionableInsights
  };
}

// API: Generate Dynamic AI Marketing Conclusion using Gemini 3.5 Flash
app.post("/api/gemini/marketing-conclusion", async (req, res) => {
  const { surveys, surveyAnswers } = req.body;
  if (!surveys || !surveyAnswers) {
    return res.status(400).json({ error: "Missing surveys or surveyAnswers data" });
  }

  try {
    const prompt = `Analiza los siguientes datos de encuestas y respuestas obtenidos en la cafetería/bistro "Mi Cafecito" y genera un resumen ejecutivo profesional y estratégico de mercadeo.
    
    ENCUESTAS CONFIGURADAS Y ACTIVAS EN EL SISTEMA:
    ${JSON.stringify(surveys, null, 2)}
    
    RESPUESTAS OBTENIDAS DE LOS CLIENTES (SOLO DE ENCUESTAS ACTIVAS):
    ${JSON.stringify(surveyAnswers, null, 2)}
    
    REGLA CRÍTICA DE CONTEXTO:
    - Debes basar tu análisis ÚNICAMENTE en las preguntas y respuestas reales provistas arriba.
    - NO menciones el café, sabor de grano de café, espresso, baristas o moliendas a menos de que un elemento de las encuestas configuradas arriba contenga explícitamente preguntas sobre café.
    - Si las encuestas tratan sobre otros temas (como servicio general, amabilidad, limpieza, promociones, desayunos o postres), tu conclusión, fortalezas ("keyStrengths") y oportunidades ("keyOpportunities") deben estar estrictamente limitadas a esos temas específicos. En ningún caso asumas plantillas genéricas sobre café.
    
    Por favor responde en formato JSON con la siguiente estructura exacta:
    {
      "acceptanceScore": <número de 0 a 100 de satisfacción general calculada óptimamente>,
      "satisfactionLevel": "Excelente" | "Favorable" | "En Observación" | "Atención Requerida",
      "keyStrengths": [<lista de hasta 3 fortalezas clave encontradas en las respuestas o encuestas>],
      "keyOpportunities": [<lista de hasta 3 áreas de oportunidad o puntos por mejorar encontrados>],
      "generalConclusion": "<un párrafo descriptivo, analítico y redactado de manera formal que resuma el estado del servicio, producto y recomendación principal de fidelización>",
      "actionableInsights": [<lista de hasta 4 acciones estratégicas recomendadas para aumentar la retención de clientes>]
    }
    
    REGLA: Responde ÚNICAMENTE con el objeto JSON, asegúrate de que sea JSON válido sin texto adicional, explicaciones ni tags markdown como \`\`\`json.`;

    let response;
    try {
      response = await ai_genai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
    } catch (e1) {
      console.warn("[GEMINI] First attempt with gemini-2.5-flash failed, retrying with gemini-1.5-flash:", e1);
      response = await ai_genai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: prompt,
      });
    }

    const text = response.text || "{}";
    let cleanText = text.trim();
    if (cleanText.startsWith("```json")) {
      cleanText = cleanText.substring(7);
    }
    if (cleanText.endsWith("```")) {
      cleanText = cleanText.substring(0, cleanText.length - 3);
    }
    cleanText = cleanText.trim();
    
    const parsed = JSON.parse(cleanText);
    res.json(parsed);
  } catch (error: any) {
    console.warn("[GEMINI] Model unavailable, activating mathematical fallback conclusion generator:", error);
    // Graceful fallback to prevent user error blocks
    const fallback = getFallbackConclusion(surveys, surveyAnswers);
    res.json(fallback);
  }
});

// Setup Vite and serve routes
async function startServer() {
  await configureWebPush();

  // Vite development middleware or static production handler
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] Running full-stack on http://0.0.0.0:${PORT}`);
  });
}

startServer();
