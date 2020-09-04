import axios from 'axios';
import { getElasticApiKey } from '../../../firebase/index';

const path = 'https://f1a4257d658c481787cc581e18b9c97e.us-central1.gcp.cloud.es.io:9243/annotations/_search';

function regenKey() {
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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.msg === 'SEARCH_ELASTIC') {
        console.log("SEARCH_ELASTIC")
        keyWrapper(search, { userSearch: request.userSearch, query: searchBarQuery(request.userSearch, true), url: request.url, successFunction: searchBarSuccess })
            .then(e => sendResponse({ response: e }))
            .catch(function (err) {
                console.log("wrapper error", err.response.status)
            });
    }
    else if (request.msg === 'SCROLL_ELASTIC') {
        console.log("SCROLL_ELASTIC")
        var query = '';
        retrieveQueryForScroll(request.url)
            .then(function (query) {
                keyWrapper(search, { userSearch: request.url, query: query, url: request.url, successFunction: paginationSuccess })
                    .then(e => sendResponse({ response: e }))
                    .catch(function (err) {
                        console.log("wrapper error", err.response.status)
                    });
            })
            .catch(function (err) {
                console.log("Nothing was found", err);
            });
    }
});

function keyWrapper(passedFunction, args) {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(['ElasticAPIKey'], storedKey => {
            console.log("this is the key", storedKey);
            passedFunction(storedKey.ElasticAPIKey.data, args)
                .then(e => resolve(e))
                .catch(function (err) {
                    if (err.response.status === 401) {
                        regenKey().then(e => keyWrapper(passedFunction, args));
                    }
                    else {
                        reject(err);
                    }
                });
        })
    });
}

function findWhereMatched(res, value) {
    if (res["anchorContent"].toLowerCase().indexOf(value) >= 0) return "Anchor Content";
    if (res["content"].toLowerCase().indexOf(value) >= 0) return "User Description";
    if (res["hostname"] !== undefined && res["hostname"].toLowerCase().indexOf(value) >= 0) return "Hostname";
    if (res["tags"].length !== 0 && res["tags"].indexOf(value) >= 0) return "Tag";
}

function searchBarQuery(userSearch) {
    return (
        {
            "from": 0,
            "size": 10,
            "query": {
                "bool": {
                    "should": [
                        {
                            "multi_match": {
                                "query": userSearch,
                                "type": "phrase",
                                "fields": [
                                    "content", "tags", "anchorContent"
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
            },
            "highlight": {
                "require_field_match": false,
                "type": "plain",
                "order": "score",
                "phrase_limit": 2,
                "fragmenter": "simple",
                "number_of_fragments": 1,
                "fragment_size": userSearch.length > 100 ? userSearch.length : 100,
                "fields": {
                    "content": {},
                    "anchorContent": {},
                    "partialSearch": {}
                }
            }
        });
}

String.prototype.indexOfEnd = function (string) {
    var io = this.indexOf(string);
    return io == -1 ? -1 : io + string.length;
}

function findOffset(highlightString, sourceString) {
    var cleanString = highlightString.replace(/(<em>)|(<\/em>)/g, '');
    highlightString = sourceString.indexOf(cleanString) === 0 ? highlightString : "..." + highlightString;
    highlightString = sourceString.indexOfEnd(cleanString) === sourceString.length ? highlightString : highlightString + "...";
    return highlightString;
}

function highlightOffsetMatch(hlElement, source) {
    for (var element in hlElement) {
        if (typeof hlElement[element] !== "undefined") {
            hlElement[element] = findOffset(hlElement[element][0], source[element])
        } else if (typeof source[element] !== "undefined") {
            hlElement[element] = source[element].substring(0, 30);
            hlElement[element] += hlElement[element].length !== source[element] ? "..." : "";
        }
    }

    return hlElement;
}

function storeQueryForScroll(query, total, url) {
    console.log("test query", query.from, url)
    if (typeof query.highlight !== "undefined") {
        delete query.highlight;
    }
    if (query.from < total) {
        query.from = query.from + 10;
    }
    chrome.storage.local.set({ [url]: query });
}

function retrieveQueryForScroll(url) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get([url], function (result) {
            if (typeof result === "undefined" || (Object.keys(result).length === 0 && result.constructor === Object)) {
                console.log("reject here baby");
                reject(null);
            }
            else {
                console.log("this is the query for url", result[url])
                resolve(result[url]);
            }
        });
    });
}

function axiosWrapper(path, query, AuthStr, args, successFunc) {
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
                console.log('this is the err', err);
                reject(err);
            });
    });
}

function paginationSuccess(res, args) {
    var finalArray = [];

    console.log("this is the res", res.data)
    if (res.data.hits.hits.length !== 0) {
        if (res.data.hits.total.value > 10) {
            storeQueryForScroll(args.query, res.data.hits.total.value, args.url)
        }
        res.data.hits.hits.forEach(function (element) {
            console.log(element._source)
            var obj = element._source
            obj["id"] = element._id
            element._source["id"] = element._id

            finalArray.push(obj)
        });
    }
    console.log("Final Array", finalArray)
    return res;

}

function searchBarSuccess(res, args) {
    var finalArray = [];
    var userSearch = args.userSearch
    console.log("this is the res", res.data)
    if (res.data.hits.hits.length !== 0) {
        if (res.data.hits.total.value > 10) {
            storeQueryForScroll(args.query, res.data.hits.total.value, args.url)
        }
        res.data.hits.hits.forEach(function (element) {
            console.log(element._source)
            userSearch = userSearch.toLowerCase();
            element._source["matchedAt"] = findWhereMatched(element._source, userSearch)
            var obj = element._source
            obj["id"] = element._id
            obj["highlight"] = element.hasOwnProperty("highlight") ? highlightOffsetMatch(element.highlight, obj) : undefined;
            element._source["id"] = element._id

            finalArray.push(obj)
        });
    }
    console.log("Final Array", finalArray)
    return res;
}

function search(key, args) {
    return new Promise((resolve, reject) => {
        var query = args.query;
        console.log("this is teh query", query);
        const AuthStr = 'ApiKey ' + key;
        axiosWrapper(path, query, AuthStr, args, args.successFunction)
            .then(e => resolve(e))
            .catch(err => reject(err));
    });
}