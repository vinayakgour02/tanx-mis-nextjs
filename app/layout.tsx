"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import "leaflet/dist/leaflet.css";


const inter = Inter({ subsets: ["latin"] });

// export const metadata = {
//   title: "tanX - Modern Monitoring & Evaluation Software",
//   description: "Empower your impact with smarter monitoring and evaluation tools featuring glassmorphism design",
// }

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <QueryClientProvider client={queryClient}>
          <Providers>{children}</Providers>
        </QueryClientProvider>
      </body>
    </html>
  );
}
