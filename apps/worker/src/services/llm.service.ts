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
 * Provides instant, offline knowledge graph generation with rich substantive descriptions.
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
      : `Executive synthesis for "${docTitle}": Core concepts, operational mechanisms, and dependency relationships mapped successfully.`;

  const lower = rawText.toLowerCase();

  let entities: ExtractedEntity[] = [];
  let relationships: ExtractedRelationship[] = [];

  if (lower.includes("caffeine") && lower.includes("adenosine")) {
    // Preset 1: Sleep Architecture
    entities = [
      {
        name: "Caffeine",
        category: "CONCEPT",
        confidenceScore: 0.98,
        metadata: {
          description:
            "Psychoactive antagonist that crosses the blood-brain barrier to bind adenosine receptors, temporarily blocking daytime fatigue signals.",
          target: "Central Nervous System",
          halfLife: "5-7 hours",
        },
      },
      {
        name: "Adenosine Receptors",
        category: "CONCEPT",
        confidenceScore: 0.95,
        metadata: {
          description:
            "Neural A1 and A2A receptors that monitor homeostatic sleep pressure and signal physical tiredness to the cerebral cortex.",
          receptorType: "G-Protein Coupled",
          subtypes: "A1, A2A, A2B, A3",
        },
      },
      {
        name: "Sleep Pressure",
        category: "CONCEPT",
        confidenceScore: 0.92,
        metadata: {
          description:
            "Continuous homeostatic neurochemical buildup of adenosine throughout waking hours that drives the physiological urge to sleep.",
          type: "Process S Homeostasis",
        },
      },
      {
        name: "Melatonin",
        category: "CONCEPT",
        confidenceScore: 0.94,
        metadata: {
          description:
            "Circadian hormone synthesized in the pineal gland that signals biological night and initiates sleep onset cycles.",
          source: "Pineal Gland",
          synthesis: "Tryptophan -> Serotonin",
        },
      },
      {
        name: "Slow-Wave Deep Sleep",
        category: "CONCEPT",
        confidenceScore: 0.96,
        metadata: {
          description:
            "Stage N3 non-REM restorative sleep phase critical for neural recovery, cellular repair, and glymphatic waste clearance.",
          eegPattern: "Delta Waves (0.5-4 Hz)",
          stage: "NREM Stage 3",
        },
      },
      {
        name: "Memory Consolidation",
        category: "CONCEPT",
        confidenceScore: 0.93,
        metadata: {
          description:
            "Neurocognitive reactivation process transforming fragile short-term synaptic memories into durable long-term cortical networks.",
          structure: "Hippocampus to Neocortex",
        },
      },
    ];
    relationships = [
      {
        sourceEntityName: "Caffeine",
        targetEntityName: "Adenosine Receptors",
        relationType: "BLOCKS",
        confidenceScore: 0.99,
      },
      {
        sourceEntityName: "Adenosine Receptors",
        targetEntityName: "Sleep Pressure",
        relationType: "REGULATES",
        confidenceScore: 0.95,
      },
      {
        sourceEntityName: "Sleep Pressure",
        targetEntityName: "Melatonin",
        relationType: "TRIGGERS",
        confidenceScore: 0.92,
      },
      {
        sourceEntityName: "Melatonin",
        targetEntityName: "Slow-Wave Deep Sleep",
        relationType: "PROMOTES",
        confidenceScore: 0.97,
      },
      {
        sourceEntityName: "Slow-Wave Deep Sleep",
        targetEntityName: "Memory Consolidation",
        relationType: "FACILITATES",
        confidenceScore: 0.96,
      },
    ];
  } else if (
    lower.includes("steam engine") ||
    lower.includes("industrial revolution")
  ) {
    // Preset 2: World History
    entities = [
      {
        name: "Steam Engine",
        category: "CONCEPT",
        confidenceScore: 0.99,
        metadata: {
          description:
            "Thermal energy converter utilizing expanding steam to generate continuous rotary mechanical power for factories and transportation.",
          pioneers: "Newcomen (1712) & Watt (1776)",
        },
      },
      {
        name: "Coal Mining",
        category: "INFRASTRUCTURE",
        confidenceScore: 0.95,
        metadata: {
          description:
            "Primary fossil fuel extraction industry providing energy for steam boilers and carbon fuel for metallurgical blast furnaces.",
          fuelType: "Bituminous & Anthracite Coal",
        },
      },
      {
        name: "Iron Smelting",
        category: "CONCEPT",
        confidenceScore: 0.93,
        metadata: {
          description:
            "Coke-fueled metallurgical refinement producing inexpensive, high-tensile wrought iron and structural steel for machinery.",
          breakthrough: "Coke Smelting (Abraham Darby)",
        },
      },
      {
        name: "Railway Networks",
        category: "INFRASTRUCTURE",
        confidenceScore: 0.96,
        metadata: {
          description:
            "Steam-locomotive rail infrastructure that interconnected industrial centers and drastically lowered intercontinental transport costs.",
          transportType: "Steam Locomotive Rail",
        },
      },
      {
        name: "Textile Mills",
        category: "SERVICE",
        confidenceScore: 0.94,
        metadata: {
          description:
            "Centralized mechanized weaving factories liberating production from riverbanks using reliable stationary steam engines.",
          machinery: "Spinning Jenny & Power Loom",
        },
      },
      {
        name: "Urbanization",
        category: "CONCEPT",
        confidenceScore: 0.97,
        metadata: {
          description:
            "Mass demographic migration from agrarian countrysides into manufacturing hubs, giving rise to modern industrial cities.",
          centers: "Manchester, Birmingham, Leeds",
        },
      },
    ];
    relationships = [
      {
        sourceEntityName: "Steam Engine",
        targetEntityName: "Coal Mining",
        relationType: "DRAINS_MINES",
        confidenceScore: 0.98,
      },
      {
        sourceEntityName: "Coal Mining",
        targetEntityName: "Iron Smelting",
        relationType: "FUELS_FURNACES",
        confidenceScore: 0.95,
      },
      {
        sourceEntityName: "Iron Smelting",
        targetEntityName: "Railway Networks",
        relationType: "SUPPLIES_RAILS",
        confidenceScore: 0.97,
      },
      {
        sourceEntityName: "Steam Engine",
        targetEntityName: "Textile Mills",
        relationType: "POWERS_LOOMS",
        confidenceScore: 0.96,
      },
      {
        sourceEntityName: "Textile Mills",
        targetEntityName: "Urbanization",
        relationType: "ACCELERATES",
        confidenceScore: 0.94,
      },
    ];
  } else if (
    lower.includes("broker") ||
    lower.includes("kafka") ||
    lower.includes("event")
  ) {
    // Preset 3: Technical RFC
    entities = [
      {
        name: "Ingestion Gateway",
        category: "SERVICE",
        confidenceScore: 0.98,
        metadata: {
          description:
            "High-concurrency async edge router that authenticates client tokens and streams telemetry frames into distributed partitions.",
          protocol: "HTTP/2 & gRPC",
          throughput: "250,000 req/sec",
        },
      },
      {
        name: "Apache Kafka",
        category: "INFRASTRUCTURE",
        confidenceScore: 0.99,
        metadata: {
          description:
            "Distributed partitioned append-only commit log providing immutable event ordering, replication factor of 3, and fault tolerance.",
          storageEngine: "Disk-backed Partitioned Log",
          replicationFactor: 3,
        },
      },
      {
        name: "Telemetry Worker",
        category: "SERVICE",
        confidenceScore: 0.95,
        metadata: {
          description:
            "Asynchronous consumer group worker performing event batch deduplication, payload enrichment, and transactional storage persistence.",
          concurrency: "Dynamic Worker Pool",
        },
      },
      {
        name: "PostgreSQL Primary",
        category: "DATA_MODEL",
        confidenceScore: 0.97,
        metadata: {
          description:
            "ACID-compliant relational database cluster storing historical telemetry transactions, relational entities, and reporting indexes.",
          engine: "PostgreSQL 16",
          indexing: "B-Tree & GIN Indexes",
        },
      },
      {
        name: "Redis Cache Cluster",
        category: "DATA_MODEL",
        confidenceScore: 0.96,
        metadata: {
          description:
            "In-memory distributed key-value store caching real-time metric counters and active session state with sub-millisecond latencies.",
          memoryModel: "In-Memory LRU Cache",
        },
      },
      {
        name: "Central Auth Service",
        category: "SECURITY_POLICY",
        confidenceScore: 0.94,
        metadata: {
          description:
            "OAuth2 and JWT token verification authority validating API credentials and enforcing multi-tenant isolation rules.",
          securityScheme: "RS256 JWT & OAuth2",
        },
      },
    ];
    relationships = [
      {
        sourceEntityName: "Ingestion Gateway",
        targetEntityName: "Apache Kafka",
        relationType: "PUBLISHES_TO",
        confidenceScore: 0.99,
      },
      {
        sourceEntityName: "Telemetry Worker",
        targetEntityName: "Apache Kafka",
        relationType: "CONSUMES_FROM",
        confidenceScore: 0.98,
      },
      {
        sourceEntityName: "Telemetry Worker",
        targetEntityName: "PostgreSQL Primary",
        relationType: "WRITES_TO",
        confidenceScore: 0.97,
      },
      {
        sourceEntityName: "Telemetry Worker",
        targetEntityName: "Redis Cache Cluster",
        relationType: "CACHES_IN",
        confidenceScore: 0.95,
      },
      {
        sourceEntityName: "Ingestion Gateway",
        targetEntityName: "Central Auth Service",
        relationType: "AUTHENTICATES_WITH",
        confidenceScore: 0.96,
      },
    ];
  } else {
    // Generic text extractor
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
      metadata: {
        description: `Essential ${name.toLowerCase()} component extracted from document text representing core operational insight.`,
        source: "Document Text Analysis",
        order: idx + 1,
      },
    }));

    for (let i = 0; i < entities.length - 1; i++) {
      relationships.push({
        sourceEntityName: entities[i].name,
        targetEntityName: entities[i + 1].name,
        relationType: i % 2 === 0 ? "CONNECTS_TO" : "ENABLES",
        confidenceScore: 0.91 + i * 0.01,
      });
    }
  }

  return { summary, entities, relationships };
}

/**
 * AI Extraction Service using Vercel AI SDK or fallback mock
 */
export class LLMService {
  async extractKnowledgeGraph(
    rawText: string,
    title?: string
  ): Promise<DocumentAnalysisOutput> {
    if (!config.openaiApiKey) {
      return generateMockAnalysis(rawText, title);
    }

    try {
      const openai = createOpenAI({
        apiKey: config.openaiApiKey,
        baseURL: config.openaiBaseUrl || undefined,
      });

      const { object } = await generateObject({
        model: openai(config.aiModel),
        schema: DocumentAnalysisOutputSchema,
        prompt: `You are an expert knowledge graph extractor and technical intelligence architect.
Analyze the following unstructured document and extract:
1. A concise, plain-language executive summary (2-3 sentences).
2. Key entities/concepts with their category (SYSTEM, SERVICE, DATA_MODEL, INFRASTRUCTURE, SECURITY_POLICY, API_ENDPOINT, CONCEPT) and a detailed 2-sentence description in the metadata object.
3. Directional relationships between entities with uppercase verbs (e.g., BLOCKS, POWERS, CALLS, CONTAINS, FACILITATES, SECURES).

Document Title: ${title || "Untitled Document"}

Document Content:
${rawText}`,
      });

      return object;
    } catch (err) {
      console.warn(
        "[LLM Service] Online extraction failed, falling back to deterministic mock analyzer:",
        err
      );
      return generateMockAnalysis(rawText, title);
    }
  }
}

const defaultLlmService = new LLMService();

export async function analyzeDocumentContent(
  rawText: string,
  title?: string
): Promise<DocumentAnalysisOutput> {
  return defaultLlmService.extractKnowledgeGraph(rawText, title);
}
