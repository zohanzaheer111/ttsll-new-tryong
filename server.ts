import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { 
  ELEVENLABS_API_KEY, 
  ELEVENLABS_API_KEY_SECONDARY,
  ELEVENLABS_API_KEY_THIRD,
  ELEVENLABS_API_KEY_FOURTH,
  ELEVENLABS_API_KEY_FIFTH
} from "./constants";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ENV_PATH = path.join(__dirname, ".env");
const POOL_PATH = path.join(__dirname, "keys_pool.json");

// Helper to read/write pool
const getPool = () => {
  if (!fs.existsSync(POOL_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(POOL_PATH, "utf-8"));
  } catch (e) {
    return [];
  }
};

const savePool = (pool: any[]) => {
  fs.writeFileSync(POOL_PATH, JSON.stringify(pool, null, 2));
};

// Helper to update .env
const updateEnvFile = (key: string, value: string) => {
  let content = "";
  if (fs.existsSync(ENV_PATH)) {
    content = fs.readFileSync(ENV_PATH, "utf-8");
  }

  const lines = content.split(/\r?\n/);
  let found = false;
  const newLines = lines.map(line => {
    if (line.trim().startsWith(`${key}=`)) {
      found = true;
      return `${key}=${value}`;
    }
    return line;
  });

  if (!found) {
    newLines.push(`${key}=${value}`);
  }

  fs.writeFileSync(ENV_PATH, newLines.join("\n"));
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Helper to get API Key
  const getApiKey = (req: express.Request) => {
    // Priority 1: Direct API Key from header (for Admin managed keys)
    const directKey = req.headers['x-api-key'] as string;
    if (directKey) return directKey;

    // Priority 2: Account Index from header (for Env/Hardcoded keys)
    const accountIndex = parseInt(req.headers['x-account-index'] as string || '0', 10);
    
    switch (accountIndex) {
      case 1: return process.env.ELEVENLABS_API_KEY_SECONDARY;
      case 2: return process.env.ELEVENLABS_API_KEY_THIRD;
      case 3: return process.env.ELEVENLABS_API_KEY_FOURTH;
      case 4: return process.env.ELEVENLABS_API_KEY_FIFTH;
      case 0:
      default:
        return process.env.ELEVENLABS_API_KEY;
    }
  };

  // Admin Config - Returns labels and indices for configured keys
  app.get("/api/admin/config", (req, res) => {
    const keys = [
      { index: 0, label: process.env.ELEVENLABS_LABEL || "Main Account", active: !!process.env.ELEVENLABS_API_KEY },
      { index: 1, label: process.env.ELEVENLABS_LABEL_SECONDARY || "Secondary Account", active: !!process.env.ELEVENLABS_API_KEY_SECONDARY },
      { index: 2, label: process.env.ELEVENLABS_LABEL_THIRD || "Third Account", active: !!process.env.ELEVENLABS_API_KEY_THIRD },
      { index: 3, label: process.env.ELEVENLABS_LABEL_FOURTH || "Fourth Account", active: !!process.env.ELEVENLABS_API_KEY_FOURTH },
      { index: 4, label: process.env.ELEVENLABS_LABEL_FIFTH || "Fifth Account", active: !!process.env.ELEVENLABS_API_KEY_FIFTH },
    ];

    res.json({ keys });
  });

  // Keys Pool Endpoints
  app.get("/api/admin/pool", (req, res) => {
    res.json(getPool());
  });

  app.post("/api/admin/pool", async (req, res) => {
    const { key, label } = req.body;
    if (!key) return res.status(400).json({ error: "Key is required" });

    // Validate key with ElevenLabs
    try {
      const validateRes = await fetch("https://api.elevenlabs.io/v1/user", {
        headers: { "xi-api-key": key }
      });
      
      if (!validateRes.ok) {
        return res.status(401).json({ error: "Invalid ElevenLabs API Key" });
      }

      const userData = await validateRes.json();
      const finalLabel = label || userData.email || "New Key";

      const pool = getPool();
      const newKey = {
        id: Date.now().toString(),
        key,
        label: finalLabel,
        addedAt: new Date().toISOString(),
        enabled: true
      };
      pool.push(newKey);
      savePool(pool);
      res.json({ success: true, key: newKey });
    } catch (error) {
      console.error("Validation Error:", error);
      res.status(500).json({ error: "Failed to validate key with ElevenLabs" });
    }
  });

  app.patch("/api/admin/pool/:id", (req, res) => {
    const { enabled, label } = req.body;
    const pool = getPool();
    const keyIndex = pool.findIndex((k: any) => k.id === req.params.id);
    
    if (keyIndex === -1) return res.status(404).json({ error: "Key not found" });
    
    if (enabled !== undefined) pool[keyIndex].enabled = enabled;
    if (label !== undefined) pool[keyIndex].label = label;
    
    savePool(pool);
    res.json(pool[keyIndex]);
  });

  app.delete("/api/admin/pool/:id", (req, res) => {
    const pool = getPool();
    const newPool = pool.filter((k: any) => k.id !== req.params.id);
    savePool(newPool);
    res.json({ success: true });
  });

  // Assign Key to Slot
  app.post("/api/admin/assign", (req, res) => {
    const { slotIndex, apiKey, label } = req.body;
    if (slotIndex === undefined || !apiKey) {
      return res.status(400).json({ error: "Slot index and API key are required" });
    }

    const envKeys = [
      "ELEVENLABS_API_KEY",
      "ELEVENLABS_API_KEY_SECONDARY",
      "ELEVENLABS_API_KEY_THIRD",
      "ELEVENLABS_API_KEY_FOURTH",
      "ELEVENLABS_API_KEY_FIFTH"
    ];

    const labelKeys = [
      "ELEVENLABS_LABEL",
      "ELEVENLABS_LABEL_SECONDARY",
      "ELEVENLABS_LABEL_THIRD",
      "ELEVENLABS_LABEL_FOURTH",
      "ELEVENLABS_LABEL_FIFTH"
    ];

    if (slotIndex < 0 || slotIndex >= envKeys.length) {
      return res.status(400).json({ error: "Invalid slot index" });
    }

    updateEnvFile(envKeys[slotIndex], apiKey);
    if (label) {
      updateEnvFile(labelKeys[slotIndex], label);
    }

    // Update process.env so it's available immediately without restart
    process.env[envKeys[slotIndex]] = apiKey;
    if (label) {
      process.env[labelKeys[slotIndex]] = label;
    }

    res.json({ success: true, message: `Assigned to Slot ${slotIndex + 1}` });
  });

  // Admin Login
  app.post("/api/admin/login", (req, res) => {
    const { username, password } = req.body;
    const adminUser = process.env.ADMIN_USERNAME;
    const adminPass = process.env.ADMIN_PASSWORD;

    if (!adminUser || !adminPass) {
      return res.status(500).json({ error: "Admin credentials not configured in server environment" });
    }

    if (username === adminUser && password === adminPass) {
      res.json({ success: true, token: "admin-session-token" }); 
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // Proxy for ElevenLabs User Info
  app.get("/api/user", async (req, res) => {
    try {
      const apiKey = getApiKey(req);
      if (!apiKey) {
        return res.status(500).json({ error: "Server configuration error: Missing API Key" });
      }

      const response = await fetch("https://api.elevenlabs.io/v1/user", {
        headers: {
          "xi-api-key": apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({ error: errorText });
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Proxy for ElevenLabs TTS
  app.post("/api/tts", async (req, res) => {
    try {
      const apiKey = getApiKey(req);
      if (!apiKey) {
        return res.status(500).json({ error: "Server configuration error: Missing API Key" });
      }

      const { voiceId, text, modelId, voiceSettings } = req.body;
      
      if (!voiceId || !text) {
        return res.status(400).json({ error: "Missing voiceId or text" });
      }

      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: modelId || "eleven_monolingual_v1",
          voice_settings: voiceSettings || {
            stability: 0.5,
            similarity_boost: 0.75
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          return res.status(response.status).json(errorJson);
        } catch {
          return res.status(response.status).json({ error: errorText });
        }
      }

      // ElevenLabs returns audio/mpeg
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      res.setHeader('Content-Type', 'audio/mpeg');
      res.send(buffer);

    } catch (error: any) {
      console.error("TTS Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Proxy for ElevenLabs Voices List
  app.get("/api/voices", async (req, res) => {
    try {
      const apiKey = getApiKey(req);
      if (!apiKey) {
         // If no API key is configured, return empty list or error. 
         // For now, let's return error to prompt user to set it up.
         return res.status(500).json({ error: "Server configuration error: Missing API Key" });
      }

      const response = await fetch("https://api.elevenlabs.io/v1/voices", {
        headers: {
          "xi-api-key": apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          return res.status(response.status).json(errorJson);
        } catch {
          return res.status(response.status).json({ error: errorText });
        }
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Proxy for ElevenLabs Subscription Info
  app.get("/api/subscription", async (req, res) => {
    try {
      const apiKey = getApiKey(req);
      if (!apiKey) {
        return res.status(500).json({ error: "Server configuration error: Missing API Key" });
      }

      const response = await fetch("https://api.elevenlabs.io/v1/user/subscription", {
        headers: {
          "xi-api-key": apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          return res.status(response.status).json(errorJson);
        } catch {
          return res.status(response.status).json({ error: errorText });
        }
      }

      const data = await response.json();
      // Calculate remaining characters if not provided by API (though ElevenLabs usually provides it)
      const character_count = data.character_count;
      const character_limit = data.character_limit;
      const remaining_characters = character_limit - character_count;
      
      res.json({
        ...data,
        remaining_characters // Ensure it's explicitly included as requested
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Proxy for ElevenLabs Usage Stats
  app.get("/api/usage", async (req, res) => {
    try {
      const apiKey = getApiKey(req);
      if (!apiKey) {
        return res.status(500).json({ error: "Server configuration error: Missing API Key" });
      }

      // Get start_unix from query or default to 31 days ago to ensure full coverage
      const days = parseInt(req.query.days as string || '31', 10);
      const now = Math.floor(Date.now() / 1000);
      const start_unix = now - (days * 24 * 60 * 60);

      const url = `https://api.elevenlabs.io/v1/usage/character-stats?start_unix=${start_unix}&end_unix=${now}`;
      
      const response = await fetch(url, {
        headers: {
          "xi-api-key": apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`ElevenLabs Usage API Error (${response.status}):`, errorText);
        try {
          const errorJson = JSON.parse(errorText);
          return res.status(response.status).json({
            error: errorJson.detail?.message || errorJson.error || errorText,
            details: errorJson
          });
        } catch {
          return res.status(response.status).json({ error: errorText });
        }
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Usage Proxy Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Proxy for ElevenLabs Voice Cloning (Instant Voice Cloning)
  app.post("/api/voices/clone", async (req, res) => {
    try {
      const apiKey = getApiKey(req);
      if (!apiKey) {
        return res.status(500).json({ error: "Server configuration error: Missing API Key" });
      }

      const { name, files, description, labels } = req.body;

      if (!name || !files || !Array.isArray(files) || files.length === 0) {
        return res.status(400).json({ error: "Missing name or audio files" });
      }

      const formData = new FormData();
      formData.append('name', name);
      if (description) formData.append('description', description);
      if (labels) formData.append('labels', labels); // labels should be a JSON string if passed

      // Convert base64 files to Blobs and append
      for (const file of files) {
        // file.content is base64 string
        const buffer = Buffer.from(file.content, 'base64');
        const blob = new Blob([buffer], { type: 'audio/mpeg' }); // ElevenLabs accepts audio/mpeg, audio/wav, etc.
        formData.append('files', blob, 'sample.mp3');
      }

      const response = await fetch("https://api.elevenlabs.io/v1/voices/add", {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          // Fetch automatically sets Content-Type to multipart/form-data with boundary
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          return res.status(response.status).json(errorJson);
        } catch {
          return res.status(response.status).json({ error: errorText });
        }
      }

      const data = await response.json();
      res.json(data);

    } catch (error: any) {
      console.error("Clone Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Proxy for ElevenLabs History
  app.get("/api/history", async (req, res) => {
    try {
      const apiKey = getApiKey(req);
      if (!apiKey) return res.status(500).json({ error: "Missing API Key" });

      const pageSize = req.query.page_size || '100';
      const response = await fetch(`https://api.elevenlabs.io/v1/history?page_size=${pageSize}`, {
        headers: { "xi-api-key": apiKey }
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({ error: errorText });
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/history/:id/audio", async (req, res) => {
    try {
      const apiKey = getApiKey(req);
      if (!apiKey) return res.status(500).json({ error: "Missing API Key" });

      const { id } = req.params;
      const response = await fetch(`https://api.elevenlabs.io/v1/history/${id}/audio`, {
        headers: { "xi-api-key": apiKey }
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({ error: errorText });
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      res.setHeader('Content-Type', 'audio/mpeg');
      res.send(buffer);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
