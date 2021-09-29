import axios from 'axios';
import { isEqual } from 'lodash';
import { getElasticApiKey, getAllUserGroups } from '../../../firebase/index';
import { searchFirebaseFunction } from '../../../firebase/index';

const path = 'https://f1a4257d658c481787cc581e18b9c97e.us-central1.gcp.cloud.es.io:9243/annotations/_search';

export async function searchElastic(request, sender, sendResponse) {

    // retrieveUrlQuery(request.url).then(async previousResults => {

    //     let from = (previousResults === null && request.msg == "SCROLL_ELASTIC" ? previousResults.from : 0);

    //     if (previousResults !== null && request.msg === "SCROLL_ELASTIC") {
    //         from = previousResults.from;
    //         request.from = previousResults.from;
    //         request = Object.assign({}, previousResults.userRequest, { msg: "SCROLL_ELASTIC" })
    //     }
    //     console.log("request", request)

    //     let bb = await searchBarQuery(request, "V3dWPY0dCiNbNqWaos2QU8KVhQB2", from)

    //     keyWrapper(search, {
    //         userSearch: request.userSearch,
    //         from: from,
    //         query: bb,
    //         url: request.url,
    //         successFunction: request.msg == "SCROLL_ELASTIC" ? paginationSuccess : searchBarSuccess
    //     })
    //         .then(e => {
    //             console.log("e", e)

    //             storeQueryForScroll2(request, e.data.hits.total.value, from)
    //             sendResponse({
    //                 response: {
    //                     results: e.data.hits.hits.map(h => h._source),
    //                     hits: e.data.hits.total.value
    //                 }
    //             })
    //         })
    //         .catch(function (err) {
    //             console.log("eer", err)
    //             // console.log("wrapper error", err.response.status)
    //         });

    // });


    retrieveUrlQuery(request.url).then(async previousResults => {

        let from = 0;

        if (previousResults !== null && request.msg === "SCROLL_ELASTIC") {
            if(previousResults.hits <= previousResults.from){
                sendResponse({});
                return;
            }
            
            from = previousResults.from;
            request = Object.assign({}, previousResults.userRequest, { msg: "SCROLL_ELASTIC" })
        }

        searchFirebaseFunction({userBody: request, from: from}).then(response => {
            let results = JSON.parse(response.data)
            storeQueryForScroll2(request, results.hits, from)
            sendResponse({ response: results });
        })
    });

    // sendResponse({ response: JSON.parse((await searchFirebaseFunction(request)).data)});
}

export async function groupElastic(request, sender, sendResponse) {
    keyWrapper(search, { query: groupQuery(request.payload.gid), url: request.payload.url, successFunction: groupSearchSuccess })
        .then(e => { console.log('sending response'); sendResponse({ response: e }) })
        .catch(function (err) {
            console.log("wrapper error", err.response.status)
        });
}



export async function searchElasticById(request, sender, sendResponse) {
    keyWrapper(search, { userSearch: null, query: searchByID(request.id), url: request.url, successFunction: paginationSuccess })
        .then(e => sendResponse({ response: e }))
        .catch(function (err) {
            console.log("wrapper error", err.response.status)
        });
}

export async function refreshContentUpdate(request, sender, sendResponse) {
    var query = '';
    retrieveUrlQuery(request.url)
        .then(function (query) {
            query.from = 0;
            keyWrapper(search, { userSearch: request.url, query: query, url: request.url, successFunction: refreshSuccess })
                .then(e => sendResponse({ response: e }))
                .catch(function (err) {
                    console.log("wrapper error", err.response.status)
                });
        })
        .catch(function (err) {
            console.log("Nothing was found", err);
        });
}

export async function removePaginationSearchCache(request) {
    removeQueryForScroll(request.url);
}

export function regenKey() {
    return new Promise((resolve, reject) => {
        getElasticApiKey().then(function (e) {
            chrome.storage.sync.set({
                'ElasticAPIKey': e,
            }, function () {
                resolve();
            });
        })
    });
}

export function keyWrapper(passedFunction, args, count = 0) {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(['ElasticAPIKey'], storedKey => {
            passedFunction(storedKey.ElasticAPIKey.data, args)
                .then(e => resolve(e))
                .catch(function (err) {
                    if (err.response.status === 401 && count <= 5) {
                        regenKey().then(e => keyWrapper(passedFunction, args, ++count));
                    }
                    else {
                        reject(err);
                    }
                });
        })
    });
}

export function findWhereMatched(res, value) {
    if (res["childAnchor"].map(anch => anch.anchor.toLowerCase().indexOf(value) >= 0)) return "Anchor Content";
    if (res["content"].toLowerCase().indexOf(value) >= 0) return "User Description";
    if (res["hostname"] !== undefined && res["hostname"].toLowerCase().indexOf(value) >= 0) return "Hostname";
    if (res["tags"] !== undefined && res["tags"].length !== 0 && res["tags"].indexOf(value) >= 0) return "Tag";
}

function searchByID(id) {
    return {
        "query": {
            "multi_match": {
                "query": id,
                "fields": ["_id", "SharedId"]
            }
        }
    }
}

function groupQuery(gid) {
    return {
        "query": {
            "term": {
                "groups": {
                    "value": gid
                }
            }
        }
    };
}

function inputQueryBuilder(userSearch) {
    return {
        "bool": {
            "should": [
                {
                    "multi_match": {
                        "query": userSearch,
                        "type": "phrase",
                        "fields": [
                            "childAnchor.anchor", "content", "tags", "hostname"
                        ],
                        "boost": 10
                    }
                },
                {
                    "multi_match": {
                        "query": userSearch,
                        "type": "most_fields",
                        "fields": [
                            "partialSearch"
                        ],
                        "fuzziness": "0"
                    }
                }
            ]
        }
    }
}

function getGroups(uid) {

    return new Promise((resolve, reject) => {

        getAllUserGroups(uid).get().then(function (snapshots) {
            let gids = []
            snapshots.forEach(snapshot => {
                gids.push(snapshot.data().gid)
            })
            console.log("SNAPS!", gids)
            resolve(gids);
        })
            .catch(function (error) {
                console.error('Error Getting Gids: ', error)
                reject(error)
            });
    });
}

function generateGroupPrivacyFilter(uid) {
    return getGroups(uid).then(gids => {
        // let gids = getgroups();

        return {
            "bool": {
                "should": [
                    {
                        "bool": {
                            "must": [
                                {
                                    "term": {
                                        "authorId": uid
                                    }
                                },
                                {
                                    "term": {
                                        "isPrivate": true
                                    }
                                }
                            ]
                        }
                    },
                    {
                        "term": {
                            "isPrivate": false
                        }
                    },
                    {
                        "terms": {
                            "groups": gids
                        }
                    }
                ]
            }
        }
    })

}

async function searchBarQuery(query, uid, from) {

    var searchObj = {
        "from": from,
        "size": 10,
        "query": {},
        "highlight": {}
    };

    searchObj.query = {
        "bool": {
            "filter": []
        }
    }

    searchObj.query.bool.filter.push(await generateGroupPrivacyFilter(uid));

    if (query.pageVisibility !== undefined && query.pageVisibility !== 'Global') {

        searchObj.query.bool.filter.push(
            query.pageVisibility === 'On Page' ?
                { "match": { "url": query.url } } :
                { "regexp": { "url": ".*" + query.hostname + ".*" } });
    }

    searchObj.query.bool.filter.push(inputQueryBuilder(query.userSearch));


    searchObj.highlight = {
        "require_field_match": false,
        "type": "plain",
        "order": "score",
        "phrase_limit": 2,
        "fragmenter": "simple",
        "number_of_fragments": 1,
        "fragment_size": query.userSearch.length > 100 ? query.userSearch.length : 100,
        "fields": {
            "content": {},
            "childAnchor.anchor": {},
            "partialSearch": {}
        }
    }
    return searchObj
}

String.prototype.indexOfEnd = function (string) {
    var io = this.indexOf(string);
    return io == -1 ? -1 : io + string.length;
}

export function findOffset(highlightString, sourceString) {
    var cleanString = highlightString.replace(/(<em>)|(<\/em>)/g, '');
    highlightString = sourceString.indexOf(cleanString) === 0 ? highlightString : "..." + highlightString;
    highlightString = sourceString.indexOfEnd(cleanString) === sourceString.length ? highlightString : highlightString + "...";
    return highlightString;
}

export function highlightOffsetMatch(hlElement, source) {
    for (var element in hlElement) {
        if (typeof hlElement[element] !== "undefined") {
            if (source.matchedAt === "Anchor Content") {
                const highlightString = hlElement[element][0];
                source.childAnchor.forEach(anch => { if (anch.anchor === highlightString) hlElement[element] = findOffset(highlightString, anch.anchor) })
            }
            else {
                hlElement[element] = findOffset(hlElement[element][0], source[element])
            }

        } else if (typeof source[element] !== "undefined") {
            hlElement[element] = source[element].substring(0, 30);
            hlElement[element] += hlElement[element].length !== source[element] ? "..." : "";
        }
    }

    return hlElement;
}

function storeQueryForScroll2(userRequest, total, from) {

    if (from < total) {
        var clone = Object.assign({}, userRequest, { msg: undefined });
        from += 10;
        console.log("yeah we adding", clone)

        chrome.storage.local.set({ [userRequest.url]: { userRequest, from, hits: total } });
    }
}

export function storeQueryForScroll(query, total, url) {
    if (typeof query.highlight !== "undefined") {
        delete query.highlight;
    }
    if (query.from < total) {
        query.from = query.from + 10;
    }
    chrome.storage.local.set({ [url]: query });
}

async function retrieveUrlQuery(url) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get([url], function (result) {
            if (typeof result === "undefined" || (Object.keys(result).length === 0 && result.constructor === Object)) {
                console.log("NULL!")
                resolve(null);
            }
            else {
                resolve(result[url]);
            }
            reject(null)
        });
    });
}

export function removeQueryForScroll(url) {
    chrome.storage.local.get([url], function (result) {
        if (typeof result === "undefined" || (Object.keys(result).length === 0 && result.constructor === Object)) {
        }
        else {
            chrome.storage.local.remove(url)
        }
    });
}

export function axiosWrapper(path, query, AuthStr, args, successFunc) {
    return new Promise((resolve, reject) => {
        axios.get(path,
            {
                params: {
                    source: JSON.stringify(query),
                    source_content_type: 'application/json'
                },
                'headers':
                {
                    'Authorization': AuthStr,
                    'Content-type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                }
            }).then((res) => {
                resolve(successFunc(res, args));
            })
            .catch((err) => {
                reject(err);
            });
    });
}

export function refreshSuccess(res, args) {
    var finalArray = [];

    if (res.data.hits.hits.length !== 0) {
        res.data.hits.hits.forEach(function (element) {
            var obj = element._source
            obj["id"] = element._id
            element._source["id"] = element._id

            finalArray.push(obj)
        });
    }
    return res;

}
export function paginationSuccess(res, args) {
    var finalArray = [];

    if (res.data.hits.hits.length !== 0) {
        // if (res.data.hits.total.value > 10) {
        //     storeQueryForScroll(args.query, res.data.hits.total.value, args.url)
        // }
        res.data.hits.hits.forEach(function (element) {
            var obj = element._source
            obj["id"] = element._id
            element._source["id"] = element._id

            finalArray.push(obj)
        });
    }
    return res;
}

export function groupSearchSuccess(res, args) {
    var finalArray = [];
    if (res.data.hits.hits.length !== 0) {
        if (res.data.hits.total.value > 10) {
            storeQueryForScroll(args.query, res.data.hits.total.value, args.url)
        }
        res.data.hits.hits.forEach(function (element) {
            var obj = element._source
            obj["id"] = element._id
            element._source["id"] = element._id

            finalArray.push(obj)
        });
    }
    return res;
}

export function searchBarSuccess(res, args) {

    var finalArray = [];
    var userSearch = args.userSearch
    if (res.data.hits.hits.length !== 0) {
        // if (res.data.hits.total.value > 10) {
        //     storeQueryForScroll(args.query, res.data.hits.total.value, args.url)
        // }
        res.data.hits.hits.forEach(function (element) {
            userSearch = userSearch.toLowerCase();
            element._source["matchedAt"] = findWhereMatched(element._source, userSearch)
            var obj = element._source
            obj["id"] = element._id
            obj["highlight"] = element.hasOwnProperty("highlight") ? highlightOffsetMatch(element.highlight, obj) : undefined;
            element._source["id"] = element._id

            finalArray.push(obj)
        });
    }
    return res;
}



export function search(key, args) {
    return new Promise((resolve, reject) => {
        var query = args.query;
        console.log("query!", query)
        const AuthStr = 'ApiKey ' + key;
        axiosWrapper(path, query, AuthStr, args, args.successFunction)
            .then(e => resolve(e))
            .catch(err => reject(err));
    });
}
