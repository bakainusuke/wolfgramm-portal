"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { ArrowLeft, Mail, Phone, Play } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/lib/firebase";
import type { Client, MediaResource } from "@/types";

type ResourceTab = "all" | "edited" | "raw" | "photos";

const tabCategories: Record<ResourceTab, MediaResource["category"][] | undefined> = {
  all: undefined,
  edited: ["Edited Video"],
  raw: ["Raw Footage"],
  photos: ["Photos"],
};

export function ClientProfile({ clientId }: { clientId: string }) {
  const [client, setClient] = useState<Client | null | undefined>(undefined);
  const [resources, setResources] = useState<MediaResource[]>([]);
  const [selectedResource, setSelectedResource] = useState<MediaResource | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeClient = onSnapshot(
      doc(db, "clients", clientId),
      (snapshot) => setClient(snapshot.exists() ? { id: snapshot.id, ...(snapshot.data() as Omit<Client, "id">) } : null),
      () => setError("Unable to load this client."),
    );
    const unsubscribeResources = onSnapshot(
      query(collection(db, "resources"), where("clientId", "==", clientId)),
      (snapshot) => setResources(snapshot.docs.map((resource) => ({ id: resource.id, ...(resource.data() as Omit<MediaResource, "id">) }))),
      () => setError("Unable to load this client's resources."),
    );

    return () => {
      unsubscribeClient();
      unsubscribeResources();
    };
  }, [clientId]);

  if (error) {
    return <main className="mx-auto w-full max-w-6xl p-6"><p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p></main>;
  }

  if (client === undefined) {
    return <main className="mx-auto w-full max-w-6xl p-6 text-sm text-muted-foreground">Loading client profile…</main>;
  }

  if (client === null) {
    return <main className="mx-auto w-full max-w-6xl space-y-4 p-6"><p className="text-sm text-muted-foreground">This client could not be found.</p><Button variant="outline" render={<Link href="/" />}>Return to clients</Button></main>;
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 p-6">
      <Button variant="ghost" render={<Link href="/" />}><ArrowLeft data-icon="inline-start" />All clients</Button>

      <section className="flex flex-col gap-5 rounded-xl border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar size="lg" className="size-14"><AvatarImage src={client.avatarUrl} alt={client.name} /><AvatarFallback>{initials(client.name)}</AvatarFallback></Avatar>
          <div>
            <div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-semibold tracking-tight">{client.name}</h1><ClientStatus status={client.status} /></div>
            <p className="text-sm text-muted-foreground">{client.company}</p>
          </div>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="flex items-center gap-2"><Mail className="size-4" />{client.email}</p>
          <p className="flex items-center gap-2"><Phone className="size-4" />{client.phone}</p>
        </div>
      </section>

      <Tabs defaultValue="all">
        <TabsList variant="line" className="w-full justify-start overflow-x-auto rounded-none border-b p-0">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="edited">Edited Videos</TabsTrigger>
          <TabsTrigger value="raw">Raw Footage</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
        </TabsList>
        {(Object.keys(tabCategories) as ResourceTab[]).map((tab) => (
          <TabsContent key={tab} value={tab} className="pt-6">
            <ResourceGrid resources={resources.filter((resource) => !tabCategories[tab] || tabCategories[tab].includes(resource.category))} onSelect={setSelectedResource} />
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={selectedResource !== null} onOpenChange={(open) => !open && setSelectedResource(null)}>
        <DialogContent className="max-w-4xl p-0" showCloseButton>
          {selectedResource ? <ResourcePreview resource={selectedResource} /> : null}
        </DialogContent>
      </Dialog>
    </main>
  );
}

function ResourceGrid({ resources, onSelect }: { resources: MediaResource[]; onSelect: (resource: MediaResource) => void }) {
  if (resources.length === 0) return <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">No resources in this category yet.</p>;

  return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{resources.map((resource) => <ResourceCard key={resource.id} resource={resource} onSelect={onSelect} />)}</div>;
}

function ResourceCard({ resource, onSelect }: { resource: MediaResource; onSelect: (resource: MediaResource) => void }) {
  const playable = resource.category !== "Photos" && resource.category !== "Documents";

  return (
    <article className="group overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-video bg-muted">
        {resource.thumbnailUrl ? <div role="img" aria-label={`${resource.title} thumbnail`} className="size-full bg-cover bg-center" style={{ backgroundImage: `url(${resource.thumbnailUrl})` }} /> : <div className="flex size-full items-center justify-center text-sm text-muted-foreground">No preview</div>}
        {playable ? <button type="button" aria-label={`Play ${resource.title}`} onClick={() => onSelect(resource)} className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"><span className="flex size-12 items-center justify-center rounded-full bg-white text-black shadow-lg"><Play className="ml-0.5 size-5 fill-current" /></span></button> : null}
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3"><div><h2 className="font-medium">{resource.title}</h2><p className="text-sm text-muted-foreground">{resource.category}{resource.fileSize ? ` · ${resource.fileSize}` : ""}</p></div><ResourceStatus status={resource.status} /></div>
        {playable ? <Button variant="outline" className="w-full" onClick={() => onSelect(resource)}><Play data-icon="inline-start" />Play video</Button> : null}
      </div>
    </article>
  );
}

function ResourcePreview({ resource }: { resource: MediaResource }) {
  return <>
    <DialogHeader className="px-6 pt-6 pr-12"><DialogTitle>{resource.title}</DialogTitle><DialogDescription>{resource.category}</DialogDescription></DialogHeader>
    <div className="aspect-video bg-black"><iframe className="size-full" src={resource.mediaUrl} title={resource.title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /></div>
  </>;
}

function ClientStatus({ status }: { status: Client["status"] }) {
  return <Badge variant={status === "Active" ? "default" : "secondary"}>{status}</Badge>;
}

function ResourceStatus({ status }: { status: MediaResource["status"] }) {
  return <Badge variant={status === "Approved" ? "default" : status === "In Review" ? "secondary" : "outline"}>{status}</Badge>;
}

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}
