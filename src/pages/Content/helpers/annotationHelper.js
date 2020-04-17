import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './anchor-box.css';

const AnnotationAnchor = ({ div, idx }) => {
  return (
    <div
      className='anchor-box'
      id={idx}
      style={{
        top: div.top,
        left: div.left,
        width: div.width,
        height: div.height,
        zIndex: 100,
        position: 'absolute'
      }}></div>
  );
}

const Popover = ({ selection, range, removePopover }) => {
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setSelected(selection.toString());
  }, [selection]);

  const annotateButtonClickedHandler = (event) => {
    event.stopPropagation();
    if (selected) {
      const annotationContent = prompt('Enter annotation');
      if (annotationContent === null) {
        return;
      }
      let rect = range.getBoundingClientRect();
      const selectionAnchor = document.body.appendChild(document.createElement('div'));
      selectionAnchor.style.zIndex = '100';
      selectionAnchor.style.position = 'absolute';
      selectionAnchor.setAttribute('class', 'anchor-box');
      selectionAnchor.style.top = `${rect.top}px`;
      selectionAnchor.style.left = `${rect.left}px`;
      selectionAnchor.style.width = `${rect.width}px`;
      selectionAnchor.style.height = `${rect.height}px`;
      const divProps = {
        top: selectionAnchor.style.top,
        left: selectionAnchor.style.left,
        width: selectionAnchor.style.width,
        height: selectionAnchor.style.height
      };
      const annotationInfo = JSON.stringify({ anchor: selected, annotation: annotationContent, div: divProps });
      console.log(annotationInfo);

      chrome.runtime.sendMessage({
        msg: 'SAVE_ANNOTATED_TEXT',
        payload: {
          content: annotationInfo,
          url: window.location.href,
        },
      });
      removePopover();
    }
  };

  return (
    <div
      style={{
        background: 'gray',
        color: 'white',
        fontSize: 12,
        fontFamily: 'Arial',
        padding: 5,
        borderRadius: 5,
        cursor: 'pointer',
      }}
      onClick={annotateButtonClickedHandler}
    >
      Save
    </div>
  );
};



/* Set up popover box anchor */
const popOverAnchor = document.body.appendChild(document.createElement('div'));
popOverAnchor.style.zIndex = '2147483647';
popOverAnchor.style.position = 'fixed';
popOverAnchor.setAttribute('id', 'popover-box');

const removePopover = () => {
  try {
    ReactDOM.unmountComponentAtNode(popOverAnchor);
  } catch (e) {
    // console.log(e);
  }
};

function displayPopoverBasedOnRectPosition(rect, props) {
  popOverAnchor.top = '0px';
  popOverAnchor.style.left = `0px`;

  ReactDOM.render(
    <Popover removePopover={removePopover} {...props} />,
    popOverAnchor
  );

  // adjusting position of popover box after mounting
  popOverAnchor.style.top = `${rect.bottom + 5 + window.scrollY}px`;
  let leftPosition = Math.floor(
    rect.left + rect.width - popOverAnchor.clientWidth
  );
  leftPosition = leftPosition >= 10 ? leftPosition : 10;
  popOverAnchor.style.left = `${leftPosition}px`;
}

document.addEventListener('mouseup', (event) => {
  const selection = window.getSelection();
  if (selection.type === 'Range') {
    const range = selection.getRangeAt(0);
    console.log(range);
    const rect = range.getBoundingClientRect();
    // console.log(rect);
    displayPopoverBasedOnRectPosition(rect, { selection, range });
  } else {
    if (!popOverAnchor.contains(event.target)) {
      removePopover();
    }
  }
});

function displayAnnotationAnchor(div, idx) {
  const annotationAnchor = document.body.appendChild(document.createElement('div'));
  ReactDOM.render(<AnnotationAnchor div={div} id={idx} />, annotationAnchor);
}

chrome.runtime.sendMessage(
  {
    msg: 'REQUEST_ANNOTATED_TEXT_ON_THIS_PAGE',
    payload: {
      url: window.location.href,
    },
  },
  (data) => {
    const { annotationsOnPage } = data;
    if (annotationsOnPage.length) {
      annotationsOnPage.forEach((anno) => {
        displayAnnotationAnchor(anno.div, anno.idx);
      });
    }
  }
);
