import React, { Component } from 'react';
import classNames from 'classnames';
import './Annotation.css';

class Annotation extends Component {

    render() {
        const { anchor, content, idx } = this.props;
        return (
            <li key={idx}
                className={
                    classNames({ AnnotationItem: true })
                }
            >
                <div className={classNames({
                    AnnotationContainerPad: true,
                    AnnotationPadActive: true
                })}>
                    <div className={classNames({ AnnotationContainerLeftPad: true })}></div>
                </div>
                <div className={classNames({
                    AnnotationContainer: true,
                    ActiveAnnotationContainer: true
                })}>
                    <div className={classNames({
                        AnchorContainer: true
                    })}>
                        {anchor}
                    </div>
                    <div className={classNames({
                        ContentContainer: true
                    })}>
                        {content}
                    </div>
                </div>
                <div className={classNames({
                    AnnotationContainerPad: true,
                    AnnotationPadActive: true
                })}>
                    <div className={classNames({ AnnotationContainerRightPad: true })}></div>
                </div>
            </li>
        );
    }

}

export default Annotation;