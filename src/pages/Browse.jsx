import React, { useMemo, useState } from "react";
import { useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { propertyService } from "@/api/propertyService";
import { useAuth } from "@/lib/AuthContext";
import { handleError } from "@/lib/errorHandler";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Sliders, MapPinOff, Navigation, Loader2 } from "lucide-react";
import PropertyCard from "@/components/shared/PropertyCard";
import SearchFilters from "@/components/browse/SearchFilters";
import EmptyState from "@/components/shared/EmptyState";
import { useUserLocation, getDistanceKm } from "@/hooks/useUserLocation";

const DEFAULT_FILTERS = {
    query: "",
    property_type: "any",
    maxPrice: 20000,
    maxDistance: 20,
    amenities: [],
};

export default function Browse() {
    const { user, navigateToLogin } = useAuth();
    const queryClient = useQueryClient();
    const { coords: userCoords, error: locationError } = useUserLocation();
    const [filters, setFilters] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        return { ...DEFAULT_FILTERS, query: params.get("q") || "" };
    });

    const { 
        data, 
        isLoading, 
        hasNextPage, 
        fetchNextPage, 
        isFetchingNextPage 
    } = useInfiniteQuery({
        queryKey: ["properties"],
        queryFn: ({ pageParam = 0 }) => propertyService.getAllProperties(pageParam, 20),
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages, lastPageParam) => {
            if (!lastPage || lastPage.length < 20) return undefined;
            return lastPageParam + 20;
        }
    });

    const properties = useMemo(() => data?.pages.flat() || [], [data]);

    const { data: bookmarks = [] } = useQuery({
        queryKey: ["bookmarks", user?.email],
        queryFn: () => propertyService.getBookmarks(user.id),
        enabled: !!user,
    });

    const bookmarkedIds = useMemo(() => new Set(bookmarks.map((b) => b.property_id)), [bookmarks]);

    const toggleBookmark = async (property) => {
        if (!user) return navigateToLogin();
        
        const currentUserId = user.id;
        const currentUserEmail = user.email;
        const existing = bookmarks.find((b) => b.property_id === property.id);
        const previousBookmarks = queryClient.getQueryData(["bookmarks", currentUserEmail]);
        
        queryClient.setQueryData(["bookmarks", currentUserEmail], (old) => {
            if (existing) return old.filter(b => b.property_id !== property.id);
            return [...(old || []), { property_id: property.id }];
        });

        try {
            await propertyService.toggleBookmark(currentUserId, property.id, !!existing);
            queryClient.invalidateQueries({ queryKey: ["bookmarks", currentUserEmail] });
        } catch (error) {
            queryClient.setQueryData(["bookmarks", currentUserEmail], previousBookmarks);
            handleError(error, "Failed to update bookmark");
        }
    };

    const filtered = useMemo(() => {
        const q = (filters.query || "").toLowerCase();
        return properties.filter((p) => {
            if (p.is_available === false) return false;
            if (filters.property_type !== "any" && p.property_type !== filters.property_type) return false;
            
            const pPrice = Number(p.price);
            if (filters.maxPrice && !isNaN(pPrice) && pPrice > filters.maxPrice) return false;

            let dist = p.distance_km;
            if (userCoords && p.latitude != null && p.longitude != null) {
                dist = getDistanceKm(userCoords.latitude, userCoords.longitude, p.latitude, p.longitude);
            }
            if (filters.maxDistance && dist != null && dist > filters.maxDistance) return false;

            if (filters.amenities?.length) {
                const has = filters.amenities.every((a) => (p.amenities || []).includes(a));
                if (!has) return false;
            }
            if (q) {
                const hay = `${p.title || ""} ${p.address || ""} ${p.city || ""} ${p.nearby_college || ""}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [properties, filters, userCoords]);

    return (
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-10">
            <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
                <div>
                    <h1 className="font-display text-4xl lg:text-5xl font-medium tracking-tight">
                        Find your <span className="italic text-primary">stay</span>
                    </h1>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <p className="text-muted-foreground">{filtered.length} {filtered.length === 1 ? "place" : "places"} available</p>
                        {userCoords && (
                            <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2.5 py-0.5 rounded-full">
                                <Navigation className="w-3 h-3" /> Live location active
                            </span>
                        )}
                        {locationError && (
                            <span className="text-xs text-muted-foreground">· distances from campus</span>
                        )}
                    </div>
                </div>
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" className="lg:hidden rounded-full gap-2">
                            <Sliders className="w-4 h-4" /> Filters
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[340px] overflow-y-auto">
                        <SheetHeader className="mb-4"><SheetTitle>Filters</SheetTitle></SheetHeader>
                        <SearchFilters filters={filters} setFilters={setFilters} onReset={() => setFilters(DEFAULT_FILTERS)} />
                    </SheetContent>
                </Sheet>
            </div>

            <div className="grid lg:grid-cols-[280px_1fr] gap-10">
                <aside className="hidden lg:block sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto pr-2">
                    <SearchFilters filters={filters} setFilters={setFilters} onReset={() => setFilters(DEFAULT_FILTERS)} />
                </aside>

                <div>
                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                            {Array(6).fill(0).map((_, i) => (
                                <div key={i} className="space-y-3">
                                    <div className="aspect-[4/3] rounded-2xl bg-muted animate-pulse" />
                                    <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                                    <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                                </div>
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="space-y-8">
                            <EmptyState
                                icon={MapPinOff}
                                title={hasNextPage ? "No matches on loaded pages" : "No stays match your filters"}
                                description={hasNextPage ? "There might be matches on further pages. Keep loading to check." : "Try adjusting the price range, distance, or amenities."}
                                action={hasNextPage 
                                    ? { label: isFetchingNextPage ? "Loading..." : "Load More", onClick: () => fetchNextPage() }
                                    : { label: "Clear filters", onClick: () => setFilters(DEFAULT_FILTERS) }
                                }
                            />
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                {filtered.map((p, i) => (
                                    <PropertyCard
                                        key={p.id}
                                        property={p}
                                        bookmarked={bookmarkedIds.has(p.id)}
                                        onToggleBookmark={toggleBookmark}
                                        index={i}
                                        userCoords={userCoords}
                                    />
                                ))}
                            </div>
                            
                            {hasNextPage && (
                                <div className="flex justify-center pt-4">
                                    <Button 
                                        variant="outline" 
                                        onClick={() => fetchNextPage()} 
                                        disabled={isFetchingNextPage}
                                        className="rounded-full px-8"
                                    >
                                        {isFetchingNextPage ? (
                                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading...</>
                                        ) : "Load More"}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}