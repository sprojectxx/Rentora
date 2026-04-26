import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { propertyService } from "@/api/propertyService";
import { messageService } from "@/api/messageService";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Eye, Home, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import RoleGate from "@/components/shared/RoleGate";
import EmptyState from "@/components/shared/EmptyState";

const FALLBACK = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80";

const getImageUrl = (images) => {
    if (!images?.length) return FALLBACK;
    const first = images[0];
    try {
        const parsed = typeof first === 'string' && first.startsWith('{') ? JSON.parse(first) : first;
        return parsed?.url || parsed || FALLBACK;
    } catch {
        return first;
    }
};

function OwnerDashboardInner() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: properties = [] } = useQuery({
        queryKey: ["owner-properties", user.email],
        queryFn: () => propertyService.getOwnerProperties(user.id),
    });

    const { data: messages = [] } = useQuery({
        queryKey: ["owner-messages", user.email],
        queryFn: () => messageService.getReceivedMessages(user.id),
    });

    const inquiriesCount = new Set(messages.map((m) => `${m.property_id}_${m.sender_id}`)).size;

    const deleteProperty = async (id) => {
        if (!confirm("Delete this listing? This cannot be undone.")) return;
        await propertyService.deleteProperty(id);
        toast.success("Listing deleted successfully.");
        queryClient.invalidateQueries({ queryKey: ["owner-properties", user.email] });
        queryClient.invalidateQueries({ queryKey: ["properties"] });
        queryClient.invalidateQueries({ queryKey: ["properties-all"] });
        queryClient.invalidateQueries({ queryKey: ["featured-properties"] });
        queryClient.invalidateQueries({ queryKey: ["property"] });
        queryClient.invalidateQueries({ queryKey: ["similar"] });
    };

    const toggleAvailability = async (id, currentStatus) => {
        try {
            await propertyService.updateProperty(id, { is_available: !currentStatus });
            toast.success(currentStatus ? "Listing marked as unavailable" : "Listing is now available!");
            queryClient.invalidateQueries({ queryKey: ["owner-properties", user.email] });
            queryClient.invalidateQueries({ queryKey: ["properties"] });
            queryClient.invalidateQueries({ queryKey: ["properties-all"] });
            queryClient.invalidateQueries({ queryKey: ["featured-properties"] });
            queryClient.invalidateQueries({ queryKey: ["property"] });
            queryClient.invalidateQueries({ queryKey: ["similar"] });
        } catch (error) {
            toast.error("Failed to update availability.");
        }
    };

    const stats = [
        { label: "Listings", value: properties.length, icon: Home },
        { label: "Available", value: properties.filter((p) => p.is_available).length, icon: Eye },
        { label: "Inquiries", value: inquiriesCount, icon: MessageCircle },
    ];

    return (
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-10">
            <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
                <div>
                    <h1 className="font-display text-4xl lg:text-5xl font-medium tracking-tight">
                        Your <span className="italic text-primary">listings</span>
                    </h1>
                    <p className="text-muted-foreground mt-1">Manage your properties and student inquiries.</p>
                </div>
                <Button onClick={() => navigate("/owner/new")} className="rounded-full gap-2">
                    <Plus className="w-4 h-4" /> New listing
                </Button>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mb-10">
                {stats.map((s) => (
                    <div key={s.label} className="p-6 rounded-2xl border border-border bg-card">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">{s.label}</span>
                            <s.icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="font-display text-4xl font-medium">{s.value}</div>
                    </div>
                ))}
            </div>

            {properties.length === 0 ? (
                <EmptyState
                    icon={Home}
                    title="No listings yet"
                    description="Create your first property listing and start connecting with students."
                    action={{ label: "Add a listing", onClick: () => navigate("/owner/new") }}
                />
            ) : (
                <div className="space-y-3">
                    {properties.map((p) => (
                        <div
                            key={p.id}
                            className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors"
                        >
                            <img
                                src={getImageUrl(p.images)}
                                alt=""
                                className="w-24 h-24 rounded-xl object-cover shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-medium truncate">{p.title}</h3>
                                    {!p.is_available && <Badge variant="secondary">Unavailable</Badge>}
                                </div>
                                <div className="text-sm text-muted-foreground truncate">{p.address}</div>
                                <div className="text-sm mt-1 font-medium">₹{p.price?.toLocaleString()}/mo</div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 mr-2">
                                    <Label htmlFor={`available-${p.id}`} className="text-xs text-muted-foreground cursor-pointer">
                                        {p.is_available ? "Live" : "Hidden"}
                                    </Label>
                                    <Switch 
                                        id={`available-${p.id}`}
                                        checked={p.is_available} 
                                        onCheckedChange={() => toggleAvailability(p.id, p.is_available)} 
                                    />
                                </div>
                                <div className="flex gap-2 border-l border-border pl-4">
                                    <Button variant="ghost" size="icon" asChild className="rounded-full">
                                        <Link to={`/property/${p.id}`}><Eye className="w-4 h-4" /></Link>
                                    </Button>
                                <Button variant="ghost" size="icon" asChild className="rounded-full">
                                    <Link to={`/owner/edit/${p.id}`}><Pencil className="w-4 h-4" /></Link>
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => deleteProperty(p.id)} className="rounded-full text-destructive hover:text-destructive">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function OwnerDashboard() {
    return (
        <RoleGate allow={["owner", "admin"]}>
            <OwnerDashboardInner />
        </RoleGate>
    );
}