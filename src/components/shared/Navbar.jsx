import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Home, Heart, MessageCircle, LayoutDashboard, LogOut, User as UserIcon, Moon, Sun, Menu, Plus } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { cn } from "@/lib/utils";

export default function Navbar() {
    const { user, logout, navigateToLogin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);
    const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
    const [mobileOpen, setMobileOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const toggleDark = () => {
        const next = !dark;
        setDark(next);
        document.documentElement.classList.toggle("dark", next);
    };

    const isOwner = user?.role === "owner";
    const isAdmin = user?.role === "admin";
    const navLinks = [
        { to: "/browse", label: "Browse", icon: Home },
        ...(user
            ? isAdmin
                ? [{ to: "/admin", label: "Admin", icon: LayoutDashboard }]
                : isOwner
                    ? [{ to: "/owner", label: "Dashboard", icon: LayoutDashboard }]
                    : [
                        { to: "/dashboard", label: "Saved", icon: Heart },
                        { to: "/messages", label: "Messages", icon: MessageCircle },
                    ]
            : []),
    ];

    return (
        <header
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
                scrolled ? "glass border-b border-border/60" : "bg-transparent"
            )}
        >
            <div className="max-w-7xl mx-auto px-5 lg:px-8 h-16 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2 group">
                    <img src="/logo.png" alt="Rentora" className="w-8 h-8 rounded-xl shadow-sm group-hover:rotate-6 transition-transform object-cover" />
                    <span className="font-display text-2xl font-semibold tracking-tight">Rentora</span>
                </Link>

                <nav className="hidden md:flex items-center gap-1">
                    {navLinks.map((l) => {
                        const active = location.pathname === l.to;
                        return (
                            <Link
                                key={l.to}
                                to={l.to}
                                className={cn(
                                    "px-4 py-2 rounded-full text-sm font-medium transition-all",
                                    active ? "bg-foreground text-background" : "hover:bg-secondary"
                                )}
                            >
                                {l.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={toggleDark} className="rounded-full">
                        {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </Button>

                    {(isOwner || isAdmin) && (
                        <Button onClick={() => navigate("/owner/new")} className="hidden sm:inline-flex rounded-full gap-2">
                            <Plus className="w-4 h-4" /> List property
                        </Button>
                    )}

                    {user ? (
                        <DropdownMenu open={profileOpen} onOpenChange={(open) => {
                            setProfileOpen(open);
                            if (open) setMobileOpen(false);
                        }}>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-secondary transition-colors">
                                    <Avatar className="w-8 h-8">
                                        <AvatarImage src={user.avatar_url} />
                                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                            {(user.full_name || user.email || "U")[0].toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent 
                                align="end" 
                                className="w-56"
                                onInteractOutside={(e) => {
                                    if (e.target.closest("#hamburger-btn")) {
                                        e.preventDefault();
                                    }
                                }}
                            >
                                <div className="px-2 py-2">
                                    <div className="font-medium text-sm truncate">{user.full_name}</div>
                                    <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                                    <div className="text-[10px] uppercase tracking-wider mt-1 text-primary font-semibold">{user.role}</div>
                                </div>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => navigate("/profile")}>
                                    <UserIcon className="w-4 h-4 mr-2" /> Profile
                                </DropdownMenuItem>
                                {isAdmin ? (
                                    <DropdownMenuItem className="hidden md:flex" onClick={() => navigate("/admin")}>
                                        <LayoutDashboard className="w-4 h-4 mr-2" /> Admin panel
                                    </DropdownMenuItem>
                                ) : isOwner ? (
                                    <DropdownMenuItem className="hidden md:flex" onClick={() => navigate("/owner")}>
                                        <LayoutDashboard className="w-4 h-4 mr-2" /> My listings
                                    </DropdownMenuItem>
                                ) : (
                                    <>
                                        <DropdownMenuItem className="hidden md:flex" onClick={() => navigate("/dashboard")}>
                                            <Heart className="w-4 h-4 mr-2" /> Saved
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="hidden md:flex" onClick={() => navigate("/messages")}>
                                            <MessageCircle className="w-4 h-4 mr-2" /> Messages
                                        </DropdownMenuItem>
                                    </>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={logout}>
                                    <LogOut className="w-4 h-4 mr-2" /> Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button onClick={navigateToLogin} className="rounded-full">
                            Sign in
                        </Button>
                    )}

                    <Button id="hamburger-btn" variant="ghost" size="icon" className="md:hidden rounded-full" onClick={() => {
                        const next = !mobileOpen;
                        setMobileOpen(next);
                        if (next) setProfileOpen(false);
                    }}>
                        <Menu className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {mobileOpen && (
                <div className="md:hidden glass border-t border-border/60 px-5 py-3 space-y-1">
                    {navLinks.map((l) => (
                        <Link
                            key={l.to}
                            to={l.to}
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary"
                        >
                            <l.icon className="w-4 h-4" /> {l.label}
                        </Link>
                    ))}
                </div>
            )}
        </header>
    );
}