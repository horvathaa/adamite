import React, { Component, useContext } from 'react';
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
import AnnotationContext from "../AnnotationContext";

//todo fix tomorrow im too tired rn
const AnchorList = () => {
    const ctx = useContext(AnnotationContext);
    if (ctx.anno.childAnchor === undefined || ctx.anno.childAnchor === null || !ctx.anno.childAnchor.length) return (null);
    return (
        <ul className='AnchorList' style={{ margin: 0, padding: '0px 0px 0px 0px' }}>
            {ctx.anno.childAnchor.map((childAnch, idx) => {
                return (<li key={idx} className='Anchor'>
                    <Anchor anchor={childAnch} />
                </li>
                );
            })}
        </ul>
    )
}

export default AnchorList;