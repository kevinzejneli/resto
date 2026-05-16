import type { Metadata } from "next";
import "./globals.css";
import { AppFrame } from "../components/AppFrame";

export const metadata: Metadata = {
  title: "RestoMaster",
  description: "Restaurant OS: POS + inventory + WhatsApp ordering",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}
