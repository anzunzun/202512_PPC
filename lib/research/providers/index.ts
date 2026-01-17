import type { ResearchProvider } from "@/lib/research/types";
import { demoProvider } from "@/lib/research/providers/demo";
import { ppcProvider } from "@/lib/research/providers/ppc";

const REGISTRY: Record<string, ResearchProvider> = {
  demo: demoProvider,
  ppc: ppcProvider,
};

export function getProviderOrThrow(providerId: string): ResearchProvider {
  const p = REGISTRY[providerId];
  if (!p) throw new Error(`Unknown provider: ${providerId}`);
  return p;
}
