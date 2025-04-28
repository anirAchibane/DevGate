import { db, auth } from "@/firebase/config";
import { ref, watchEffect } from "vue";

/**
 * Composable for fetching messages for a specific chat
 * @param {string} chatId - The chat ID (uid for groups, chatKey for private chats)
 * @param {string} chatType - The chat type ("private" or "group")
 * @returns {Object} - Contains messages array, error, loading status, and refresh function
 */
export function useMessages(chatId, chatType) {
    const messages = ref([]);
    const error = ref(null);
    const loading = ref(true);
    const unsubscribe = ref(null);
    // const chatDocRef = ref(null);

    // Cache for private chat document references
    // const chatCache = {};

    // Flag to prevent recursive updates
    let isProcessing = false;

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
            // Determine collection path based on chat type
            const collectionPath = chatType === "private" ? "chat" : "group";

            // For private chats with chatKey format
            if (chatType === "private") {
                console.log(
                    "Loading private chat messages for chatKey:",
                    chatId
                );

                // First query to find the chat document with this chatKey
                unsubscribe.value = db
                    .collection(collectionPath)
                    .where("chatKey", "==", chatId)
                    .limit(1)
                    .onSnapshot(
                        (chatSnapshot) => {
                            if (chatSnapshot.empty) {
                                error.value = "Chat not found";
                                loading.value = false;
                                return;
                            }

                            // Get the first (and only) document
                            const chatDoc = chatSnapshot.docs[0];

                            // Now get the messages subcollection from this document
                            chatDoc.ref
                                .collection("messages")
                                .orderBy("created_at", "desc")
                                .limit(50)
                                .onSnapshot(
                                    (snapshot) => {
                                        // Avoid recursive updates
                                        if (isProcessing) return;
                                        isProcessing = true;

                                        try {
                                            // Transform and reverse to display in ascending order
                                            const newMessages = snapshot.docs
                                                .map((doc) => ({
                                                    id: doc.id,
                                                    ...doc.data(),
                                                }))
                                                .reverse();

                                            // Update the reactive reference in one operation
                                            messages.value = newMessages;
                                            loading.value = false;
                                            console.log(
                                                "Messages loaded:",
                                                messages.value
                                            );
                                        } finally {
                                            isProcessing = false;
                                        }
                                    },
                                    (err) => {
                                        error.value = `Error fetching messages: ${err.message}`;
                                        console.error(
                                            "Error fetching messages:",
                                            err
                                        );
                                        loading.value = false;
                                        isProcessing = false;
                                    }
                                );
                        },
                        (err) => {
                            error.value = `Error finding chat: ${err.message}`;
                            console.error("Error finding chat:", err);
                            loading.value = false;
                        }
                    );
            } else {
                // For group chats, directly access by document ID
                console.log(
                    "Loading group chat messages for group ID:",
                    chatId
                );

                unsubscribe.value = db
                    .collection(collectionPath)
                    .doc(chatId)
                    .collection("messages")
                    .orderBy("created_at", "desc")
                    .limit(50) // Limit to most recent 50 messages for better performance
                    .onSnapshot(
                        (snapshot) => {
                            // Avoid recursive updates
                            if (isProcessing) return;
                            isProcessing = true;

                            try {
                                // Transform and reverse to display in ascending order
                                const newMessages = snapshot.docs
                                    .map((doc) => ({
                                        id: doc.id,
                                        ...doc.data(),
                                    }))
                                    .reverse();

                                // Update the reactive reference in one operation
                                messages.value = newMessages;
                                loading.value = false;
                            } finally {
                                isProcessing = false;
                            }
                        },
                        (err) => {
                            error.value = `Error fetching messages: ${err.message}`;
                            console.error("Error fetching messages:", err);
                            loading.value = false;
                            isProcessing = false;
                        }
                    );
            }
        } catch (err) {
            error.value = `Error setting up message listener: ${err.message}`;
            console.error("Error setting up message listener:", err);
            loading.value = false;
        }
    };

    // Setup and cleanup with watchEffect
    watchEffect((onCleanup) => {
        // Use immediate async function to avoid watchEffect restrictions
        (async () => {
            await loadMessages();
        })();

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
 * @param {string} chatId - The chat ID
 * @param {string} chatType - The chat type ("private" or "group")
 * @returns {Object} - Contains sendMessage function, error, and loading status
 */
export function useSendMessage(chatId, chatType) {
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

            const collectionPath = chatType === "private" ? "chat" : "group";
            const messageData = {
                content: content.trim(),
                sender_id: auth.currentUser.uid,
                created_at: new Date(),
            };

            // Add message to the chat
            await db
                .collection(collectionPath)
                .doc(chatId)
                .collection("messages")
                .add(messageData);

            // Update the last message and timestamp on the chat/group document
            await db
                .collection(collectionPath)
                .doc(chatId)
                .update({
                    lastMessage: {
                        content: content.trim(),
                        sender_id: auth.currentUser.uid,
                    },
                    lastUpdate: new Date(),
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
 * Helper function to add a message to a chat (without composable structure)
 * @param {string} chatId - The chat ID (uid for groups, chatKey for private chats)
 * @param {Object} messageData - The message data to add
 */
export async function addMessageToChat(chatId, messageData) {
    if (!chatId || !messageData.content) {
        throw new Error("Chat ID and message content are required");
    }

    try {
        if (!auth.currentUser) {
            throw new Error("User not authenticated");
        }

        // Determine if this is a private chat or group chat
        // Check if the ID has the format of a chatKey (has an underscore)
        const isPrivateChat = chatId.includes("_");
        const collectionPath = isPrivateChat ? "chat" : "group";

        console.log(
            `Adding message to ${
                isPrivateChat ? "private" : "group"
            } chat: ${chatId}`
        );

        // Add created_at if not provided
        if (!messageData.created_at) {
            messageData.created_at = new Date();
        }

        // Add sender_id if not provided
        if (!messageData.sender_id) {
            messageData.sender_id = auth.currentUser.uid;
        }

        // For private chats, we need to first find the document by chatKey
        if (isPrivateChat) {
            // Query to find the chat document with this chatKey
            const chatQuerySnapshot = await db
                .collection("chat")
                .where("chatKey", "==", chatId)
                .limit(1)
                .get();

            if (chatQuerySnapshot.empty) {
                console.error(`No chat found with chatKey: ${chatId}`);

                // Try to create the chat if it doesn't exist
                if (chatId.includes("_")) {
                    const userIds = chatId.split("_");
                    if (userIds.length === 2) {
                        console.log(
                            `Creating new chat with users: ${userIds.join(
                                ", "
                            )}`
                        );

                        // Create new chat document
                        const newChatRef = db.collection("chat").doc();
                        await newChatRef.set({
                            chatKey: chatId,
                            type: "private",
                            users: userIds,
                            createdAt: new Date(),
                            lastUpdate: new Date(),
                        });

                        // Add message to the new chat
                        await newChatRef
                            .collection("messages")
                            .add(messageData);

                        // Update last message info
                        await newChatRef.update({
                            lastMessage: {
                                content: messageData.content,
                                sender_id: messageData.sender_id,
                            },
                            lastUpdate: new Date(),
                        });

                        return true;
                    }
                }

                throw new Error(`No chat found with chatKey: ${chatId}`);
            }

            // Get the actual document ID
            const chatDocRef = chatQuerySnapshot.docs[0].ref;

            // Add message to the chat
            await chatDocRef.collection("messages").add(messageData);

            // Update the last message and timestamp on the chat document
            await chatDocRef.update({
                lastMessage: {
                    content: messageData.content,
                    sender_id: messageData.sender_id,
                },
                lastUpdate: new Date(),
            });
        } else {
            // For group chats, we can access directly by ID
            const docRef = db.collection(collectionPath).doc(chatId);

            // Check if group exists
            const docSnapshot = await docRef.get();
            if (!docSnapshot.exists) {
                throw new Error(`Group chat with ID ${chatId} does not exist`);
            }

            // Add message to the chat
            await docRef.collection("messages").add(messageData);

            // Update the last message and timestamp on the chat/group document
            await docRef.update({
                lastMessage: {
                    content: messageData.content,
                    sender_id: messageData.sender_id,
                },
                lastUpdate: new Date(),
            });
        }

        return true;
    } catch (err) {
        console.error("Error adding message to chat:", err);
        throw err;
    }
}

/**
 * Helper function to delete a message from a chat
 * @param {string} chatId - The chat ID (uid for groups, chatKey for private chats)
 * @param {string} messageId - The ID of the message to delete
 * @param {string} chatType - The chat type ("private" or "group")
 * @returns {Promise<boolean>} - True if deletion was successful
 */
export async function deleteMessage(chatId, messageId, chatType) {
    if (!chatId || !messageId) {
        throw new Error("Chat ID and message ID are required");
    }

    try {
        if (!auth.currentUser) {
            throw new Error("User not authenticated");
        }

        // Determine collection path based on chat type
        const collectionPath = chatType === "private" ? "chat" : "group";

        // For private chats with chatKey format
        if (chatType === "private") {
            console.log(
                `Deleting message ${messageId} from private chat: ${chatId}`
            );

            // Find the chat document with this chatKey
            const chatQuerySnapshot = await db
                .collection(collectionPath)
                .where("chatKey", "==", chatId)
                .limit(1)
                .get();

            if (chatQuerySnapshot.empty) {
                throw new Error(`No chat found with chatKey: ${chatId}`);
            }

            // Get the actual document reference
            const chatDocRef = chatQuerySnapshot.docs[0].ref;

            // Delete the message
            await chatDocRef.collection("messages").doc(messageId).delete();

            // Update lastMessage if necessary (fetch the new last message)
            const lastMessages = await chatDocRef
                .collection("messages")
                .orderBy("created_at", "desc")
                .limit(1)
                .get();

            if (!lastMessages.empty) {
                const lastMessage = lastMessages.docs[0].data();
                await chatDocRef.update({
                    lastMessage: {
                        content: lastMessage.content,
                        sender_id: lastMessage.sender_id,
                    },
                    lastUpdate: new Date(),
                });
            } else {
                // No messages left, update with empty last message
                await chatDocRef.update({
                    lastMessage: {
                        content: "(No messages)",
                        sender_id: "",
                    },
                    lastUpdate: new Date(),
                });
            }
        } else {
            // For group chats, directly access by document ID
            console.log(
                `Deleting message ${messageId} from group chat: ${chatId}`
            );

            const groupDocRef = db.collection(collectionPath).doc(chatId);

            // Delete the message
            await groupDocRef.collection("messages").doc(messageId).delete();

            // Update lastMessage if necessary (fetch the new last message)
            const lastMessages = await groupDocRef
                .collection("messages")
                .orderBy("created_at", "desc")
                .limit(1)
                .get();

            if (!lastMessages.empty) {
                const lastMessage = lastMessages.docs[0].data();
                await groupDocRef.update({
                    lastMessage: {
                        content: lastMessage.content,
                        sender_id: lastMessage.sender_id,
                    },
                    lastUpdate: new Date(),
                });
            } else {
                // No messages left, update with empty last message
                await groupDocRef.update({
                    lastMessage: {
                        content: "(No messages)",
                        sender_id: "",
                    },
                    lastUpdate: new Date(),
                });
            }
        }

        return true;
    } catch (err) {
        console.error("Error deleting message:", err);
        throw err;
    }
}

/**
 * Get all messages for a user from all chats
 * @param {string} userId - The user ID
 * @returns {Object} - Contains messages array and error
 */
export function useAllUserMessages(userId) {
    const messages = ref([]);
    const error = ref(null);
    const loading = ref(true);
    const unsubscribes = ref([]);

    // Internal cache to store messages by chat/type
    const messageCache = {};
    // Flag to prevent recursive updates
    let isProcessing = false;

    const loadAllMessages = () => {
        // Clear existing data
        loading.value = true;
        messages.value = [];
        error.value = null;
        // Reset message cache
        Object.keys(messageCache).forEach((key) => delete messageCache[key]);

        // Unsubscribe from previous listeners
        if (unsubscribes.value.length > 0) {
            unsubscribes.value.forEach((unsub) => unsub());
            unsubscribes.value = [];
        }

        if (!userId) {
            error.value = "User ID is required";
            loading.value = false;
            return;
        }

        try {
            // Listen for private chat messages
            const privateUnsubscribe = db
                .collection("chat")
                .where("users", "array-contains", userId)
                .onSnapshot(
                    (chatSnapshot) => {
                        chatSnapshot.forEach((chatDoc) => {
                            const chatId = chatDoc.id;

                            const messageUnsubscribe = db
                                .collection("chat")
                                .doc(chatId)
                                .collection("messages")
                                .orderBy("created_at", "desc")
                                .onSnapshot(
                                    (msgSnapshot) => {
                                        const chatMessages =
                                            msgSnapshot.docs.map((doc) => ({
                                                id: doc.id,
                                                chatId,
                                                chatType: "private",
                                                ...doc.data(),
                                            }));

                                        // Store in cache
                                        messageCache[`private_${chatId}`] =
                                            chatMessages;

                                        // Update reactive state in a non-recursive way
                                        updateAllMessages();
                                    },
                                    (err) => {
                                        console.error(
                                            `Error fetching messages for chat ${chatId}:`,
                                            err
                                        );
                                    }
                                );

                            unsubscribes.value.push(messageUnsubscribe);
                        });
                    },
                    (err) => {
                        error.value = `Error fetching chats: ${err.message}`;
                        console.error("Error fetching chats:", err);
                    }
                );

            unsubscribes.value.push(privateUnsubscribe);

            // Listen for group chat messages
            const groupUnsubscribe = db
                .collection("group")
                .where("users", "array-contains", userId)
                .onSnapshot(
                    (groupSnapshot) => {
                        groupSnapshot.forEach((groupDoc) => {
                            const groupId = groupDoc.id;

                            const messageUnsubscribe = db
                                .collection("group")
                                .doc(groupId)
                                .collection("messages")
                                .orderBy("created_at", "desc")
                                .onSnapshot(
                                    (msgSnapshot) => {
                                        const groupMessages =
                                            msgSnapshot.docs.map((doc) => ({
                                                id: doc.id,
                                                chatId: groupId,
                                                chatType: "group",
                                                ...doc.data(),
                                            }));

                                        // Store in cache
                                        messageCache[`group_${groupId}`] =
                                            groupMessages;

                                        // Update reactive state in a non-recursive way
                                        updateAllMessages();
                                        loading.value = false;
                                    },
                                    (err) => {
                                        console.error(
                                            `Error fetching messages for group ${groupId}:`,
                                            err
                                        );
                                    }
                                );

                            unsubscribes.value.push(messageUnsubscribe);
                        });
                    },
                    (err) => {
                        error.value = `Error fetching groups: ${err.message}`;
                        console.error("Error fetching groups:", err);
                    }
                );

            unsubscribes.value.push(groupUnsubscribe);
        } catch (err) {
            error.value = `Error setting up message listeners: ${err.message}`;
            console.error("Error setting up message listeners:", err);
            loading.value = false;
        }
    };

    // Function to safely update all messages without causing reactivity loops
    const updateAllMessages = () => {
        // Prevent recursive calls
        if (isProcessing) return;
        isProcessing = true;

        try {
            // Collect all messages into an array
            const allMessages = Object.values(messageCache).flat();

            // Sort the messages
            const sortedMessages = allMessages.sort((a, b) => {
                const timestampA = a.created_at?.toMillis
                    ? a.created_at.toMillis()
                    : 0;
                const timestampB = b.created_at?.toMillis
                    ? b.created_at.toMillis()
                    : 0;
                return timestampB - timestampA;
            });

            // Update reactive reference in one atomic operation
            messages.value = sortedMessages;
        } finally {
            isProcessing = false;
        }
    };

    // Initialize message loading
    loadAllMessages();

    // Cleanup function
    const cleanup = () => {
        if (unsubscribes.value.length > 0) {
            unsubscribes.value.forEach((unsub) => unsub());
            unsubscribes.value = [];
        }
    };

    return {
        messages,
        error,
        loading,
        refresh: loadAllMessages,
        cleanup,
    };
}
