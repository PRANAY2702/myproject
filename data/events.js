// Assuming you have these exported correctly in your project
import FabricFusion from '@/public/events/FabricFusion.png';
import BrandFrame from '@/public/events/BrandFrame.png';
import A3Painting from '@/public/events/A3Painting.png';
import CanvasConclave from '@/public/events/CanvasConclave.png';
import PaintedPersona from '@/public/events/PaintedPersona.png';
import NarrativeLens from '@/public/events/NarrativeLens.png';

export const EVENTS_DATA = [
  {
    id: "evt-01",
    title: "The Painted Arena",
    category: "Art",
    rounds: 2,
    date: "Day 1 & 2",
    location: "Drawing Halls, PEC, Chandigarh",
    description: "Unleash your creativity in this two-round painting showdown that celebrates imagination, skill, and artistic expression. In Round 1, participants will craft their vision on an A3 canvas using acrylics, based on a theme. Shortlisted artists will advance to Round 2, where they will take on a larger canvas with 4.5 hours in hand, pushing their originality, technique, and compositional excellence to the next level. 🎨✨",
    rulebookUrl: "https://drive.google.com/drive/folders/1nHqwsup2F2aaurZ1VN1LD5M-rFmWtw-C?usp=drive_link",
    posters: [
      A3Painting,
      CanvasConclave
    ],
    accentColor: "#EBBA32",
    registrationFees: "₹250",
    prizePool: "₹40,000"
  },
  {
    id: "evt-02",
    title: "Brand Frame & Narrative Lens",
    category: "Photography",
    rounds: 2,
    date: "Day 1 & 2",
    location: "Round 1: PEC Campus | Round 2: Citywide",
    description: "Step into the world of visual storytelling in this dynamic two-round photography competition that blends branding with creativity. In Round 1, participants will capture compelling product photographs that authentically represent a brand’s identity using curated products and props. Shortlisted photographers will advance to Round 2, where they will craft a powerful photo story, transforming everyday moments into a cohesive and impactful visual narrative through their own concept and execution. 📸✨",
    rulebookUrl: "https://drive.google.com/drive/folders/1f0HOiT3vcczEmhuVBz1izdGhwpO_8InJ?usp=drive_link",
    posters: [
      BrandFrame,
      NarrativeLens
    ],
    accentColor: "#7CA458",
    registrationFees: "₹200",
    prizePool: "₹30,000"
  },
  {
    id: "evt-03",
    title: "Painted Personas",
    category: "Art",
    rounds: 1,
    date: "Day 2 - 2:00 PM",
    location: "Auditorium PEC, Chandigarh",
    description: "Painted Personas is a dynamic body painting and styling competition where creativity takes center stage. Participants will transform their models into striking visual concepts, blending artistic technique with styling, makeup, and thematic expression. From intricate details to a fully realized persona, this event challenges teams to create bold, cohesive looks that stand out on stage. It’s not just body art — it’s storytelling through color, design, and identity. 🎨✨",
    rulebookUrl: "https://drive.google.com/drive/folders/14nMRN79hPtl4Ssdk_97xKdsfpjX50dRK?usp=drive_link",
    posters: [PaintedPersona],
    accentColor: "#5AE0FE",
    registrationFees: "₹250",
    prizePool: "₹40,000"
  },
  {
    id: "evt-04",
    title: "Fabric Fusion",
    category: "Art",
    rounds: 1,
    date: "Day 2 - 11:00 AM",
    location: "PEC, Chandigarh",
    description: "Design your own tote bag in this creative showcase of personal style. Participants will create unique designs that blend art and functionality, competing for recognition of the most innovative and visually striking tote bag designs. This event celebrates the fusion of creativity and everyday utility, challenging participants to transform a simple canvas into a wearable work of art. 🎨✨",
    rulebookUrl: "https://drive.google.com/drive/folders/1CnTUAOGdNjD3UFEK5Ib9-K7JLrOEcv9C?usp=sharing",
    posters: [FabricFusion],
    accentColor: "#F6E245",
    registrationFees: "₹120",
    prizePool: "₹5,000"
  }
];