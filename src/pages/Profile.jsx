import React, { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { handleError } from "@/lib/errorHandler";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { propertyService } from "@/api/propertyService";
import PropertyCard from "@/components/shared/PropertyCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Upload, PencilLine, Bookmark } from "lucide-react";
import RoleGate from "@/components/shared/RoleGate";
import { toast, Toaster } from "sonner";

function ProfileInner() {
    const { user, refreshUser } = useAuth();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState({
        full_name: user.full_name || "",
        phone: user.phone || "",
        college: user.college || "",
        city: user.city || "",
        bio: user.bio || "",
        role: user.role || "student",
        avatar_url: user.avatar_url || "",
    });
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const up = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const uploadAvatar = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error } = await supabase.storage.from('avatars').upload(fileName, file);
        if (!error) {
            const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
            up("avatar_url", data.publicUrl);
        }
        setUploading(false);
    };

    const save = async () => {
        setSaving(true);
        try {
            const { error } = await supabase.from('users').update({ ...form, onboarded: true }).eq('id', user?.id || user?.sub);
            if (error) throw error;
            toast.success("Profile updated");
            setIsEditing(false);
            await refreshUser?.();
        } catch (error) {
            handleError(error, "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const { data: savedProperties = [], isLoading: isLoadingSaved } = useQuery({
        queryKey: ["savedProperties", user?.id],
        queryFn: () => propertyService.getBookmarkedProperties(user?.id),
        enabled: !!user,
    });

    return (
        <div className="max-w-5xl mx-auto px-5 lg:px-8 py-10">
            <Toaster position="top-center" />
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="font-display text-4xl font-medium tracking-tight mb-1">Your profile</h1>
                    <p className="text-muted-foreground">Manage your personal details and saved stays.</p>
                </div>
                {!isEditing && (
                    <Button variant="outline" onClick={() => setIsEditing(true)} className="rounded-full gap-2">
                        <PencilLine className="w-4 h-4" /> Edit Profile
                    </Button>
                )}
            </div>

            <div className="grid lg:grid-cols-[1fr_2.5fr] gap-10">
                <div className="space-y-6">
                    <div className="p-6 rounded-3xl border border-border flex flex-col items-center text-center bg-card shadow-sm">
                        <Avatar className="w-24 h-24 mb-4">
                            <AvatarImage src={form.avatar_url} />
                            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                                {(form.full_name || user.email)[0]?.toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        {isEditing && (
                            <label className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border text-xs font-medium cursor-pointer hover:bg-secondary mb-4 transition-colors">
                                {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                                Change photo
                                <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
                            </label>
                        )}
                        <h2 className="font-display text-2xl font-medium">{form.full_name || "Anonymous User"}</h2>
                        <p className="text-sm text-muted-foreground mt-1 mb-3">{user.email}</p>
                        <Badge variant="outline" className="capitalize">{form.role}</Badge>
                    </div>

                    <div className="p-6 rounded-3xl border border-border space-y-4 bg-card shadow-sm">
                        <h3 className="font-display text-lg font-medium border-b pb-2">Details</h3>
                        
                        {isEditing ? (
                            <div className="space-y-4">
                                <div><Label className="text-xs text-muted-foreground">Full name</Label><Input className="mt-1" value={form.full_name} onChange={(e) => up("full_name", e.target.value)} /></div>
                                <div><Label className="text-xs text-muted-foreground">Phone</Label><Input className="mt-1" value={form.phone} onChange={(e) => up("phone", e.target.value)} /></div>
                                <div><Label className="text-xs text-muted-foreground">City</Label><Input className="mt-1" value={form.city} onChange={(e) => up("city", e.target.value)} /></div>
                                {user.role === "student" && (
                                    <div><Label className="text-xs text-muted-foreground">College</Label><Input className="mt-1" value={form.college} onChange={(e) => up("college", e.target.value)} disabled={true} placeholder="Change via settings" /></div>
                                )}
                                <div><Label className="text-xs text-muted-foreground">Bio</Label><Textarea className="mt-1" rows={3} value={form.bio} onChange={(e) => up("bio", e.target.value)} /></div>
                                
                                <div className="flex gap-2 pt-2">
                                    <Button variant="outline" className="flex-1 rounded-full" onClick={() => setIsEditing(false)}>Cancel</Button>
                                    <Button onClick={save} disabled={saving} className="flex-1 rounded-full">
                                        {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Save
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 text-sm">
                                <div>
                                    <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1 block">Phone</div>
                                    <div className="font-medium">{form.phone || "Not provided"}</div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1 block">City</div>
                                    <div className="font-medium">{form.city || "Not provided"}</div>
                                </div>
                                {user.role === "student" && (
                                    <div>
                                        <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1 block">College</div>
                                        <div className="font-medium">{form.college || "Not enrolled"}</div>
                                    </div>
                                )}
                                <div>
                                    <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1 block">Bio</div>
                                    <div className="font-medium bg-secondary/30 p-3 rounded-xl mt-1 border border-border/50">{form.bio || "No bio written yet."}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <h2 className="font-display text-2xl font-medium mb-6 flex items-center gap-2">
                        <Bookmark className="w-5 h-5 text-primary" /> Saved Properties
                    </h2>
                    
                    {isLoadingSaved ? (
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="aspect-[4/3] rounded-2xl bg-muted animate-pulse" />
                            <div className="aspect-[4/3] rounded-2xl bg-muted animate-pulse" />
                        </div>
                    ) : savedProperties.length === 0 ? (
                        <div className="text-center p-12 border border-dashed rounded-3xl text-muted-foreground bg-secondary/10">
                            No saved properties yet. Start browsing to save your favorites!
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 gap-6">
                            {savedProperties.map((p, i) => (
                                <PropertyCard
                                    key={p.id}
                                    property={p}
                                    bookmarked={true}
                                    onToggleBookmark={async () => {
                                        const currentUserId = user.id;
                                        const previousSaved = queryClient.getQueryData(["savedProperties", currentUserId]);
                                        
                                        queryClient.setQueryData(["savedProperties", currentUserId], (old) => {
                                            if (!old) return [];
                                            return old.filter(prop => prop.id !== p.id);
                                        });

                                        try {
                                            await propertyService.toggleBookmark(currentUserId, p.id, true);
                                            queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
                                        } catch (error) {
                                            queryClient.setQueryData(["savedProperties", currentUserId], previousSaved);
                                            handleError(error, "Failed to remove bookmark");
                                        }
                                    }}
                                    index={i}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function Profile() {
    return (
        <RoleGate>
            <ProfileInner />
        </RoleGate>
    );
}