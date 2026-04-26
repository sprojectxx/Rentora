import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { AMENITY_META } from "@/components/shared/AmenityIcon";

export default function SearchFilters({ filters, setFilters, onReset }) {
    const toggleAmenity = (a) => {
        const current = filters.amenities || [];
        const next = current.includes(a) ? current.filter((x) => x !== a) : [...current, a];
        setFilters({ ...filters, amenities: next });
    };

    return (
        <div className="space-y-6">
            <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Search</Label>
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="College, area, city..."
                        value={filters.query || ""}
                        onChange={(e) => setFilters({ ...filters, query: e.target.value })}
                        className="pl-9 rounded-full"
                    />
                </div>
            </div>

            <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Type</Label>
                <Select
                    value={filters.property_type || "any"}
                    onValueChange={(v) => setFilters({ ...filters, property_type: v })}
                >
                    <SelectTrigger className="rounded-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="any">Any type</SelectItem>
                        <SelectItem value="room">Private room</SelectItem>
                        <SelectItem value="pg">PG</SelectItem>
                        <SelectItem value="hostel">Hostel</SelectItem>
                        <SelectItem value="apartment">Apartment</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Sharing</Label>
                <Select
                    value={filters.room_type || "any"}
                    onValueChange={(v) => setFilters({ ...filters, room_type: v })}
                >
                    <SelectTrigger className="rounded-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="any">Any sharing</SelectItem>
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
                <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Max price</Label>
                    <span className="text-sm font-medium">₹{(filters.maxPrice ?? 20000).toLocaleString()}</span>
                </div>
                <Slider
                    min={1000}
                    max={20000}
                    step={500}
                    value={[Math.min(filters.maxPrice ?? 20000, 20000)]}
                    onValueChange={([v]) => setFilters({ ...filters, maxPrice: v })}
                />
            </div>

            <div>
                <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Max distance</Label>
                    <span className="text-sm font-medium">{filters.maxDistance ?? 20} km</span>
                </div>
                <Slider
                    min={1}
                    max={50}
                    step={1}
                    value={[filters.maxDistance ?? 20]}
                    onValueChange={([v]) => setFilters({ ...filters, maxDistance: v })}
                />
            </div>

            <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-3 block">Amenities</Label>
                <div className="grid grid-cols-2 gap-2">
                    {Object.entries(AMENITY_META).map(([key, { label }]) => (
                        <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                            <Checkbox
                                checked={(filters.amenities || []).includes(key)}
                                onCheckedChange={() => toggleAmenity(key)}
                            />
                            <span>{label}</span>
                        </label>
                    ))}
                </div>
            </div>

            <Button variant="outline" onClick={onReset} className="w-full rounded-full gap-2">
                <X className="w-4 h-4" /> Clear filters
            </Button>
        </div>
    );
}