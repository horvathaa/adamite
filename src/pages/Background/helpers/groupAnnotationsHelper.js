import * as fb from '../../../firebase/index';
import { transmitMessage, transmitUpdateAnnotationMessage } from '../backgroundTransmitter';

const isModal = (res) => res.from === 'modal';
const isContent = (res) => res.from === 'content';

let groupListener;

function setUpGetGroupListener(uid) {
    return new Promise((resolve, reject) => {
        resolve(fb.getAllUserGroups(uid).onSnapshot(querySnapshot => {
            let groups = [];
            querySnapshot.forEach(snapshot => {
                groups.push({
                    gid: snapshot.id,
                    ...snapshot.data()
                });
            })
            console.log('groups in listener', groups);
            transmitMessage({ msg: "GROUPS_UPDATED", sentFrom: "background", data: { groups } });
        }))
    })
}

export async function getGroups(request, sender, sendResponse) {
    groupListener = setUpGetGroupListener(request.uid);
}

export async function createGroup(request, sender, sendResponse) {
    if (!isContent) return;
    await fb.addNewGroup({
        name: request.group.name,
        description: request.group.description,
        owner: request.group.owner,
        emails: request.group.emails
    }).then(value => {
        transmitMessage({ msg: 'GROUP_CREATE_SUCCESS', sentFrom: 'background', currentTab: true });
    })
}


export async function deleteGroup(request, sender, sendResponse) {
    if (!isModal(request)) return;
    console.log("this is the request for a delete group", request.gid);
    const { gid } = request;
    fb.deleteGroupForeverByGid(gid).then(value => transmitMessage({ msg: 'GROUP_DELETE_SUCCESS' }));
}

export async function showGroup(request, sender, sendResponse) {
    chrome.tabs.query({ active: true, lastFocusedWindow: true },
        (tabs) => {
            chrome.tabs.sendMessage(
                tabs[0].id,
                {
                    msg: 'SHOW_GROUP',
                    from: 'background',
                }
            );
        });
}

export async function hideGroup(request, sender, sendResponse) {
    chrome.tabs.query({ active: true, lastFocusedWindow: true },
        (tabs) => {
            chrome.tabs.sendMessage(
                tabs[0].id,
                {
                    msg: 'HIDE_GROUP',
                    from: 'background',
                }
            );
        });
}

// "DELETE_GROUP": (request, sender, sendResponse) => {
//     if (!isModal(request)) return;
//     console.log("this is the request for a delete group", request.gid);
//     const { gid } = request;
//     deleteGroupForeverByGid(gid).then(value => sendMsg('GROUP_DELETE_SUCCESS', null, true));
// },
// 'ADD_NEW_GROUP': (request, sender, sendResponse) => {
//     if (!isContent(request)) return;
//     addNewGroup({
//         name: request.group.name,
//         description: request.group.description,
//         owner: request.group.owner,
//         emails: request.group.emails
//     }).then(value => sendMsg('GROUP_CREATE_SUCCESS', null, true))
// },