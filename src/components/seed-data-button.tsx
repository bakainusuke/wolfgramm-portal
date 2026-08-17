"use client";

import { useState } from "react";
import { Database, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { seedDatabase } from "@/lib/seedData";

export function SeedDataButton() {
  const [loading, setLoading] = useState(false);

  async function handleSeed() {
    const confirmed = window.confirm(
      "Add 3 production clients and 10 media resources to Firestore?",
    );
    if (!confirmed) return;

    setLoading(true);

    try {
      const result = await seedDatabase();
      window.alert(
        `Success! Created ${result.clientsCount} clients and ${result.resourcesCount} resources.`,
      );
      // ClientsTable uses onSnapshot, so it updates automatically without a reload.
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Failed to seed mock data:", error);
      window.alert(`Failed to seed data: ${message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSeed}
      disabled={loading}
      className="gap-2"
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : <Database className="size-4" />}
      Seed Mock Data
    </Button>
  );
}
