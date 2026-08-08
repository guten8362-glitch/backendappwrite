import { listHalls } from './appwrite/database';
import { APPWRITE_CONFIG } from "./appwrite/constants";

export interface Auditorium {
  id: string;
  name: string;
  capacity: number;
  tagline: string;
  availability: string;
  image: string | string[];
  location: string;
  facilities: string[];
  about: string;
}

const DEFAULT_AUDITORIUMS: Auditorium[] = [
  {
    id: "av-room",
    name: "Audio Visual (AV) Room",
    capacity: 150,
    tagline: "Air-Conditioned • Audio Visual System",
    availability: "Available Today",
    image: ["/logos/logo4.jpg"],
    location: "Main Building, First Floor",
    facilities: ["Air Conditioner", "Projector & Screen", "Podium Mic", "Wireless Mics", "Sound System"],
    about: "State of the art Audio-Visual Hall equipped with high definition projection and acoustic surround system for seminars and presentations."
  },
  {
    id: "conference-hall",
    name: "Central Conference Hall",
    capacity: 250,
    tagline: "Executive Seating • High Definition Display",
    availability: "Available Today",
    image: ["/logos/logo4.jpg"],
    location: "Administrative Block, Second Floor",
    facilities: ["Air Conditioner", "Executive Chairs", "Video Conference System", "Podium Mic", "High-speed Wi-Fi"],
    about: "Spacious conference hall designed for academic conferences, guest lectures, and institutional meetings."
  },
  {
    id: "ground-floor-auditorium",
    name: "Ground Floor Auditorium",
    capacity: 500,
    tagline: "Large Capacity • Stage Lighting",
    availability: "Available Today",
    image: ["/logos/logo4.jpg"],
    location: "Main Building, Ground Floor",
    facilities: ["Stage Lighting", "Dais Setup", "Sound System", "Green Rooms", "Broadcasting Support"],
    about: "Multi-purpose auditorium with large seating capacity ideal for cultural events, inaugurations, and annual functions."
  },
  {
    id: "backside-auditorium",
    name: "Backside Auditorium",
    capacity: 350,
    tagline: "Open Layout • Campus Events",
    availability: "Available Today",
    image: ["/logos/logo4.jpg"],
    location: "Campus Back Block",
    facilities: ["PA System", "Stage Setup", "Generous Parking", "Restroom Facilities"],
    about: "Open campus auditorium suitable for inter-collegiate fests, workshops, and sports cultural gatherings."
  }
];

export const fetchAuditoriums = async (): Promise<Auditorium[]> => {
  try {
    const data = await listHalls();
    console.log("DB Halls Data:", data);
    if (Array.isArray(data) && data.length > 0) {
      return data.map((h: any) => {
        let rawImages = h.imagesURL || h.imageURL || h.image || h.images || [];
        if (typeof rawImages === "string") {
          try { rawImages = JSON.parse(rawImages); } catch { rawImages = [rawImages]; }
        }
        
        const mappedImages = (Array.isArray(rawImages) ? rawImages : [rawImages]).map((img: string) => {
          if (!img) return "";
          if (/^[a-zA-Z0-9]{20}$/.test(img)) {
            return `${APPWRITE_CONFIG.endpoint}/storage/buckets/${APPWRITE_CONFIG.bucketId}/files/${img}/view?project=${APPWRITE_CONFIG.projectId}`;
          }
          return img;
        }).filter(Boolean);

        return {
          id: h.$id,
          name: h.name || "Unnamed Hall",
          capacity: h.capacity || 0,
          tagline: h.description || h.tagline || "",
          availability: h.availability || "Available Today",
          image: mappedImages.length > 0 ? mappedImages : ["/logos/logo4.jpg"],
          location: h.location || "",
          facilities: h.facilities || [],
          about: h.about || h.description || ""
        };
      });
    }
  } catch (err) {
    console.error("fetchAuditoriums appwrite error:", err);
  }
  return DEFAULT_AUDITORIUMS;
};

export const fetchAuditorium = async (id: string): Promise<Auditorium | undefined> => {
  const allHalls = await fetchAuditoriums();
  return allHalls.find(h => h.id === id || (h.name || "").toLowerCase().trim() === id.toLowerCase().trim());
};
