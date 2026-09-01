import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Providers from "@/components/Providers";

const inter = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ),
  title: "H₂S Dose Wristband | Passive Colorimetric Exposure Monitoring",
  description:
    "A passive wristband that records a colour response to H₂S exposure. Read the band with a smartphone and connect each reading to a worker's history.",
  openGraph: {
    title: "H₂S Dose Wristband",
    description:
      "Passive colour response · smartphone reading · worker history",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Concept illustration of the H₂S Dose Wristband with A, B and C colour patches",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "H₂S Dose Wristband",
    description:
      "Passive colour response · smartphone reading · worker history",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${inter.className} bg-canvas text-charcoal min-h-screen antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
