import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './anchor-box.css';
import { SIDEBAR_IFRAME_ID } from '../../../shared/constants';

function anchorClick(e) {
  const target = e.target.id;
  chrome.runtime.sendMessage(
    {
      msg: 'ANCHOR_CLICKED',
      from: 'content',
      payload: {
        url: window.location.href,
        target: target
      },
    });
}

const AnnotationAnchor = ({ div, id }) => {
  return (
    <div
      className="anchor-box"
      id={id}
      style={{
        top: div.top,
        left: div.left,
        width: div.width,
        height: div.height,
        zIndex: 100,
        position: 'absolute',
      }}
      onClick={(e) => anchorClick(e)}
    ></div>
  );
};

const alertBackgroundOfNewSelection = (selection, rect, offset) => {
  // supporting creation of annotations in sidebar
  chrome.runtime.sendMessage({
    msg: 'CONTENT_SELECTED',
    from: 'content',
    payload: {
      selection,
      rect,
      offset,
    },
  });
};

document.addEventListener('mouseup', event => {
  const selection = window.getSelection();
  if (selection.type === 'Range') {
    const rect = selection.getRangeAt(0).getBoundingClientRect();
    const offset = window.scrollY;
    alertBackgroundOfNewSelection(selection.toString(), rect, offset);
  }

  if (selection.toString().trim().length === 0) {
    alertBackgroundOfNewSelection(null, null);
  }
});

function displayAnnotationAnchor(div, id) {
  const annotationAnchor = document.body.appendChild(
    document.createElement('div')
  );
  ReactDOM.render(<AnnotationAnchor div={div} id={id} />, annotationAnchor);
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
    console.log(annotationsOnPage);
    if (annotationsOnPage.length) {
      annotationsOnPage.forEach(anno => {
        displayAnnotationAnchor(anno.div, anno.id);
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
        displayAnnotationAnchor(mostRecentAnno.div, mostRecentAnno.id);
      }
    );
  }
});
