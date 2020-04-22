import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './anchor-box.css';
import { SIDEBAR_IFRAME_ID } from '../../../shared/constants';

const AnnotationAnchor = ({ div, idx }) => {
  return (
    <div
      className="anchor-box"
      id={idx}
      style={{
        top: div.top,
        left: div.left,
        width: div.width,
        height: div.height,
        zIndex: 100,
        position: 'absolute',
      }}
    ></div>
  );
};

const alertBackgroundOfNewSelection = (selection, rect) => {
  // supporting creation of annotations in sidebar
  chrome.runtime.sendMessage({
    msg: 'CONTENT_SELECTED',
    from: 'content',
    payload: {
      selection,
      rect,
    },
  });
};

document.addEventListener('mouseup', event => {
  const selection = window.getSelection();
  if (selection.type === 'Range') {
    const rect = selection.getRangeAt(0).getBoundingClientRect();
    alertBackgroundOfNewSelection(selection.toString(), rect);
  }

  if (selection.toString().trim().length === 0) {
    alertBackgroundOfNewSelection(null, null);
  }
});

function displayAnnotationAnchor(div, idx) {
  const annotationAnchor = document.body.appendChild(
    document.createElement('div')
  );
  ReactDOM.render(<AnnotationAnchor div={div} id={idx} />, annotationAnchor);
}

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
      annotationsOnPage.forEach(anno => {
        displayAnnotationAnchor(anno.div, anno.idx);
      });
    }
  }
);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg === 'ANNOTATIONS_UPDATED' && request.from === 'background') {
    chrome.runtime.sendMessage(
      {
        msg: 'REQUEST_ANNOTATED_TEXT_ON_THIS_PAGE',
        payload: {
          url: window.location.href,
        },
      },
      data => {
        const { annotationsOnPage } = data;
        const mostRecentAnno = annotationsOnPage[annotationsOnPage.length - 1];
        displayAnnotationAnchor(mostRecentAnno.div, mostRecentAnno.idx);
      }
    );
  }
});
