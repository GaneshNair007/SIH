"use client";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Camera, Activity, Users, Info } from "lucide-react";
import { motion } from "framer-motion";

export default function HomePage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-300">
      {/* NAVBAR */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-xl">
            <ShieldCheck size={28} />
            H₂S Monitor
          </div>
          <div className="flex gap-6">
            <Link href="/readme" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
              <Info size={18} /> How it Works
            </Link>
            <Link href="/login" className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2 rounded-full font-medium transition-colors">
              Log In
            </Link>
          </div>
        </div>
      </nav>

      {/* SECTION A: HERO ELEMENT */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-950 text-cyan-400 text-sm font-medium mb-8 border border-cyan-800"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          Industrial Safety Reimagined
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight"
        >
          Passive H₂S Monitoring <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Made Simple.</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl text-slate-400 max-w-2xl mx-auto mb-10"
        >
          Protect your workforce with colorimetric wristbands and smartphone analysis. Track cumulative exposure across shifts without expensive hardware.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row justify-center gap-4"
        >
          <Link href="/login" className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-transform hover:scale-105 shadow-lg shadow-cyan-900/50">
            Log In to Platform <ArrowRight size={20} />
          </Link>
          <Link href="/readme" className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center transition-colors border border-slate-700">
            Learn More
          </Link>
        </motion.div>

        {/* Visual Elements Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24"
        >
          <motion.div variants={itemVariants} className="bg-slate-800/50 border border-slate-700 p-8 rounded-2xl flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mb-6 text-cyan-400">
              <ShieldCheck size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Colorimetric Band</h3>
            <p className="text-slate-400 text-center">Disposable wristbands that react to H₂S gas exposure passively over a 5-day cycle.</p>
          </motion.div>
          
          <motion.div variants={itemVariants} className="bg-slate-800/50 border border-slate-700 p-8 rounded-2xl flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mb-6 text-cyan-400">
              <Camera size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Camera Scanning</h3>
            <p className="text-slate-400 text-center">Managers scan bands at shift start and end using any smartphone. No special readers needed.</p>
          </motion.div>
          
          <motion.div variants={itemVariants} className="bg-slate-800/50 border border-slate-700 p-8 rounded-2xl flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mb-6 text-cyan-400">
              <Activity size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Digital Dashboard</h3>
            <p className="text-slate-400 text-center">Continuous worker history tracking and control room analytics across multiple shifts.</p>
          </motion.div>
        </motion.div>
      </section>

      {/* SECTION B: TEAM NAME + ABOUT */}
      <section className="bg-slate-800/30 border-y border-slate-800 py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-cyan-400 mb-4">[Your Team Name Here]</h2>
          <h3 className="text-4xl font-extrabold text-white mb-8">About Our Mission</h3>
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-6 text-lg text-slate-300 text-left bg-slate-800 p-8 rounded-2xl border border-slate-700"
          >
            <p>
              <strong className="text-white">The Problem:</strong> Industrial workers face constant danger from Hydrogen Sulfide (H₂S) gas. Traditional electronic personal gas monitors are expensive to maintain, require daily bump testing, and often fail to track long-term, low-level cumulative exposure.
            </p>
            <p>
              <strong className="text-white">Our Solution:</strong> We bridge the gap between chemistry and software. Our passive colorimetric wristband absorbs H₂S over 5 working days. Our platform allows Shift Managers to simply snap a photo to calculate the cumulative exposure range.
            </p>
            <p>
              <strong className="text-white">Why it Matters:</strong> It democratizes safety. Now, 100% of the workforce—including temporary contractors—can be monitored for chronic H₂S exposure without deploying thousands of dollars in hardware.
            </p>
          </motion.div>
        </div>
      </section>

      {/* SECTION C: PROJECT DESCRIPTION + OUR PHOTO + TEAM */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <h2 className="text-4xl font-extrabold text-white mb-12 text-center">Meet the Team</h2>
        
        {/* Team Photo Placeholder */}
        <div className="w-full h-96 bg-slate-800 border-2 border-dashed border-slate-600 rounded-2xl mb-16 flex items-center justify-center flex-col text-slate-500">
          <Users size={64} className="mb-4 opacity-50" />
          <p className="text-xl font-medium">[Insert Full Team Photo Here]</p>
        </div>

        {/* Individual Team Members */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[1, 2, 3, 4].map((member) => (
            <motion.div 
              key={member}
              whileHover={{ y: -5 }}
              className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-center hover:border-cyan-500/50 transition-colors group cursor-default"
            >
              <div className="w-24 h-24 bg-slate-700 rounded-full mx-auto mb-4 border-2 border-transparent group-hover:border-cyan-400 overflow-hidden flex items-center justify-center text-slate-500 transition-colors">
                [Photo]
              </div>
              <h3 className="text-xl font-bold text-white mb-1">[Name {member}]</h3>
              <p className="text-cyan-400 font-medium mb-3">[Role]</p>
              <p className="text-sm text-slate-400">
                [Short description of what they do for the project and their expertise]
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 bg-slate-900 py-8 text-center text-slate-500">
        <p>Award-Winning H2S Monitor Platform</p>
        <p className="mt-2 text-sm">© {new Date().getFullYear()} [Your Team Name]. SIH Project.</p>
      </footer>
    </div>
  );
}
