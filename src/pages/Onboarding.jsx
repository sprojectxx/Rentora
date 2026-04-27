import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { handleError } from "@/lib/errorHandler";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, Home, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { propertyService } from "@/api/propertyService";
import { toast } from "sonner";

const ROLES = [
    {
        value: "student",
        label: "Student",
        icon: GraduationCap,
        description: "I'm looking for a room near my college",
    },
    {
        value: "owner",
        label: "Room Owner",
        icon: Home,
        description: "I want to list my property for students",
    },
];

export default function Onboarding() {
    const navigate = useNavigate();
    const { user, refreshUser } = useAuth();
    const [role, setRole] = useState("student");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [gender, setGender] = useState("");
    const [collegeId, setCollegeId] = useState("");
    const [saving, setSaving] = useState(false);

    const { data: colleges = [] } = useQuery({
        queryKey: ["colleges"],
        queryFn: propertyService.getColleges,
    });

    const submit = async (e) => {
        e.preventDefault();
        
        if (!name.trim()) return toast.error("Please enter your full name.");
        if (!phone.trim()) return toast.error("Please enter your phone number.");
        if (!gender) return toast.error("Please select your gender.");
        
        if (role === "student" && !collegeId) {
            return toast.error("Please select your college.");
        }
        setSaving(true);
        
        const selectedCollege = colleges.find(c => String(c.id) === String(collegeId))?.name;

        try {
            const { error } = await supabase.from('users').upsert({ 
                id: user?.id || user?.sub,
                email: user?.email,
                role, 
                full_name: name || undefined, 
                phone: phone || undefined, 
                gender: gender || undefined,
                college: selectedCollege || undefined,
                onboarded: true 
            });

            if (error) throw error;

            await refreshUser();
            toast.success("Profile saved successfully!");
            navigate(role === "owner" ? "/owner" : "/browse");
        } catch (error) {
            handleError(error, "Failed to save profile");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-5 py-16 bg-background">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="flex items-center gap-2 mb-8">
                    <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                        <span className="text-primary-foreground font-display font-bold text-xl">R</span>
                    </div>
                    <span className="font-display text-2xl font-semibold">Rentora</span>
                </div>

                <h1 className="font-display text-4xl font-medium tracking-tight mb-1">Welcome!</h1>
                <p className="text-muted-foreground mb-8">Tell us a bit about yourself to get started.</p>

                <form onSubmit={submit} className="space-y-6">
                    <div>
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-3 block">I am aâ€¦</Label>
                        <div className="grid grid-cols-2 gap-3">
                            {ROLES.map((r) => (
                                <button
                                    key={r.value}
                                    type="button"
                                    onClick={() => setRole(r.value)}
                                    className={`p-4 rounded-2xl border-2 text-left transition-all ${role === r.value
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:border-foreground/20"
                                        }`}
                                >
                                    <r.icon className={`w-6 h-6 mb-2 ${role === r.value ? "text-primary" : "text-muted-foreground"}`} />
                                    <div className="font-semibold text-sm">{r.label}</div>
                                    <div className="text-xs text-muted-foreground mt-0.5">{r.description}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <Label>Your name</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Arjun Sharma" className="mt-1.5" required />
                    </div>

                    <div>
                        <Label>Phone</Label>
                        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10 - digit phone number" className="mt-1.5" required /> 
                    </div>

                    <div>
                        <Label>Gender</Label>
                        <Select value={gender} onValueChange={setGender} required>
                            <SelectTrigger className="h-10 mt-1.5 w-full bg-background border-input text-foreground">
                                <SelectValue placeholder="Select your gender..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {role === "student" && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                            <Label>Select your College</Label>
                            <Select value={collegeId} onValueChange={setCollegeId} required>
                                <SelectTrigger className="h-10 mt-1.5 w-full bg-background border-input text-foreground">
                                    <SelectValue placeholder="Select your campus..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {colleges.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <Button type="submit" disabled={saving} className="w-full rounded-full">
                        {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        Get started &rarr;
                    </Button>
                </form>
            </motion.div>
        </div>
    );
}
