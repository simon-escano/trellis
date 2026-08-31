import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { config } from "../config.js";
import {
  DocumentAnalysisOutput,
  DocumentAnalysisOutputSchema,
  EntityCategory,
  ExtractedEntity,
  ExtractedRelationship,
} from "../contracts/extraction.js";

/**
 * Deterministic Zero-Cost Mock Extraction Engine
 * Provides instant, offline knowledge graph generation without external API dependencies.
 */
export function generateMockAnalysis(
  rawText: string,
  title?: string
): DocumentAnalysisOutput {
  const docTitle = title || "Document Overview";

  // Clean text and split sentences
  const sentences = rawText
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);

  // Generate plain-language executive summary
  const summary =
    sentences.length > 0
      ? sentences.slice(0, 3).join(" ")
      : `Executive analysis for "${docTitle}": Core concepts and dependency relationships mapped successfully.`;

  // Pre-seed known domain scenarios or general keyword extraction
  const lower = rawText.toLowerCase();

  let entities: ExtractedEntity[] = [];
  let relationships: ExtractedRelationship[] = [];

  if (lower.includes("caffeine") && lower.includes("adenosine")) {
    // Preset 1: Sleep Architecture
    entities = [
      { name: "Caffeine", category: "CONCEPT", confidenceScore: 0.98, metadata: { type: "Stimulant" } },
      { name: "Adenosine Receptors", category: "CONCEPT", confidenceScore: 0.95, metadata: { target: "A1/A2A" } },
      { name: "Sleep Pressure", category: "CONCEPT", confidenceScore: 0.92, metadata: { mechanism: "Homeostatic" } },
      { name: "Melatonin", category: "CONCEPT", confidenceScore: 0.94, metadata: { hormone: "Circadian" } },
      { name: "Slow-Wave Deep Sleep", category: "CONCEPT", confidenceScore: 0.96, metadata: { stage: "N3" } },
      { name: "Memory Consolidation", category: "CONCEPT", confidenceScore: 0.93, metadata: { function: "Cognitive" } },
    ];
    relationships = [
      { sourceEntityName: "Caffeine", targetEntityName: "Adenosine Receptors", relationType: "BLOCKS", confidenceScore: 0.99 },
      { sourceEntityName: "Adenosine Receptors", targetEntityName: "Sleep Pressure", relationType: "REGULATES", confidenceScore: 0.95 },
      { sourceEntityName: "Sleep Pressure", targetEntityName: "Melatonin", relationType: "TRIGGERS", confidenceScore: 0.92 },
      { sourceEntityName: "Melatonin", targetEntityName: "Slow-Wave Deep Sleep", relationType: "PROMOTES", confidenceScore: 0.97 },
      { sourceEntityName: "Slow-Wave Deep Sleep", targetEntityName: "Memory Consolidation", relationType: "FACILITATES", confidenceScore: 0.96 },
    ];
  } else if (lower.includes("steam engine") || lower.includes("industrial revolution")) {
    // Preset 2: World History
    entities = [
      { name: "Steam Engine", category: "CONCEPT", confidenceScore: 0.99, metadata: { inventor: "Newcomen / Watt" } },
      { name: "Coal Mining", category: "CONCEPT", confidenceScore: 0.95, metadata: { sector: "Resource Extraction" } },
      { name: "Iron Smelting", category: "CONCEPT", confidenceScore: 0.93, metadata: { product: "Structural Steel" } },
      { name: "Railway Networks", category: "INFRASTRUCTURE", confidenceScore: 0.96, metadata: { domain: "Logistics" } },
      { name: "Textile Mills", category: "CONCEPT", confidenceScore: 0.94, metadata: { mode: "Mechanized Factory" } },
      { name: "Urbanization", category: "CONCEPT", confidenceScore: 0.97, metadata: { outcome: "Demographic Shift" } },
    ];
    relationships = [
      { sourceEntityName: "Steam Engine", targetEntityName: "Coal Mining", relationType: "DRAINS", confidenceScore: 0.98 },
      { sourceEntityName: "Coal Mining", targetEntityName: "Iron Smelting", relationType: "FUELS", confidenceScore: 0.95 },
      { sourceEntityName: "Iron Smelting", targetEntityName: "Railway Networks", relationType: "ENABLES", confidenceScore: 0.97 },
      { sourceEntityName: "Steam Engine", targetEntityName: "Textile Mills", relationType: "POWERS", confidenceScore: 0.96 },
      { sourceEntityName: "Textile Mills", targetEntityName: "Urbanization", relationType: "DRIVES", confidenceScore: 0.94 },
    ];
  } else if (lower.includes("broker") || lower.includes("kafka") || lower.includes("event")) {
    // Preset 3: Technical RFC
    entities = [
      { name: "Ingestion Gateway", category: "SERVICE", confidenceScore: 0.98, metadata: { protocol: "HTTP/2 & gRPC" } },
      { name: "Apache Kafka", category: "INFRASTRUCTURE", confidenceScore: 0.99, metadata: { role: "Event Broker" } },
      { name: "Telemetry Worker", category: "SERVICE", confidenceScore: 0.95, metadata: { role: "Consumer" } },
      { name: "PostgreSQL Primary", category: "DATA_MODEL", confidenceScore: 0.97, metadata: { role: "Persistent Store" } },
      { name: "Redis", category: "DATA_MODEL", confidenceScore: 0.96, metadata: { role: "Cache Layer" } },
      { name: "Central Auth Service", category: "SERVICE", confidenceScore: 0.94, metadata: { mechanism: "JWT Tokens" } },
    ];
    relationships = [
      { sourceEntityName: "Ingestion Gateway", targetEntityName: "Apache Kafka", relationType: "PUBLISHES_TO", confidenceScore: 0.99 },
      { sourceEntityName: "Telemetry Worker", targetEntityName: "Apache Kafka", relationType: "CONSUMES_FROM", confidenceScore: 0.98 },
      { sourceEntityName: "Telemetry Worker", targetEntityName: "PostgreSQL Primary", relationType: "WRITES_TO", confidenceScore: 0.97 },
      { sourceEntityName: "Telemetry Worker", targetEntityName: "Redis", relationType: "CACHES_IN", confidenceScore: 0.95 },
      { sourceEntityName: "Ingestion Gateway", targetEntityName: "Central Auth Service", relationType: "AUTHENTICATES_WITH", confidenceScore: 0.96 },
    ];
  } else {
    // Generic fallback analyzer
    const words = rawText
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter(
        (w) =>
          w.length > 4 &&
          !/^(about|their|there|which|would|these|could|after|before)$/i.test(w)
      );

    const uniqueWords = Array.from(new Set(words)).slice(0, 6);
    const capitalized = uniqueWords.map(
      (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    );

    if (capitalized.length === 0) {
      capitalized.push(docTitle, "Key Insight", "Core Principle");
    }

    entities = capitalized.map((name, idx) => ({
      name,
      category: (idx % 2 === 0 ? "CONCEPT" : "SERVICE") as EntityCategory,
      confidenceScore: 0.9 + idx * 0.01,
      metadata: { source: "Text Analysis", order: idx + 1 },
    }));

    for (let i = 0; i < entities.length - 1; i++) {
      relationships.push({
        sourceEntityName: entities[i].name,
        targetEntityName: entities[i + 1].name,
        relationType: i % 2 === 0 ? "POWERS" : "CONNECTS_TO",
        confidenceScore: 0.95,
      });
    }
  }

  return {
    summary,
    entities,
    relationships,
  };
}

/**
 * Main AI Document Extraction Orchestrator
 */
export async function analyzeDocumentContent(
  rawText: string,
  title?: string
): Promise<DocumentAnalysisOutput> {
  // $0 Zero-Cost Pipeline Fallback Check
  if (!config.openaiApiKey || config.openaiApiKey.trim() === "") {
    console.log(
      `[AI Worker] No OPENAI_API_KEY detected. Utilizing deterministic zero-cost mock analyzer for "${title || "Document"}".`
    );
    return generateMockAnalysis(rawText, title);
  }

  try {
    const openaiProvider = createOpenAI({
      apiKey: config.openaiApiKey,
      baseURL: config.openaiBaseUrl,
    });

    const systemPrompt = `You are a Master Concept & Knowledge Systems Architect for Trellis.
Your goal is to transform dense, unstructured text into an engaging, crystal-clear conceptual mind map and executive summary.

Requirements:
1. Executive Summary: Write a clear, high-impact summary accessible to a layman, highlighting core concepts and takeaways.
2. Concept Nodes: Identify 3 to 12 core concepts, topics, systems, or services. Categorize each using:
   - CONCEPT (general ideas, phenomena, academic topics)
   - SYSTEM / SERVICE (architectural subsystems or components)
   - DATA_MODEL (databases, schemas, storage)
   - INFRASTRUCTURE (cloud, brokers, compute)
   - SECURITY_POLICY / API_ENDPOINT (endpoints, auth, policies)
3. Directional Relationships: Map 2 to 10 active directional connections between concepts (e.g. BLOCKS, POWERS, TRIGGERS, REGULATES, CONSUMES_FROM, WRITES_TO). Use active verbs.`;

    const userPrompt = `Document Title: ${title || "Untitled Document"}\n\nDocument Content:\n${rawText}`;

    const { object } = await generateObject({
      model: openaiProvider(config.aiModel),
      schema: DocumentAnalysisOutputSchema,
      system: systemPrompt,
      prompt: userPrompt,
    });

    return object;
  } catch (error) {
    console.warn(
      "[AI Worker] LLM extraction encountered an error. Falling back safely to local deterministic analyzer.",
      error
    );
    return generateMockAnalysis(rawText, title);
  }
}
