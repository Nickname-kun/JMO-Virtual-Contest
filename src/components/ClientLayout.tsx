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
    <>
      <Navbar />
      {isLoading && <LoadingOverlay />}
      <main>{children}</main>
      <Footer />
      <Suspense fallback={<div>Loading...</div>}>
        <FeedbackToast />
      </Suspense>
    </>
  );
} 