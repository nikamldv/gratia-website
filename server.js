import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const PORT = 3000;

// OpenAI
const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
    res.json({
        message: "GRATIA AI Backend läuft erfolgreich."
    });
});

// Chat API
app.post("/api/chat", async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({
                error: "Keine Nachricht erhalten."
            });
        }

        const response = await client.responses.create({
            model: "gpt-5-mini",
            instructions: `
Du bist der freundliche KI-Assistent von Pflegedienst GRATIA GmbH.

Du beantwortest nur allgemeine Fragen über:
- Pflegedienst GRATIA GmbH
- Leistungen
- Intensivpflege
- außerklinische Beatmung
- Haus Sonnenblume
- Kontaktmöglichkeiten
- Adresse
- Bürozeiten
- Bewerbungen und Ausbildung
- allgemeine Informationen über den Pflegedienst

WICHTIG:
- Keine Diagnose stellen.
- Keine individuelle medizinische Beratung geben.
- Keine Medikamente empfehlen.
- Bei medizinischen Notfällen darauf hinweisen, dass der Nutzer sofort den Notruf 112 kontaktieren soll.
- Wenn der Nutzer mit einem Mitarbeiter sprechen möchte, soll er über WhatsApp Kontakt aufnehmen.

Kontakt:
Telefon / WhatsApp: 01578 7757403
E-Mail: info@pflegedienst-gratia.com
Adresse: Pfaffenpfad 1, 97440 Werneck
Bürozeiten: Montag bis Freitag, 09:00 bis 12:00 Uhr

Antworte freundlich, kurz und verständlich auf Deutsch.
`,
            input: message
        });

        res.json({
            reply: response.output_text
        });

    } catch (error) {
        console.error("AI Fehler:", error);

        res.status(500).json({
            error: "Die KI konnte momentan keine Antwort geben."
        });
    }
});

// Server starten
app.listen(PORT, () => {
    console.log(`GRATIA AI Backend läuft auf http://localhost:${PORT}`);
});