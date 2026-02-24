/* Home.jsx — The full landing page, extracted from App.jsx */
import HeroSection from '../components/HeroSection'
import TrustBar from '../components/TrustBar'
import HowItWorks from '../components/HowItWorks'
import FeaturedGrid from '../components/FeaturedGrid'
import CommunitySection from '../components/CommunitySection'
import LenderCTA from '../components/LenderCTA'
import Testimonials from '../components/Testimonials'

export default function Home() {
    return (
        <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "28px 20px 60px", display: "flex", flexDirection: "column", gap: "56px" }}>
            <HeroSection />
            <TrustBar />
            <HowItWorks />
            <div id="explore"><FeaturedGrid /></div>
            <CommunitySection />
            <LenderCTA />
            <Testimonials />
        </main>
    )
}
