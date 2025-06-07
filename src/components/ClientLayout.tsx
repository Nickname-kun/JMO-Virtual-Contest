"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useCallback, Suspense } from "react";
import LoadingOverlay from "@/components/LoadingOverlay";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FeedbackToast from '@/app/profile/FeedbackToast';
import { useLoading } from '@/contexts/LoadingContext';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoading } = useLoading();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      {isLoading && <LoadingOverlay />}
      <main style={{ flexGrow: 1 }}>{children}</main>
      <Footer />
      <Suspense fallback={<div>Loading...</div>}>
        <FeedbackToast />
      </Suspense>
    </div>
  );
} 