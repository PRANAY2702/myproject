import "./globals.css";
import { Bricolage_Grotesque } from "next/font/google"; // Import the font
import { Toaster } from "sonner";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/app/context/AuthContext";
import DynamicBG from "@/components/DynamicBG";
// import SPECOGImg from "@/public/SPECOGImg.jpeg";

export const metadata = {
  title: "SPECTRUM 2026 - Nationwide Art and Photography Contest | PEC, Chandigarh",
  description: "Official website for the flagship event of the Art and Photography Club, PEC - SPECTRUM 2026. Explore a vibrant showcase of creativity, featuring stunning art and captivating photography. Join us for an unforgettable celebration of talent and imagination.",
  openGraph: {
    title: "SPECTRUM 2026 - Nationwide Art and Photography Contest | PEC, Chandigarh",
    description: "Official website for the flagship event of the Art and Photography Club, PEC - SPECTRUM 2026. Explore a vibrant showcase of creativity, featuring stunning art and captivating photography. Join us for an unforgettable celebration of talent and imagination.",
    url: "https://spectrumbypec.in",
    siteName: "SPECTRUM 2026",
    images: ["https://spectrum.gumlet.io/displayImg17_qd4cio"],
    locale: "en-US",
    type: "website",
  },
};

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
});

export default function RootLayout({
  children,
}) {
  return (
    <html lang="en">
      <body
        className={`${bricolage.className} antialiased`}
      >
        <AuthProvider>
          <Toaster />
          <Navbar />
          <DynamicBG>
            {children}
          </DynamicBG>
        </AuthProvider>
      </body>
    </html>
  );
}
