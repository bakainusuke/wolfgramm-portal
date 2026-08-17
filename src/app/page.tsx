import { ClientsTable } from "@/components/clients-table";
import { SeedDataButton } from "@/components/seed-data-button";

export default function Home() {
  return (
    <main className="relative">
      <div className="absolute top-6 right-6 z-10">
        <SeedDataButton />
      </div>
      <ClientsTable />
    </main>
  );
}
