import { getDb } from './Firebase';

export const DB_PATHS = {
  EVENTS: 'events',
  USERS: 'users',
  EVENT_USERS: 'event_users',
  EVENT_COMMENTS: 'event_comments',
  METADATA: 'metadata',
  NOTIFICATIONS: 'user_notifications',
};

/**
 * Gets all documents in a collection
 * @param collection - Name of the collection for which we are returning all documents
 * @returns Promise - A promise of the collection's snapshot
 */
export function getCollection(collection: string): Promise<FirebaseFirestore.QuerySnapshot> {
  return getDb()
    .collection(collection)
    .get();
}

/**
 * Queries the database for the provided path based on the id
 * @param { string } collection Path to retrieve the data from
 * @param { string } id ID of what you want to retrieve
 * @returns The snapshot of the document if it finds any
 */
export function getDocument(
  collection: string,
  id: string,
): Promise<FirebaseFirestore.DocumentSnapshot> {
  return getDb()
    .collection(collection)
    .doc(id)
    .get();
}

/**
 * Add a document into specified collection
 * @param { string } collection to add the document to
 * @param document to add to the collection
 * @returns Promise returned by the firestore
 */
export function addToCollection(
  collection: string,
  document: any,
): Promise<FirebaseFirestore.DocumentReference> {
  return getDb()
    .collection(collection)
    .add(document);
}

/**
 * Generic function that inserts a documentID into the database with a specified ID
 * @param { string } collection Collection to add the data to
 * @param { string } documentID ID of the document to add to the collection
 * @param document that is being added as a document to he collection
 * @returns Promise returned by the firestore write result
 */
export function setDocument(
  collection: string,
  documentID: string,
  document: any,
): Promise<FirebaseFirestore.WriteResult> {
  return getDb()
    .collection(collection)
    .doc(documentID)
    .set(document);
}

/**
 * This method is used to update a specific document in the Firebase Firestore db
 * @param collection - The name of the collection where the document to-be-updated is stored
 * @param documentID - The ID of the document being accessed
 * @param document - The data to be updated
 * @returns Promise - Returns a promise that the data will be updated in the specified document
 */
export function updateDocument(
  collection: string,
  documentID: string,
  document: any,
): Promise<FirebaseFirestore.WriteResult> {
  return getDb()
    .collection(collection)
    .doc(documentID)
    .update(document);
}

/**
 * This method is used to delete a specific document in the Firebase Firestore db
 * @param collection - The name of the collection where the document is stored
 * @param documentID - The ID of the document being deleted
 * @returns Promise - Returns a promise that the document will be deleted
 */
export function deleteDocument(
  collection: string,
  documentID: string,
): Promise<FirebaseFirestore.WriteResult> {
  return getDb()
    .collection(collection)
    .doc(documentID)
    .delete();
}
