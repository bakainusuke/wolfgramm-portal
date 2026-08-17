"use client";

import { useEffect, useMemo, useState, type ComponentProps, type FormEvent } from "react";
import Link from "next/link";
import type { FirebaseError } from "firebase/app";
import { addDoc, collection, doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { Pencil, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/firebase";
import type { Client } from "@/types";

type ClientFormValues = Pick<Client, "name" | "company" | "email" | "phone" | "status" | "avatarUrl">;

const emptyClient: ClientFormValues = { name: "", company: "", email: "", phone: "", status: "Lead", avatarUrl: "" };

// Keep this check in the client bundle so a missing public Firebase value is
// reported clearly instead of becoming a generic Firestore write failure.
const firebaseEnvironment = {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function ClientsTable() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formValues, setFormValues] = useState<ClientFormValues>(emptyClient);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return onSnapshot(
      collection(db, "clients"),
      (snapshot) => {
        setClients(snapshot.docs.map((client) => ({
          id: client.id,
          ...(client.data() as Omit<Client, "id">),
        })));
        setError(null);
      },
      () => setError("Unable to load clients. Please check your Firestore connection."),
    );
  }, []);

  const filteredClients = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter((client) =>
      [client.name, client.company, client.email, client.status].some((value) => value.toLowerCase().includes(term)),
    );
  }, [clients, search]);

  function openCreateDialog() {
    setEditingClient(null);
    setFormValues(emptyClient);
    setError(null);
    setIsDialogOpen(true);
  }

  function openEditDialog(client: Client) {
    setEditingClient(client);
    setFormValues({
      name: client.name,
      company: client.company,
      email: client.email,
      phone: client.phone,
      status: client.status,
      avatarUrl: client.avatarUrl ?? "",
    });
    setError(null);
    setIsDialogOpen(true);
  }

  async function saveClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      assertFirebaseEnvironment();

      // Firestore rejects `undefined`; remove optional blank values before every write.
      const clientData = removeUndefinedValues({
        ...formValues,
        avatarUrl: (formValues.avatarUrl ?? "").trim() || undefined,
      });

      if (editingClient?.id) {
        await setDoc(doc(db, "clients", editingClient.id), {
          ...clientData,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      } else {
        await addDoc(collection(db, "clients"), {
          ...clientData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      setIsDialogOpen(false);
    } catch (error) {
      const firestoreError = error as FirebaseError;
      console.error("Firestore Error Code:", firestoreError.code, "Message:", firestoreError.message, error);

      const message = firestoreError.message || "An unknown error occurred while saving the client.";
      const errorMessage = firestoreError.code ? `${firestoreError.code}: ${message}` : message;
      setError(errorMessage);
      window.alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground">Manage your video production relationships.</p>
        </div>
        <Button onClick={openCreateDialog}><Plus data-icon="inline-start" />Add client</Button>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input aria-label="Search clients" className="pl-9" placeholder="Search name, company, or email..." value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>

      {error && !isDialogOpen ? <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead><TableHead>Company</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Status</TableHead>
              <TableHead className="w-16"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium"><Link className="hover:underline" href={`/clients/${client.id}`}>{client.name}</Link></TableCell><TableCell>{client.company}</TableCell><TableCell>{client.email}</TableCell><TableCell>{client.phone}</TableCell><TableCell>{client.status}</TableCell>
                <TableCell><Button aria-label={`Edit ${client.name}`} variant="ghost" size="icon-sm" onClick={() => openEditDialog(client)}><Pencil /></Button></TableCell>
              </TableRow>
            ))}
            {filteredClients.length === 0 ? <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No clients found.</TableCell></TableRow> : null}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingClient ? "Edit client" : "Add client"}</DialogTitle>
            <DialogDescription>{editingClient ? "Update the client details below." : "Add a client to start organising their media resources."}</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={saveClient}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" value={formValues.name} required onChange={(name) => setFormValues((values) => ({ ...values, name }))} />
              <Field label="Company" value={formValues.company} required onChange={(company) => setFormValues((values) => ({ ...values, company }))} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email" type="email" value={formValues.email} required onChange={(email) => setFormValues((values) => ({ ...values, email }))} />
              <Field label="Phone" type="tel" value={formValues.phone} required onChange={(phone) => setFormValues((values) => ({ ...values, phone }))} />
            </div>
            <label className="grid gap-2 text-sm font-medium">
              Status
              <select className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" value={formValues.status} onChange={(event) => setFormValues((values) => ({ ...values, status: event.target.value as Client["status"] }))}>
                <option value="Lead">Lead</option><option value="Active">Active</option><option value="Archived">Archived</option>
              </select>
            </label>
            <Field label="Avatar URL (optional)" type="url" value={formValues.avatarUrl} onChange={(avatarUrl) => setFormValues((values) => ({ ...values, avatarUrl }))} />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <DialogFooter><Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : editingClient ? "Save changes" : "Add client"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function assertFirebaseEnvironment() {
  const missingVariables = Object.entries(firebaseEnvironment)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingVariables.length > 0) {
    throw new Error(`Missing Firebase environment variables: ${missingVariables.join(", ")}`);
  }
}

function removeUndefinedValues<T extends Record<string, unknown>>(payload: T) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

function Field({ label, onChange, ...props }: Omit<ComponentProps<typeof Input>, "onChange"> & { label: string; onChange: (value: string) => void }) {
  return <label className="grid gap-2 text-sm font-medium">{label}<Input {...props} onChange={(event) => onChange(event.target.value)} /></label>;
}
