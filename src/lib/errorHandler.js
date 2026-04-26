import { toast } from "sonner";
import { supabase } from "@/api/supabaseClient";

/**
 * Standardized error handling utility for the app.
 * @param {Error|any} error - The error object to handle.
 * @param {string} defaultMessage - A user-friendly default message to show on the toast.
 * @param {boolean} showToast - Whether to display a toast notification to the user.
 */
export const handleError = async (error, defaultMessage = "Something went wrong", showToast = true) => {
    console.error("Caught Exception:", error);

    // If it's a Supabase/PostgREST error, try to fetch current user to help debug RLS issues
    if (error?.code || error?.details) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            console.log("DEBUG: Current Supabase Auth User:", user);
            console.log("DEBUG: Error Details:", error.details || error.hint || error.message);
        } catch (e) {
            // ignore
        }
    }

    // Check for network errors
    if (!navigator.onLine || error?.message === "Failed to fetch") {
        console.warn("Network Error detected.");
        if (showToast) {
            toast.error("You are offline. Please check your network connection and try again.");
        }
        return;
    }

    // Standard Toast
    if (showToast) {
        const message = error?.message || defaultMessage;
        toast.error(message);
    }
};
