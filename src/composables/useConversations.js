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
        sortConversations();
        
        loading.value = false;
      });

    return () => unsubscribe();
  });
  
  // Function to sort conversations by lastUpdate timestamp
  const sortConversations = () => {
    conversations.value.sort((a, b) => {
      const timestampA = a.lastUpdate?.toMillis ? a.lastUpdate.toMillis() : 0;
      const timestampB = b.lastUpdate?.toMillis ? b.lastUpdate.toMillis() : 0;
      return timestampB - timestampA;
    });
  };
  
  // Add a method to manually refresh a conversation to the top
  const refreshConversation = (chatId) => {
    if (!chatId) return;
    
    // Find the conversation in our local data
    const index = conversations.value.findIndex(conv => conv.id === chatId);
    if (index >= 0) {
      // Update its lastUpdate timestamp to now
      const updatedConversation = {
        ...conversations.value[index],
        lastUpdate: {
          toMillis: () => Date.now(),
          toDate: () => new Date()
        }
      };
      
      // Replace the conversation in the array
      conversations.value[index] = updatedConversation;
      
      // Re-sort the conversations
      sortConversations();
    }
  };

  return { conversations, loading, refreshConversation };
}