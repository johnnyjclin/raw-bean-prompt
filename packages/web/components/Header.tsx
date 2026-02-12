"use client";

import Link from "next/link";
import Image from "next/image";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Header() {
  return (
    <header className="border-b border-gray-800 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" prefetch={false} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Image src="/logo.png" alt="Raw Bean Prompt" width={40} height={40} className="w-10 h-10" />
          <span className="text-xl font-bold">Raw Bean Prompt</span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/" prefetch={false} className="hover:text-green-500">Marketplace</Link>
          <Link href="/dashboard" prefetch={false} className="hover:text-green-500">Dashboard</Link>
          <Link href="/agent" prefetch={false} className="hover:text-green-500">Agent</Link>
          <Link 
            href="/launch" 
            prefetch={false}
            className="bg-green-500 hover:bg-green-600 text-black px-6 py-2 rounded-lg font-semibold flex items-center gap-2"
          >
            <span>+</span>
            <span>Launch</span>
          </Link>
          <ConnectButton />
        </nav>
      </div>
    </header>
  );
}
