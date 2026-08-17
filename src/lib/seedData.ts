import { doc, serverTimestamp, writeBatch } from "firebase/firestore";

import { db } from "@/lib/firebase";
import type { Client, MediaResource } from "@/types";

type SeedClient = Omit<Client, "id" | "createdAt"> & { id: string };
type SeedResource = Omit<MediaResource, "id" | "createdAt"> & { id: string };

const clients: SeedClient[] = [
  {
    id: "harbour-and-co",
    name: "Mia Thompson",
    company: "Harbour & Co. Property",
    email: "mia@harbourandco.nz",
    phone: "+64 21 487 219",
    status: "Active",
    avatarUrl: "https://i.pravatar.cc/160?img=47",
  },
  {
    id: "northstar-outdoors",
    name: "Ethan Walker",
    company: "Northstar Outdoors",
    email: "ethan@northstaroutdoors.co.nz",
    phone: "+64 27 631 0842",
    status: "Active",
    avatarUrl: "https://i.pravatar.cc/160?img=12",
  },
  {
    id: "copper-and-vine",
    name: "Sophie Patel",
    company: "Copper & Vine",
    email: "sophie@copperandvine.co.nz",
    phone: "+64 22 315 7609",
    status: "Lead",
    avatarUrl: "https://i.pravatar.cc/160?img=32",
  },
  {
    id: "atlas-architecture",
    name: "Liam Chen",
    company: "Atlas Architecture",
    email: "liam@atlasarchitecture.co.nz",
    phone: "+64 21 902 176",
    status: "Active",
    avatarUrl: "https://i.pravatar.cc/160?img=68",
  },
  {
    id: "bloom-wellness",
    name: "Amelia Roberts",
    company: "Bloom Wellness Studio",
    email: "amelia@bloomwellness.co.nz",
    phone: "+64 27 558 4301",
    status: "Archived",
    avatarUrl: "https://i.pravatar.cc/160?img=45",
  },
];

const resources: SeedResource[] = [
  { id: "harbour-summer-listings", clientId: "harbour-and-co", title: "Summer Listings Brand Film", category: "Edited Video", mediaUrl: "https://www.youtube.com/embed/Scxs7L0vhZ4", thumbnailUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80", fileSize: "1.2 GB", status: "Approved" },
  { id: "harbour-paremata-drone", clientId: "harbour-and-co", title: "Paremata Drone Selects", category: "Raw Footage", mediaUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", thumbnailUrl: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80", fileSize: "8.4 GB", status: "Approved" },
  { id: "northstar-winter-campaign", clientId: "northstar-outdoors", title: "Winter Range Campaign", category: "Edited Video", mediaUrl: "https://www.youtube.com/embed/aqz-KE-bpKQ", thumbnailUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80", fileSize: "2.6 GB", status: "Approved" },
  { id: "northstar-reel-01", clientId: "northstar-outdoors", title: "Trail Series — Reel 01", category: "Short-form", mediaUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4", thumbnailUrl: "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1200&q=80", fileSize: "184 MB", status: "In Review" },
  { id: "copper-menu-launch", clientId: "copper-and-vine", title: "Autumn Menu Launch", category: "Short-form", mediaUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4", thumbnailUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80", fileSize: "96 MB", status: "Draft" },
  { id: "copper-still-library", clientId: "copper-and-vine", title: "Hero Dish Still Library", category: "Photos", mediaUrl: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1600&q=80", thumbnailUrl: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=80", fileSize: "742 MB", status: "Draft" },
  { id: "atlas-studio-tour", clientId: "atlas-architecture", title: "Ponsonby Studio Tour", category: "Edited Video", mediaUrl: "https://www.youtube.com/embed/jNQXAC9IVRw", thumbnailUrl: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80", fileSize: "1.8 GB", status: "In Review" },
  { id: "atlas-project-brief", clientId: "atlas-architecture", title: "Cedar House Production Brief", category: "Documents", mediaUrl: "https://example.com/documents/cedar-house-production-brief.pdf", fileSize: "2.1 MB", status: "Approved" },
  { id: "bloom-launch-film", clientId: "bloom-wellness", title: "Studio Launch Film", category: "Edited Video", mediaUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4", thumbnailUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=80", fileSize: "1.5 GB", status: "Approved" },
  { id: "bloom-social-cutdowns", clientId: "bloom-wellness", title: "Morning Ritual Social Cutdowns", category: "Short-form", mediaUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4", thumbnailUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80", fileSize: "225 MB", status: "Approved" },
];

/** Creates or updates the sample portal data using stable document IDs. */
export async function seedFirestoreData(): Promise<{ clients: number; resources: number }> {
  const batch = writeBatch(db);

  clients.forEach(({ id, ...client }) => {
    batch.set(doc(db, "clients", id), { ...client, createdAt: serverTimestamp() });
  });

  resources.forEach(({ id, ...resource }) => {
    batch.set(doc(db, "resources", id), { ...resource, createdAt: serverTimestamp() });
  });

  await batch.commit();

  return { clients: clients.length, resources: resources.length };
}
