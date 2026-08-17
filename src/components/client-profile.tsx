"use client";

import Link from "next/link";
import { useEffect, useState, type ComponentProps, type FormEvent, type ReactNode } from "react";
import { addDoc, collection, doc, onSnapshot, query, serverTimestamp, where } from "firebase/firestore";
import { ArrowLeft, CalendarDays, Mail, Phone, Play, Plus } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/lib/firebase";
import type { Client, MediaResource } from "@/types";

type ResourceTab = "all" | "edited" | "raw" | "photos";
type ResourceFormValues = Pick<MediaResource, "title" | "category" | "mediaUrl" | "thumbnailUrl" | "status">;

const tabCategories: Record<ResourceTab, MediaResource["category"][] | undefined> = {
  all: undefined,
  edited: ["Edited Video"],
  raw: ["Raw Footage"],
  photos: ["Photos"],
};

const emptyResource: ResourceFormValues = {
  title: "",
  category: "Raw Footage",
  mediaUrl: "",
  thumbnailUrl: "",
  status: "Draft",
};

export function ClientProfile({ clientId }: { clientId: string }) {
  const [client, setClient] = useState<Client | null | undefined>(undefined);
  const [resources, setResources] = useState<MediaResource[]>([]);
  const [selectedResource, setSelectedResource] = useState<MediaResource | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [resourceForm, setResourceForm] = useState<ResourceFormValues>(emptyResource);
  const [isSavingResource, setIsSavingResource] = useState(false);
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

  function openAddResourceDialog() {
    setResourceForm(emptyResource);
    setError(null);
    setIsAddDialogOpen(true);
  }

  async function saveResource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingResource(true);
    setError(null);

    try {
      await addDoc(collection(db, "resources"), removeUndefinedValues({
        clientId,
        title: resourceForm.title.trim(),
        category: resourceForm.category,
        mediaUrl: resourceForm.mediaUrl.trim(),
        thumbnailUrl: (resourceForm.thumbnailUrl ?? "").trim() || undefined,
        status: resourceForm.status,
        createdAt: serverTimestamp(),
      }));
      setIsAddDialogOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save this resource.";
      console.error("Unable to save resource:", error);
      setError(message);
    } finally {
      setIsSavingResource(false);
    }
  }

  if (error && !isAddDialogOpen) return <main className="mx-auto w-full max-w-6xl p-6"><p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p></main>;
  if (client === undefined) return <main className="mx-auto w-full max-w-6xl p-6 text-sm text-muted-foreground">Loading client profile…</main>;
  if (client === null) return <main className="mx-auto w-full max-w-6xl space-y-4 p-6"><p className="text-sm text-muted-foreground">This client could not be found.</p><Button variant="outline" render={<Link href="/" />}>Return to clients</Button></main>;

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 p-6">
      <Button variant="ghost" render={<Link href="/" />}><ArrowLeft data-icon="inline-start" />All clients</Button>

      <section className="flex flex-col gap-5 rounded-xl border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4"><Avatar size="lg" className="size-14"><AvatarImage src={client.avatarUrl} alt={client.name} /><AvatarFallback>{initials(client.name)}</AvatarFallback></Avatar><div><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-semibold tracking-tight">{client.name}</h1><ClientStatus status={client.status} /></div><p className="text-sm text-muted-foreground">{client.company}</p></div></div>
        <div className="space-y-2 text-sm text-muted-foreground"><p className="flex items-center gap-2"><Mail className="size-4" />{client.email}</p><p className="flex items-center gap-2"><Phone className="size-4" />{client.phone}</p></div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-semibold">Media resources</h2><p className="text-sm text-muted-foreground">Videos, footage, photos, and documents for this client.</p></div><Button onClick={openAddResourceDialog}><Plus data-icon="inline-start" />Add resource</Button></div>
        <Tabs defaultValue="all">
          <TabsList variant="line" className="w-full justify-start overflow-x-auto rounded-none border-b p-0"><TabsTrigger value="all">All</TabsTrigger><TabsTrigger value="edited">Edited Videos</TabsTrigger><TabsTrigger value="raw">Raw Footage</TabsTrigger><TabsTrigger value="photos">Photos</TabsTrigger></TabsList>
          {(Object.keys(tabCategories) as ResourceTab[]).map((tab) => <TabsContent key={tab} value={tab} className="pt-6"><ResourceGrid resources={resources.filter((resource) => !tabCategories[tab] || tabCategories[tab].includes(resource.category))} onSelect={setSelectedResource} /></TabsContent>)}
        </Tabs>
      </section>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Add resource</DialogTitle><DialogDescription>Attach a media resource to {client.name}.</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={saveResource}><ResourceField label="Title" value={resourceForm.title} required onChange={(title) => setResourceForm((form) => ({ ...form, title }))} /><ResourceSelect label="Category" value={resourceForm.category} onChange={(category) => setResourceForm((form) => ({ ...form, category: category as MediaResource["category"] }))}><option value="Raw Footage">Raw Footage</option><option value="Edited Video">Edited Videos</option><option value="Short-form">Short-form</option><option value="Photos">Photos</option><option value="Documents">Documents</option></ResourceSelect><ResourceField label="Media URL" type="url" value={resourceForm.mediaUrl} required onChange={(mediaUrl) => setResourceForm((form) => ({ ...form, mediaUrl }))} /><ResourceField label="Thumbnail URL (optional)" type="url" value={resourceForm.thumbnailUrl} onChange={(thumbnailUrl) => setResourceForm((form) => ({ ...form, thumbnailUrl }))} /><ResourceSelect label="Status" value={resourceForm.status} onChange={(status) => setResourceForm((form) => ({ ...form, status: status as MediaResource["status"] }))}><option value="In Review">In Review</option><option value="Approved">Approved</option><option value="Draft">Draft</option></ResourceSelect>{error ? <p className="text-sm text-destructive">{error}</p> : null}<DialogFooter><Button type="submit" disabled={isSavingResource}>{isSavingResource ? "Saving..." : "Save resource"}</Button></DialogFooter></form></DialogContent>
      </Dialog>

      <Dialog open={selectedResource !== null} onOpenChange={(open) => !open && setSelectedResource(null)}><DialogContent className="max-w-4xl p-0" showCloseButton>{selectedResource ? <ResourcePreview resource={selectedResource} /> : null}</DialogContent></Dialog>
    </main>
  );
}

function ResourceGrid({ resources, onSelect }: { resources: MediaResource[]; onSelect: (resource: MediaResource) => void }) {
  if (resources.length === 0) return <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">No resources in this category yet.</p>;
  return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{resources.map((resource) => <ResourceCard key={resource.id} resource={resource} onSelect={onSelect} />)}</div>;
}

function ResourceCard({ resource, onSelect }: { resource: MediaResource; onSelect: (resource: MediaResource) => void }) {
  const playable = isPlayableVideo(resource.mediaUrl);
  const thumbnailUrl = resource.thumbnailUrl ?? (isImageUrl(resource.mediaUrl) ? resource.mediaUrl : undefined);
  return <article className="group overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md"><div className="relative aspect-video bg-muted">{thumbnailUrl ? <div role="img" aria-label={`${resource.title} thumbnail`} className="size-full bg-cover bg-center" style={{ backgroundImage: `url(${thumbnailUrl})` }} /> : <div className="flex size-full items-center justify-center text-sm text-muted-foreground">No preview</div>}{playable ? <button type="button" aria-label={`Play ${resource.title}`} onClick={() => onSelect(resource)} className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"><span className="flex size-12 items-center justify-center rounded-full bg-white text-black shadow-lg"><Play className="ml-0.5 size-5 fill-current" /></span></button> : null}</div><div className="space-y-3 p-4"><h3 className="font-medium">{resource.title}</h3><div className="flex flex-wrap gap-2"><Badge variant="outline">{resource.category}</Badge><ResourceStatus status={resource.status} /></div><p className="flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays className="size-3.5" />{formatCreationDate(resource)}</p>{playable ? <Button variant="outline" className="w-full" onClick={() => onSelect(resource)}><Play data-icon="inline-start" />Preview</Button> : null}</div></article>;
}

function ResourcePreview({ resource }: { resource: MediaResource }) {
  return <><DialogHeader className="px-6 pt-6 pr-12"><DialogTitle>{resource.title}</DialogTitle><DialogDescription>{resource.category}</DialogDescription></DialogHeader><div className="aspect-video bg-black">{isDirectVideo(resource.mediaUrl) ? <video className="size-full" controls src={resource.mediaUrl}>Your browser does not support video playback.</video> : <iframe className="size-full" src={toEmbedUrl(resource.mediaUrl)} title={resource.title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />}</div></>;
}

function ResourceField({ label, onChange, ...props }: Omit<ComponentProps<typeof Input>, "onChange"> & { label: string; onChange: (value: string) => void }) { return <label className="grid gap-2 text-sm font-medium">{label}<Input {...props} onChange={(event) => onChange(event.target.value)} /></label>; }
function ResourceSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) { return <label className="grid gap-2 text-sm font-medium">{label}<select className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" value={value} onChange={(event) => onChange(event.target.value)}>{children}</select></label>; }
function ClientStatus({ status }: { status: Client["status"] }) { return <Badge variant={status === "Active" ? "default" : "secondary"}>{status}</Badge>; }
function ResourceStatus({ status }: { status: MediaResource["status"] }) { return <Badge variant={status === "Approved" ? "default" : status === "In Review" ? "secondary" : "outline"}>{status}</Badge>; }
function initials(name: string) { return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase(); }
function formatCreationDate(resource: MediaResource) { return resource.createdAt ? new Intl.DateTimeFormat("en-NZ", { day: "numeric", month: "short", year: "numeric" }).format(resource.createdAt.toDate()) : "Just added"; }
function removeUndefinedValues<T extends Record<string, unknown>>(payload: T) { return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined)) as Partial<T>; }
function isDirectVideo(url: string) { return /\.(mp4|webm|ogg|mov)(?:[?#]|$)/i.test(url); }
function isImageUrl(url: string) { return /\.(avif|gif|jpe?g|png|webp)(?:[?#]|$)/i.test(url); }
function isPlayableVideo(url: string) { return isDirectVideo(url) || /(?:youtu\.be|youtube\.com|vimeo\.com)/i.test(url); }
function toEmbedUrl(url: string) { const youtubeMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^?&/]+)/i); if (youtubeMatch) return `https://www.youtube.com/embed/${youtubeMatch[1]}`; const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i); if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`; return url; }
