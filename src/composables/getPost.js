// function to get all posts and function to get a single post from post id
import { ref } from 'vue';
import { db } from '../firebase'; 
// import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

function getPosts() {
    const posts = ref([]);
    const error = ref(null);
    const loading = ref(true);
    
    // Store the unsubscribe function to allow cleanup
    const unsubscribe = db.collection('publicFeed')
        .onSnapshot((snapshot) => {
            posts.value = snapshot.docs.map((doc) => doc.id);
            console.log('Posts fetched:', posts.value);
            loading.value = false;
        }, (err) => {
            error.value = err.message;
            console.error('Error fetching posts:', err);
            loading.value = false;
        });
    
    // Return unsubscribe function along with data
    return { posts, error, loading, unsubscribe };
}

function getPost(postID) {
    const post = ref(null);
    const error = ref(null);
    const loading = ref(true);

    // Store the unsubscribe function to allow cleanup
    const unsubscribe = db.collection('publicFeed')
        .doc(postID)
        .onSnapshot((doc) => {
            if (doc.exists) {
                post.value = { id: doc.id, ...doc.data() };
                console.log('Post fetched:', post.value);
            } else {
                error.value = 'Post not found';
                console.error('Post not found with ID:', postID);
            }
            loading.value = false;
        }, (err) => {
            error.value = err.message;
            console.error('Error fetching post:', err);
            loading.value = false;
        });

    return { post, error, loading, unsubscribe };
}

export { getPosts, getPost };