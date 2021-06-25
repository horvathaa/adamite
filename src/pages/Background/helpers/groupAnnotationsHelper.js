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
    if (request.group.emails !== undefined && request.group.emails.length) {
        fb.getUsersByEmails(request.group.emails).get().then(function (snapshot) {
            const uids = [request.group.owner].concat(getListFromSnapshots(snapshot).map(u => u.uid));
            if (request.group.gid !== "") {
                console.log('in if');
                fb.updateGroup({
                    name: request.group.name,
                    description: request.group.description,
                    owner: request.group.owner,
                    emails: request.group.emails,
                    uids: uids,
                    gid: request.group.gid
                }).then(value => {
                    transmitMessage({ msg: "GROUP_UPDATE_SUCCESS", sentFrom: 'background', currentTab: true })
                })
            }
            else {
                fb.addNewGroup({
                    name: request.group.name,
                    description: request.group.description,
                    owner: request.group.owner,
                    emails: request.group.emails,
                    uids: uids
                }).then(value => {
                    transmitMessage({ msg: 'GROUP_CREATE_SUCCESS', sentFrom: 'background', currentTab: true });
                })
            }

        })
    }
    else {
        if (request.group.gid !== "") {
            fb.updateGroup({
                name: request.group.name,
                description: request.group.description,
                owner: request.group.owner,
                emails: request.group.emails,
                uids: [request.group.owner],
                gid: request.group.gid
            }).then(value => {
                transmitMessage({ msg: "GROUP_UPDATE_SUCCESS", sentFrom: 'background', currentTab: true })
            })
        }
        else {
            await fb.addNewGroup({
                name: request.group.name,
                description: request.group.description,
                owner: request.group.owner,
                emails: request.group.emails,
                uids: [request.group.owner]
            }).then(value => {
                transmitMessage({ msg: 'GROUP_CREATE_SUCCESS', sentFrom: 'background', currentTab: true });
            })
        }

    }


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
