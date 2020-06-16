import { DB_COLLECTIONS, db, getCurrentUserId } from '../index';
import firebase from '../firebase';

export const getAllAnnotationsByUserId = uid => {
  return db.collection(DB_COLLECTIONS.ANNOTATIONS).where('authorId', '==', uid);
};

export const getAllAnnotationsByUrl = url => {
  return db.collection(DB_COLLECTIONS.ANNOTATIONS).where('url', '==', url);
};

export const getAnnotationsAcrossSite = hostname => {
  return db.collection(DB_COLLECTIONS.ANNOTATIONS).where('hostname', '==', hostname).limit(15);
}

export const getAllAnnotationsByUserIdAndUrl = (uid, url) => {
  return db
    .collection(DB_COLLECTIONS.ANNOTATIONS)
    .where('authorId', '==', uid)
    .where('url', '==', url);
};

export const getAllAnnotationsByUserUrlAndMaxTime = (url, maxTime) => {
  return db
    .collection(DB_COLLECTIONS.ANNOTATIONS)
    .where('createdTimestamp', '>', maxTime)
    .where('url', '==', url);
};

export const getAllAnnotations = () => {
  return db.collection(DB_COLLECTIONS.ANNOTATIONS)/*.orderBy("createdTimestamp", "desc")*/;
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
  return getAnnotationById(id).update({ ...newAnnotationFields });
};

export const createAnnotation = async ({
  authorId,
  taskId,
  SharedId,
  AnnotationContent,
  AnnotationAnchorContent,
  AnnotationType,
  url,
  hostname,
  AnnotationTags,
  offsets,
  xpath,
  childAnchor
}) => {
  authorId = authorId ? authorId : getCurrentUserId();
  if (!authorId) {
    return;
  }
  // SharedId = SharedId ? SharedId : undefined;

  let newAnnotation = {
    authorId,
    taskId,
    SharedId,
    trashed: false,
    createdTimestamp: new Date().getTime(),
    content: AnnotationContent,
    anchorContent: AnnotationAnchorContent,
    anchorPath: null,
    type: AnnotationType,
    url,
    hostname,
    tags: AnnotationTags,
    offsets,
    xpath,
    childAnchor
  };
  return db.collection(DB_COLLECTIONS.ANNOTATIONS).add(newAnnotation);
};
