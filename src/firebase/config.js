import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDf3IYfuDOOECYhhz4ZWtNaTrtAl0IEDA0",
    authDomain: "devgate-6df87.firebaseapp.com",
    projectId: "devgate-6df87",
    storageBucket: "devgate-6df87.firebasestorage.app",
    messagingSenderId: "233307387981",
    appId: "1:233307387981:web:0566380fda84ca6d8b8404",
    measurementId: "G-NGKQQ1TF0D"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

export {db, auth, firebase};