import { db, auth, firebase } from "@/firebase/config";
import { ref, watchEffect } from "vue";

/**
 * Composable for fetching messages for a specific chat
 * @param {string} chatId - The chat document ID
 * @returns {Object} - Contains messages array, error, loading status, and refresh function
 */
export function useChatMessages(chatId) {
    const messages = ref([]);
    const error = ref(null);
    const loading = ref(true);
    const unsubscribe = ref(null);

    const loadMessages = async () => {
        // Clear existing data and listener
        if (unsubscribe.value) {
            unsubscribe.value();
            unsubscribe.value = null;
        }

        messages.value = [];
        error.value = null;
        loading.value = true;

        if (!chatId) {
            error.value = "Chat ID is required";
            loading.value = false;
            return;
        }

        try {
            // Set up listener for messages
            unsubscribe.value = db
                .collection("chat")
                .doc(chatId)
                .collection("messages")
                .orderBy("created_at", "asc")
                .limit(100) // Limit to most recent messages for better performance
                .onSnapshot(
                    (snapshot) => {
                        // Transform messages
                        messages.value = snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        }));
                        loading.value = false;
                    },
                    (err) => {
                        error.value = `Error fetching messages: ${err.message}`;
                        console.error("Error fetching messages:", err);
                        loading.value = false;
                    }
                );
        } catch (err) {
            error.value = `Error setting up message listener: ${err.message}`;
            console.error("Error setting up message listener:", err);
            loading.value = false;
        }
    };

    // Setup and cleanup with watchEffect
    watchEffect((onCleanup) => {
        loadMessages();

        onCleanup(() => {
            if (unsubscribe.value) {
                unsubscribe.value();
                unsubscribe.value = null;
            }
        });
    });

    return {
        messages,
        error,
        loading,
        refresh: loadMessages,
    };
}

/**
 * Composable for sending a message to a chat
 * @param {string} chatId - The chat document ID
 * @returns {Object} - Contains sendMessage function, error, and loading status
 */
export function useSendMessage(chatId) {
    const error = ref(null);
    const loading = ref(false);

    const sendMessage = async (content) => {
        if (!chatId || !content.trim()) {
            error.value = "Chat ID and message content are required";
            return false;
        }

        error.value = null;
        loading.value = true;

        try {
            if (!auth.currentUser) {
                throw new Error("User not authenticated");
            }

            // Create message data
            const messageData = {
                content: content.trim(),
                sender_id: auth.currentUser.uid,
                created_at: firebase.firestore.FieldValue.serverTimestamp(),
            };

            // Add message to the chat
            await db
                .collection("chat")
                .doc(chatId)
                .collection("messages")
                .add(messageData);

            // Update the last message and timestamp on the chat document
            await db
                .collection("chat")
                .doc(chatId)
                .update({
                    lastMessage: {
                        content: content.trim(),
                        sender_id: auth.currentUser.uid,
                    },
                    lastUpdate: firebase.firestore.FieldValue.serverTimestamp(),
                });

            loading.value = false;
            return true;
        } catch (err) {
            error.value = `Error sending message: ${err.message}`;
            console.error("Error sending message:", err);
            loading.value = false;
            return false;
        }
    };

    return { sendMessage, error, loading };
}

/**
 * Helper function to create a new chat between two users
 * @param {string} otherUserId - The ID of the user to chat with
 * @returns {Promise<string>} - The ID of the created or existing chat
 */
export async function createChat(otherUserId) {
    try {
        if (!auth.currentUser) {
            throw new Error("User not authenticated");
        }

        if (otherUserId === auth.currentUser.uid) {
            throw new Error("Cannot create chat with yourself");
        }

        const currentUserId = auth.currentUser.uid;
        
        // Check if a chat already exists between these users
        const existingChatQuery = await db
            .collection("chat")
            .where("users", "array-contains", currentUserId)
            .get();
        
        // Find a chat where the other user is also a participant
        const existingChat = existingChatQuery.docs.find(doc => {
            const chatData = doc.data();
            return chatData.users && chatData.users.includes(otherUserId);
        });
        
        if (existingChat) {
            return existingChat.id;
        }
        
        // Create a new chat if none exists
        const chatRef = db.collection("chat").doc();
        
        await chatRef.set({
            users: [currentUserId, otherUserId],
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastUpdate: firebase.firestore.FieldValue.serverTimestamp(),
            lastMessage: {
                content: "",
                sender_id: "",
            }
        });
        
        return chatRef.id;
    } catch (error) {
        console.error("Error creating chat:", error);
        throw error;
    }
}

/**
 * Delete a message from a chat
 * @param {string} chatId - The chat ID
 * @param {string} messageId - The message ID to delete
 * @returns {Promise<boolean>} - True if successful
 */
export async function deleteMessage(chatId, messageId) {
    try {
        if (!auth.currentUser) {
            throw new Error("User not authenticated");
        }

        // Get the message to check ownership
        const messageDoc = await db
            .collection("chat")
            .doc(chatId)
            .collection("messages")
            .doc(messageId)
            .get();

        if (!messageDoc.exists) {
            throw new Error("Message not found");
        }

        const messageData = messageDoc.data();
        
        // Only allow users to delete their own messages
        if (messageData.sender_id !== auth.currentUser.uid) {
            throw new Error("You can only delete your own messages");
        }

        // Delete the message
        await db
            .collection("chat")
            .doc(chatId)
            .collection("messages")
            .doc(messageId)
            .delete();

        // If this was the last message, update the lastMessage field
        const chatRef = db.collection("chat").doc(chatId);
        const lastMessages = await chatRef
            .collection("messages")
            .orderBy("created_at", "desc")
            .limit(1)
            .get();

        if (!lastMessages.empty) {
            const lastMessage = lastMessages.docs[0].data();
            await chatRef.update({
                lastMessage: {
                    content: lastMessage.content,
                    sender_id: lastMessage.sender_id,
                },
                lastUpdate: firebase.firestore.FieldValue.serverTimestamp(),
            });
        } else {
            // No messages left
            await chatRef.update({
                lastMessage: {
                    content: "",
                    sender_id: "",
                },
                lastUpdate: firebase.firestore.FieldValue.serverTimestamp(),
            });
        }

        return true;
    } catch (error) {
        console.error("Error deleting message:", error);
        throw error;
    }
}