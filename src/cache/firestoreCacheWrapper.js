import { queryCache } from './cache';

import {
    getAllAnnotationsByUrl,
    getAllAnnotationsByUserUrlAndMaxTime,
    getAllAnnotationsByUserId,
} from '../firebase/index';

function getAllAnnotationsByUserId2(uid) {
    getCache(getAllAnnotationsByUserId(uid), { uid: uid });
}

export const getAllAnnotationsByUrlCache = (url) => {
    return new Promise((resolve, reject) => {
        resolve(queryCache(getAllAnnotationsByUrl(url), { url: url }));
    });
}