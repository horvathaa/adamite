


export const formatTimestamp = (timestamp) => {
    let date = new Date(timestamp);
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var year = date.getFullYear();
    var month = months[date.getMonth()];
    var day = date.getDate();
    var hour = date.getHours();
    var min = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
    var time = hour + ':' + min + ' ' + day + ' ' + month + ' ' + year;
    return time;
}


// helper method from
// https://stackoverflow.com/questions/2540969/remove-querystring-from-url
export const getPathFromUrl = (url) => {
    return url.split(/[?#]/)[0];
}

export const containsObjectWithUrl = (url, list) => {
    const test = list.filter(obj => obj.url.includes(url));
    return test.length !== 0;
}

// if length is 0 does not contain object, else does contain object
// stupid helper method made out of necessity
export function containsObjectWithId(id, list) {
    const test = list.filter(obj => obj.id === id);
    return test.length !== 0;
}

// if length is 0 does not contain object, else does contain object
// stupid helper method made out of necessity
export function containsReplyWithAnchor(list) {
    const test = list.filter(obj => obj.xpath !== null);
    return test;
}

// helper method from 
// https://stackoverflow.com/questions/4587061/how-to-determine-if-object-is-in-array
export function containsObject(obj, list) {
    var i;
    for (i = 0; i < list.length; i++) {
        if (list[i] === obj) {
            return true;
        }
    }
    return false;
}

// helper method from
// https://stackoverflow.com/questions/18773778/create-array-of-unique-objects-by-property
export function removeDuplicates(annotationArray) {
    const flags = new Set();
    const annotations = annotationArray.filter(anno => {
        if (flags.has(anno.id)) {
            return false;
        }
        flags.add(anno.id);
        return true;
    });
    return annotations;
}


export function checkTimeRange(annotation, timeRange) {
    if (timeRange === null || timeRange === 'all' || annotation.pinned) {
        return true;
    }
    if (timeRange === 'day') {
        return (new Date().getTime() - annotation.createdTimestamp) < 86400000;
    }
    else if (timeRange === 'week') {
        return (new Date().getTime() - annotation.createdTimestamp) < 604800000;
    }
    else if (timeRange === 'month') {
        return (new Date().getTime() - annotation.createdTimestamp) < 2629746000;
    }
    else if (timeRange === '6months') {
        return (new Date().getTime() - annotation.createdTimestamp) < 15778476000;
    }
    else if (timeRange === 'year') {
        return (new Date().getTime() - annotation.createdTimestamp) < 31556952000;
    }
}