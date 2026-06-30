import "./globals.css";

export const metadata = {
  title: "Impact Hub",
  description: "Coordinate volunteer participation in community events.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
