import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Growth System - Autonomous Intelligence Console',
  description: 'Clean private intelligence and outreach platform for Zia Ul Din',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
        />
      </head>
      <body className="bg-canvas text-on-surface antialiased selection:bg-primary-container selection:text-white">
        {children}
      </body>
    </html>
  );
}

