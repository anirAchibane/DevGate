import { ref, watchEffect } from "vue";
import { db, auth } from "@/firebase/config";

export function useConversations() {
  const conversations = ref([]);
  const loading = ref(true);

  watchEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribe = db
      .collection("chat")
      .where("users", "array-contains", auth.currentUser.uid)
      .onSnapshot(snapshot => {
        conversations.value = snapshot.docs.map(doc => {
          const data = doc.data();
          const otherUserId = data.users.find(uid => uid !== auth.currentUser.uid);

          return {
            id: doc.id,
            ...data,
            otherUsername: otherUserId || "Unknown"
          };
        });
        
        // Sort conversations by lastUpdate timestamp, most recent first
        conversations.value.sort((a, b) => {
          const timestampA = a.lastUpdate?.toMillis ? a.lastUpdate.toMillis() : 0;
          const timestampB = b.lastUpdate?.toMillis ? b.lastUpdate.toMillis() : 0;
          return timestampB - timestampA;
        });
        
        loading.value = false;
      });

    return () => unsubscribe();
  });

  return { conversations, loading };
}