import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { propertyService } from "@/api/propertyService";
import { messageService } from "@/api/messageService";
import { useAuth } from "@/lib/AuthContext";
import { handleError } from "@/lib/errorHandler";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Heart, MapPin, BadgeCheck, Phone, MessageSquare, ArrowLeft, Share2, Navigation, ChevronLeft, ChevronRight } from "lucide-react";
import AmenityIcon, { AMENITY_META } from "@/components/shared/AmenityIcon";
import PropertyCard from "@/components/shared/PropertyCard";
import ReviewSection from "@/components/property/ReviewSection";
import { toast } from "sonner";
import { Toaster } from "sonner";
import { useUserLocation, getDistanceKm, formatDistance } from "@/hooks/useUserLocation";

const FALLBACK = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1600&q=80";

export default function PropertyDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, navigateToLogin } = useAuth();
    const queryClient = useQueryClient();
    const [chatOpen, setChatOpen] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [msg, setMsg] = useState("Hi! I'm interested in this property. Is it still available?");
    const { coords: userCoords } = useUserLocation();

    const { data: property, isLoading } = useQuery({
        queryKey: ["property", id],
        queryFn: () => propertyService.getPropertyById(id),
    });

    const { data: bookmarks = [] } = useQuery({
        queryKey: ["bookmarks", user?.email],
        queryFn: () => propertyService.getBookmarks(user?.id),
        enabled: !!user && !!id,
    });
    const bookmark = bookmarks.find(b => String(b.property_id) === String(id));

    const { data: similar = [] } = useQuery({
        queryKey: ["similar", property?.id, property?.city, property?.property_type],
        queryFn: () => propertyService.getSimilarProperties(property.id, property.city, property.property_type),
        enabled: !!property,
    });

    const { data: reviews = [] } = useQuery({
        queryKey: ["reviews", id],
        queryFn: () => propertyService.getReviews(id),
    });
    const avgRating = reviews.length ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : "New";

    const { data: colleges = [] } = useQuery({
        queryKey: ["colleges"],
        queryFn: propertyService.getColleges,
    });

    const userCollege = (user?.role === "student" && user?.college) 
        ? colleges.find(c => c.name === user.college) 
        : null;

    let studentCollegeDistance = null;
    if (userCollege && userCollege.latitude != null && property?.latitude != null) {
        studentCollegeDistance = getDistanceKm(
            userCollege.latitude, userCollege.longitude,
            property.latitude, property.longitude
        );
    }

    const toggleBookmark = async (idOverride) => {
        if (!user) return navigateToLogin();
        
        const currentUserId = user.id;
        const currentUserEmail = user.email;
        
        const targetId = idOverride || id;
        const isBookmarked = bookmarks.some(b => String(b.property_id) === String(targetId));
        const previousBookmarks = queryClient.getQueryData(["bookmarks", currentUserEmail]);
        
        queryClient.setQueryData(["bookmarks", currentUserEmail], (old) => {
            if (isBookmarked) return old.filter(b => String(b.property_id) !== String(targetId));
            return [...(old || []), { property_id: targetId }];
        });

        try {
            await propertyService.toggleBookmark(currentUserId, targetId, isBookmarked);
            queryClient.invalidateQueries({ queryKey: ["bookmarks", currentUserEmail] });
            toast.success(isBookmarked ? "Removed from bookmarks" : "Saved to bookmarks");
        } catch (error) {
            queryClient.setQueryData(["bookmarks", currentUserEmail], previousBookmarks);
            handleError(error, "Failed to update bookmark");
        }
    };

    const sendMessage = async () => {
        if (!user) return navigateToLogin();
        if (!msg.trim()) return;
        
        const currentUserId = user.id;

        try {
            await messageService.sendMessage(property.id, currentUserId, property.owner_id, msg.trim());
            toast.success("Message sent to the owner!");
            setChatOpen(false);
            navigate("/messages");
        } catch (error) {
            handleError(error, "Failed to send message");
        }
    };

    if (isLoading) return <div className="max-w-6xl mx-auto px-5 py-12">Loading…</div>;
    if (!property) return <div className="max-w-6xl mx-auto px-5 py-12">Property not found.</div>;

    const parsedImages = (property.images || []).map(imgStr => {
        try {
            if (imgStr.startsWith('{')) return JSON.parse(imgStr);
            return { url: imgStr, label: "" };
        } catch(e) { return { url: imgStr, label: "" }; }
    });
    if (!parsedImages.length) parsedImages.push({ url: FALLBACK, label: "" });

    let liveDistance = null;
    if (userCoords && property?.latitude != null && property?.longitude != null) {
        liveDistance = getDistanceKm(
            userCoords.latitude, userCoords.longitude,
            property.latitude, property.longitude
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-5 lg:px-8 py-8">
            <Toaster position="top-center" />
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 rounded-full gap-1">
                <ArrowLeft className="w-4 h-4" /> Back
            </Button>

        {/* Gallery / Image Slider */}
        <div className="relative w-full h-[300px] md:h-[500px] rounded-3xl overflow-hidden group mb-6 md:mb-10 bg-secondary/20 border border-border">
            <div 
                id="property-gallery"
                className="flex w-full h-full overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
                style={{ scrollbarWidth: "none" }}
                onScroll={(e) => {
                    const idx = Math.round(e.target.scrollLeft / e.target.clientWidth);
                    setCurrentSlide(idx);
                }}
            >
                {parsedImages.map((img, i) => (
                    <div key={i} className="min-w-full h-full snap-start relative">
                        <img src={img.url} className="w-full h-full object-cover" alt="" />
                        {img.label && (
                            <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
                                {img.label}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            
            {/* Desktop Arrows */}
            <button 
                className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/90 backdrop-blur-md border border-border/50 items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:scale-105"
                onClick={() => {
                    const el = document.getElementById("property-gallery");
                    el.scrollBy({ left: -el.clientWidth, behavior: 'smooth' });
                }}
            >
                <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
                className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/90 backdrop-blur-md border border-border/50 items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:scale-105"
                onClick={() => {
                    const el = document.getElementById("property-gallery");
                    el.scrollBy({ left: el.clientWidth, behavior: 'smooth' });
                }}
            >
                <ChevronRight className="w-5 h-5" />
            </button>

            {/* Counter Pill */}
            <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold tracking-widest hidden md:block shadow-sm">
                {currentSlide + 1} / {parsedImages.length}
            </div>

            {/* Mobile Dots */}
            <div className="md:hidden absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-background/40 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
                {parsedImages.map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentSlide ? "bg-white w-3" : "bg-white/50"}`} />
                ))}
            </div>
        </div>

        {/* Title & Metadata */}
        <div className="flex flex-col md:flex-row items-start justify-between gap-4 mb-6">
            <div className="w-full">
                {/* Title */}
                <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-balance mb-3">
                    {property.title}
                </h1>
                
                {/* Price directly below title */}
                <div className="flex items-baseline gap-1 mb-2 mt-2">
                    {property.price ? (
                        <>
                            <span className="text-4xl md:text-3xl font-bold text-primary">₹{property.price.toLocaleString()}</span>
                            <span className="text-sm text-primary/80 font-medium">/month</span>
                        </>
                    ) : (
                        <span className="text-xl font-bold text-muted-foreground">Price not available</span>
                    )}
                </div>

                {/* Distance directly below price */}
                <div className="flex flex-col gap-1.5 text-muted-foreground/80 font-medium mb-1 mt-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-lg leading-none">📍</span>
                        <span>
                            {(userCollege ? studentCollegeDistance : property.distance_km) != null 
                                ? `${(userCollege && studentCollegeDistance != null ? studentCollegeDistance.toFixed(1) : property.distance_km)} km from ${userCollege ? 'your campus' : 'campus'}` 
                                : "Location unavailable"}
                        </span>
                        <span className="mx-1 hidden sm:inline">•</span>
                        <span className="truncate">{property.address}{property.city && `, ${property.city}`}</span>

                        <Button variant="link" asChild className="h-auto p-0 text-primary gap-1 ml-2 text-sm hover:no-underline hover:text-primary/80">
                            <a href={property.google_maps_url || (property.latitude ? `https://www.google.com/maps?q=${property.latitude},${property.longitude}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(property.address + ' ' + (property.city || ''))}`)} target="_blank" rel="noopener noreferrer">
                                Open in Maps <Navigation className="w-3 h-3" />
                            </a>
                        </Button>
                    </div>

                    {liveDistance != null && (
                        <div className="flex items-center gap-2 ml-[2px]">
                            <span className="text-base leading-none">👤</span>
                            <span>{liveDistance.toFixed(1)} km from you</span>
                        </div>
                    )}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-5">
                    {property.is_verified && (
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1.5 rounded-md text-sm py-1 px-3">
                            <BadgeCheck className="w-4 h-4 text-primary" /> Verified Stay
                        </Badge>
                    )}
                    <Badge variant="secondary" className="capitalize text-sm py-1 px-3">{property.property_type}</Badge>
                    {property.room_type && <Badge variant="secondary" className="capitalize text-sm py-1 px-3">{property.room_type.replace("_", " ")}</Badge>}
                    {property.gender_preference && property.gender_preference !== "any" && (
                        <Badge variant="secondary" className="capitalize text-sm py-1 px-3">{property.gender_preference} only</Badge>
                    )}
                </div>
            </div>

            <div className="flex gap-2 w-full md:w-auto justify-end mt-4 md:mt-0">
                <Button variant="outline" size="icon" className="rounded-full shadow-sm" onClick={async () => {
                    try {
                        await navigator.clipboard.writeText(window.location.href);
                        toast.success("Link copied");
                    } catch (err) {
                        toast.error("Clipboard access not supported");
                    }
                }}>
                    <Share2 className="w-5 h-5" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full shadow-sm" onClick={() => toggleBookmark()}>
                    <Heart className={`w-5 h-5 ${bookmark ? "fill-primary text-primary" : ""}`} />
                </Button>
            </div>
        </div>

        {/* Content */}
        <div className="grid lg:grid-cols-[1fr_380px] gap-10 mt-10">
            <div>
                <h2 className="font-display text-2xl font-medium mb-3">About this stay</h2>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {property.description || "No description provided."}
                    </p>

                    {(userCollege || property.nearby_college) && (
                        <div className="mt-8 space-y-4">
                            {liveDistance != null && (
                                <div className="p-5 rounded-2xl border border-primary/20 bg-primary/5 flex items-center justify-between shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                                            <Navigation className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="text-xs uppercase tracking-wider text-primary/80 font-bold mb-0.5">Live Distance</div>
                                            <div className="text-sm font-medium">It is <span className="font-bold text-lg text-primary">{liveDistance.toFixed(1)} km</span> from you</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="p-6 rounded-2xl border border-border bg-secondary/40">
                                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                                    {userCollege ? "Your Campus" : "Nearest campus"}
                                </div>
                                <div className="font-medium text-lg">
                                    {userCollege ? userCollege.name : property.nearby_college}
                                </div>
                                {(userCollege ? studentCollegeDistance : property.distance_km) != null && (
                                    <div className="text-sm text-muted-foreground mt-1">
                                        {(userCollege && studentCollegeDistance != null ? studentCollegeDistance.toFixed(1) : property.distance_km)} km away
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {property.amenities?.length > 0 && (
                        <div className="mt-12 bg-secondary/20 p-6 rounded-3xl border border-border">
                            <h2 className="font-display text-2xl font-medium mb-5">What this place offers</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {property.amenities.map((a) => (
                                    <div key={a} className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md hover:border-primary/30 transition-all font-medium text-sm">
                                        <AmenityIcon amenity={a} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* House Rules */}
                    {((property.property_rules && property.property_rules.length > 0) || (property.custom_rules && property.custom_rules.length > 0)) && (
                        <div className="mt-12 pt-10 border-t border-border">
                            <h2 className="font-display text-2xl font-medium mb-6 flex items-center gap-2">
                                House Rules <BadgeCheck className="w-5 h-5 text-primary" />
                            </h2>
                            <ul className="grid sm:grid-cols-2 gap-4">
                                {property.property_rules?.map(pr => (
                                    <li key={pr.rule_id} className="flex items-center gap-3 text-sm font-medium p-3 rounded-xl border border-primary/20 bg-primary/5 text-foreground">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                                        {pr.rules?.title}
                                    </li>
                                ))}
                                {property.custom_rules?.map(rule => (
                                    <li key={rule} className="flex items-center gap-3 text-sm font-medium p-3 rounded-xl border border-primary/20 bg-primary/5 text-foreground">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                                        {rule}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Sticky booking card */}
                <aside className="lg:sticky lg:top-24 self-start order-last mt-4 md:mt-0 w-full mb-8 md:mb-0">
                    <div className="p-6 rounded-3xl border border-border bg-card shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <div className="flex flex-col mb-6 pb-6 border-b border-border">
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-sm font-semibold flex items-center justify-center gap-1"><span className="text-secondary-foreground">★ {avgRating}</span> <span className="text-xs text-muted-foreground font-normal underline cursor-pointer">({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</span></div>
                                {property.is_verified && <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"><BadgeCheck className="w-3 h-3 mr-1"/>Verified Stay</Badge>}
                            </div>
                            <div className="flex items-baseline gap-1 mt-1">
                                <span className="font-display text-4xl font-bold">₹{property.price?.toLocaleString()}</span>
                                <span className="text-muted-foreground font-medium">/month</span>
                            </div>
                        </div>
                        {property.deposit != null && (
                            <div className="text-sm text-muted-foreground mb-5">
                                Security deposit: ₹{property.deposit.toLocaleString()}
                            </div>
                        )}
                        {user?.id !== property.owner_id && (
                            <Button onClick={() => setChatOpen(true)} className="w-full rounded-full gap-2 mb-2">
                                <MessageSquare className="w-4 h-4" /> Message owner
                            </Button>
                        )}
                        {property.users?.phone && (
                            <Button variant="outline" asChild className="w-full rounded-full gap-2">
                                <a href={`tel:${property.users.phone}`}>
                                    <Phone className="w-4 h-4" /> {property.users.phone}
                                </a>
                            </Button>
                        )}
                         {property.created_at && (
                            <div className="text-xs text-center mt-6 text-muted-foreground">
                                Listed on {new Date(property.created_at).toLocaleDateString()}
                            </div>
                        )}
                        <div className="mt-5 pt-5 border-t text-sm">
                            <div className="text-muted-foreground">Hosted by</div>
                            <div className="font-medium mt-0.5">{property.users?.full_name || "Verified Owner"}</div>
                        </div>
                    </div>
                </aside>
                </div>


                {/* Reviews Section */}
            <ReviewSection propertyId={property.id} />

            {/* Similar Properties */}
            {similar.length > 0 && (
                <div className="mt-20 pt-10 border-t border-border">
                    <h2 className="font-display text-3xl font-medium mb-6">Similar stays</h2>
                    <div className="flex overflow-x-auto gap-6 pb-6 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
                        {similar.map((p, i) => (
                            <div key={p.id} className="min-w-[280px] w-[280px] sm:min-w-[320px] sm:w-[320px] snap-start shrink-0">
                                <PropertyCard
                                    property={p}
                                    bookmarked={bookmarks.some(b => String(b.property_id) === String(p.id))}
                                    onToggleBookmark={async () => toggleBookmark(p.id)}
                                    index={i}
                                    userCoords={userCoords}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Message dialog */}
            <Dialog open={chatOpen} onOpenChange={setChatOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Message {property.users?.full_name?.split(' ')[0] || "the owner"}</DialogTitle>
                    </DialogHeader>
                    <Textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={5} className="rounded-xl" />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setChatOpen(false)} className="rounded-full">Cancel</Button>
                        <Button onClick={sendMessage} className="rounded-full">Send</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}