import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { propertyService } from "@/api/propertyService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, ShieldCheck, MessageSquare, Sparkles, ArrowRight } from "lucide-react";
import PropertyCard from "@/components/shared/PropertyCard";
import { useUserLocation } from "@/hooks/useUserLocation";

export default function Landing() {
    const navigate = useNavigate();
    const [q, setQ] = useState("");

    useEffect(() => {
        if (window.innerWidth < 768) {
            navigate("/browse", { replace: true });
        }
    }, [navigate]);

    const { coords: userCoords } = useUserLocation();

    const { data: featured = [] } = useQuery({
        queryKey: ["featured-properties"],
        queryFn: propertyService.getFeaturedProperties,
    });

    const submit = (e) => {
        e.preventDefault();
        navigate(`/browse?q=${encodeURIComponent(q)}`);
    };

    return (
        <div>
            {/* HERO */}
            <section className="relative overflow-hidden grain pt-28 pb-24 lg:pt-36 lg:pb-32">
                <div
                    className="absolute inset-0 -z-10"
                    style={{
                        background:
                            "radial-gradient(ellipse 80% 60% at 50% 0%, hsl(var(--primary) / 0.15), transparent 70%), radial-gradient(ellipse 60% 40% at 80% 100%, hsl(var(--accent) / 0.4), transparent 70%)",
                    }}
                />
                <div className="max-w-7xl mx-auto px-5 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                        className="max-w-4xl"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-medium mb-6">
                            <Sparkles className="w-3.5 h-3.5 text-primary" />
                            Zero brokerage. Verified listings.
                        </div>
                        <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-medium leading-[0.95] text-balance tracking-tight">
                            Your perfect
                            <br />
                            <span className="italic text-primary">student stay</span>,<br />
                            without the hassle.
                        </h1>
                        <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
                            Find PGs, hostels, and rooms near your campus. Connect directly with verified owners —
                            no middlemen, no inflated rent.
                        </p>

                        <form
                            onSubmit={submit}
                            className="mt-10 max-w-xl flex items-center gap-2 p-2 bg-card border border-border rounded-full shadow-lg shadow-foreground/5"
                        >
                            <div className="flex-1 flex items-center gap-2 pl-4">
                                <Search className="w-4 h-4 text-muted-foreground" />
                                <Input
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    placeholder="Search by college, city, or neighbourhood"
                                    className="border-0 shadow-none focus-visible:ring-0 px-0"
                                />
                            </div>
                            <Button type="submit" className="rounded-full px-6">
                                Search <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                        </form>

                        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Verified owners</div>
                            <div className="flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Direct chat</div>
                            <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Near your campus</div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* FEATURED */}
            <section className="max-w-7xl mx-auto px-5 lg:px-8 py-20">
                <div className="flex items-end justify-between mb-10">
                    <div>
                        <h2 className="font-display text-4xl lg:text-5xl font-medium tracking-tight">
                            Handpicked <span className="italic text-primary">stays</span>
                        </h2>
                        <p className="text-muted-foreground mt-2">Fresh listings from trusted owners</p>
                    </div>
                    <Button variant="ghost" onClick={() => navigate("/browse")} className="rounded-full gap-1">
                        See all <ArrowRight className="w-4 h-4" />
                    </Button>
                </div>

                {featured.length === 0 ? (
                    <div className="text-center py-20 border border-dashed rounded-3xl">
                        <p className="text-muted-foreground">No listings yet. Be the first to list!</p>
                        <Button onClick={() => navigate("/owner/new")} className="mt-4 rounded-full">List a property</Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {featured.map((p, i) => <PropertyCard key={p.id} property={p} index={i} userCoords={userCoords} bookmarked={false} onToggleBookmark={null} />)}
                    </div>
                )}
            </section>

            {/* HOW IT WORKS */}
            <section className="max-w-7xl mx-auto px-5 lg:px-8 py-20">
                <div className="max-w-2xl mb-14">
                    <h2 className="font-display text-4xl lg:text-5xl font-medium tracking-tight">
                        How Rentora <span className="italic">works</span>
                    </h2>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                    {[
                        { n: "01", t: "Search smarter", d: "Filter by price, distance to campus, amenities and room type — no more endless scrolling." },
                        { n: "02", t: "Connect directly", d: "Message verified owners in-app. Ask questions, share details, settle terms." },
                        { n: "03", t: "Move in confidently", d: "Every listing is verified. No brokers, no hidden charges, no surprises." },
                    ].map((step, i) => (
                        <motion.div
                            key={step.n}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="p-8 rounded-3xl bg-card border border-border hover:border-primary/40 transition-colors"
                        >
                            <div className="font-display text-5xl text-primary/20 font-medium mb-4">{step.n}</div>
                            <h3 className="font-display text-2xl font-medium mb-2">{step.t}</h3>
                            <p className="text-muted-foreground leading-relaxed">{step.d}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* OWNER CTA */}
            <section className="max-w-7xl mx-auto px-5 lg:px-8 py-20">
                <div className="relative overflow-hidden rounded-3xl bg-foreground text-background p-10 lg:p-16 grain">
                    <div
                        className="absolute inset-0 -z-10 opacity-60"
                        style={{
                            background:
                                "radial-gradient(ellipse 60% 80% at 100% 100%, hsl(var(--primary) / 0.4), transparent 60%)",
                        }}
                    />
                    <div className="max-w-2xl">
                        <h2 className="font-display text-4xl lg:text-6xl font-medium tracking-tight text-balance">
                            Own a property? <span className="italic text-primary">List it free.</span>
                        </h2>
                        <p className="mt-5 text-background/70 text-lg leading-relaxed">
                            Reach thousands of students searching for stays right now. Manage everything from a single dashboard.
                        </p>
                        <Button
                            onClick={() => navigate("/owner/new")}
                            size="lg"
                            className="mt-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                            Become a host <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
}