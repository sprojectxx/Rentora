import { supabase } from "./supabaseClient";

export const propertyService = {
    // Student Browsing
    getFeaturedProperties: async () => {
        const { data, error } = await supabase
            .from("properties")
            .select("*")
            .eq("is_available", true)
            .order("created_at", { ascending: false })
            .limit(6);
        if (error) throw error;
        return data;
    },

    searchProperties: async (q) => {
        let query = supabase.from("properties").select("*").eq("is_available", true);
        if (q) {
            query = query.or(`title.ilike.%${q}%,address.ilike.%${q}%,city.ilike.%${q}%`);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    getPropertyById: async (id) => {
        const { data, error } = await supabase
            .from("properties")
            .select("*, users(full_name, phone, email), property_rules(rule_id, rules(title))")
            .eq("id", id)
            .single();
        if (error) throw error;
        return data;
    },

    getSimilarProperties: async (currentId, city, type) => {
        let query = supabase.from("properties").select("*").eq("is_available", true).neq("id", currentId);
        
        // Find properties with the same city or type
        if (city && type) {
             query = query.or(`city.ilike.%${city}%,property_type.eq.${type}`);
        } else if (city) {
             query = query.ilike('city', `%${city}%`);
        } else if (type) {
             query = query.eq('property_type', type);
        }

        const { data, error } = await query.limit(4);
        if (error) throw error;
        return data;
    },

    // Bookmarks
    getBookmarkedProperties: async (userId) => {
        if (!userId) return [];
        const { data, error } = await supabase
            .from("bookmarks")
            .select("property_id, properties(*)")
            .eq("user_id", userId);
        if (error) throw error;
        return data.map(b => b.properties).filter(Boolean);
    },

    getBookmarks: async (userId) => {
        if (!userId) return [];
        const { data, error } = await supabase
            .from("bookmarks")
            .select("*")
            .eq("user_id", userId);
        if (error) throw error;
        return data;
    },

    toggleBookmark: async (userId, propertyId, isBookmarked) => {
        if (isBookmarked) {
            const { error } = await supabase.from("bookmarks").delete().match({ user_id: userId, property_id: propertyId });
            if (error) throw error;
        } else {
            const { error } = await supabase.from("bookmarks").insert({ user_id: userId, property_id: propertyId });
            if (error) throw error;
        }
    },

    // Colleges
    getColleges: async () => {
        const { data, error } = await supabase.from("colleges").select("*").order("name");
        if (error) throw error;
        return data;
    },
    createCollege: async (payload) => {
        const { data, error } = await supabase.from("colleges").insert(payload);
        if (error) throw error;
        return data;
    },
    deleteCollege: async (id) => {
        const { error } = await supabase.from("colleges").delete().eq("id", id);
        if (error) throw error;
    },

    // Reviews
    getReviews: async (propertyId) => {
        let { data, error } = await supabase
            .from("reviews")
            .select("*, users(full_name, avatar_url)")
            .eq("property_id", propertyId)
            .order("created_at", { ascending: false });
            
        if (error) {
            console.warn("Falling back to select(*) due to error:", error);
            const fallback = await supabase
                .from("reviews")
                .select("*")
                .eq("property_id", propertyId)
                .order("created_at", { ascending: false });
            data = fallback.data;
            error = fallback.error;
        }
        
        if (error) {
            console.error("Fetch reviews error:", error);
            throw error;
        }
        return data || [];
    },

    addReview: async (propertyId, userId, rating, comment) => {
        const { data, error } = await supabase
            .from("reviews")
            .insert({ property_id: propertyId, user_id: userId, rating, comment });
        if (error) throw error;
        return data;
    },

    // Rules
    getRules: async () => {
        const { data, error } = await supabase.from("rules").select("*").order("created_at");
        if (error) throw error;
        return data;
    },
    createRule: async (payload) => {
        const { data, error } = await supabase.from("rules").insert(payload);
        if (error) throw error;
        return data;
    },
    deleteRule: async (id) => {
        const { error } = await supabase.from("rules").delete().eq("id", id);
        if (error) throw error;
    },

    // Owner Functions
    getOwnerProperties: async (ownerId) => {
        const { data, error } = await supabase
            .from("properties")
            .select("*")
            .eq("owner_id", ownerId)
            .order("created_at", { ascending: false });
        if (error) throw error;
        return data;
    },

    createProperty: async (payload) => {
        const { rule_ids, ...propertyData } = payload;
        
        // 1. Insert property
        const { data, error } = await supabase.from("properties").insert(propertyData).select().single();
        if (error) throw error;
        
        // 2. Insert property rules
        if (rule_ids && rule_ids.length > 0) {
            const propertyRules = rule_ids.map(rule_id => ({ property_id: data.id, rule_id }));
            const { error: rulesError } = await supabase.from("property_rules").insert(propertyRules);
            if (rulesError) {
                // Rollback pseudo-transaction
                await supabase.from("properties").delete().eq("id", data.id);
                throw new Error("Failed to save property rules. Listing creation was rolled back.");
            }
        }
        return data;
    },

    updateProperty: async (id, payload) => {
        const { rule_ids, ...propertyData } = payload;
        
        // 1. Update property fields
        const { data, error } = await supabase.from("properties").update(propertyData).eq("id", id).select().single();
        if (error) throw error;
        
        // 2. Update rules if provided (delete all existing mapping and insert new)
        if (rule_ids) {
            try {
                const { error: delError } = await supabase.from("property_rules").delete().eq("property_id", id);
                if (delError) throw delError;
                
                if (rule_ids.length > 0) {
                    const propertyRules = rule_ids.map(rule_id => ({ property_id: id, rule_id }));
                    const { error: insError } = await supabase.from("property_rules").insert(propertyRules);
                    if (insError) throw insError;
                }
            } catch (rulesError) {
                console.error("Rules update failed:", rulesError);
                throw new Error("Property updated, but rule changes failed. Please try saving rules again.");
            }
        }
        
        return data;
    },

    deleteProperty: async (id) => {
        const { error } = await supabase.from("properties").delete().eq("id", id);
        if (error) throw error;
    },

    uploadPropertyImage: async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error } = await supabase.storage.from("properties").upload(fileName, file);
        if (error) throw error;
        const { data } = supabase.storage.from("properties").getPublicUrl(fileName);
        return data.publicUrl;
    },

    // Admin Functions
    getAllProperties: async (offset = 0, limit = 20) => {
        const { data, error } = await supabase
            .from("properties")
            .select("*")
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);
        if (error) throw error;
        return data;
    },
    
    getAllUsers: async () => {
        const { data, error } = await supabase.from("users").select("*");
        if (error) throw error;
        return data;
    },

    updateUserRole: async (id, newRole) => {
        const { error } = await supabase.from("users").update({ role: newRole }).eq("id", id);
        if (error) throw error;
    }
};
