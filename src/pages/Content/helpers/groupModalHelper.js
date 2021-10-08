import React from 'react';
import ReactDOM from 'react-dom';
import './groupModal.css';
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function toastRenderWrapper(message, closeModal=false) {
    let positionString = "";
    chrome.storage.sync.get(['sidebarOnLeft'], result => {
        if (result.sidebarOnLeft) {
            positionString = "top-right";
        }
        else {
            positionString = "top-left";
        }
        toast.warning(message, {
            position: "top-center",
            autoClose: false,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: false,
            progress: undefined,
        });
        let modal = document.createElement("div");
        modal.classList.add("success-notif-div");
        document.body.appendChild(modal);
        const toastModal = <ToastContainer
            position="top-center"
            autoClose={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            transition={Slide}
            pauseOnFocusLoss
            draggable={false}
        />;
        ReactDOM.render(toastModal, modal);
    });
    console.log("RENDERING")

    if(closeModal){

        chrome.runtime.sendMessage({
            msg: 'GROUP_MODAL_CLOSED',
            from: 'helper'
        });

        const dialogEl = document.getElementById('adamite-group-modal');
        dialogEl.classList.remove("new-group-modal-shown")
        dialogEl.classList.add('new-group-modal-hidden');
        dialogEl.close();
    }
}

chrome.runtime.onMessage.addListener((request) => {
    if (request.msg === 'CREATE_GROUP' && request.from === 'background') { renderModal(request.owner); }
    else if (request.msg === 'SHOW_GROUP' && request.from === 'background') { showModal(); }
    else if (request.msg === 'HIDE_GROUP' && request.from === 'background') { hideModal(); }
    else if (request.msg === 'GROUP_CREATE_SUCCESS' && request.from === 'background') {
        toastRenderWrapper('Successfully created group!', true);
    }
    else if (request.msg === 'GROUP_UPDATE_SUCCESS' && request.from === 'background') {
        toastRenderWrapper('Successfully updated group!', true);
    }
    else if (request.msg === 'GROUP_DELETE_SUCCESS' && request.from === 'background') {
        toastRenderWrapper('Deleted group', true);
    }
    else if (request.msg === 'GROUP_CREATE_DUPLICATE' && request.from === 'background') {
        toastRenderWrapper('DUPLICATE!!!!')
    }
});

const isVisible = elem => !!elem && !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length)

function hideOnClickOutside(element) {
    const outsideClickListener = event => {
        if (element.contains(event.target) && isVisible(element)) {
            removeClickListener()
            element.classList.add('w3-animate-show');
            chrome.runtime.sendMessage({
                msg: 'GROUP_MODAL_CLOSED',
                from: 'helper'
            });
        }
        // else {
        //     console.log("outsides", event, event.target, isVisible(element), element.contains(event.target))
        // }
    }
    // const removeAnimations = () => {
    //     document.removeEventListener('animationend', outsideClickListener)
    // }

    const removeClickListener = () => {
        document.removeEventListener('click', outsideClickListener)
    }
    // console.log("adding element", element)
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
    const dialog = document.getElementById("adamite-group-modal");
    if (dialog.classList.contains('new-group-modal-hidden')) {
        dialog.classList.remove("new-group-modal-hidden")
        dialog.classList.add('new-group-modal-shown');
    }
    dialog.showModal();

    hideOnClickOutside(dialog);
}

const hideModal = () => {
    const dialog = document.getElementById('group-modal');
    if (dialog.classList.contains('new-group-modal-shown')) {
        dialog.classList.remove("new-group-modal-shown")
        dialog.classList.add('new-group-modal-hidden');
    }
    dialog.close();
    chrome.runtime.sendMessage({
        msg: 'GROUP_MODAL_CLOSED',
        from: 'helper'
    });
}

const renderModal = (owner) => {
    if (!document.getElementById('adamite-group-modal')) {
        let modal = document.createElement("dialog");
        modal.classList.add("new-group-modal-hidden");
        document.body.appendChild(modal);
        modal.setAttribute('id', 'adamite-group-modal');
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
}








