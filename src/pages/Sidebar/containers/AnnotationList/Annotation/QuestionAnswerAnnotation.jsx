import React, { Component } from 'react';
import classNames from 'classnames';
import { GoThreeBars } from 'react-icons/go';
import './Annotation.css';
import { Dropdown } from 'react-bootstrap';
import CustomTag from '../../CustomTag/CustomTag';
import profile from '../../../../../assets/img/SVGs/Profile.svg';
import expand from '../../../../../assets/img/SVGs/expand.svg'
import CardWrapper from '../../CardWrapper/CardWrapper'
import AnchorList from './AnchorList/AnchorList';
import Anchor from './AnchorList/Anchor';


const HamburgerToggle = React.forwardRef(({ children, onClick }, ref) => (
    <a ref={ref}
        onClick={(e) => {
            e.preventDefault();
            onClick(e);
        }}><GoThreeBars className="Icon" />
        {children}
    </a>
));

class QuestionAnswerAnnotation extends Component {

    render() {
        const { idx, id, collapsed, author, pin, currentUser, authorId,
            childAnchor, currentUrl, url, anchor, xpath, tags, annotationType,
            annotationContent, editing } = this.props;
        return (
            <li key={idx} id={id} className={classNames({ AnnotationItem: true })}>
                <div
                    className={classNames({
                        AnnotationContainerPad: true,
                        AnnotationPadActive: true,
                    })}
                >
                    <div
                        className={classNames({ AnnotationContainerLeftPad: true })}
                    ></div>
                </div>
                <div id={id}
                    className={classNames({
                        AnnotationContainer: true,
                        ActiveAnnotationContainer: true,
                    })}
                >
                    {!collapsed ? (
                        <div className={" container " + classNames({
                            Header: true,
                            Truncated: collapsed,
                        })}>
                            <div className="profileContainer">
                                <img src={profile} alt="profile" className="profile" />
                            </div>
                            <div className="userProfileContainer">

                                <div className="author">
                                    {author}
                                </div>
                                <div className="timestamp">
                                    {this.props.formatTimestamp()}
                                </div>
                            </div>
                            <div className="row">
                                <div className="col2">
                                    <div className="PinContainer" onClick={this.props.transmitPinToParent}>
                                        {pin}
                                    </div>
                                    {currentUser.uid === authorId ? (
                                        <Dropdown className="HamburgerMenu">
                                            <Dropdown.Toggle as={HamburgerToggle}></Dropdown.Toggle>
                                            <Dropdown.Menu>
                                                <Dropdown.Item as="button" eventKey={id} onSelect={eventKey => this.props.handleNewAnchor(id)}>
                                                    Add new anchor
                            </Dropdown.Item>
                                                <Dropdown.Item as="button" eventKey={id} onSelect={eventKey => this.props.handleEditClick(id)}>
                                                    Edit
                            </Dropdown.Item>
                                                <Dropdown.Item as="button" eventKey={id} onSelect={eventKey => this.props.handleTrashClick(id)}>
                                                    Delete
                            </Dropdown.Item>

                                            </Dropdown.Menu>
                                        </Dropdown>
                                    ) : (
                                            <Dropdown className="HamburgerMenu">
                                                <Dropdown.Toggle as={HamburgerToggle}></Dropdown.Toggle>
                                                <Dropdown.Menu>
                                                    <Dropdown.Item as="button" eventKey={id} onSelect={eventKey => this.props.handleNewAnchor(id)}>
                                                        Add new anchor
                            </Dropdown.Item>
                                                </Dropdown.Menu>
                                            </Dropdown>
                                        )}

                                </div>
                            </div>
                        </div>
                    ) : (null)}
                    {childAnchor === undefined || !childAnchor.length ? (
                        <Anchor
                            id={id}
                            currentUrl={currentUrl}
                            url={url}
                            collapsed={collapsed}
                            anchorContent={anchor}
                            pageAnchor={xpath === null} />
                    ) : (
                            <React.Fragment>
                                <Anchor
                                    id={id}
                                    currentUrl={currentUrl}
                                    url={url}
                                    collapsed={collapsed}
                                    anchorContent={anchor}
                                    pageAnchor={xpath === null} />
                                <AnchorList childAnchor={childAnchor} currentUrl={currentUrl} collapsed={collapsed} />
                            </React.Fragment>
                        )}

                    <React.Fragment>
                        <CardWrapper
                            tags={tags}
                            annotationType={annotationType}
                            annotationContent={annotationContent}
                            edit={editing}
                            pageAnnotation={anchor}
                            id={id}
                            cancelButtonHandler={this.props.cancelButtonHandler}
                            submitButtonHandler={this.props.submitButtonHandler}
                            elseContent={annotationContent}
                            collapsed={collapsed} />
                    </React.Fragment>

                    {tags.length && !collapsed && !editing ? (
                        <div className={classNames({
                            TagRow: true
                        })}>
                            <ul style={{ margin: 0, padding: '0px 0px 0px 0px' }}>
                                {tags.map((tagContent, idx) => {
                                    return (
                                        <CustomTag idx={idx} content={tagContent} deleteTag={this.deleteTag} editing={editing} />
                                    )
                                }
                                )}
                            </ul>

                        </div>
                    ) : (null)}
                    {collapsed ? (
                        <div className="ExpandCollapse">
                            <img src={expand} alt="Expand" onClick={_ => this.props.handleExpandCollapse('expand')} className="Icon" />
                        </div>
                    ) : (
                            <React.Fragment>
                                <div className="ExpandCollapse">
                                    <img src={expand} id="collapse" alt="Collapse" onClick={_ => this.props.handleExpandCollapse('collapse')} className="Icon" />
                                </div>
                            </React.Fragment>
                        )
                    }
                </div>

                <div
                    className={classNames({
                        AnnotationContainerPad: true,
                        AnnotationPadActive: true,
                    })}
                >

                    <div
                        className={classNames({ AnnotationContainerRightPad: true })}
                    ></div>
                </div>
                <div
                    className={classNames({
                        AnnotationContainerPad: true,
                        AnnotationPadActive: true,
                    })}
                ></div>
            </li>
        );
    }
}

export default QuestionAnswerAnnotation;