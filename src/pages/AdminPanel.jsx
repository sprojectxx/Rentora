import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { propertyService } from "@/api/propertyService";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import RoleGate from "@/components/shared/RoleGate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Eye, Pencil, Trash2, Plus, Users, Home, ShieldCheck,
    ToggleLeft, ToggleRight, Search, CheckCircle2, XCircle,
    GraduationCap, MapPin, MessageSquare, ClipboardList
} from "lucide-react";

const FALLBACK = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&q=80";

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

function AdminPanelInner() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [propSearch, setPropSearch] = useState("");
    const [userSearch, setUserSearch] = useState("");

    const { data: properties = [] } = useQuery({
        queryKey: ["admin-properties"],
        queryFn: () => propertyService.getAllProperties(0, 1000),
    });

    const { data: users = [] } = useQuery({
        queryKey: ["admin-users"],
        queryFn: propertyService.getAllUsers,
    });

    const { data: colleges = [] } = useQuery({
        queryKey: ["admin-colleges"],
        queryFn: propertyService.getColleges,
    });

    const { data: globalRules = [] } = useQuery({
        queryKey: ["admin-rules"],
        queryFn: propertyService.getRules,
    });

    const [newCollegeName, setNewCollegeName] = useState("");
    const [newCollegeMapsUrl, setNewCollegeMapsUrl] = useState("");
    const [newRuleTitle, setNewRuleTitle] = useState("");

    const handleAddCollege = async () => {
        if (!newCollegeName.trim() || !newCollegeMapsUrl.trim()) return;
        
        let lat = null, lon = null;
        try {
            const match = newCollegeMapsUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
                          newCollegeMapsUrl.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/) ||
                          newCollegeMapsUrl.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
            if (match) {
                lat = parseFloat(match[1]);
                lon = parseFloat(match[2]);
            }
        } catch (e) {
            console.error("Failed to parse map URL.");
        }

        if (lat === null || lon === null) {
            alert("Could not extract coordinates from the Google Maps URL. Please ensure it is a full web Maps URL containing the '@lat,lon' format.");
            return;
        }

        await propertyService.createCollege({ name: newCollegeName.trim(), latitude: lat, longitude: lon });
        setNewCollegeName("");
        setNewCollegeMapsUrl("");
        queryClient.invalidateQueries({ queryKey: ["admin-colleges"] });
    };

    const handleDeleteCollege = async (id) => {
        if (!confirm("Delete this college? It may affect existing users.")) return;
        await propertyService.deleteCollege(id);
        queryClient.invalidateQueries({ queryKey: ["admin-colleges"] });
    };

    const handleAddRule = async () => {
        if (!newRuleTitle.trim()) return;
        await propertyService.createRule({ title: newRuleTitle.trim(), is_global: true, created_by: user.id });
        setNewRuleTitle("");
        queryClient.invalidateQueries({ queryKey: ["admin-rules"] });
    };

    const handleDeleteRule = async (id) => {
        if (!confirm("Delete this rule? It will be removed from all properties using it.")) return;
        await propertyService.deleteRule(id);
        queryClient.invalidateQueries({ queryKey: ["admin-rules"] });
    };

    const deleteProperty = async (id) => {
        if (!confirm("Delete this listing permanently?")) return;
        await propertyService.deleteProperty(id);
        queryClient.invalidateQueries({ queryKey: ["admin-properties"] });
        queryClient.invalidateQueries({ queryKey: ["properties"] });
        queryClient.invalidateQueries({ queryKey: ["properties-all"] });
        queryClient.invalidateQueries({ queryKey: ["featured-properties"] });
        queryClient.invalidateQueries({ queryKey: ["property"] });
        queryClient.invalidateQueries({ queryKey: ["similar"] });
    };

    const toggleAvailability = async (p) => {
        await propertyService.updateProperty(p.id, { is_available: !p.is_available });
        queryClient.invalidateQueries({ queryKey: ["admin-properties"] });
        queryClient.invalidateQueries({ queryKey: ["properties"] });
        queryClient.invalidateQueries({ queryKey: ["properties-all"] });
        queryClient.invalidateQueries({ queryKey: ["featured-properties"] });
        queryClient.invalidateQueries({ queryKey: ["property"] });
        queryClient.invalidateQueries({ queryKey: ["similar"] });
    };

    const toggleVerified = async (p) => {
        await propertyService.updateProperty(p.id, { is_verified: !p.is_verified });
        queryClient.invalidateQueries({ queryKey: ["admin-properties"] });
        queryClient.invalidateQueries({ queryKey: ["properties"] });
        queryClient.invalidateQueries({ queryKey: ["properties-all"] });
        queryClient.invalidateQueries({ queryKey: ["featured-properties"] });
        queryClient.invalidateQueries({ queryKey: ["property"] });
        queryClient.invalidateQueries({ queryKey: ["similar"] });
    };

    const changeUserRole = async (u, newRole) => {
        await propertyService.updateUserRole(u.id, newRole);
        queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    };

    const filteredProps = properties.filter((p) => {
        const q = propSearch.toLowerCase();
        return !q || `${p.title} ${p.address} ${p.city}`.toLowerCase().includes(q);
    });

    const filteredUsers = users.filter((u) => {
        const q = userSearch.toLowerCase();
        return !q || `${u.full_name} ${u.email}`.toLowerCase().includes(q);
    });

    const stats = [
        { label: "Total listings", value: properties.length, icon: Home, color: "text-primary" },
        { label: "Available", value: properties.filter((p) => p.is_available).length, icon: CheckCircle2, color: "text-green-500" },
        { label: "Verified", value: properties.filter((p) => p.is_verified).length, icon: ShieldCheck, color: "text-blue-500" },
        { label: "Total users", value: users.length, icon: Users, color: "text-violet-500" },
    ];

    return (
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-10">
            <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <ShieldCheck className="w-5 h-5 text-primary" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-primary">Admin Panel</span>
                    </div>
                    <h1 className="font-display text-4xl lg:text-5xl font-medium tracking-tight">
                        Platform <span className="italic text-primary">control</span>
                    </h1>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => navigate("/messages")} variant="outline" className="rounded-full gap-2">
                        <MessageSquare className="w-4 h-4" /> Messages
                    </Button>
                    <Button onClick={() => navigate("/owner/new")} className="rounded-full gap-2">
                        <Plus className="w-4 h-4" /> Add listing
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map((s) => (
                    <div key={s.label} className="p-5 rounded-2xl border border-border bg-card">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-muted-foreground">{s.label}</span>
                            <s.icon className={`w-4 h-4 ${s.color}`} />
                        </div>
                        <div className="font-display text-3xl font-medium">{s.value}</div>
                    </div>
                ))}
            </div>

            <Tabs defaultValue="listings">
                <TabsList className="mb-6 rounded-full">
                    <TabsTrigger value="listings" className="rounded-full gap-2">
                        <Home className="w-4 h-4" /> Listings
                    </TabsTrigger>
                    <TabsTrigger value="users" className="rounded-full gap-2">
                        <Users className="w-4 h-4" /> Users
                    </TabsTrigger>
                    <TabsTrigger value="colleges" className="rounded-full gap-2">
                        <GraduationCap className="w-4 h-4" /> Colleges
                    </TabsTrigger>
                    <TabsTrigger value="rules" className="rounded-full gap-2">
                        <ClipboardList className="w-4 h-4" /> Rules
                    </TabsTrigger>
                </TabsList>

                {/* LISTINGS TAB */}
                <TabsContent value="listings">
                    <div className="relative mb-4">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search listings..."
                            value={propSearch}
                            onChange={(e) => setPropSearch(e.target.value)}
                            className="pl-9 rounded-full max-w-sm"
                        />
                    </div>
                    <div className="space-y-3">
                        {filteredProps.map((p) => (
                            <div key={p.id} className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors">
                                <img src={getImageUrl(p.images)} alt="" className="w-20 h-20 rounded-xl object-cover shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="font-medium truncate">{p.title}</h3>
                                        {p.is_verified && <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-0 text-[10px]">Verified</Badge>}
                                        {!p.is_available && <Badge variant="secondary" className="text-[10px]">Unavailable</Badge>}
                                    </div>
                                    <div className="text-sm text-muted-foreground truncate">{p.address}{p.city && `, ${p.city}`}</div>
                                    <div className="text-sm font-semibold text-primary mt-0.5">₹{p.price?.toLocaleString()}/mo</div>
                                    <div className="text-xs text-muted-foreground mt-0.5">by {users.find(u => u.id === p.owner_id)?.full_name || p.owner_id || "Unknown"}</div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-1.5">
                                    <Button
                                        variant="ghost" size="sm"
                                        onClick={() => toggleVerified(p)}
                                        className={`rounded-full text-xs gap-1 ${p.is_verified ? "text-blue-600" : "text-muted-foreground"}`}
                                        title={p.is_verified ? "Remove verification" : "Verify listing"}
                                    >
                                        <ShieldCheck className="w-3.5 h-3.5" />
                                        {p.is_verified ? "Verified" : "Verify"}
                                    </Button>
                                    <Button
                                        variant="ghost" size="sm"
                                        onClick={() => toggleAvailability(p)}
                                        className="rounded-full text-xs gap-1"
                                        title={p.is_available ? "Mark unavailable" : "Mark available"}
                                    >
                                        {p.is_available
                                            ? <><ToggleRight className="w-3.5 h-3.5 text-green-500" /> Active</>
                                            : <><ToggleLeft className="w-3.5 h-3.5" /> Inactive</>
                                        }
                                    </Button>
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
                        ))}
                        {filteredProps.length === 0 && (
                            <div className="text-center py-16 text-muted-foreground">No listings found.</div>
                        )}
                    </div>
                </TabsContent>

                {/* USERS TAB */}
                <TabsContent value="users">
                    <div className="relative mb-4">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search users..."
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            className="pl-9 rounded-full max-w-sm"
                        />
                    </div>
                    <div className="space-y-3">
                        {filteredUsers.map((u) => (
                            <div key={u.id} className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold shrink-0">
                                    {(u.full_name || u.email || "U")[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">{u.full_name || "—"}</div>
                                    <div className="text-sm text-muted-foreground truncate">{u.email}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge
                                        className={`text-xs capitalize ${u.role === "admin" ? "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" :
                                                u.role === "owner" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" :
                                                    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                                            } border-0`}
                                    >
                                        {u.role || "student"}
                                    </Badge>
                                    {/* Role change buttons */}
                                    {u.id !== user.id && (
                                        <div className="flex gap-1">
                                            {["student", "owner", "admin"].filter(r => r !== u.role).map(r => (
                                                <Button
                                                    key={r}
                                                    variant="outline"
                                                    size="sm"
                                                    className="rounded-full text-xs h-7 px-2"
                                                    onClick={() => changeUserRole(u, r)}
                                                >
                                                    → {r}
                                                </Button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {filteredUsers.length === 0 && (
                            <div className="text-center py-16 text-muted-foreground">No users found.</div>
                        )}
                    </div>
                </TabsContent>

                {/* COLLEGES TAB */}
                <TabsContent value="colleges">
                    <div className="p-6 rounded-3xl border border-border bg-card shadow-sm mb-6">
                        <h2 className="font-display text-xl font-medium mb-4">Add new college</h2>
                        <div className="grid md:grid-cols-[1fr_2fr_auto] gap-4 items-end">
                            <div>
                                <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">College Name</label>
                                <Input 
                                    placeholder="e.g. IIT Hyderabad" 
                                    value={newCollegeName} 
                                    onChange={e => setNewCollegeName(e.target.value)} 
                                />
                            </div>
                            <div>
                                <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Google Maps Web Link</label>
                                <Input 
                                    placeholder="Paste full map URL with @lat,lon..." 
                                    value={newCollegeMapsUrl} 
                                    onChange={e => setNewCollegeMapsUrl(e.target.value)} 
                                />
                            </div>
                            <Button onClick={handleAddCollege} disabled={!newCollegeName || !newCollegeMapsUrl} className="rounded-xl h-10 w-full md:w-auto">
                                <Plus className="w-4 h-4 mr-2" /> Add College
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {colleges.map((c) => (
                            <div key={c.id} className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors">
                                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                                    <GraduationCap className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">{c.name}</div>
                                    <div className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-1">
                                        <MapPin className="w-3 h-3" />
                                        Latitude [{c.latitude}] • Longitude [{c.longitude}]
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteCollege(c.id)} className="rounded-full text-destructive hover:text-destructive shrink-0">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                        {colleges.length === 0 && (
                            <div className="text-center py-16 text-muted-foreground border-2 border-dashed border-border rounded-3xl">No colleges added yet.</div>
                        )}
                    </div>
                </TabsContent>

                {/* RULES TAB */}
                <TabsContent value="rules">
                    <div className="p-6 rounded-3xl border border-border bg-card shadow-sm mb-6">
                        <h2 className="font-display text-xl font-medium mb-4">Add global rule</h2>
                        <div className="grid md:grid-cols-[1fr_auto] gap-4 items-end">
                            <div>
                                <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Rule Title</label>
                                <Input 
                                    placeholder="e.g. No visitors after 10 PM" 
                                    value={newRuleTitle} 
                                    onChange={e => setNewRuleTitle(e.target.value)} 
                                    onKeyDown={e => { if (e.key === 'Enter') handleAddRule() }}
                                />
                            </div>
                            <Button onClick={handleAddRule} disabled={!newRuleTitle.trim()} className="rounded-xl h-10 w-full md:w-auto">
                                <Plus className="w-4 h-4 mr-2" /> Add Rule
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {globalRules.map((r) => (
                            <div key={r.id} className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                                    <ClipboardList className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">{r.title}</div>
                                    <div className="text-xs text-muted-foreground truncate mt-1">
                                        {r.is_global ? "Global Rule" : "Custom Rule"}
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteRule(r.id)} className="rounded-full text-destructive hover:text-destructive shrink-0">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                        {globalRules.length === 0 && (
                            <div className="text-center py-16 text-muted-foreground border-2 border-dashed border-border rounded-3xl">No rules added yet.</div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default function AdminPanel() {
    return (
        <RoleGate allow={["admin"]}>
            <AdminPanelInner />
        </RoleGate>
    );
}