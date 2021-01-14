

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