// const

// <div className="Replies">
//     <div className="SeparationRow">
//         <div className="ShowHideReplies">
//             <div className="ExpandCollapse">
//                 <img src={expand} className="Icon" alt="Show replies" onClick={this.handleShowReplies} />
//             </div>
//             {replies.length} {replyCountString}
//         </div>
//         <hr className="divider" />
//     </div>
//     <ul style={{ margin: 0, padding: '0px 0px 0px 0px' }}>
//         {replies.map((reply, idx) => {
//             return (
//                 <Reply
//                     key={idx}
//                     idx={idx}
//                     replyId={reply.replyId}
//                     annoId={id}
//                     replies={replies}
//                     content={reply.replyContent}
//                     author={reply.author}
//                     authorId={reply.authorId}
//                     timeStamp={reply.timestamp}
//                     tags={reply.tags}
//                     answer={reply.answer}
//                     question={reply.question}
//                     finishReply={this.finishReply}
//                     showQuestionAnswerInterface={false}
//                     currentUser={currentUser}
//                     xpath={reply.xpath}
//                     anchor={reply.anchor}
//                     hostname={reply.hostname}
//                     url={reply.url}
//                     offsets={reply.offsets}
//                     currentUrl={currentUrl}
//                     notifyParentOfAdopted={this.props.notifyParentOfAdopted}
//                     brokenAnchor={this.props.brokenReply.includes(reply.replyId)}
//                 />
//             )
//         }
//         )}
//     </ul>

// </div>