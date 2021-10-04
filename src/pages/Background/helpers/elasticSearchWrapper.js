import { searchFirebaseFunction } from '../../../firebase/index';

export async function searchElastic(request, sender, sendResponse) {
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
}

export async function removePaginationSearchCache(request) {
    removeQueryForScroll(request.url);
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

function storeQueryForScroll2(userRequest, total, from) {
    if (from < total) {
        from += 10;
        chrome.storage.local.set({ [userRequest.url]: { userRequest, from, hits: total } });
    }
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

