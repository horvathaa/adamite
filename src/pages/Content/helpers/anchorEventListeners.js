
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
        updateXpaths(collection, request.id)
    }
    else if (request.msg === 'ANNOTATION_FOCUS_ONCLICK') {
        var findSpan = document.getElementsByName(request.id);
        if (findSpan.length === 0) {
            return;
        }
        findSpan[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        //findSpan.forEach(e => e.style.backgroundColor = '#B0B65B')
    }
    else if (request.msg === 'ANNOTATION_FOCUS') {
        var findSpan = document.getElementsByName(request.id);
        if (findSpan.length === 0) {
            return;
        }
        findSpan.forEach(e => e.style.backgroundColor = '#7cce7299');
    }
    else if (request.msg === 'ANNOTATION_DEFOCUS') {
        var findSpan = document.getElementsByName(request.id);
        if (findSpan.length === 0) {
            return;
        }
        findSpan.forEach(e => e.style.backgroundColor = null)
    }
    else if (request.msg === 'ANNOTATION_ADDED') {
        request.newAnno.content = request.newAnno.annotation;
        highlightRange(request.newAnno);
    }

    else if (request.msg === 'DELIVER_FILTERED_ANNOTATION_TAG' && request.from === 'background') {
        window.postMessage({ type: 'FROM_CONTENT', value: request.payload.response }, "*");
    }

});
