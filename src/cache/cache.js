
/**
 * Checks Chrome local storage cache for arguements, queries firestore where needed
 * @param {function} callback Firestore query
 * @param {object} args 
 */
export const queryCache = (callback, args) => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(annotations => {
            console.log("these are the cache annotations", annotations)
            if (!annotations.sidebarOpen) {
                console.log("state tells me to leave")
                return;
            }
            resolve(loadFromCacheOrFirestore(annotations, callback, args));
        });
    });
}


function filter(arr, criteria) {
    return arr.filter(function (obj) {
        return Object.keys(criteria).every(function (c) {
            return obj[c] == criteria[c];
        });
    });
}

function firestoreDataToArray(firestoreData) {
    var firestoreAnnotations = []
    firestoreData.forEach(function (annotation) {
        firestoreAnnotations.push({
            id: annotation.id,
            ...annotation.data(),
        });
    });
    return firestoreAnnotations;
}

/**
 * Determines if cache has any annotations that are needed
 * @param {array} annotations cached annotations
 * @param {function} callback firestore callback
 * @param {object} args query arguements for firestore
 */
function loadFromCacheOrFirestore(annotations, callback, args) {

    return new Promise((resolve, reject) => {
        annotations.annotations = filter(annotations.annotations, args)
        if (!annotations.hasOwnProperty('annotations') || (annotations.annotations !== null && annotations.annotations.length === 0)) {
            CacheAllAnnotationsOnPageGeneric(callback);
        }
        else {
            getUpdatedAnnotationsFromFirestore(annotations.annotations, callback)
                .then(function (e) {
                    resolve(e);
                });
        }
    });
}


/**
 * Caches every annotation on a url to chrome local storage
 * @param {string} url url of current user page 
 */
function CacheAllAnnotationsOnPageGeneric(callback) {
    return new Promise((resolve, reject) => {
        callback.get()
            .then(function (item) {
                var toStore = firestoreDataToArray(item);
                chrome.storage.local.set({ annotations: toStore }, function () { resolve(toStore) });
            }).catch(function (error) {
                console.log("Error getting documents: ", error);
                reject(error)
            });
    });
}

/**
 * Checks to see if any new annotations need to be added to the local cache.
 * @param {Array} oldAnnotations Array of annotation objects that were pulled from local storage that may need to be updated 
 * @param {*} url url of current user page 
 */
function getUpdatedAnnotationsFromFirestore(oldAnnotations, callback) {
    var maxTimeStamp = Math.max.apply(Math, oldAnnotations.map(function (o) { return o.createdTimestamp; }))
    return new Promise((resolve, reject) => {
        var query = callback
        query = query
            .where('createdTimestamp', '>', maxTimeStamp)
            .where('deletedTimestamp', '==', 0);
        console.log("this is the query", query)
        query.get()
            .then(function (item) {
                var toStore = firestoreDataToArray(item);
                if (toStore.length !== 0) {

                    for (var i = oldAnnotations.length - 1; i >= 0; i--) {
                        var found = toStore.filter(e => e.id == oldAnnotations[i].id)
                        if (found.length > 0) {
                            oldAnnotations[i] = found[0];
                        }
                    }

                    for (var i = 0; i < toStore.length; i++) {
                        var found = oldAnnotations.filter(e => e.id == toStore[i].id)
                        if (found.length === 0) {
                            oldAnnotations.push(toStore[i]);
                        }
                    }
                    chrome.storage.local.set({ annotations: oldAnnotations });
                }
                resolve(oldAnnotations);
            }).catch(function (error) {
                console.log("Error getting documents: ", error);
                reject(error);
            });
    });
}
