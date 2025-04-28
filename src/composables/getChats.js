import { db, auth } from "@/firebase/config";
import { ref, watchEffect } from "vue";

// Composable for fetching private chats
export function useChats() {
    const chats = ref([]);
    const error = ref(null);
    const loading = ref(true);
    const unsubscribe = ref(null);

    const loadChats = () => {
        // Clear any existing listener
        if (unsubscribe.value) {
            unsubscribe.value();
        }

        chats.value = [];
        loading.value = true;
        error.value = null;

        try {
            if (!auth.currentUser) {
                throw new Error("User not authenticated");
            }

            // Listen for chats where current user is a participant
            unsubscribe.value = db
                .collection("chat")
                .where("users", "array-contains", auth.currentUser.uid)
                .onSnapshot(
                    (snapshot) => {
                        chats.value = snapshot.docs.map((doc) => {
                            const data = doc.data();
                            return {
                                id: doc.id,
                                ...data,
                            };
                        });

                        // Sort by most recent
                        chats.value.sort((a, b) => {
                            const timestampA = a.lastUpdate?.toMillis
                                ? a.lastUpdate.toMillis()
                                : a.lastUpdate || 0;
                            const timestampB = b.lastUpdate?.toMillis
                                ? b.lastUpdate.toMillis()
                                : b.lastUpdate || 0;
                            return timestampB - timestampA;
                        });

                        loading.value = false;
                    },
                    (err) => {
                        console.error("Error fetching chats:", err);
                        error.value = err.message;
                        loading.value = false;
                    }
                );
        } catch (err) {
            console.error("Error setting up chats listener:", err);
            error.value = err.message;
            loading.value = false;
        }
    };

    // Setup and cleanup with watchEffect
    watchEffect((onCleanup) => {
        loadChats();
        onCleanup(() => {
            if (unsubscribe.value) {
                unsubscribe.value();
            }
        });
    });

    return { chats, error, loading, loadChats };
}