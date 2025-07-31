"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ConnectButton } from "@xellar/kit";
import { Shield, Zap, CheckCircle } from "lucide-react";
import { useAccount } from "wagmi";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isConnected } = useAccount();
  // Redirect if already authenticated
  useEffect(() => {
    if (isConnected) {
      const redirect = searchParams.get('redirect') || '/dashboard';
      router.push(redirect);
    }
  }, [isConnected, router, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="flex min-h-screen">
        {/* Left side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent" />
          <div className="relative z-10 flex flex-col justify-center px-12 py-12">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Zap className="h-7 w-7 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white">Zapow</h1>
              </div>
              <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
                The Future of
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-green-300">Secure Trading</span>
              </h2>
              <p className="text-xl text-blue-100 mb-12 leading-relaxed">
                Experience lightning-fast escrow powered by blockchain. 
                Trade globally with confidence and transparency.
              </p>
            </div>
            
            <div className="space-y-4">
              {[
                "Smart contract powered escrow",
                "Lightning-fast settlements",
                "Zero hidden fees, 100% transparent",
                "Trade with anyone, anywhere"
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-blue-100">{feature}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full blur-xl" />
          <div className="absolute bottom-20 right-40 w-24 h-24 bg-blue-400/20 rounded-full blur-lg" />
        </div>

        {/* Right side - Auth form */}
        <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-12">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="lg:hidden mb-8 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Zapow</h1>
              </div>
            </div>

            <div className="mb-6 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Zapow</h2>
              <p className="text-gray-600">
                Connect your wallet to start secure escrow trading
              </p>
            </div>

            <Card className="border-0 shadow-xl bg-white backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Wallet Connection CTA */}
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse">
                      <Zap className="h-8 w-8 text-white" />
                    </div>
                    
                    <h3 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-green-500 bg-clip-text text-transparent">Get Started in Seconds</h3>
                    <p className="text-sm text-gray-600 max-w-xs mx-auto">
                      No lengthy forms. Just connect your wallet and start trading securely.
                    </p>
                  </div>
                  
                  {/* Connect Button with enhanced styling */}
                  <div className="space-y-4">
                    <ConnectButton className="w-full" />
                  </div>
                  
                  {/* Supported Wallets */}
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-center text-xs text-gray-500 mb-2">Supported Wallets</p>
                    <div className="flex items-center justify-center gap-4 text-xs">
                      <span className="text-gray-500">Email</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-500">MetaMask</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-500">WalletConnect</span>
                    </div>
                  </div>

                  {/* Security Badge */}
                  <div className="bg-blue-50 rounded-lg p-3 flex items-center justify-center gap-2">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-medium text-blue-900">Secured by Xellar Embedded Wallet</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-6 text-center space-y-4">
              <p className="text-xs text-gray-500">
                By continuing, you agree to our{" "}
                <Link href="#" className="text-blue-600 hover:text-blue-700">Terms</Link>
                {" & "}
                <Link href="#" className="text-blue-600 hover:text-blue-700">Privacy</Link>
              </p>
              
              {/* Trust indicators */}
              <div className="flex items-center justify-center gap-6">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-gray-500">10,000+ Traders</span>
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="h-3 w-3 text-blue-500" />
                  <span className="text-xs text-gray-500">Blockchain Secured</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}