import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "ThriftAI - Smart Secondhand Shopping",
  description: "Discover amazing secondhand finds with AI-powered search and recommendations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
        />
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

          /* Force dark theme to override Bootstrap */
          html, body {
            background: #000000 !important;
            color: #ffffff !important;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', system-ui, sans-serif !important;
          }

          body {
            background-image:
              radial-gradient(circle at 20% 20%, rgba(16, 185, 129, 0.05) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(6, 214, 160, 0.05) 0%, transparent 50%),
              radial-gradient(circle at 40% 60%, rgba(0, 212, 255, 0.03) 0%, transparent 50%) !important;
            background-attachment: fixed !important;
            min-height: 100vh !important;
          }

          /* Override any Bootstrap container/layout elements that might have background colors */
          .container, .container-fluid, .row, [class*="col-"] {
            background: transparent !important;
            color: inherit !important;
          }

          /* Force all text to white to override Bootstrap's defaults */
          h1, h2, h3, h4, h5, h6, p, div, span, a {
            color: #ffffff !important;
          }

          /* Ensure App container has proper styling */
          .App {
            background: transparent !important;
            color: #ffffff !important;
            min-height: 100vh;
          }
        `}</style>
      </head>
      <body className="App">
        <Providers>
          {children}
        </Providers>
        <script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"
          async
        ></script>
      </body>
    </html>
  );
}
