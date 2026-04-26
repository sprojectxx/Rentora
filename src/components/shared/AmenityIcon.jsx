import React from "react";
import {
    Wifi, Snowflake, Shirt, Utensils, Car, Dumbbell, BookOpen,
    Shield, Sparkles, Zap, Droplet, Tv, Video, Refrigerator, 
    ChefHat, ArrowUpDown, Bath, Brush, Lock, Droplets
} from "lucide-react";

export const AMENITY_META = {
    wifi: { label: "Wi-Fi", icon: Wifi },
    ac: { label: "AC", icon: Snowflake },
    laundry: { label: "Laundry", icon: Shirt },
    meals: { label: "Meals", icon: Utensils },
    parking: { label: "Parking", icon: Car },
    gym: { label: "Gym", icon: Dumbbell },
    study_room: { label: "Study room", icon: BookOpen },
    security: { label: "24/7 security", icon: Shield },
    housekeeping: { label: "Housekeeping", icon: Sparkles },
    power_backup: { label: "Power backup", icon: Zap },
    hot_water: { label: "Hot water", icon: Droplet },
    tv: { label: "TV", icon: Tv },
    cctv: { label: "CCTV", icon: Video },
    fridge: { label: "Refrigerator", icon: Refrigerator },
    kitchen: { label: "Self-cooking kitchen", icon: ChefHat },
    lift: { label: "Lift/Elevator", icon: ArrowUpDown },
    attached_bathroom: { label: "Attached washroom", icon: Bath },
    daily_cleaning: { label: "Daily cleaning", icon: Brush },
    wardrobe: { label: "Personal locker", icon: Lock },
    ro_water: { label: "RO Water", icon: Droplets },
};

export default function AmenityIcon({ amenity, className = "" }) {
    const meta = AMENITY_META[amenity];
    if (!meta) return null;
    const Icon = meta.icon;
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <Icon className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">{meta.label}</span>
        </div>
    );
}
