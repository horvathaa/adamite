import React from 'react';

import { APP_NAME_FULL } from '../../../../shared/constants';

import './Title.css';

const Title = (props) => {
  return (
    <div className="TitleContainer">
      <h4>{APP_NAME_FULL}</h4>
    </div>
  );
};

export default Title;
