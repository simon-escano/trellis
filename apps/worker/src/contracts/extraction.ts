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

export const ExtractedEntitySchema = z.object({
  name: z.string().min(1).max(255).describe("Concise name of the entity"),
  category: EntityCategoryEnum.describe("Architectural or technical category"),
  confidenceScore: z
    .number()
    .min(0)
    .max(1)
    .describe("Confidence score between 0.0 and 1.0"),
  metadata: z
    .record(z.any())
    .default({})
    .describe("Key-value attributes or properties"),
});

export const ExtractedRelationshipSchema = z.object({
  sourceEntityName: z
    .string()
    .describe("Exact matching name of the source entity"),
  targetEntityName: z
    .string()
    .describe("Exact matching name of the target entity"),
  relationType: z
    .string()
    .max(100)
    .describe(
      "Active verb relationship e.g., 'STORES_IN', 'CALLS', 'AUTHENTICATES'"
    ),
  confidenceScore: z.number().min(0).max(1).default(1.0),
});

export const DocumentAnalysisOutputSchema = z.object({
  summary: z
    .string()
    .min(10)
    .describe(
      "Concise executive summary covering key architecture points and trade-offs"
    ),
  entities: z
    .array(ExtractedEntitySchema)
    .min(1)
    .describe("List of extracted named entities"),
  relationships: z
    .array(ExtractedRelationshipSchema)
    .describe("Directional relationships mapping the knowledge graph"),
});

export type EntityCategory = z.infer<typeof EntityCategoryEnum>;
export type ExtractedEntity = z.infer<typeof ExtractedEntitySchema>;
export type ExtractedRelationship = z.infer<typeof ExtractedRelationshipSchema>;
export type DocumentAnalysisOutput = z.infer<
  typeof DocumentAnalysisOutputSchema
>;
