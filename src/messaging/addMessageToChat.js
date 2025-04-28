import { db } from "@/firebase/config";
import firebase from "firebase/app";
import "firebase/firestore";

/**
 * Extract mentions from message content
 * @param {string} content - Message content
 * @returns {Array} - Array of mentioned usernames
 */
const extractMentions = (content) => {
    if (!content) return [];

    // Find all @username patterns
    const mentionRegex = /@([a-zA-Z0-9._]+)/g;
    const mentions = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
        mentions.push(match[1]); // match[1] is the username without the @ symbol
    }

    return [...new Set(mentions)]; // Remove duplicates
};

/**
 * Resolves usernames to user IDs
 * @param {Array} usernames - Array of usernames
 * @returns {Promise<Array>} - Array of user IDs
 */
const resolveMentionedUsers = async (usernames) => {
    if (!usernames.length) return [];

    try {
        // Lookup users by username
        const mentionedUsers = [];

        // Using Promise.all to run queries in parallel
        const promises = usernames.map(async (username) => {
            const userSnapshot = await db
                .collection("users")
                .where("username", "==", username)
                .limit(1)
                .get();

            if (!userSnapshot.empty) {
                mentionedUsers.push(userSnapshot.docs[0].id);
            }
        });

        await Promise.all(promises);
        return mentionedUsers;
    } catch (error) {
        console.error("Error resolving mentioned users:", error);
        return [];
    }
};

export const addMessageToChat = async (chatId, messageData) => {
    try {
        // Determine if this is a private chat or group chat
        const isPrivateChat = chatId.includes("_");

        // Get the appropriate collection reference
        const collectionName = isPrivateChat ? "chat" : "group";
        const chatRef = db.collection(collectionName).doc(chatId);

        // Extract mentions from the message content
        const mentionedUsernames = extractMentions(messageData.content);

        // If there are mentions, resolve them to user IDs
        let mentionedUserIds = [];
        if (mentionedUsernames.length > 0) {
            mentionedUserIds = await resolveMentionedUsers(mentionedUsernames);
        }

        // Create the message object with required fields
        const message = {
            content: messageData.content,
            created_at: firebase.firestore.FieldValue.serverTimestamp(),
            sender_id: messageData.sender_id,
            ...(messageData.admins && { admins: messageData.admins }), // Add admins field for group chats
            ...(mentionedUserIds.length > 0 && { mentions: mentionedUserIds }), // Add mentions if present
        };

        // Update the chat document
        await chatRef.update({
            messages: firebase.firestore.FieldValue.arrayUnion(message),
            lastUpdate: firebase.firestore.FieldValue.serverTimestamp(),
        });

        return { success: true, message };
    } catch (error) {
        console.error("Error adding message to chat:", error);
        throw error;
    }
};

export default addMessageToChat;
