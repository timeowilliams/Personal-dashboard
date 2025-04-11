"use client";

import { useEffect } from "react";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const img = new Image();
    img.src = "/mountain-background.jpg";

    img.onerror = () => {
      document.body.classList.add("no-bg-image");
    };
  }, []);

  return <body>{children}</body>;
}
