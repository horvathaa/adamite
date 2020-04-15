import React, { Component } from 'react';

import './Annotation.css';

class Annotation extends Component {

    render() {
        const { anchor, content } = this.props;
        return ('Anchor:' + anchor + 'Annotation: ' + content);
    }

}

export default Annotation;