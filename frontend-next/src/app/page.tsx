import PublicNavbar from "@/components/layout/PublicNavbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/public/Hero";
import ProjectDescription from "@/components/public/ProjectDescription";
import PlatformAccess from "@/components/public/PlatformAccess";
import TeamSection from "@/components/public/TeamSection";
import FinalCTA from "@/components/public/FinalCTA";

export default function HomePage() {
  return (
    <>
      <PublicNavbar />
      <main className="flex-1">
        {/* Order: Hero -> Project Description -> Platform Access -> Team -> Final CTA */}
        <Hero />
        <ProjectDescription />
        <PlatformAccess />
        <TeamSection />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
