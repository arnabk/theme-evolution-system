import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Theme Evolution System',
  description: 'AI-powered theme extraction and evolution',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.Node;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

