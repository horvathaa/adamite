import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

const Popover = ({ selection, removePopover }) => {
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setSelected(selection.toString());
  }, [selection]);

  const annotateButtonClickedHandler = (event) => {
    event.stopPropagation();
    if (selected) {
      const annotationContent = prompt('Enter annotation');
      const annotationPair = JSON.stringify({ [selected]: annotationContent });
      chrome.runtime.sendMessage({
        msg: 'SAVE_ANNOTATED_TEXT',
        payload: {
          content: annotationPair,
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
    const rect = selection.getRangeAt(0).getBoundingClientRect();
    displayPopoverBasedOnRectPosition(rect, { selection });
  } else {
    if (!popOverAnchor.contains(event.target)) {
      removePopover();
    }
  }
});

chrome.runtime.sendMessage(
  {
    msg: 'REQUEST_ANNOTATED_TEXT_ON_THIS_PAGE',
    payload: {
      url: window.location.href,
    },
  },
  (data) => {
    const { annotationsOnPage } = data;
    let toDisplay = '';
    toDisplay += `There are ${annotationsOnPage.length} annotated text on this page.`;
    if (annotationsOnPage.length) {
      toDisplay += ' They are:\n';
      annotationsOnPage.forEach((anno) => {
        toDisplay += anno;
      });
    }
    console.log(toDisplay);
  }
);
