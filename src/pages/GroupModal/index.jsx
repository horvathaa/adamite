import React from 'react';
import { render } from 'react-dom';

import Groups from './GroupModal';
import './index.css';

let getParamsFromQuery = function () {
    var query = window.location.search.substring(1);
    var paramArray = {}

    query.split('&').forEach(function (keyValue) {
        var [key, value] = keyValue.split('=');
        paramArray[key] = value;
    });

    return paramArray;
}




const App = () => {
    let params = getParamsFromQuery();
    return <Groups uid={params.uid} email={params.email} userName={params.userName} />;
};

// console.log("PARENT", window.location);
if(!window.document.querySelector('#group-container').hasChildNodes())
render(<App />, window.document.querySelector('#group-container'));
