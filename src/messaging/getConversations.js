import { db, auth } from "@/firebase/config";
import { ref, watchEffect } from "vue";

// Composable for fetching private chats
export function usePrivateChats() {
    const privateChats = ref([]);
    const error = ref(null);
    const loading = ref(true);
    const unsubscribe = ref(null);

    const loadPrivateChats = () => {
        // Clear any existing listener
        if (unsubscribe.value) {
            unsubscribe.value();
        }

        privateChats.value = [];
        loading.value = true;
        error.value = null;

        try {
            if (!auth.currentUser) {
                throw new Error("User not authenticated");
            }

            // Listen for private chats
            unsubscribe.value = db
                .collection("chat")
                .where("users", "array-contains", auth.currentUser.uid)
                .onSnapshot(
                    (snapshot) => {
                        privateChats.value = snapshot.docs.map((doc) => {
                            const data = doc.data();
                            return {
                                id: doc.id,
                                uid: doc.id, // Add uid for consistency
                                type: "private",
                                ...data,
                            };
                        });

                        // Sort by most recent
                        privateChats.value.sort((a, b) => {
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
                        console.error("Error fetching private chats:", err);
                        error.value = err.message;
                        loading.value = false;
                    }
                );
        } catch (err) {
            console.error("Error setting up private chats listener:", err);
            error.value = err.message;
            loading.value = false;
        }
    };

    // Setup and cleanup with watchEffect
    watchEffect((onCleanup) => {
        loadPrivateChats();
        onCleanup(() => {
            if (unsubscribe.value) {
                unsubscribe.value();
            }
        });
    });

    return { privateChats, error, loading, loadPrivateChats };
}

// Composable for fetching group chats
export function useGroupChats() {
    const groupChats = ref([]);
    const error = ref(null);
    const loading = ref(true);
    const unsubscribe = ref(null);

    const loadGroupChats = () => {
        // Clear any existing listener
        if (unsubscribe.value) {
            unsubscribe.value();
        }

        groupChats.value = [];
        loading.value = true;
        error.value = null;

        try {
            if (!auth.currentUser) {
                throw new Error("User not authenticated");
            }

            // Listen for group chats
            unsubscribe.value = db
                .collection("group")
                .where("users", "array-contains", auth.currentUser.uid)
                .onSnapshot(
                    (snapshot) => {
                        groupChats.value = snapshot.docs.map((doc) => {
                            const data = doc.data();
                            return {
                                id: doc.id,
                                uid: doc.id, // Ensure uid field exists and matches id
                                type: "group",
                                ...data,
                            };
                        });

                        // Sort by most recent
                        groupChats.value.sort((a, b) => {
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
                        console.error("Error fetching group chats:", err);
                        error.value = err.message;
                        loading.value = false;
                    }
                );
        } catch (err) {
            console.error("Error setting up group chats listener:", err);
            error.value = err.message;
            loading.value = false;
        }
    };

    // Setup and cleanup with watchEffect
    watchEffect((onCleanup) => {
        loadGroupChats();
        onCleanup(() => {
            if (unsubscribe.value) {
                unsubscribe.value();
            }
        });
    });

    return { groupChats, error, loading, loadGroupChats };
}

// Helper function to combine both chat types
export function useAllChats() {
    const {
        privateChats,
        error: privateError,
        loading: privateLoading,
    } = usePrivateChats();
    const {
        groupChats,
        error: groupError,
        loading: groupLoading,
    } = useGroupChats();

    const allChats = ref([]);
    const error = ref(null);
    const loading = ref(true);

    // Combine both chat types
    watchEffect(() => {
        if (privateError.value) error.value = privateError.value;
        if (groupError.value) error.value = groupError.value;

        // Only set loading to false when both are done
        loading.value = privateLoading.value || groupLoading.value;

        // Combine chats and sort them
        allChats.value = [...privateChats.value, ...groupChats.value].sort(
            (a, b) => {
                const timestampA = a.lastUpdate?.toMillis
                    ? a.lastUpdate.toMillis()
                    : a.lastUpdate || 0;
                const timestampB = b.lastUpdate?.toMillis
                    ? b.lastUpdate.toMillis()
                    : b.lastUpdate || 0;
                return timestampB - timestampA;
            }
        );
    });

    return { allChats, error, loading };
}
