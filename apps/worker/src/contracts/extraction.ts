import { z } from "zod";

export const EntityCategoryEnum = z.enum([
  "SYSTEM",
  "SERVICE",
  "DATA_MODEL",
  "INFRASTRUCTURE",
  "SECURITY_POLICY",
  "API_ENDPOINT",
  "CONCEPT",
]);

export type EntityCategory = z.infer<typeof EntityCategoryEnum>;

export const ExtractedEntitySchema = z.object({
  name: z
    .string()
    .min(1)
    .max(255)
    .describe("Concise name of the concept, topic, or technical element"),
  category: EntityCategoryEnum.default("CONCEPT").describe(
    "Category: CONCEPT for general ideas/topics, or technical categories like SERVICE/SYSTEM for architecture"
  ),
  confidenceScore: z
    .number()
    .min(0)
    .max(1)
    .default(0.95)
    .describe("Relevance score between 0.0 and 1.0"),
  metadata: z
    .record(z.any())
    .default({})
    .describe("Key-value attributes or properties"),
});

export const ExtractedRelationshipSchema = z.object({
  sourceEntityName: z
    .string()
    .describe("Exact name of the source concept or node"),
  targetEntityName: z
    .string()
    .describe("Exact name of the target concept or node"),
  relationType: z
    .string()
    .max(100)
    .describe(
      "Clear, active connection label (e.g., 'BLOCKS', 'POWERS', 'TRIGGERS', 'WRITES_TO')"
    ),
  confidenceScore: z.number().min(0).max(1).default(1.0),
});

export const DocumentAnalysisOutputSchema = z.object({
  topicTitle: z
    .string()
    .max(120)
    .optional()
    .describe(
      "A punchy, professional, human-readable title summarizing the explored topic (3-7 words, e.g. 'The Gut-Brain Axis & Microbiome Dynamics', 'Microservices Distributed Tracing', 'AI Ethics & Governance Framework')"
    ),
  summary: z
    .string()
    .min(10)
    .describe(
      "Engaging, easy-to-read summary breaking down key concepts and takeaways in plain language"
    ),
  entities: z
    .array(ExtractedEntitySchema)
    .min(1)
    .describe("List of extracted core concepts and nodes"),
  relationships: z
    .array(ExtractedRelationshipSchema)
    .describe("List of connections and dependencies mapping the visual graph"),
});

export type ExtractedEntity = z.infer<typeof ExtractedEntitySchema>;
export type ExtractedRelationship = z.infer<typeof ExtractedRelationshipSchema>;
export type DocumentAnalysisOutput = z.infer<typeof DocumentAnalysisOutputSchema>;
