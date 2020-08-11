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
    console.log("SEARCH ELASTIC RR")
    if (request.msg === 'SEARCH_ELASTIC') {
        keyWrapper(search, { userSearch: request.userSearch, query: searhBarQuery(request.userSearch) })
            .then(e => sendResponse({ response: e }))
            .catch(function (err) {
                console.log("wrapper error", err.response.status)
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

function searhBarQuery(userSearch) {
    return (
        {
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
            }
        });
}


function search(key, args) {
    return new Promise((resolve, reject) => {
        var userSearch = args.userSearch;
        var query = args.query;
        const AuthStr = 'ApiKey ' + key;
        axios.get(path + '?size=10',
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
                var finalArray = [];
                console.log("this is the res")
                if (res.data.hits.hits.length !== 0) {
                    res.data.hits.hits.forEach(function (element) {
                        console.log(element._source)
                        userSearch = userSearch.toLowerCase();
                        element._source["matchedAt"] = findWhereMatched(element._source, userSearch)
                        var obj = element._source
                        obj["id"] = element._id
                        element._source["id"] = element._id

                        finalArray.push(obj)
                    });
                }
                console.log("Final Array", finalArray)
                resolve(res);
            })
            .catch((err) => {
                console.log('this is the err', err);
                reject(err);
            });;
    });
}