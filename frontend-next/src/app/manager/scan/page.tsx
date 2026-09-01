import ProtectedNavbar from "@/components/layout/ProtectedNavbar";
import Footer from "@/components/layout/Footer";
import BandScanner from "@/components/dashboard/BandScanner";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export default function ManagerScanPage() {
  return (
    <>
      <ProtectedNavbar />
      <main className="flex-1 py-10 px-6 lg:px-12 bg-warm-white">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Link
              href="/manager"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-sage-muted hover:text-charcoal transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Shift Manager Dashboard</span>
            </Link>
            <span className="text-xs font-mono text-sage-muted">Optical Dosimetry Portal</span>
          </div>

          <BandScanner standalone={true} />
        </div>
      </main>
      <Footer />
    </>
  );
}
