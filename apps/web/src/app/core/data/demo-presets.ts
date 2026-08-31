export interface DemoPreset {
  id: string;
  persona: string;
  personaIcon: string;
  categoryBadge: string;
  title: string;
  description: string;
  rawContent: string;
}

export const DEMO_PRESETS: DemoPreset[] = [
  {
    id: 'science-caffeine',
    persona: 'Everyday Science',
    personaIcon: '☕',
    categoryBadge: 'Casual Learner',
    title: 'How Caffeine Affects Sleep Architecture',
    description:
      'Explore adenosine receptor antagonism, circadian rhythms, and deep sleep suppression.',
    rawContent: `Caffeine is the world's most widely consumed psychoactive substance. Once ingested, caffeine enters the bloodstream and easily crosses the blood-brain barrier. In the central nervous system, caffeine acts primarily as an adenosine receptor antagonist, specifically targeting A1 and A2A adenosine receptors.

Under normal physiological conditions, adenosine accumulates continuously in the brain throughout waking hours, creating homeostatic sleep pressure (also known as sleepiness). Because caffeine shares a molecular shape similar to adenosine, it binds directly to adenosine receptors without activating them, effectively blocking adenosine from delivering its drowsiness signals to neurons.

This mechanism temporarily delays the onset of sleep pressure and promotes wakefulness. However, adenosine continues to build up in the background. When caffeine is eventually metabolized by liver enzymes (specifically cytochrome P450 1A2), the unbound adenosine rushes onto the available receptors, causing a sudden and severe feeling of exhaustion known as a caffeine crash.

Furthermore, caffeine impairs the quality of subsequent sleep by suppressing slow-wave deep sleep (N3 stage) and reducing melatonin secretion from the pineal gland. Deep sleep is essential for physical restoration, cellular repair, and memory consolidation, meaning evening caffeine consumption degrades neurocognitive recovery even if the total sleep duration appears unchanged.`,
  },
  {
    id: 'history-steam',
    persona: 'World History',
    personaIcon: '🚂',
    categoryBadge: 'Humanities Student',
    title: 'The Industrial Revolution & Steam Power (1760-1840)',
    description:
      'Trace the feedback loop between coal mining, Newcomen engines, metallurgy, and urban factories.',
    rawContent: `The Industrial Revolution originated in Great Britain during the late eighteenth century, driven by an interconnected technological and economic transformation. The initial catalyst was the urgent need to pump water out of deep coal mining pits, which led Thomas Newcomen to invent the atmospheric steam engine in 1712. James Watt later revolutionized this invention in 1776 by introducing a separate condenser and rotary motion, drastically increasing thermal efficiency and allowing steam power to drive machinery.

Abundant coal extraction fueled breakthroughs in iron smelting, replacing charcoal with coke. This yielded vast quantities of inexpensive, high-quality wrought iron and structural steel. High-strength iron made it possible to construct robust boilers, heavy machine tools, and expansive railway networks.

In turn, steam-powered locomotives and steamships created rapid transportation routes that drastically reduced the cost of moving raw goods and finished products across continents. Simultaneously, steam engines replaced water wheels in textile mills, liberating manufacturing from riverside constraints and centralizing production inside mechanized urban factories.

This industrial shift catalyzed massive demographic urbanization as rural laborers migrated to factory cities like Manchester, Birmingham, and Leeds. The rapid rise of factory work fundamentally altered human labor dynamics, giving birth to modern trade unions, parliamentary labor reform, and the foundation of modern industrial capitalism.`,
  },
  {
    id: 'tech-rfc',
    persona: 'Technical RFC',
    personaIcon: '⚙️',
    categoryBadge: 'Software Engineer',
    title: 'Distributed Event Broker Architecture (Kafka vs RabbitMQ)',
    description:
      'Deep dive into partitioned commit logs, telemetry pipelines, and persistent storage tiers.',
    rawContent: `This technical RFC outlines the architectural blueprint for migrating our high-throughput telemetry pipeline to an enterprise distributed event broker. The existing monolithic API struggles under peak ingestion loads of 250,000 events per second, resulting in socket exhaustion and dropped telemetry frames.

Under the new architecture, incoming telemetry payloads are received by a lightweight Ingestion Gateway built with high-concurrency asynchronous workers. The Ingestion Gateway authenticates client tokens with the Central Auth Service and immediately publishes validated events into an Apache Kafka partitioned commit log.

Apache Kafka serves as the central durable event backbone. Topic partitions are distributed across an active cluster, ensuring high availability, replication factor of 3, and disk-backed append-only immutability. Partition keys are assigned by customer tenant ID to guarantee strict per-tenant ordering.

Downstream Telemetry Workers consume event batches asynchronously from Kafka consumer groups. These workers perform deduplication, enrich event payloads, and persist analytics transactions into PostgreSQL Primary storage for long-term historical reporting. High-frequency counters and ephemeral session state are cached inside a distributed Redis cluster to provide sub-millisecond query latencies for user-facing dashboards.`,
  },
];
