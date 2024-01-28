import { ClerkProvider } from '@clerk/nextjs'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import "@/styles/globals.css";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ClerkProvider>
      <Navbar />
        <Component {...pageProps} />
      <Footer />
    </ClerkProvider>
  )
}
