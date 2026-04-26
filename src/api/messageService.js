import { supabase } from "./supabaseClient";

export const messageService = {
    // Fetch user messages (both sent and received)
    getUserMessages: async (userId) => {
        if (!userId) return [];
        const { data: sent, error: sentErr } = await supabase.from("messages").select("*, properties(title)").eq("sender_id", userId);
        const { data: received, error: recErr } = await supabase.from("messages").select("*, properties(title)").eq("receiver_id", userId);
        
        if (sentErr || recErr) throw sentErr || recErr;
        
        const all = [...(sent || []), ...(received || [])];
        const seen = new Set();
        return all.filter((m) => (seen.has(m.id) ? false : seen.add(m.id))).sort(
            (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );
    },

    // Fetch received messages only (e.g for Owner dashboard stats)
    getReceivedMessages: async (userId, limit = 50) => {
        if (!userId) return [];
        const { data, error } = await supabase
            .from("messages")
            .select("*")
            .eq("receiver_id", userId)
            .order("created_at", { ascending: false })
            .limit(limit);
        if (error) throw error;
        return data;
    },

    // Send a message
    sendMessage: async (propertyId, senderId, receiverId, messageText) => {
        const { data, error } = await supabase.from("messages").insert({
            property_id: propertyId,
            sender_id: senderId,
            receiver_id: receiverId,
            message: messageText,
        });
        if (error) throw error;
        return data;
    },

    // Subscribe to messages (Realtime channel)
    subscribeToMessages: (userId, onMessageReceived) => {
        return supabase
            .channel(`public:messages:${userId}`)
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
                const newMsg = payload.new;
                if (newMsg.sender_id === userId || newMsg.receiver_id === userId) {
                    onMessageReceived(newMsg);
                }
            })
            .subscribe();
    },

    unsubscribeFromMessages: (channel) => {
        supabase.removeChannel(channel);
    }
};
