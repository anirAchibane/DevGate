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
        loading.value = false;
      });

    return () => unsubscribe();
  });

  return { conversations, loading };
}