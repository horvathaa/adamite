

import { createContext } from "react";

// create a context with default values
const AnnotationContext = createContext({

    id: null,
    idx: null,
    anno: null,
    currentUrl: null,
    userGroups: [],
    currentUser: null,
    brokenAnchor: false,

    brokenChild: [],
    formatTimestamp: null,
    isCurrentUser: null,
    collapsed: true,
    setCollapsed: () => { },
    handleExpandCollapse: () => { },

    // Annotation 
    editing: false,
    setEditing: () => { },
    handleEditClick: () => { },
    handleTrashClick: () => { },
    handleDoneToDo: (id) => { },
    handleExpertReview: () => { },
    cancelButtonHandler: () => { },
    submitButtonHandler: () => { },

    transmitPinToParent: () => { },
    notifyParentOfAdopted: () => { },
    getGroupName: () => { },

    //Replies
    showReplies: false,
    handleShowReplies: () => { },
    replying: false,
    brokenReply: [],
    showReply: false,
    setReplying: () => { },
    deleteReply: (id) => { },
    replyCountString: "",


    //Anchors
    handleNewAnchor: () => { },
    updateAnchorTags: () => { },
    deleteAnchor: () => { },





});

export default AnnotationContext;


//setAnnotationType: () => { },
 // tags: null,
    // setTags: () => { },
    // setContent: () => { },


    //url: null,
    //content: null,
    // replies: [],
    // annotationType: null,
    // childAnchor: null,
    // anchor: null,
    // xpath: null,
    // isPrivate: false,
    // annoGroups: null,
    // readCount: null,
    // isClosed: null,
    // howClosed: null,
    // authorId: null,
    // pinned: false,