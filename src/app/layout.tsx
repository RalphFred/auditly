import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
const satoshi = localFont({
  src: [
    {
      path: "../fonts/Satoshi-Variable.ttf",
      weight: "300 900",
      style: "normal",
    },
    {
      path: "../fonts/Satoshi-VariableItalic.ttf",
      weight: "300 900",
      style: "italic",
    },
  ],
  variable: "--font-satoshi",
});

export const metadata: Metadata = {
  title: "Auditly",
  description: "Your All-In-One Website Audit Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${satoshi.variable} antialiased`}>
 
        {children}
      </body>
    </html>
  );
}
