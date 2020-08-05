import { DB_COLLECTIONS, db, getCurrentUserId } from '../index';
import firebase from '../firebase';

export const getAllAnnotationsByUserId = uid => {
  return db.collection(DB_COLLECTIONS.ANNOTATIONS).where('authorId', '==', uid);
};

export const getAllAnnotationsByUrl = url => {
  return db.collection(DB_COLLECTIONS.ANNOTATIONS)
    .where('url', '==', url)
    .where('private', '==', false);
};

export const getPrivateAnnotationsByUrl = (url, uid) => {
  return db.collection(DB_COLLECTIONS.ANNOTATIONS)
    .where('url', '==', url)
    .where('authorId', '==', uid)
    .where('private', '==', true);
};

export const getAnnotationsAcrossSite = hostname => {
  return db.collection(DB_COLLECTIONS.ANNOTATIONS)
    .where('hostname', '==', hostname)
    .where('private', '==', false)
    .limit(15);
};

export const getPrivateAnnotationsAcrossSite = (hostname, uid) => {
  return db.collection(DB_COLLECTIONS.ANNOTATIONS)
    .where('hostname', '==', hostname)
    .where('private', '==', true)
    .where('authorId', '==', uid)
    .limit(15);
};

export const getAnnotationsByTag = tag => {
  return db.collection(DB_COLLECTIONS.ANNOTATIONS).where('tags', 'array-contains', tag);
};

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
  return db.collection(DB_COLLECTIONS.ANNOTATIONS);
};

export const getAllQuestionAnnotationsByUserId = (uid) => {
  return db
    .collection(DB_COLLECTIONS.ANNOTATIONS)
    .where('authorId', '==', uid)
    .where('type', '==', 'question')
    .where('private', '==', false);
};

export const getAllPrivateQuestionAnnotationsByUserId = (uid) => {
  return db
    .collection(DB_COLLECTIONS.ANNOTATIONS)
    .where('authorId', '==', uid)
    .where('type', '==', 'question')
    .where('private', '==', true);
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

export const updateAllAnnotations = () => {
  db.collection(DB_COLLECTIONS.ANNOTATIONS).get().then(function (querySnapshot) {
    querySnapshot.forEach(function (doc) {
      doc.ref.update({
        // fill in here what needs updating
      });
    });
  });
}

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
  childAnchor,
  pinned,
  isPrivate
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
    childAnchor,
    pinned: AnnotationType === 'question',
    replies: [],
    private: isPrivate
  };
  return db.collection(DB_COLLECTIONS.ANNOTATIONS).add(newAnnotation);
};
