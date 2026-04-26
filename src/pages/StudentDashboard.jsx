import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { propertyService } from "@/api/propertyService";
import { useAuth } from "@/lib/AuthContext";
import { handleError } from "@/lib/errorHandler";
import RoleGate from "@/components/shared/RoleGate";
import PropertyCard from "@/components/shared/PropertyCard";
import EmptyState from "@/components/shared/EmptyState";
import { Heart } from "lucide-react";
import { useUserLocation } from "@/hooks/useUserLocation";

function StudentDashboardInner() {
    const { user, navigateToLogin } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { coords: userCoords } = useUserLocation();

    const { data: bookmarks = [] } = useQuery({
        queryKey: ["bookmarks", user.email],
        queryFn: () => propertyService.getBookmarks(user.id),
    });

    const { data: allProps = [] } = useQuery({
        queryKey: ["properties-all"],
        queryFn: () => propertyService.getAllProperties(0, 1000),
    });

    const saved = useMemo(() => {
        const ids = new Set(bookmarks.map((b) => b.property_id));
        return allProps.filter((p) => ids.has(p.id));
    }, [bookmarks, allProps]);

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

    return (
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-10">
            <div className="mb-10">
                <h1 className="font-display text-4xl lg:text-5xl font-medium tracking-tight">
                    Saved <span className="italic text-primary">stays</span>
                </h1>
                <p className="text-muted-foreground mt-1">Your shortlisted places, all in one spot.</p>
            </div>

            {saved.length === 0 ? (
                <EmptyState
                    icon={Heart}
                    title="No saved stays yet"
                    description="Tap the heart on any listing to save it here for later."
                    action={{ label: "Browse stays", onClick: () => navigate("/browse") }}
                />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {saved.map((p, i) => (
                        <PropertyCard
                            key={p.id}
                            property={p}
                            bookmarked={true}
                            onToggleBookmark={toggleBookmark}
                            index={i}
                            userCoords={userCoords}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function StudentDashboard() {
    return (
        <RoleGate allow={["student", "admin"]}>
            <StudentDashboardInner />
        </RoleGate>
    );
}