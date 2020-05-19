console.log('loaded filterWindow.js');

let selectedTags = [];

function modifySelectedTags(event) {
    console.log(event.target);
    if (selectedTags.includes(event.target.innerHTML)) {
        console.log('includes is true');
        selectedTags = selectedTags.filter(tag => tag !== event.target.innerHTML);
        event.target.style = 'background-color: white';
    }
    else {
        selectedTags.push(event.target.innerHTML);
        event.target.style = 'background-color: darkcyan';
    }
    console.log(selectedTags);
}

function transmitSelectedTags(event) {
    chrome.runtime.sendMessage({
        msg: 'TAGS_SELECTED',
        from: 'background',
        payload: { tags: selectedTags }
    });
}

chrome.runtime.sendMessage({ msg: 'REQUEST_FILTERED_ANNOTATIONS', from: 'background' }, (response) => {
    // filteredAnnotations = response;
    let tagSet = new Set();
    console.log(response);
    response.forEach(annotation => {
        annotation.tags.forEach(tag => {
            tagSet.add(tag);
        });
    })
    console.log(tagSet);
    tagSet.forEach(tag => {
        let tagButton = document.createElement('button');
        tagButton.innerHTML = tag;
        tagButton.style = 'padding: 5px';
        tagButton.onclick = modifySelectedTags;
        document.body.appendChild(tagButton);
    });

    document.body.appendChild(document.createElement('br'));
    let submitButton = document.createElement('button');
    submitButton.innerHTML = 'Save';
    submitButton.onclick = transmitSelectedTags;
    document.body.appendChild(submitButton);

});