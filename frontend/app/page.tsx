"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAccount } from "wagmi";
import { Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { isConnected, isConnecting } = useAccount();

  useEffect(() => {
    if (!isConnecting) {
      if (isConnected) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    }
  }, [isConnected, isConnecting, router]);

  // Show loading while checking auth
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Zapow</h1>
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
      </div>
    </div>
  );
}