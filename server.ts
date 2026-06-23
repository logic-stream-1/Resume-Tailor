import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

let supabaseClient: any = null;

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    return null;
  }
  if (!supabaseClient) {
    supabaseClient = createClient(url, key, {
      auth: { persistSession: false },
      db: { schema: "resume_tailor" }
    });
  }
  return supabaseClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for tailoring
  app.post("/api/tailor", async (req, res) => {
    try {
      const { jobDescription, resume } = req.body;

      // Validation
      if (!jobDescription || !resume) {
        return res.status(400).json({ error: "Both Job Description and Resume are required.", code: "VALIDATION_ERROR" });
      }

      if (jobDescription.trim().length < 50) {
        return res.status(400).json({ error: "Job Description must be at least 50 characters long.", code: "VALIDATION_ERROR" });
      }

      if (resume.trim().length < 100) {
        return res.status(400).json({ error: "Resume must be at least 100 characters long.", code: "VALIDATION_ERROR" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error("Missing GEMINI_API_KEY in environment");
        return res.status(500).json({ error: "Gemini API key is not configured inside the Secrets panel.", code: "CONFIG_ERROR" });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const startTime = Date.now();

      // prompt
      const systemPrompt = `You are a professional resume tailoring assistant.

CRITICAL CONSTRAINT — NO FABRICATION:
Never invent, add, or imply any skill, technology, metric, job title, company name,
certification, or achievement not explicitly present in the user's original resume.
Your job is to REPHRASE and REORDER what already exists — not to create new content.

INPUT:
The user will provide:
1. JOB DESCRIPTION — the role they are applying for
2. ORIGINAL RESUME — their existing resume text

YOUR OUTPUT — four sections, in this exact order, separated by the delimiter ---SECTION---:

SECTION 1 — REWRITTEN SUMMARY:
Rewrite the resume summary or profile section to mirror the language and priorities
of the job description. Use only skills and experience present in the original resume.

---SECTION---

SECTION 2 — REWRITTEN BULLETS:
For each role in the original resume, output the role title and company on one line,
then each bullet rewritten to use vocabulary from the job description where there is
a genuine semantic match. Keep the same achievement — rephrase the language.
Do not add metrics that were not in the original. Format each bullet starting with •

---SECTION---

SECTION 3 — KEYWORD GAPS:
List 3–5 keywords or phrases present in the job description but absent from the
original resume. For each, label it either:
[GENUINE GAP] — the user truly lacks this skill or experience
[REPHRASE OPPORTUNITY] — the skill likely exists but the language does not match

---SECTION---

SECTION 4 — METRICS:
Output exactly the following three lines with appropriate estimations based on the comparison:
ATS Match Score: [Estimate a realistic percentage integer between 0 and 100 representing how well the original resume matches the job description based on keywords and skills overlap]
Target Job Title: [The title of the job described, or "Not specified"]
Target Company: [The company name described, or "Not specified"]

OUTPUT FORMAT: Only the four sections above, separated by ---SECTION---. No
preamble, no commentary, no closing remarks. Plain text only.`;

      const prompt = `JOB DESCRIPTION:\n${jobDescription}\n\nORIGINAL RESUME:\n${resume}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.15, // Keep temperature low to stay anchored to the original facts
        }
      });

      const timeMs = Date.now() - startTime;
      const text = response.text || "";

      // Parse the output segments split by ---SECTION---
      const parts = text.split("---SECTION---").map(p => p.trim());
      
      const summary = parts[0] ? parts[0].replace(/^SECTION 1\s*[—-]\s*REWRITTEN SUMMARY:\s*/i, "") : "No summary generated.";
      const bullets = parts[1] ? parts[1].replace(/^SECTION 2\s*[—-]\s*REWRITTEN BULLETS:\s*/i, "") : "No bullets generated.";
      const keywordGaps = parts[2] ? parts[2].replace(/^SECTION 3\s*[—-]\s*KEYWORD GAPS:\s*/i, "") : "No keyword gaps generated.";

      // Parse metrics from Section 4
      const metricsText = parts[3] || "";
      const matchScoreMatch = metricsText.match(/ATS Match Score:\s*(\d+)/i);
      const matchScore = matchScoreMatch ? parseInt(matchScoreMatch[1]) : 75;
      
      const jobTitleMatch = metricsText.match(/Target Job Title:\s*(.+)/i);
      const jobTitle = jobTitleMatch ? jobTitleMatch[1].trim() : "Target Role";

      const companyMatch = metricsText.match(/Target Company:\s*(.+)/i);
      const companyName = companyMatch ? companyMatch[1].trim() : "Not specified";

      return res.json({
        summary,
        bullets,
        keywordGaps,
        matchScore,
        jobTitle,
        companyName,
        timeMs
      });

    } catch (error: any) {
      console.error("General Tailoring Error:", error);
      return res.status(500).json({ 
        error: "Tailoring failed. Please try again.", 
        code: "TAILOR_ERROR"
      });
    }
  });

  // API Route for drafting a single bullet for a keyword gap
  app.post("/api/draft-bullet", async (req, res) => {
    try {
      const { keyword, context, resumeContext } = req.body;
      if (!keyword || !context) {
        return res.status(400).json({ error: "Keyword and context details are required." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Gemini API key is not configured." });
      }

      const ai = new GoogleGenAI({ apiKey });

      const systemPrompt = `You are a professional resume writer.
The user wants to draft a SINGLE high-impact resume achievement bullet point that integrates a specific keyword or skill they currently lack or want to rephrase.

CRITICAL INSTRUCTIONS:
1. Write exactly one professional bullet point.
2. The bullet MUST naturally integrate the keyword: "${keyword}".
3. The bullet MUST be anchored in the context provided by the user: "${context}".
4. Avoid fabricating metrics. If the user provides a percentage or number, keep it; if not, do not invent artificial metrics.
5. Format the output to start with a bullet symbol: •
6. Keep it concise, action-oriented, and professional. Plain text only. No preamble or introductory text.`;

      const prompt = `Draft a high-impact achievement bullet.
Keyword: ${keyword}
Context details: ${context}
User's existing background context: ${resumeContext || "Not provided"}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.25
        }
      });

      const bullet = response.text ? response.text.trim() : `• Successfully integrated ${keyword} into operations to resolve: ${context}`;
      return res.json({ bullet });

    } catch (err: any) {
      console.error("Draft bullet error:", err);
      return res.status(500).json({ error: "Failed to generate drafted bullet point." });
    }
  });

  // Supabase connection status check
  app.get("/api/supabase/status", async (req, res) => {
    try {
      const url = process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_ANON_KEY;
      
      if (!url || !key) {
        return res.json({
          configured: false,
          connected: false,
          tablesExist: false,
          error: "Supabase environment variables (SUPABASE_URL, SUPABASE_ANON_KEY) are not set.",
          url: null
        });
      }

      const client = getSupabase();
      if (!client) {
        return res.json({
          configured: false,
          connected: false,
          tablesExist: false,
          error: "Failed to initialize Supabase client.",
          url: url ? url.substring(0, 20) + "..." : null
        });
      }

      // Check if tables exist by making a quick select
      const { data: profileCheck, error: profileError } = await client
        .from("profiles")
        .select("id")
        .limit(1);

      const { data: sessionCheck, error: sessionError } = await client
        .from("sessions")
        .select("id")
        .limit(1);

      const profileTableExists = !profileError || profileError.code !== "42P01";
      const sessionTableExists = !sessionError || sessionError.code !== "42P01";
      const tablesExist = profileTableExists && sessionTableExists;

      let connError = null;
      if (profileError && profileError.code !== "42P01") {
        connError = profileError.message;
      } else if (sessionError && sessionError.code !== "42P01") {
        connError = sessionError.message;
      }

      return res.json({
        configured: true,
        connected: !connError,
        tablesExist,
        profileTableExists,
        sessionTableExists,
        error: connError,
        url: url ? url.replace(/^(https?:\/\/)?([^\/]+).*/i, "$2") : null
      });

    } catch (err: any) {
      console.error("Supabase status check failed:", err);
      return res.json({
        configured: true,
        connected: false,
        tablesExist: false,
        error: err.message || "An error occurred while checking Supabase status.",
        url: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.replace(/^(https?:\/\/)?([^\/]+).*/i, "$2") : null
      });
    }
  });

  // Supabase sync and merge route
  app.post("/api/supabase/sync", async (req, res) => {
    try {
      const client = getSupabase();
      if (!client) {
        return res.status(400).json({ error: "Supabase is not configured on the server." });
      }

      const { userId, fullName, baseResume, sessions } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "userId is required for syncing." });
      }

      // 1. Upsert profile if provided
      if (fullName !== undefined) {
        const { error: profileErr } = await client
          .from("profiles")
          .upsert({
            id: userId,
            full_name: fullName,
            base_resume: baseResume || "",
            updated_at: new Date().toISOString()
          });

        if (profileErr) {
          console.error("Error saving profile to Supabase:", profileErr);
          return res.status(500).json({ error: `Failed to save profile: ${profileErr.message}` });
        }
      }

      // 2. Fetch remote sessions to perform a smart merge
      const { data: dbSessions, error: fetchErr } = await client
          .from("sessions")
          .select("*")
          .eq("user_id", userId);

      if (fetchErr) {
        console.error("Error fetching sessions from Supabase:", fetchErr);
        return res.status(500).json({ error: `Failed to fetch existing sessions: ${fetchErr.message}` });
      }

      // 3. Upsert local sessions into Supabase
      const localSessions: any[] = sessions || [];
      if (localSessions.length > 0) {
        const payload = localSessions.map(s => ({
          id: s.id,
          user_id: userId,
          date: s.date,
          job_description: s.jobDescription,
          resume: s.resume,
          summary: s.summary,
          bullets: s.bullets,
          keyword_gaps: s.keywordGaps,
          time_ms: s.timeMs,
          match_score: s.matchScore || 75,
          job_title: s.jobTitle || "Target Role",
          company_name: s.companyName || "Not specified",
          created_at: new Date(s.date).toISOString()
        }));

        const { error: upsertErr } = await client
          .from("sessions")
          .upsert(payload);

        if (upsertErr) {
          console.error("Error upserting sessions into Supabase:", upsertErr);
          return res.status(500).json({ error: `Failed to save sessions: ${upsertErr.message}` });
        }
      }

      // 4. Retrieve final merged session list from Supabase (including any sessions created elsewhere)
      const { data: finalDbSessions, error: finalFetchErr } = await client
        .from("sessions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (finalFetchErr) {
        console.error("Error fetching final sessions from Supabase:", finalFetchErr);
        return res.status(500).json({ error: `Failed to fetch final session list: ${finalFetchErr.message}` });
      }

      // Retrieve final profile as well
      const { data: finalProfile, error: profileFetchErr } = await client
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      // Map DB schema back to client-side interface TailoringSession
      const mappedSessions = (finalDbSessions || []).map(s => ({
        id: s.id,
        date: s.date || s.created_at,
        jobDescription: s.job_description,
        resume: s.resume,
        summary: s.summary,
        bullets: s.bullets,
        keywordGaps: s.keyword_gaps,
        timeMs: s.time_ms,
        matchScore: s.match_score || 75,
        jobTitle: s.job_title || "Target Role",
        companyName: s.company_name || "Not specified"
      }));

      return res.json({
        success: true,
        profile: finalProfile ? {
          fullName: finalProfile.full_name,
          baseResume: finalProfile.base_resume
        } : null,
        sessions: mappedSessions
      });

    } catch (err: any) {
      console.error("Sync handler crashed:", err);
      return res.status(500).json({ error: err.message || "Internal server error during sync." });
    }
  });

  // Serve static assets in production or use Vite middleware in dev
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
