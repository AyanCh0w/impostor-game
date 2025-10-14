// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: "impostergame-e575b.firebaseapp.com",
  databaseURL: "https://impostergame-e575b-default-rtdb.firebaseio.com",
  projectId: "impostergame-e575b",
  storageBucket: "impostergame-e575b.firebasestorage.app",
  messagingSenderId: "754453884333",
  appId: "1:754453884333:web:3079951139295b68698524",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Function to get a document by ID from a collection
export async function getDocumentById(
  collectionName: string,
  documentId: string
) {
  try {
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        data: docSnap.data(),
      };
    } else {
      console.log("No such document!");
      return null;
    }
  } catch (error) {
    console.error("Error getting document:", error);
    return null;
  }
}

// Function to set a document in a collection
export async function setDocument(
  collectionName: string,
  documentId: string,
  data: any
) {
  try {
    const docRef = doc(db, collectionName, documentId);
    await setDoc(docRef, data);
    console.log("Document successfully written!");
    return { success: true, id: documentId };
  } catch (error) {
    console.error("Error setting document:", error);
    return { success: false, error };
  }
}

// Function to delete a document from a collection
export async function deleteDocument(
  collectionName: string,
  documentId: string
) {
  try {
    const docRef = doc(db, collectionName, documentId);
    await deleteDoc(docRef);
    console.log("Document successfully deleted!");
    return { success: true, id: documentId };
  } catch (error) {
    console.error("Error deleting document:", error);
    return { success: false, error };
  }
}

// Function to subscribe to real-time updates for a document
export function subscribeToDocument(
  collectionName: string,
  documentId: string,
  callback: (data: any) => void
): Unsubscribe {
  const docRef = doc(db, collectionName, documentId);

  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback({
        id: doc.id,
        data: doc.data(),
      });
    } else {
      console.log("No such document!");
      callback(null);
    }
  });
}
