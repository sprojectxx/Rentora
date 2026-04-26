import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Layout() {
    const location = useLocation();
    const isLanding = location.pathname === "/";

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className={isLanding ? "" : "pt-16 flex-1"}>
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}