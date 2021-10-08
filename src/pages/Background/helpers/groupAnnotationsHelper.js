import * as fb from '../../../firebase/index';
import { transmitMessage, transmitUpdateAnnotationMessage } from '../backgroundTransmitter';

const isModal = (res) => res.from === 'modal';
const isContent = (res) => res.from === 'content';

function getListFromSnapshots(snapshots) {
    let out = [];
    snapshots.forEach(snapshot => {
        out.push({
            id: snapshot.id, ...snapshot.data(),
        });
    });
    return out;
}

export let groupListener;

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
            chrome.storage.local.set({ 'groups': groups });
            transmitMessage({ msg: "GROUPS_UPDATED", sentFrom: "background", data: { groups } });
        }))
    })
}

export async function getGroups(request, sender, sendResponse) {
    groupListener = request.uid !== undefined ? setUpGetGroupListener(request.uid) : setUpGetGroupListener(request.request.uid)
}

export async function createGroup(request, sender, sendResponse) {
    if (!isContent) return;

    fb.createGroupFunction(request.group).then(response => {
        transmitMessage(JSON.parse(response.data))
    })
}


export async function deleteGroup(request, sender, sendResponse) {
    if (!isModal(request)) return;
    const { gid } = request;
    transmitMessage({ msg: 'GROUP_DELETE_SUCCESS', sentFrom: 'background', currentTab: true });
    fb.deleteGroupForeverByGid(gid) //.then(value => transmitMessage({ msg: 'GROUP_DELETE_SUCCESS' }));
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
