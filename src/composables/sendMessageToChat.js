import { db } from "@/firebase/config";
import firebase from "firebase/app";

const sendMessageToChat = async (chatId, messageData) => {
  const chatRef = db.collection("chat").doc(chatId);

  const newMessage = {
    content: messageData.content,
    created_at: firebase.firestore.FieldValue.serverTimestamp(),
    sender_id: messageData.sender_id
  };

  await chatRef.collection("messages").add(newMessage);
  await chatRef.update({
    lastMessage: {
      content: messageData.content,
      sender_id: messageData.sender_id
    },
    lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
  });
};

export default sendMessageToChat;