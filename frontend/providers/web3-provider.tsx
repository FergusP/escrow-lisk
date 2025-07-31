'use client';

import React from 'react';
import { Config, WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  XellarKitProvider,
  darkTheme,
  defaultConfig,
  lightTheme,
} from '@xellar/kit';
import { liskSepolia } from 'viem/chains';

const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
  'fd72198296f17b917980c76f888bf1c5';
const xellarAppId =
  process.env.NEXT_PUBLIC_XELLAR_APP_ID ||
  '5b991abc-7cb0-4005-b033-f961aee58aaa';

const config = defaultConfig({
  appName: 'Zapow',
  chains: [liskSepolia],
  // Required for WalletConnect
  walletConnectProjectId: walletConnectProjectId,

  // Required for Xellar Passport
  xellarAppId: xellarAppId,
  xellarEnv: 'sandbox',
  ssr: true, // Use this if you're using Next.js App Router
}) as Config;

const queryClient = new QueryClient();

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <XellarKitProvider theme={darkTheme}>{children}</XellarKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
