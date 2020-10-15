import React from 'react';
import ReactDOM from 'react-dom';
import './groupModal.css';

chrome.runtime.onMessage.addListener((request) => {
    if (request.msg === 'CREATE_GROUP' && request.from === 'background') { renderModal(request.owner); }
    else if (request.msg === 'SHOW_GROUP' && request.from === 'background') { console.log('showing modal'); showModal(); }
});

const isVisible = elem => !!elem && !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length)

function hideOnClickOutside(element) {
    const outsideClickListener = event => {
        if (element.contains(event.target) && isVisible(element)) { // or use: event.target.closest(selector) === null                      console.log("this is happening")
            removeClickListener()
            element.classList.add('w3-animate-show');
            // element.close()
            chrome.runtime.sendMessage({
                msg: 'GROUP_MODAL_CLOSED',
                from: 'helper'
            });
        }
        else {
            console.log("outsides", event, event.target, isVisible(element), element.contains(event.target))
        }
    }
    // const removeAnimations = () => {
    //     document.removeEventListener('animationend', outsideClickListener)
    // }

    const removeClickListener = () => {
        document.removeEventListener('click', outsideClickListener)
    }
    console.log("adding element", element)
    document.addEventListener('click', outsideClickListener)
    element.addEventListener('animationend', function () {
        if (this.classList.contains('w3-animate-show')) {
            // this.style.display = 'none';
            this.classList.remove('w3-animate-show')
            element.close()
        }
    });
}

const showModal = () => {
    const dialog = document.querySelector("dialog");
    dialog.showModal();

    hideOnClickOutside(dialog);
}

const renderModal = (owner) => {
    let modal = document.createElement("dialog");
    modal.classList.add("new-group-modal");
    document.body.appendChild(modal);
    modal.setAttribute('id', 'blurg');
    // console.log("rendering")
    const App = (
        <React.Fragment>

            <iframe className="iframe-modal-wrapper"

                src={chrome.extension.getURL('groupmodal.html')
                    + "?uid=" + owner.uid
                    + "&email=" + owner.email
                    + "&userName=" + owner.userName
                }
            />
        </React.Fragment>

    );
    ReactDOM.render(App, modal);
}


