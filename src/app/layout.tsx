import type { Metadata } from "next";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "Markdown → HTML — A little Markdown. A beautiful page.",
  description: "Turn Markdown files into beautiful, standalone HTML pages. Preview, copy, download, or open in a new tab. Free, private, and entirely in your browser.",
  applicationName: "Markdown → HTML",
  icons: { icon: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/icon.svg` },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body>
        <noscript>
          <p className="mx-auto max-w-3xl p-6 text-center">
            Enable JavaScript to convert files. Markdown processing happens entirely in your browser, not on a server.
          </p>
        </noscript>
        {children}
      </body>
    </html>
  );
}
