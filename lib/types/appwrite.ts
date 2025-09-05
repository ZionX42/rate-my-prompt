// Shared interfaces for Appwrite documents following DRY principles
export interface AppwriteDocument {
  $id: string;
  $collectionId: string;
  $databaseId: string;
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];
  // Allow dynamic properties for specific document types
  [key: string]: unknown;
}

// Specific interface for Comment documents
export interface CommentDocument extends AppwriteDocument {
  promptId: string;
  userId: string;
  content: string;
  parentId: string;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
  isDeleted: boolean;
}

// Type guard to check if document is a valid Appwrite document
export function isAppwriteDocument(doc: unknown): doc is AppwriteDocument {
  return (
    typeof doc === 'object' &&
    doc !== null &&
    '$id' in doc &&
    '$collectionId' in doc &&
    '$databaseId' in doc &&
    '$createdAt' in doc &&
    '$updatedAt' in doc &&
    '$permissions' in doc
  );
}
