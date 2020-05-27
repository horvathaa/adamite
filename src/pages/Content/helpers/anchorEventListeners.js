
//import './AnchorEngine/AnchorCreate';
import { updateXpaths } from './AnchorEngine/AnchorDestroy';
import { highlightRange } from './AnchorEngine/AnchorHighlight';
import { createAnnotation } from './AnchorEngine/AnchorCreate';


chrome.runtime.sendMessage(
    {
        msg: 'REQUEST_ANNOTATED_TEXT_ON_THIS_PAGE',
        payload: {
            url: window.location.href,
        },
    },
    data => {
        const { annotationsOnPage } = data;
        if (annotationsOnPage.length) {
            annotationsOnPage.reverse().forEach(anno => highlightRange(anno));
        }
    }
);

document.addEventListener('mouseup', event => {
    createAnnotation();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    if (request.msg === 'ANNOTATION_DELETED_ON_PAGE') {
        let collection = document.getElementsByName(request.id);
        console.log("COLLECTION", collection)
        updateXpaths(collection, request.id)
        // while (collection[0] !== undefined) {
        //   var parent = collection[0].parentNode;
        //   $(collection[0]).contents().unwrap();
        //   parent.normalize();
        // }
    }
    else if (request.msg === 'ANNOTATION_ADDED') {
        request.newAnno.content = request.newAnno.annotation;
        highlightRange(request.newAnno);
    }

    else if (request.msg === 'DELIVER_FILTERED_ANNOTATION_TAG' && request.from === 'background') {
        window.postMessage({ type: 'FROM_CONTENT', value: request.payload.response }, "*");
    }

});
