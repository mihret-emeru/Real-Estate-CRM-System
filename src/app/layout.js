import "./globals.css";
import { Inter, Playfair_Display } from "next/font/google";
import SessionProvider from "@/components/providers/SessionProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--heading-font",
});

export const metadata = {
  title: "Real Estate CRM",
  description: "Real Estate Management System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable}`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
