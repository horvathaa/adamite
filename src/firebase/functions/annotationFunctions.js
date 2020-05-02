import { DB_COLLECTIONS, db, getCurrentUserId } from '../index';

export const getAllAnnotationsByUserId = uid => {
  return db.collection(DB_COLLECTIONS.ANNOTATIONS).where('authorId', '==', uid);
};

export const getAllAnnotationsByUrl = url => {
  return db.collection(DB_COLLECTIONS.ANNOTATIONS).where('url', '==', url);
};

export const getAllAnnotationsByUserIdAndUrl = (uid, url) => {
  return db
    .collection(DB_COLLECTIONS.ANNOTATIONS)
    .where('authorId', '==', uid)
    .where('url', '==', url);
};

export const getAllAnnotations = () => {
  return db.collection(DB_COLLECTIONS.ANNOTATIONS);
};

export const getAnnotationById = id => {
  return db.collection(DB_COLLECTIONS.ANNOTATIONS).doc(id);
};

export const trashAnnotationById = id => {
  getAnnotationById(id).update({ trashed: true });
};

export const deleteAnnotationForeverById = id => {
  getAnnotationById(id).delete();
};

export const updateAnnotationById = (id, newAnnotationFields = {}) => {
  getAnnotationById(id).update({ ...newAnnotationFields });
};

export const createAnnotation = async ({
  authorId,
  taskId,
  AnnotationContent,
  AnnotationAnchorContent,
  AnnotationAnchorPath,
  AnnotationType,
  url,
  AnnotationTags,
  div,
  todo,
}) => {
  authorId = authorId ? authorId : getCurrentUserId();
  if (!authorId) {
    return;
  }

  let newAnnotation = {
    authorId,
    taskId,
    trashed: false,
    createdTimestamp: new Date().getTime(),
    content: AnnotationContent,
    anchorContent: AnnotationAnchorContent,
    anchorPath: AnnotationAnchorPath,
    type: AnnotationType,
    url,
    tags: AnnotationTags,
    div,
    todo,
  };

  return getAllAnnotations().doc().set(newAnnotation);
};
