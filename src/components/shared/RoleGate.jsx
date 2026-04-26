import React from "react";
import { useAuth } from "@/lib/AuthContext";

import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

export default function RoleGate({ allow, children }) {
    const { user, navigateToLogin } = useAuth();

    if (!user) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-6">
                <div className="text-center max-w-sm">
                    <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-6 h-6" />
                    </div>
                    <h3 className="font-display text-2xl font-semibold mb-2">Sign in to continue</h3>
                    <p className="text-muted-foreground mb-6">You need an account to access this page.</p>
                    <Button onClick={navigateToLogin} className="rounded-full">Sign in</Button>
                </div>
            </div>
        );
    }

    if (allow && !allow.includes(user.role)) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-6">
                <div className="text-center max-w-sm">
                    <h3 className="font-display text-2xl font-semibold mb-2">Not available for your account</h3>
                    <p className="text-muted-foreground">
                        This page is only for {allow.join(" or ")} accounts. You can update your role from your profile.
                    </p>
                </div>
            </div>
        );
    }

    return children;
}