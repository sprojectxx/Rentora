import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
    return (
        <footer className="border-t border-border/60 bg-background mt-20">
            <div className="max-w-7xl mx-auto px-5 lg:px-8 py-12 grid md:grid-cols-4 gap-10">
                <div className="md:col-span-2">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                            <span className="text-primary-foreground font-display font-bold text-lg">R</span>
                        </div>
                        <span className="font-display text-2xl font-semibold">Rentora</span>
                    </div>
                    <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                        The trusted student rental platform. No brokers, no inflated fees — just verified stays
                        near your campus.
                    </p>
                </div>
                <div>
                    <div className="text-sm font-semibold mb-3">For students</div>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li><Link to="/browse" className="hover:text-foreground">Find a stay</Link></li>
                        <li><Link to="/dashboard" className="hover:text-foreground">Saved places</Link></li>
                        <li><Link to="/messages" className="hover:text-foreground">Messages</Link></li>
                    </ul>
                </div>
                <div>
                    <div className="text-sm font-semibold mb-3">For owners</div>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li><Link to="/owner" className="hover:text-foreground">Dashboard</Link></li>
                        <li><Link to="/owner/new" className="hover:text-foreground">List a property</Link></li>
                    </ul>
                </div>
            </div>
            <div className="border-t border-border/60 py-5 text-center text-xs text-muted-foreground">
                © {new Date().getFullYear()} Rentora. Made for students.
            </div>
        </footer>
    );
}