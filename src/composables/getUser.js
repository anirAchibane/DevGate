import { ref } from "vue";
import { auth, db } from "@/firebase/config";

// Function to get a specific user by ID
function getUser(userID) {
    const userData = ref(null);
    const error = ref(null);
    const loading = ref(true);

    // Immediately fetch user data when called
    db.collection("users")
        .doc(userID)
        .get()
        .then((doc) => {
            if (doc.exists) {
                userData.value = { uid: doc.id, ...doc.data() };
                console.log("User data fetched:", userData.value);
            } else {
                console.error("User not found with ID:", userID);
                error.value = "User not found";
            }
        })
        .catch((err) => {
            error.value = err.message;
            console.error("Error fetching user:", err);
        })
        .finally(() => {
            loading.value = false;
        });

    return { userData, error, loading };
}

// Function to get the currently authenticated user
function getCurrentUser() {
    const userData = ref(null);
    const error = ref(null);
    const loading = ref(true);

    if (!auth.currentUser) {
        error.value = "No authenticated user";
        loading.value = false;
        console.error("No authenticated user");
        return { userData, error, loading };
    }

    db.collection("users")
        .doc(auth.currentUser.uid)
        .get()
        .then((doc) => {
            if (doc.exists) {
                userData.value = { uid: doc.id, ...doc.data() };
            } else {
                error.value = "Current user not found";
            }
        })
        .catch((err) => {
            error.value = err.message;
            console.error("Error fetching current user:", err);
        })
        .finally(() => {
            loading.value = false;
        });

    return { userData, error, loading };
}

// Function to get all users
function getAllUsers() {
    const users = ref([]);
    const error = ref(null);
    const loading = ref(true);

    db.collection("users")
        .get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                users.value.push({
                    uid: doc.id,
                    ...doc.data(),
                });
            });
        })
        .catch((err) => {
            error.value = err.message;
            console.error("Error fetching all users:", err);
        })
        .finally(() => {
            loading.value = false;
        });

    return { users, error, loading };
}

export { getUser, getCurrentUser, getAllUsers };
