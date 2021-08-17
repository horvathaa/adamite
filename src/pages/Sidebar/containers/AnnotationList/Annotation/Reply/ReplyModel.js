
import { v4 as uuidv4 } from 'uuid';


const cleanReplyModel = (replyData) => {
    let d = replyData !== null && replyData !== undefined ? replyData : {};
    return {
        replyId: "replyId" in d ? d.replyId : uuidv4(),
        author: "author" in d ? d.author : "",
        authorId: "authorId" in d ? d.authorId : "",
        replyContent: "replyContent" in d ? d.replyContent : "",
        tags: "tags" in d ? d.tags : [],
        answer: "answer" in d ? d.answer : false,
        question: "question" in d ? d.question : false,
        timestamp: "timestamp" in d ? d.timestamp : new Date().getTime(),
        anchor: "anchor" in d ? d.anchor : null,
        replyBlock: "replyBlock" in d ? d.replyBlock : ""
    }
}
export default cleanReplyModel;
