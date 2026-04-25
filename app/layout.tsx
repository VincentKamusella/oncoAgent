import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CommandPalette } from "@/components/shell/command-palette";
import "@xyflow/react/dist/style.css";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "oncoAgent — IDE for cancer",
  description:
    "A collaborative context base for tumor boards. Patients as files, treatment as code, agents in the loop.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full overflow-hidden antialiased`}
    >
      <body className="bg-canvas h-full overflow-hidden font-sans text-foreground">
        <TooltipProvider delay={120}>
          {children}
          <CommandPalette />
        </TooltipProvider>
      </body>
    </html>
  );
}
