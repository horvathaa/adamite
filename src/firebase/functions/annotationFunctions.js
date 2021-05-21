import { DB_COLLECTIONS, db, getCurrentUserId } from '../index';
import firebase from '../firebase';


export const getUserByUserId = uid => {
  return db.collection(DB_COLLECTIONS.USERS).where('uid', '==', uid);
};

export const getAllAnnotationsByUserId = uid => {
  return db.collection(DB_COLLECTIONS.ANNOTATIONS).where('authorId', '==', uid);
};

export const getAllAnnotationsByUrl = url => {
  return db.collection(DB_COLLECTIONS.ANNOTATIONS)
    .where('url', 'array-contains', url)
    .where('isPrivate', '==', false);
};

export const getPrivateAnnotationsByUrl = (url, uid) => {
  return db.collection(DB_COLLECTIONS.ANNOTATIONS)
    .where('url', 'array-contains', url)
    .where('authorId', '==', uid)
    .where('isPrivate', '==', true);
};

export const getAllUserGroups = uid => {
  return db.collection(DB_COLLECTIONS.GROUPS)
    .where('uids', 'array-contains', uid);
}

export const getUsersByEmails = async (emails) => {
  return db.collection(DB_COLLECTIONS.USERS)
    .where('email', 'in', emails)
}

export const addNewGroup = async ({
  name,
  description,
  owner,
  uids,
  emails
}) => {
  let newGroup = {
    name,
    description,
    emails,
    uids,
    owner,
    createdTimestamp: new Date().getTime()
  };
  return db.collection(DB_COLLECTIONS.GROUPS).add(newGroup).then(ref => {
    db.collection(DB_COLLECTIONS.GROUPS).doc(ref.id).update({
      gid: ref.id,
    }).then(_ => console.log('success'), _ => console.log('rejected!'));
  })
};


export const getAnnotationsAcrossSite = hostname => {
  return db.collection(DB_COLLECTIONS.ANNOTATIONS)
    .where('hostname', '==', hostname)
    .where('isPrivate', '==', false)
    .limit(15);
};

export const getPrivateAnnotationsAcrossSite = (hostname, uid) => {
  return db.collection(DB_COLLECTIONS.ANNOTATIONS)
    .where('hostname', '==', hostname)
    .where('isPrivate', '==', true)
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

export const getAllPinnedAnnotationsByUserId = (uid) => {
  return db
    .collection(DB_COLLECTIONS.ANNOTATIONS)
    .where('authorId', '==', uid)
    .where('pinned', '==', true)
    .where('isPrivate', '==', false);
};

export const getGroupAnnotationsByGroupId = (gid) => {
  // console.log('in annofunctions', gid);
  return db
    .collection(DB_COLLECTIONS.ANNOTATIONS)//.doc("06OlxrYfO08cofa2mDb9");
    .where('groups', 'array-contains', gid) // switch to array-contains-any to look across all groups that user is in
  // .where('authorId', '!=', uid);     // .where('url', 'array-contains', url) fuck u firestore and ur arbitrary limitations
};

export const getAnnotationsByUrl = (url) => {
  return db.collection(DB_COLLECTIONS.ANNOTATIONS)
    .where('url', 'array-contains', url)
}

export const getAllPrivatePinnedAnnotationsByUserId = (uid) => {
  return db
    .collection(DB_COLLECTIONS.ANNOTATIONS)
    .where('authorId', '==', uid)
    .where('pinned', '==', true)
    .where('isPrivate', '==', true);
};

export const getAnnotationById = id => {
  return db.collection(DB_COLLECTIONS.ANNOTATIONS).doc(id);
};

export const getGroupByGid = gid => {
  return db.collection(DB_COLLECTIONS.GROUPS).doc(gid);
}

export const deleteAnnotationForeverById = (id) => {
  return getAnnotationById(id).delete();
};

export const deleteGroupForeverByGid = (gid) => {
  return getGroupByGid(gid).delete();
};

export const updateAnnotationById = async (id, newAnnotationFields = {}) => {
  return getAnnotationById(id).update({ ...newAnnotationFields });
};

export const updateAllAnnotations = () => {
  db.collection(DB_COLLECTIONS.ANNOTATIONS)
    .get()
    .then(function (querySnapshot) {
      querySnapshot.forEach(function (doc) {
        doc.ref.update({
          // add update here
        });
      });
    });
}


export const createAnnotation = async (newAnno) => {
  return db.collection(DB_COLLECTIONS.ANNOTATIONS).doc(newAnno.id).set(newAnno);
};



// export const createAnnotation = async ({
//   authorId,
//   taskId,
//   SharedId,
//   AnnotationContent,
//   AnnotationAnchorContent,
//   AnnotationType,
//   url,
//   hostname,
//   AnnotationTags,
//   offsets,
//   xpath,
//   childAnchor,
//   pinned,
//   isPrivate,
//   author,
//   groups,
//   readCount,
//   events
// }) => {
//   authorId = authorId ? authorId : getCurrentUserId();
//   if (!authorId) {
//     return;
//   }
//   // SharedId = SharedId ? SharedId : undefined;

//   let newAnnotation = {
//     authorId,
//     taskId,
//     SharedId,
//     trashed: false,
//     createdTimestamp: new Date().getTime(),
//     content: AnnotationContent,
//     //anchorContent: "",
//     anchorPath: null,
//     type: AnnotationType,
//     url,
//     hostname,
//     tags: AnnotationTags,
//     offsets,
//     xpath,
//     childAnchor,
//     pinned: AnnotationType === 'question' || AnnotationType === 'to-do',
//     replies: [],
//     private: isPrivate,
//     adopted: false,
//     author,
//     groups,
//     readCount,
//     deleted: false,
//     events
//   };
//   return db.collection(DB_COLLECTIONS.ANNOTATIONS).add(newAnnotation);
// };

