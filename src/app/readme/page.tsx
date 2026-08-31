import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";

export default function ReadmePage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-300 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-medium mb-8">
          <ArrowLeft size={20} /> Back to Home
        </Link>

        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6">How It Works</h1>
        
        {/* WORKING README SECTION */}
        <section className="bg-slate-800 border border-slate-700 rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 border-b border-slate-700 pb-4">Workflow Architecture</h2>
          
          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-cyan-900 text-cyan-400 flex items-center justify-center font-bold shrink-0">1</div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Assign & Distribute</h3>
                <p>A new, sterile colorimetric band is assigned to a Worker. The band has a max lifecycle of 5 working days before it must be retired.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-cyan-900 text-cyan-400 flex items-center justify-center font-bold shrink-0">2</div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Shift Start Scan</h3>
                <p>The Shift Manager scans the band QR code. This logs the baseline color state and starts the exposure clock.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-cyan-900 text-cyan-400 flex items-center justify-center font-bold shrink-0">3</div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Passive Absorption</h3>
                <p>The worker performs their duties. The chemistry on the patch passively absorbs any H₂S in the environment.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-cyan-900 text-cyan-400 flex items-center justify-center font-bold shrink-0">4</div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Shift End Scan & Calculation</h3>
                <p>The Manager scans the band again. The app calculates <code className="bg-slate-900 px-1 rounded text-cyan-300">exposure = end - start</code> and determines the exposure range (e.g., 4.8–6.2 ppm•h) along with a Measurement Confidence score (HIGH/MEDIUM/LOW/INVALID).</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-cyan-900 text-cyan-400 flex items-center justify-center font-bold shrink-0">5</div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Continuous History</h3>
                <p>The data is appended to the worker&apos;s permanent digital profile. Even when the band is retired and replaced, the worker&apos;s exposure history continues seamlessly.</p>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mt-12 mb-6 border-b border-slate-700 pb-4">Technology Stack</h2>
          <div className="flex flex-wrap gap-3">
            {["Next.js 14 (App Router)", "React 18", "TypeScript", "Tailwind CSS", "Lucide Icons"].map(tech => (
              <span key={tech} className="bg-slate-900 border border-slate-700 px-4 py-2 rounded-lg font-medium">{tech}</span>
            ))}
          </div>
        </section>

        {/* WHY WE ARE BETTER SECTION */}
        <section>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-8">Why We Are Better</h2>
          
          <div className="overflow-x-auto bg-slate-800 border border-slate-700 rounded-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900/50">
                  <th className="p-4 font-bold text-white">Feature</th>
                  <th className="p-4 font-bold text-white w-1/3">Typical / Old Solutions</th>
                  <th className="p-4 font-bold text-cyan-400 w-1/3">Our Platform</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                <tr>
                  <td className="p-4 font-medium text-white">Cost & Maintenance</td>
                  <td className="p-4 text-slate-400"><XCircle size={16} className="inline mr-2 text-red-400"/>Expensive hardware, daily bump tests</td>
                  <td className="p-4 text-cyan-100 bg-cyan-900/20"><CheckCircle2 size={16} className="inline mr-2 text-cyan-400"/>Disposable bands, zero maintenance</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-white">Data Representation</td>
                  <td className="p-4 text-slate-400"><XCircle size={16} className="inline mr-2 text-red-400"/>Fake precision (single exact numbers)</td>
                  <td className="p-4 text-cyan-100 bg-cyan-900/20"><CheckCircle2 size={16} className="inline mr-2 text-cyan-400"/>Honest Range-based exposure (e.g., 10-30 ppm•h)</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-white">Worker History</td>
                  <td className="p-4 text-slate-400"><XCircle size={16} className="inline mr-2 text-red-400"/>Often lost when hardware is reset/reassigned</td>
                  <td className="p-4 text-cyan-100 bg-cyan-900/20"><CheckCircle2 size={16} className="inline mr-2 text-cyan-400"/>Continuous digital history across multiple bands</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-white">Access Control</td>
                  <td className="p-4 text-slate-400"><XCircle size={16} className="inline mr-2 text-red-400"/>Everyone sees everything, or no one does</td>
                  <td className="p-4 text-cyan-100 bg-cyan-900/20"><CheckCircle2 size={16} className="inline mr-2 text-cyan-400"/>Strict Role-based access (Worker vs Manager)</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-white">Lifecycle Tracking</td>
                  <td className="p-4 text-slate-400"><XCircle size={16} className="inline mr-2 text-red-400"/>Manual tracking of sensor degradation</td>
                  <td className="p-4 text-cyan-100 bg-cyan-900/20"><CheckCircle2 size={16} className="inline mr-2 text-cyan-400"/>Enforced 5 working days lifecycle in app</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-white">Data Integrity</td>
                  <td className="p-4 text-slate-400"><XCircle size={16} className="inline mr-2 text-red-400"/>Assumes all readings are 100% accurate</td>
                  <td className="p-4 text-cyan-100 bg-cyan-900/20"><CheckCircle2 size={16} className="inline mr-2 text-cyan-400"/>Calculates Measurement Confidence (HIGH/MED/LOW/INVALID)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
