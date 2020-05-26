console.log('loaded filterWindow.js');

let selectedTags = [];

function modifySelectedTags(event) {
    // console.log(event.target);
    if (selectedTags.includes(event.target.innerHTML)) {
        selectedTags = selectedTags.filter(tag => tag !== event.target.innerHTML);
        event.target.style = 'background-color: white';
    }
    else {
        selectedTags.push(event.target.innerHTML);
        event.target.style = 'background-color: darkcyan';
    }
}

function transmitSelectedTags(event) {
    chrome.runtime.sendMessage({
        msg: 'TAGS_SELECTED',
        from: 'background',
        payload: { tags: selectedTags }
    });
}

chrome.storage.local.get(annotations => {
    let tagSet = new Set();
    // console.log(annotations);
    annotations.annotations.forEach(annotation => {
        annotation.tags.forEach(tag => {
            tagSet.add(tag);
        });
    })
    // console.log(tagSet);
    let tagButtonContainer = document.createElement('div');
    tagButtonContainer.setAttribute("class", "tagButtonContainer");
    document.body.appendChild(tagButtonContainer);
    tagSet.forEach(tag => {
        let tagButtonPad = document.createElement('div');
        tagButtonPad.setAttribute("class", "buttonContainer");
        tagButtonContainer.appendChild(tagButtonPad);
        let tagButton = document.createElement('button');
        tagButton.innerHTML = tag;
        // tagButton.style = 'padding: 5px';
        tagButton.onclick = modifySelectedTags;
        tagButtonPad.appendChild(tagButton);
    });

    document.body.appendChild(document.createElement('br'));
    let submitButton = document.createElement('button');
    submitButton.innerHTML = 'Save';
    submitButton.onclick = transmitSelectedTags;
    document.body.appendChild(submitButton);
})
