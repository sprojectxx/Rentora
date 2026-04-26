import React from "react";
import { Button } from "@/components/ui/button";

export default function EmptyState({ icon: Icon, title, description, action }) {
    return (
        <div className="text-center py-20 px-6">
            {Icon && (
                <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-muted-foreground" />
                </div>
            )}
            <h3 className="font-display text-2xl font-semibold mb-2">{title}</h3>
            {description && <p className="text-muted-foreground max-w-sm mx-auto mb-6">{description}</p>}
            {action && <Button onClick={action.onClick} className="rounded-full">{action.label}</Button>}
        </div>
    );
}