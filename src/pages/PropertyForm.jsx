import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { propertyService } from "@/api/propertyService";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getDistanceKm } from "@/hooks/useUserLocation";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Upload, X, ImageIcon, Loader2, MapPin } from "lucide-react";
import { AMENITY_META } from "@/components/shared/AmenityIcon";
import RoleGate from "@/components/shared/RoleGate";
import { toast, Toaster } from "sonner";

const EMPTY = {
    title: "",
    description: "",
    property_type: "pg",
    price: "",
    deposit: "",
    address: "",
    city: "",
    nearby_college: "",
    distance_km: "",
    amenities: [],
    rules: [],
    custom_rules: [],
    room_type: "single",
    gender_preference: "any",
    images: [],
    owner_name: "",
    owner_phone: "",
    is_available: true,
};

function PropertyFormInner() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);
    const isEdit = !!id;

    const { data: colleges = [] } = useQuery({
        queryKey: ["colleges"],
        queryFn: propertyService.getColleges,
    });

    const { data: globalRules = [] } = useQuery({
        queryKey: ["admin-rules"],
        queryFn: propertyService.getRules,
    });

    const [customRuleInput, setCustomRuleInput] = useState("");

    useEffect(() => {
        if (!id) return;
        propertyService.getPropertyById(id).then((data) => {
            if (data) {
                const extractedRuleIds = data.property_rules?.map(pr => pr.rule_id) || [];
                const owner_name = data.users?.full_name || "";
                const owner_phone = data.users?.phone || "";
                setForm({ ...EMPTY, ...data, owner_name, owner_phone, rules: extractedRuleIds, custom_rules: data.custom_rules || [] });
            }
        });
    }, [id]);

    useEffect(() => {
        if (!isEdit && user?.full_name) {
            setForm((f) => ({ ...f, owner_name: f.owner_name || user.full_name, owner_phone: f.owner_phone || user.phone || "" }));
        }
    }, [user, isEdit]);

    // Auto-calculate distance based on property location and college location!
    useEffect(() => {
        if (!form.nearby_college || !form.google_maps_url || colleges.length === 0) return;

        const college = colleges.find(c => c.name === form.nearby_college);
        if (!college || college.latitude == null || college.longitude == null) return;

        let propLat = null, propLon = null;
        const matchAt = form.google_maps_url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        const matchQ = form.google_maps_url.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
        
        if (matchAt) {
            propLat = parseFloat(matchAt[1]);
            propLon = parseFloat(matchAt[2]);
        } else if (matchQ) {
            propLat = parseFloat(matchQ[1]);
            propLon = parseFloat(matchQ[2]);
        }

        if (propLat !== null && propLon !== null) {
            const straightLineDist = getDistanceKm(propLat, propLon, college.latitude, college.longitude);
            const formatted = straightLineDist.toFixed(1);
            
            // Auto-fill distance and location! We only call `setForm` via `up` if it's different.
            if (form.distance_km !== formatted || form.latitude !== propLat || form.longitude !== propLon) {
                setForm((f) => ({ ...f, distance_km: formatted, latitude: propLat, longitude: propLon }));
            }
        }
    }, [form.nearby_college, form.google_maps_url, colleges]);

    const up = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const toggleAmenity = (a) => {
        const cur = form.amenities || [];
        up("amenities", cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a]);
    };

    const toggleRule = (rId) => {
        const cur = form.rules || [];
        up("rules", cur.includes(rId) ? cur.filter((x) => x !== rId) : [...cur, rId]);
    };

    const addCustomRule = () => {
        if (!customRuleInput.trim()) return;
        const cur = form.custom_rules || [];
        up("custom_rules", [...cur, customRuleInput.trim()]);
        setCustomRuleInput("");
    };

    const removeCustomRule = (idx) => {
        const cur = form.custom_rules || [];
        up("custom_rules", cur.filter((_, i) => i !== idx));
    };

    const handleUpload = async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        setUploading(true);
        const uploaded = [];
        try {
            const uploadPromises = files.map(file => propertyService.uploadPropertyImage(file));
            const newUrls = await Promise.all(uploadPromises);
            uploaded.push(...newUrls);
        } catch (err) {
            console.error("Upload error", err);
            toast.error("One or more images failed to upload. Please check your connection.");
        }
        up("images", [...(form.images || []), ...uploaded]);
        setUploading(false);
    };

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }
        setGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                up("google_maps_url", `https://maps.google.com/?q=${lat},${lon}`);
                toast.success("Location captured!");
                setGettingLocation(false);
            },
            (err) => {
                console.error(err);
                toast.error("Could not access GPS. Please allow location permissions.");
                setGettingLocation(false);
            },
            { enableHighAccuracy: true }
        );
    };

    const removeImage = (url) => up("images", form.images.filter((u) => u !== url));

    const submit = async (e) => {
        e.preventDefault();
        if (!form.title || !form.price) {
            toast.error("Please fill title and price.");
            return;
        }
        if (!form.address || !form.city || !form.nearby_college || form.distance_km === "" || !form.google_maps_url) {
            toast.error("Please fill all location information completely.");
            return;
        }
        if (!form.images || form.images.length < 4) {
            toast.error("Please upload a minimum of 4 photos.");
            return;
        }
        if (!form.owner_name || !form.owner_phone) {
            toast.error("Please fill in all contact information.");
            return;
        }
        if ((!form.rules || form.rules.length === 0) && (!form.custom_rules || form.custom_rules.length === 0)) {
            toast.error("Please select or add at least one house rule.");
            return;
        }
        setSaving(true);
        try {
            // 1. Separate the User fields and nested relational fields from the Property fields! (This prevents 400 errors)
            const { owner_name, owner_phone, users, property_rules, rules, custom_rules, ...propertyFormFields } = form;

            // 2. Prepare the database payload perfectly matching the Properties table schema
            const payload = {
                ...propertyFormFields,
                price: Number(form.price),
                deposit: form.deposit ? Number(form.deposit) : undefined,
                distance_km: form.distance_km ? Number(form.distance_km) : undefined,
                rule_ids: rules, // Custom key for our new propertyService
                custom_rules: custom_rules || [],
            };

            // 3. Update the Owner's contact info strictly in the `users` table FIRST
            // If this fails, property is not created (atomic).
            const { error: userError } = await supabase.from('users').update({ full_name: owner_name, phone: owner_phone }).eq('id', user.id);
            if (userError) throw userError;

            // 4. Update the Property!
            if (isEdit) {
                await propertyService.updateProperty(id, payload);
            } else {
                await propertyService.createProperty({ ...payload, owner_id: user.id });
            }

            toast.success(isEdit ? "Listing updated" : "Listing created");
            navigate("/owner");
        } catch (err) {
            console.error("Save error:", err);
            toast.error("Failed to save the property! " + (err.message || err.details || ""));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-5 lg:px-8 py-8">
            <Toaster position="top-center" />
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 rounded-full gap-1">
                <ArrowLeft className="w-4 h-4" /> Back
            </Button>

            <h1 className="font-display text-4xl font-medium tracking-tight mb-1">
                {isEdit ? "Edit listing" : "New listing"}
            </h1>
            <p className="text-muted-foreground mb-8">Fill in the details — you can edit later.</p>

            <form onSubmit={submit} className="space-y-8">
                {/* Basics */}
                <section className="space-y-4 p-6 rounded-2xl border border-border">
                    <h2 className="font-display text-xl font-medium">Basics</h2>
                    <div>
                        <Label>Title *</Label>
                        <Input value={form.title} onChange={(e) => up("title", e.target.value)} placeholder="Cozy single room near IIT campus" />
                    </div>
                    <div>
                        <Label>Description</Label>
                        <Textarea rows={4} value={form.description} onChange={(e) => up("description", e.target.value)} placeholder="Tell students about the vibe, rules, neighborhood..." />
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                        <div>
                            <Label>Type</Label>
                            <Select value={form.property_type} onValueChange={(v) => up("property_type", v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="room">Private room</SelectItem>
                                    <SelectItem value="pg">PG</SelectItem>
                                    <SelectItem value="hostel">Hostel</SelectItem>
                                    <SelectItem value="apartment">Apartment</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Room type</Label>
                            <Select value={form.room_type} onValueChange={(v) => up("room_type", v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="single">Single</SelectItem>
                                    <SelectItem value="shared_2">2-sharing</SelectItem>
                                    <SelectItem value="shared_3">3-sharing</SelectItem>
                                    <SelectItem value="shared_4">4-sharing</SelectItem>
                                    <SelectItem value="shared_5">5-sharing</SelectItem>
                                    <SelectItem value="shared_6">6-sharing</SelectItem>
                                    <SelectItem value="dormitory">Dormitory</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Gender</Label>
                            <Select value={form.gender_preference} onValueChange={(v) => up("gender_preference", v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="any">Any</SelectItem>
                                    <SelectItem value="male">Male only</SelectItem>
                                    <SelectItem value="female">Female only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </section>

                {/* Pricing */}
                <section className="space-y-4 p-6 rounded-2xl border border-border">
                    <h2 className="font-display text-xl font-medium">Pricing</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <Label>Monthly rent (₹) *</Label>
                            <Input type="number" value={form.price} onChange={(e) => up("price", e.target.value)} placeholder="8000" />
                        </div>
                        <div>
                            <Label>Security deposit (₹)</Label>
                            <Input type="number" value={form.deposit} onChange={(e) => up("deposit", e.target.value)} placeholder="16000" />
                        </div>
                    </div>
                </section>

                {/* Location */}
                <section className="space-y-4 p-6 rounded-2xl border border-border">
                    <h2 className="font-display text-xl font-medium">Location</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <Label>Address *</Label>
                            <Input value={form.address} onChange={(e) => up("address", e.target.value)} placeholder="Street, area, landmark" />
                        </div>
                        <div>
                            <div className="flex items-center justify-between">
                                <Label>Google Maps Link *</Label>
                                <button type="button" onClick={handleGetCurrentLocation} disabled={gettingLocation} className="text-xs text-primary hover:underline flex items-center font-medium">
                                    {gettingLocation ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <MapPin className="w-3 h-3 mr-1" />}
                                    Use my exact location
                                </button>
                            </div>
                            <Input value={form.google_maps_url} onChange={(e) => up("google_maps_url", e.target.value)} placeholder="https://maps.app.goo.gl/..." className="mt-1" />
                        </div>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4 [&>div>input]:mt-1.5 [&>div>label]:text-muted-foreground">
                        <div><Label>City *</Label><Input value={form.city} onChange={(e) => up("city", e.target.value)} placeholder="e.g. Hyderabad" /></div>
                        <div>
                            <Label>Nearby college *</Label>
                            <Select value={form.nearby_college} onValueChange={(v) => up("nearby_college", v)}>
                                <SelectTrigger className="h-10 mt-1.5 w-full bg-background border-input text-foreground">
                                    <SelectValue placeholder="Select campus..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {colleges.map((c) => (
                                        <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div><Label>Distance (km) *</Label><Input type="number" step="0.1" value={form.distance_km} onChange={(e) => up("distance_km", e.target.value)} placeholder="e.g. 1.5" /></div>
                    </div>
                </section>

                {/* Images */}
                <section className="space-y-4 p-6 rounded-2xl border border-border">
                    <h2 className="font-display text-xl font-medium">Photos</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {form.images?.map((imgStr) => {
                            let url = imgStr;
                            try { if (typeof imgStr === 'string' && imgStr.startsWith('{')) url = JSON.parse(imgStr).url; } catch(e) {}
                            
                            return (
                            <div key={imgStr} className="relative aspect-square rounded-xl overflow-hidden border border-border">
                                <img src={url} alt="" className="w-full h-full object-cover" />
                                <button type="button" onClick={() => removeImage(imgStr)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-background/90 flex items-center justify-center hover:bg-background">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        )})}
                        <label className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-secondary/30 transition-colors">
                            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Upload className="w-5 h-5 mb-1" /><span className="text-xs">Upload</span></>}
                            <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
                        </label>
                    </div>
                    {!form.images?.length || form.images.length < 4 ? (
                        <p className="text-xs text-destructive flex items-center gap-1 font-medium"><ImageIcon className="w-3 h-3" /> You must upload a minimum of 4 photos to list this property.</p>
                    ) : null}
                </section>

                {/* Amenities */}
                <section className="space-y-4 p-6 rounded-2xl border border-border">
                    <h2 className="font-display text-xl font-medium">Amenities</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {Object.entries(AMENITY_META).map(([key, { label }]) => (
                            <label key={key} className="flex items-center gap-2 p-3 rounded-xl border border-border cursor-pointer hover:bg-secondary/30">
                                <Checkbox checked={form.amenities.includes(key)} onCheckedChange={() => toggleAmenity(key)} />
                                <span className="text-sm">{label}</span>
                            </label>
                        ))}
                    </div>
                </section>

                {/* Property Rules */}
                <section className="space-y-4 p-6 rounded-2xl border border-border">
                    <div>
                        <h2 className="font-display text-xl font-medium">House Rules *</h2>
                        <p className="text-sm text-muted-foreground mt-1">Select the rules that you strictly enforce.</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {globalRules.map((rule) => (
                            <label key={rule.id} className="flex items-center gap-2 p-3 rounded-xl border border-border cursor-pointer hover:bg-secondary/30">
                                <Checkbox checked={(form.rules || []).includes(rule.id)} onCheckedChange={() => toggleRule(rule.id)} />
                                <span className="text-sm font-medium">{rule.title}</span>
                            </label>
                        ))}
                        {globalRules.length === 0 && <p className="text-sm text-muted-foreground col-span-full">No global rules defined by Admin yet.</p>}
                    </div>

                    {/* Custom Rules Input */}
                    <div className="pt-4 border-t border-border">
                        <Label className="mb-2 block">Add custom rules</Label>
                        <div className="flex gap-2">
                            <Input 
                                value={customRuleInput} 
                                onChange={e => setCustomRuleInput(e.target.value)} 
                                placeholder="e.g. Visitors allowed only till 9 PM"
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomRule(); } }}
                            />
                            <Button type="button" onClick={addCustomRule} variant="secondary">Add</Button>
                        </div>
                        {form.custom_rules?.length > 0 && (
                            <div className="flex flex-col gap-2 mt-4">
                                {form.custom_rules.map((cr, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-secondary/20 border border-border text-sm">
                                        <span className="font-medium flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" /> {cr}</span>
                                        <button type="button" onClick={() => removeCustomRule(i)} className="text-destructive hover:underline text-xs">Remove</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* Contact */}
                <section className="space-y-4 p-6 rounded-2xl border border-border">
                    <h2 className="font-display text-xl font-medium">Contact</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div><Label>Your name *</Label><Input value={form.owner_name} onChange={(e) => up("owner_name", e.target.value)} /></div>
                        <div><Label>Phone *</Label><Input value={form.owner_phone} onChange={(e) => up("owner_phone", e.target.value)} /></div>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                        <div>
                            <Label>Available for booking</Label>
                            <p className="text-sm text-muted-foreground">Turn off to pause this listing.</p>
                        </div>
                        <Switch checked={form.is_available} onCheckedChange={(v) => up("is_available", v)} />
                    </div>
                </section>

                <div className="flex gap-3 justify-end">
                    <Button type="button" variant="outline" onClick={() => navigate("/owner")} className="rounded-full">Cancel</Button>
                    <Button type="submit" disabled={saving} className="rounded-full">
                        {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        {isEdit ? "Save changes" : "Publish listing"}
                    </Button>
                </div>
            </form>
        </div>
    );
}

export default function PropertyForm() {
    return (
        <RoleGate allow={["owner", "admin"]}>
            <PropertyFormInner />
        </RoleGate>
    );
}