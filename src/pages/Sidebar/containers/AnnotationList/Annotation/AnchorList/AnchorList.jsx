import React, { Component } from 'react';
import classNames from 'classnames';
import { FaCaretDown, FaCaretUp, FaTrash, FaEdit, FaFont, FaExternalLinkAlt, FaHamburger } from 'react-icons/fa';
import { GoThreeBars } from 'react-icons/go';
import '../Annotation.css';
import { Dropdown } from 'react-bootstrap';
import { checkPropTypes, string } from 'prop-types';
import Anchor from './Anchor';
// import CustomTag from '../../CustomTag/CustomTag';
// import profile from '../../../../../assets/img/SVGs/Profile.svg';
import expand from '../../../../../../assets/img/SVGs/expand.svg'
// import { deleteAnnotationForeverById, updateAnnotationById, getUserProfileById } from '../../../../../firebase';
// import CardWrapper from '../../CardWrapper/CardWrapper'


//todo fix tomorrow im too tired rn
class AnchorList extends Component {

    render() {
        const { childAnchor, currentUrl, collapsed } = this.props;
        return (
            <ul className='AnchorList' style={{ margin: 0, padding: '0px 0px 0px 0px' }}>
                {childAnchor.map((childAnch, idx) => {
                    return (<li key={idx} className='Anchor'>
                        <Anchor id={childAnch.id} currentUrl={currentUrl} collapsed={collapsed} url={childAnch.url} anchorContent={childAnch.anchorContent} />
                    </li>
                    );
                })}
            </ul>
        )
    }
}

export default AnchorList;