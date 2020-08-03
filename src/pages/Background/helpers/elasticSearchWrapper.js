import axios from 'axios';
import { getElasticApiKey } from '../../../firebase/index';

const path = 'https://f1a4257d658c481787cc581e18b9c97e.us-central1.gcp.cloud.es.io:9243/annotations/_search?size=50';

function getAuthKeyElastic() {
    return
}


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("SEARCH ELASTIC RR")
    if (request.msg === 'SEARCH_ELASTIC') {
        keyWrapper(search, request.userSearch).then(e => sendResponse({ response: e }));
        //sendResponse({ response: keyWrapper(search, request.userSearch) });
    }
});

function keyWrapper(passedFunction, args) {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(['ElasticAPIKey'], storedKey => {
            console.log("this is the key", storedKey);
            passedFunction(storedKey.ElasticAPIKey.data, args).then(e => resolve(e));
        })
    });
}

function search(key, userSearch) {
    return new Promise((resolve, reject) => {
        var query = {
            "query": {
                "match_phrase": {
                    "anchorContent": userSearch
                },
                "match_phrase": {
                    "content": userSearch
                },
            }
        };
        console.log("in test run")
        const AuthStr = 'ApiKey ' + key;
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
                var finalArray = [];
                console.log("this is the res")
                if (res.data.hits.hits.length !== 0) {
                    res.data.hits.hits.forEach(function (element) {
                        var obj = element._source
                        obj["id"] = element._id
                        finalArray.push(obj)
                    });
                }
                console.log(res);
                console.log("this is the res array", finalArray)
                resolve(finalArray);
            })
            .catch((err) => {
                console.log('err', err);
                reject(err);
            });;
    });
}