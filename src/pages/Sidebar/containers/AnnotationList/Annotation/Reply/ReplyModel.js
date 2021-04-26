
import { v4 as uuidv4 } from 'uuid';

const cleanReplyModel = (replyData) => {
    let d = replyData != null && replyData !== undefined ? replyData : {};
    return {
        isNew: d !== replyData,
        replyId: "replyId" in d ? d.replyId : uuidv4(),
        author: "author" in d ? d.author : "",
        authorId: "authorId" in d ? d.authorId : "",
        replyContent: "replyContent" in d ? d.replyContent : "",
        tags: "tags" in d ? d.tags : [],
        answer: "answer" in d ? d.answer : false,
        question: "question" in d ? d.question : false,
        timestamp: "timestamp" in d ? d.timestamp : new Date().getTime(),
        xpath: "xpath" in d ? d.xpath : null,
        anchor: "anchor" in d ? d.anchor : "",
        hostname: "hostname" in d ? d.hostname : "",
        url: "url" in d ? d.url : "",
        offsets: "offset" in d ? d.offsets : null,
        adopted: "adopted" in d ? d.adopted : false
    }
}
export default cleanReplyModel;
