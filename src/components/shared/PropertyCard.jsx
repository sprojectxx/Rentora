import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, MapPin, BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getDistanceKm, formatDistance } from "@/hooks/useUserLocation";
import { AMENITY_META } from "@/components/shared/AmenityIcon";

const FALLBACK = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80";

export default function PropertyCard({ property, bookmarked, onToggleBookmark, index = 0, userCoords }) {
    let image = FALLBACK;
    if (property?.images?.[0]) {
        try {
            const parsed = typeof property.images[0] === 'string' && property.images[0].startsWith('{') 
                ? JSON.parse(property.images[0]) 
                : property.images[0];
            image = parsed?.url || parsed || FALLBACK;
        } catch (e) {
            image = property.images[0];
        }
    }

    // Live GPS distance
    let liveDistance = null;
    if (userCoords && property.latitude != null && property.longitude != null) {
        liveDistance = getDistanceKm(
            userCoords.latitude, userCoords.longitude,
            property.latitude, property.longitude
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.04 }}
        >
            <Link to={`/property/${property.id}`} className="block group">
                {/* Image */}
                <div className="relative overflow-hidden rounded-2xl bg-muted aspect-[4/3] mb-3">
                    <img
                        src={image}
                        alt={property.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    {onToggleBookmark && (
                        <button
                            onClick={(e) => { e.preventDefault(); onToggleBookmark(property); }}
                            className="absolute top-3 right-3 w-9 h-9 rounded-full glass flex items-center justify-center hover:scale-110 transition-transform"
                        >
                            <Heart className={cn("w-4 h-4 transition-colors", bookmarked ? "fill-primary text-primary" : "text-foreground")} />
                        </button>
                    )}
                    {!property.is_available && (
                        <div className="absolute inset-0 bg-foreground/40 flex items-center justify-center">
                            <Badge variant="secondary" className="bg-background text-foreground hover:bg-background/90 border-0">Unavailable</Badge>
                        </div>
                    )}
                </div>

                {/* Card info */}
                <div className="space-y-1 px-1 py-1 mt-1">
                    {/* Title */}
                    <h3 className="font-semibold text-lg leading-snug line-clamp-1">{property.title}</h3>

                    {/* Price directly below title */}
                    <div className="flex items-baseline gap-1 mt-1">
                        {property.price ? (
                            <>
                                <span className="text-xl font-bold">&#8377;{property.price.toLocaleString()}</span>
                                <span className="text-sm text-muted-foreground font-medium">/month</span>
                            </>
                        ) : (
                            <span className="text-[15px] font-semibold text-muted-foreground">Price not available</span>
                        )}
                    </div>

                    {/* Distance (below price) */}
                    <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground mt-1">
                        <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span>
                            {liveDistance != null 
                                ? `${liveDistance.toFixed(1)} km away` 
                                : (property.distance_km != null ? `${property.distance_km} km away` : "Location unavailable")}
                        </span>
                    </div>

                    {/* Amenities */}
                    {property.amenities?.length > 0 && (
                        <div className="flex gap-1.5 pt-1.5 mt-1 flex-wrap items-center">
                            {property.amenities.slice(0, 4).map((amenity, i) => {
                                const meta = AMENITY_META[amenity];
                                if (!meta) return null;
                                const Icon = meta.icon;
                                return (
                                    <div key={i} className="flex items-center gap-1 text-[11px] font-medium bg-secondary text-secondary-foreground px-2 py-1 rounded-md">
                                        <Icon className="w-3 h-3" />
                                        <span>{meta.label}</span>
                                    </div>
                                );
                            })}
                            {property.amenities.length > 4 && (
                                <span className="text-[11px] text-muted-foreground font-medium pl-1">
                                    +{property.amenities.length - 4} more
                                </span>
                            )}
                        </div>
                    )}

                    {/* Verified badge */}
                    {property.is_verified && (
                        <div className="mt-3 flex">
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1 rounded-md text-[10px] font-medium">
                                <BadgeCheck className="w-3.5 h-3.5 text-primary" /> Verified
                            </Badge>
                        </div>
                    )}
                </div>
            </Link>
        </motion.div>
    );
}
