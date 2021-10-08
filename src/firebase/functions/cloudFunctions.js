import firebase from '../firebase';


export const searchFirebaseFunction = (userQuery) => {
  return firebase.functions().httpsCallable('search')({ userQuery }).then((result) => { return result });
}

export const getPhotoForAnnosFunction = (annotations) => {
  return firebase.functions().httpsCallable('getPhotoForAnnotations')({ annotations }).then((result) => { return result });
}

export const createGroupFunction = (group) => {
  return firebase.functions().httpsCallable('createGroup')({ group }).then((result) => { return result });
}