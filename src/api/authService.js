import { supabase } from "./supabaseClient";

export const authService = {
    // Current user session & properties
    getSession: async () => {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        return data.session;
    },

    getUserRecord: async (email) => {
        const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("email", email)
            .single();
        if (error && error.code !== "PGRST116") throw error; // PGRST116 is "no rows returned"
        return data;
    },

    // Standard Auth flows
    signOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    signInWithGoogle: async () => {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/`,
            },
        });
        if (error) throw error;
        return data;
    },

    signInWithEmailOTP: async (email) => {
        const { data, error } = await supabase.auth.signInWithOtp({ 
            email,
            options: { shouldCreateUser: true }
        });
        if (error) throw error;
        return data;
    },

    verifyEmailOTP: async (email, token) => {
        const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
        if (error) throw error;
        return data;
    },

    signInWithPhoneOTP: async (phone) => {
        const { data, error } = await supabase.auth.signInWithOtp({ phone });
        if (error) throw error;
        return data;
    },

    verifyPhoneOTP: async (phone, token) => {
        const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
        if (error) throw error;
        return data;
    },

    // User management
    updateUserRecord: async (userId, payload) => {
        const { data, error } = await supabase
            .from("users")
            .update(payload)
            .eq("id", userId);
        if (error) throw error;
        return data;
    },
    
    uploadAvatar: async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error } = await supabase.storage.from("avatars").upload(fileName, file);
        if (error) throw error;
        const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
        return data.publicUrl;
    }
};
