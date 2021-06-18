

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
    collapsed: false,
    setCollapsed: () => { },
    handleExpandCollapse: () => { },

    createAnnotation: () => { },
    updateAnnotation: () => { },
    updateAnnotationFields: () => { },
    cancelButtonHandler: () => { },
    submitButtonHandler: () => { },


    // Annotation 
    editing: false,
    isNew: false,
    setEditing: () => { },
    handleEditClick: () => { },
    handleTrashClick: () => { },

    // todo annotation
    handleDoneToDo: (id) => { },
    // Issue Annotation
    handleExpertReview: () => { },
    // Question Annotation
    closeOut: () => { },


    handlePin: () => { },
    notifyParentOfAdopted: () => { },
    getGroupName: () => { },
    deleteTag: () => { },



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
    // updateAnchorTags: (newAnchors) => { },
    // deleteAnchor: () => { },
    updateAnchors: (newAnchors) => { },

});

export default AnnotationContext;