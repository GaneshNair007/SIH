import Link from "next/link";
import { PROJECT } from "@/lib/content";

export default function PublicFooter() {
  return (
    <footer className="border-t border-border bg-canvas-white">
      <div className="page-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="w-6 h-6 rounded-full bg-teal flex items-center justify-center text-white text-[10px] font-bold">
                H₂S
              </span>
              <span className="font-serif font-semibold text-charcoal">
                {PROJECT.name}
              </span>
            </div>
            <p className="text-sm text-muted leading-relaxed max-w-xs">
              {PROJECT.heroLines[0]}
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
              Navigation
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-sm text-muted hover:text-charcoal transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/working"
                  className="text-sm text-muted hover:text-charcoal transition-colors"
                >
                  Pipeline
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-sm text-muted hover:text-charcoal transition-colors"
                >
                  Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Status */}
          <div>
            <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
              Status
            </h4>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-canvas-subtle text-xs font-medium text-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              {PROJECT.status}
            </div>
            <p className="text-xs text-muted-light mt-3 leading-relaxed">
              {PROJECT.limitation}
            </p>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-muted-light">
          <span>© {PROJECT.year} {PROJECT.name}</span>
          <span>Passive Colorimetric Dosimetry</span>
        </div>
      </div>
    </footer>
  );
}
