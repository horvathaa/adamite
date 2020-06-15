import '../../assets/img/Adamite.png';
import '../../assets/img/icon-128.png';
import './helpers/authHelper';
import './helpers/sidebarHelper';
import { clean } from './helpers/objectCleaner';
import {
  getAllAnnotationsByUrl,
  createAnnotation,
  updateAnnotationById,
  getAnnotationsAcrossSite
} from '../../firebase/index';


let unsubscribeAnnotations = null;
var pageannotationsActive = [];
let annotationsAcrossWholeSite = [];

const broadcastAnnotationsUpdated = (message, annotations) => {
  chrome.runtime.sendMessage({
    msg: message,
    from: 'background',
    payload: annotations,
  });
};

const broadcastAnnotationsUpdatedTab = (message, annotations, tabId) => {
  chrome.tabs.query({ active: true }, tabs => {
    console.log("here are the tabs you cuck", tabs)
    chrome.tabs.sendMessage(
      tabId,
      {
        msg: message,
        from: 'background',
        payload: annotations,
      }
    );
  });
};

function promiseToComeBack(url) {
  pageannotationsActive.push({
    url: url,
    annotations: null,
    timeout: 500,
    unsubscribe: null
  });
  return new Promise((resolve, reject) => {
    resolve(getAllAnnotationsByUrl(url).onSnapshot(querySnapshot => {
      let annotations = [];
      querySnapshot.forEach(snapshot => {
        annotations.push({
          id: snapshot.id,
          ...snapshot.data(),
        });
      });
      var pos = pageannotationsActive.map(function (e) { return e.url; }).indexOf(url);
      pageannotationsActive[pos].annotations = annotations;
      broadcastAnnotationsUpdated("CONTENT_UPDATED", annotations)
      chrome.tabs.query({}, tabs => {

        tabs = tabs.filter(e => e.url === pageannotationsActive[pos].url)
        tabs.forEach(function (tab) {
          chrome.tabs.sendMessage(tab.id, {
            msg: 'REFRESH_HIGHLIGHTS',
            payload: annotations,
          });
        });
        console.log("these are changed tabs", tabs)
      });
    }));
  });
}



chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg === 'REQUEST_TAB_URL') {
    sendResponse({ url: sender.tab.url });
  }
  else if (request.msg === 'GET_ANNOTATIONS_PAGE_LOAD') {
    var findActiveUrl = pageannotationsActive.filter(e => e.url === request.url)
    if (findActiveUrl.length !== 0) {
      broadcastAnnotationsUpdatedTab("CONTENT_UPDATED", findActiveUrl[0].annotations, sender.tab.id);
      broadcastAnnotationsUpdatedTab("HIGHLIGHT_ANNOTATIONS", findActiveUrl[0].annotations, sender.tab.id);
    }
    else {
      promiseToComeBack(request.url)
        .then(function (e) {
          pageannotationsActive[pageannotationsActive.length - 1].unsubscribe = e;
        });
    }
  }
  else if (request.msg === 'SAVE_ANNOTATED_TEXT') {
    let { url, content } = request.payload;
    const hostname = new URL(url).hostname;

    // firebase: in action
    //content = JSON.parse(content); // consider just pass content as an object
    createAnnotation({
      taskId: null,
      SharedId: null,
      AnnotationContent: content.annotation,
      AnnotationAnchorContent: content.anchor,
      AnnotationAnchorPath: null,
      offsets: content.offsets,
      xpath: content.xpath,
      AnnotationType: content.annotationType, // could be other types (string)
      url,
      hostname,
      AnnotationTags: content.tags,
      childAnchor: []
    }).then(value => {
      sendResponse({
        msg: 'DONE',
        value: value.id
      });
    });
  } else if (request.from === 'content' && request.msg === 'SAVE_NEW_ANCHOR') {
    let { newAnno, xpath, url, anchor, offsets } = request.payload;
    // console.log('somewhow made it here', newAnno, xpath);
    createAnnotation({
      taskId: null,
      childAnchor: null,
      AnnotationContent: newAnno.content,
      AnnotationType: newAnno.type,
      SharedId: newAnno.sharedId,
      xpath: xpath,
      url: url,
      AnnotationTags: newAnno.tags,
      AnnotationAnchorContent: anchor,
      offsets: offsets
    }).then(value => {
      console.log(value);
      let highlightObj = {
        id: value.id,
        content: newAnno.content,
        xpath: xpath
      }
      // chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
      //   chrome.tabs.sendMessage(
      //     tabs[0].id,
      //     {
      //       msg: 'ANNOTATION_ADDED',
      //       newAnno: highlightObj,
      //     }
      //   );
      // });
    });
  } else if (request.from === 'content' && request.msg === 'CONTENT_SELECTED') {
    chrome.tabs.sendMessage(sender.tab.id, {
      msg: 'CONTENT_SELECTED',
      from: 'background',
      payload: request.payload,
    });
  }
  else if (request.from === 'content' && request.msg === 'REQUEST_PAGINATED_ACROSS_SITE_ANNOTATIONS') {
    const { hostname, url } = request.payload;
    let cursor = undefined;
    if (hostname in annotationsAcrossWholeSite) {
      cursor = annotationsAcrossWholeSite[hostname].cursor;
    }
    else {
      annotationsAcrossWholeSite[hostname] = { cursor: undefined, annotations: [] };
    }
    if (cursor === 'DONE') {
      sendResponse({ annotations: annotationsAcrossWholeSite[hostname].annotations });
      return;
    }
    if (cursor !== null && cursor !== undefined) {
      //do the below query but with startAfter 
      getAnnotationsAcrossSite(hostname).startAfter(annotationsAcrossWholeSite[hostname].cursor).get().then(function (doc) {
        // lastVisible.push({ cursor: doc.docs[doc.docs.length - 1], hostname: hostname });
        let currPage = pageannotationsActive.filter(page => page.url === url);
        // annotationsToTransmit.push(...currPage[0].annotations);
        annotationsAcrossWholeSite[hostname].annotations.push(...currPage[0].annotations);
        // console.log('current page annos', currPage[0].annotations);
        // annotationsToTransmit.push(...doc.docs.data());
        // console.log('page', currPage);
        // console.log('doc', doc);
        // console.log('docs', doc.docs);
        if (!doc.empty) {
          doc.docs.forEach(anno => {
            // console.log('anno im pushin', anno.data());
            annotationsAcrossWholeSite[hostname].annotations.push({ id: anno.id, ...anno.data() });
            // if (anno.data().url !== url) {
            //   annotationsToTransmit.push({ id: anno.id, ...anno.data() });
            // }
          })
        }
        else {
          // console.log('reached end of pagination - send stored annos');
          annotationsAcrossWholeSite[hostname].cursor = 'DONE';
          sendResponse({ annotations: annotationsAcrossWholeSite[hostname].annotations });
          return;

        }
        // // annotationsToTransmit.concat(doc.docs);
        // let setter = new Set(annotationsToTransmit, annotationsAcrossWholeSite[hostname].annotations);
        // // console.log('set', setter);
        // annotationsToTransmit = Array.from(setter);
        // console.log('annos', annotationsToTransmit);
        // this isn't a perfect check - if the set of annotations happens to be divisible by 15  we will get one last
        // read from the query with a length of 15 but the next query will return 0
        if (doc.docs.length < 15) {
          annotationsAcrossWholeSite[hostname].cursor = 'DONE';
        }
        else {
          annotationsAcrossWholeSite[hostname].cursor = doc.docs[doc.docs.length - 1];
        }
        // console.log('donezo, sending response', annotationsAcrossWholeSite[hostname]);
        sendResponse({ annotations: annotationsAcrossWholeSite[hostname].annotations });
        // annotationsToTransmit = [];
      }).catch(function (error) {
        console.log('could not get doc: ', error);
      });
    }
    else {
      getAnnotationsAcrossSite(hostname).get().then(function (doc) {
        let currPage = pageannotationsActive.filter(page => page.url === url);
        // annotationsToTransmit.push(...currPage[0].annotations);
        annotationsAcrossWholeSite[hostname].annotations.push(...currPage[0].annotations);
        // console.log('current page annos', currPage[0].annotations);
        // // annotationsToTransmit.push(...doc.docs.data());
        // // console.log('page', currPage);
        // console.log('doc', doc);
        // console.log('docs', doc.docs);
        if (!doc.empty) {
          doc.docs.forEach(anno => {
            // console.log('anno im pushin', anno.data());
            annotationsAcrossWholeSite[hostname].annotations.push({ id: anno.id, ...anno.data() });
            // if (anno.data().url !== url) {
            //   annotationsToTransmit.push({ id: anno.id, ...anno.data() });
            // }
          })
        }
        else {
          // console.log('reached end of pagination - send stored annos');
          annotationsAcrossWholeSite[hostname].cursor = 'DONE';
          sendResponse({ annotations: annotationsAcrossWholeSite[hostname].annotations });
          return;
        }
        // let setter = new Set(annotationsToTransmit, annotationsAcrossWholeSite[hostname].annotations);
        // annotationsToTransmit = Array.from(setter);
        if (doc.docs.length < 15) {
          annotationsAcrossWholeSite[hostname].cursor = 'DONE';
        }
        else {
          annotationsAcrossWholeSite[hostname].cursor = doc.docs[doc.docs.length - 1];
        }
        // console.log('donezo, sending response', annotationsAcrossWholeSite[hostname]);
        sendResponse({ annotations: annotationsAcrossWholeSite[hostname].annotations });
        // annotationsToTransmit = [];
      }).catch(function (error) {
        console.log('could not get doc: ', error);
      });

    }
    // need to think about use case where user's current URL has the majority of annotations on it - pagination will result
    // in many duplicate annotations that need to be filtered out and then keep reading to find unique annotations?
    // it seems like we need to do the comparison locally which sucks ass fuck u firebase


  }
  // else if (request.msg === 'REQUEST_ANNOTATED_TEXT_ON_THIS_PAGE') {
  //   const { url } = request.payload;
  //   //console.log("REQUEST ANNOTATED TEXT ON THIS PAGE", annotations)
  //   // var test = getAllAnnotationsByUrlCache(url).then(function (cacheAnno) {
  //   //   var test = cacheAnno.filter(e => e.url === url);
  //   //   const annotationsOnPage = test // can use this later so we get all annotations that match our filter criterias
  //   //   console.log("THIS IS HIGHLIGHTS", test)
  //   //   //sendResponse({ annotationsOnPage });
  //   // });

  //   // const annotationsOnPage = test // can use this later so we get all annotations that match our filter criterias
  //   // sendResponse({ annotationsOnPage });
  // } 
  else if (request.msg === 'UPDATE_XPATH_BY_IDS') {
    request.payload.toUpdate.forEach(e =>
      updateAnnotationById(
        e.id, clean({
          "xpath.start": e.xpath.start,
          "xpath.startOffset": e.xpath.startOffset,
          "xpath.end": e.xpath.end,
          "xpath.endOffset": e.xpath.endOffset,
        }),
      )
    );
  } else if (request.msg === 'LOAD_EXTERNAL_ANCHOR' && request.from === 'content') {
    chrome.tabs.create({ url: request.payload });
  }
  return true;
});
