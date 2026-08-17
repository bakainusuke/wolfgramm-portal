import { collection, addDoc, serverTimestamp, writeBatch, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { MediaResource } from "@/types";

export interface MockClient {
  name: string;
  company: string;
  email: string;
  phone: string;
  status: "Active" | "Lead" | "Archived";
  avatarUrl: string;
}

export interface MockResource {
  clientIndex: number; // 0, 1, hoặc 2 tương ứng với client trong danh sách
  title: string;
  category: MediaResource["category"];
  mediaUrl: string;
  thumbnailUrl: string;
  fileSize: string;
  status: "Approved" | "In Review" | "Draft";
}

const mockClients: MockClient[] = [
  {
    name: "Sarah Jenkins",
    company: "Auckland Metro Brand TVC",
    email: "sarah.jenkins@aucklandmetro.nz",
    phone: "+64 21 555 0192",
    status: "Active",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
  },
  {
    name: "David Chen",
    company: "Horizon Real Estate Walkthroughs",
    email: "david.chen@horizonproperties.co.nz",
    phone: "+64 22 849 2011",
    status: "Active",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
  },
  {
    name: "Aroha Te Kawa",
    company: "Pacific Sounds Music Video",
    email: "aroha@pacificsounds.nz",
    phone: "+64 27 123 9840",
    status: "Lead",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
  },
];

const mockResources: MockResource[] = [
  // Resources for Client 0: Auckland Metro
  {
    clientIndex: 0,
    title: "Main TVC 60s - Final Master (ProRes 422 HQ)",
    category: "Edited Video",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=600",
    fileSize: "1.4 GB",
    status: "Approved",
  },
  {
    clientIndex: 0,
    title: "Sony FX6 A-Cam Reel 01 - Golden Hour (S-Log3)",
    category: "Raw Footage",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600",
    fileSize: "4.8 GB",
    status: "Draft",
  },
  {
    clientIndex: 0,
    title: "Instagram Reels & TikTok Cutdown 9:16",
    category: "Short-form",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1536240478700-b869070f9279?w=600",
    fileSize: "185 MB",
    status: "In Review",
  },
  {
    clientIndex: 0,
    title: "Location Permit & Actor Release Forms",
    category: "Documents",
    mediaUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    thumbnailUrl: "https://images.unsplash.com/photo-1568667256549-094345857637?w=600",
    fileSize: "2.4 MB",
    status: "Approved",
  },

  // Resources for Client 1: Horizon Real Estate
  {
    clientIndex: 1,
    title: "Penthouse Cinematic 4K Walkthrough",
    category: "Edited Video",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600",
    fileSize: "850 MB",
    status: "Approved",
  },
  {
    clientIndex: 1,
    title: "DJI Inspire 3 Drone Footage - Coastal Views",
    category: "Raw Footage",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=600",
    fileSize: "3.2 GB",
    status: "In Review",
  },
  {
    clientIndex: 1,
    title: "Architectural Interior Still Photography",
    category: "Photos",
    mediaUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200",
    thumbnailUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600",
    fileSize: "95 MB",
    status: "Approved",
  },

  // Resources for Client 2: Pacific Sounds
  {
    clientIndex: 2,
    title: "Official Music Video - Color Graded Rough Cut",
    category: "Edited Video",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600",
    fileSize: "2.1 GB",
    status: "In Review",
  },
  {
    clientIndex: 2,
    title: "Studio Session B-Roll Stills",
    category: "Photos",
    mediaUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200",
    thumbnailUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600",
    fileSize: "120 MB",
    status: "Approved",
  },
  {
    clientIndex: 2,
    title: "Spotify Canvas & Story Teasers (Vertical)",
    category: "Short-form",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600",
    fileSize: "64 MB",
    status: "Draft",
  },
];

export async function seedDatabase() {
  try {
    const createdClientIds: string[] = [];

    // 1. Seed Clients
    for (const clientData of mockClients) {
      const docRef = await addDoc(collection(db, "clients"), {
        ...clientData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      createdClientIds.push(docRef.id);
    }

    // 2. Seed Resources with mapped clientId
    const batch = writeBatch(db);
    for (const res of mockResources) {
      const targetClientId = createdClientIds[res.clientIndex];
      const newDocRef = doc(collection(db, "resources"));
      
      const resourcePayload = {
        title: res.title,
        category: res.category,
        mediaUrl: res.mediaUrl,
        thumbnailUrl: res.thumbnailUrl,
        fileSize: res.fileSize,
        status: res.status,
      };
      batch.set(newDocRef, {
        ...resourcePayload,
        clientId: targetClientId,
        createdAt: serverTimestamp(),
      });
    }

    await batch.commit();
    return { success: true, clientsCount: createdClientIds.length, resourcesCount: mockResources.length };
  } catch (error: unknown) {
    console.error("Error seeding database:", error);
    throw error;
  }
}
