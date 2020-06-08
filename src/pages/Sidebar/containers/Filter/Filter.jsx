import React from 'react';
import './Filter.css';
import classNames from 'classnames';
import { Combobox } from 'react-widgets';
import 'react-widgets/dist/css/react-widgets.css';
import expand from '../../../../assets/img/SVGs/expand.svg'

class Filter extends React.Component {
    selection = {
        siteScope: ['onPage'],
        userScope: ['public'],
        annoType: ['default', 'to-do', 'question', 'highlight', 'navigation', 'issue'],
        timeRange: 'all',
        archive: null,
        tags: []
    }

    constructor(props) {
        super(props);
        this.selection = props.currentFilter;
    }

    tagSet = [];

    state = {
        tagSelect: false,
    }


    async componentDidMount() {
        let tagSet = new Set();
        await this.props.getFilteredAnnotations().forEach(annotation => {
            annotation.tags.forEach(tag => {
                tagSet.add(tag);
            });
        })
        this.tagSet = [...tagSet];
    }

    async handleTagSelect() {
        await this.getTags();
        this.setState({ tagSelect: !this.state.tagSelect })
    }

    async getTags() {
        let tagSet = new Set();
        await this.props.getFilteredAnnotations().forEach(annotation => {
            annotation.tags.forEach(tag => {
                tagSet.add(tag);
            });
        })
        this.tagSet = [...tagSet];
    }

    async handleTagClick(event) {
        let tagName = event.target.value;
        if (this.selection.tags.includes(tagName)) {
            this.selection.tags = this.selection.tags.filter(e => e !== tagName);
        }
        else {
            this.selection.tags.push(tagName);
        }
        this.props.applyFilter(this.selection);
    }

    setAnnoTypeListEmpty = () => {
        this.selection.annoType = [];
        this.props.applyFilter(this.selection);
    }

    setAnnoTypeListFull = () => {
        this.selection.annoType = ['default', 'to-do', 'question', 'highlight', 'navigation', 'issue'];
        this.props.applyFilter(this.selection);
    }

    revertToDefaultFilter = () => {
        this.selection = {
            siteScope: ['onPage'],
            userScope: ['public'],
            annoType: ['default', 'to-do', 'question', 'highlight', 'navigation', 'issue'],
            timeRange: 'all',
            archive: null,
            tags: []
        }
        this.props.applyFilter(this.selection);
    }

    async updateUserScope(eventKey) {
        let choice = "";
        if (eventKey === 'Anyone') {
            choice = 'public';
        } else {
            choice = 'onlyMe';
        }
        if (this.selection.userScope.includes(choice)) {
            this.selection.userScope = this.selection.userScope.filter(e => e !== choice);
        } else {
            this.selection.userScope.push(choice);
        }
        this.props.applyFilter(this.selection);
        await this.getTags();
    }

    async updateTimeRange(eventKey) {
        let choice = "";
        if (eventKey === 'Past Day') {
            choice = "day";
        }
        else if (eventKey === 'Past Week') {
            choice = "week";
        }
        else if (eventKey === 'Past Month') {
            choice = "month";
        }

        else if (eventKey === 'Past Year') {
            choice = "year";
        }

        else if (eventKey === 'All Time') {
            choice = "all";
        }
        else if (eventKey === 'Custom Time Range') {
            choice = "custom";
        }
        this.selection.timeRange = choice;
        this.props.applyFilter(this.selection);
        await this.getTags();
    }

    async updateAnnoType(eventKey) {
        let choice = eventKey.target.value;
        if (this.selection.annoType.includes(choice)) {
            this.selection.annoType = this.selection.annoType.filter(e => e !== choice);
        } else {
            this.selection.annoType.push(choice);
        }
        this.props.applyFilter(this.selection);
        await this.getTags();
    }

    async updateSiteScope(eventKey) {
        let choice = eventKey.target.value;
        if (this.selection.siteScope.includes(choice)) {
            this.selection.siteScope = this.selection.siteScope.filter(e => e !== choice);
        } else {
            this.selection.siteScope.push(choice);
        }
        this.props.applyFilter(this.selection);
        await this.getTags();
    }

    render() {
        return (
            <div className='FilterContainer'>
                <div className="UserTime">
                    <div className="User">
                        Author
                        <Combobox
                            data={['Only me', 'Anyone']}
                            defaultValue={'Anyone'}
                            onChange={value => this.updateUserScope(value)}
                        />
                    </div>
                    <div className="Time">
                        Time Range
                        <Combobox
                            data={['Past Day', 'Past Week', 'Past Month', 'Past Year', 'All Time', 'Custom Time Range...']}
                            defaultValue={'All Time'}
                            onChange={value => this.updateTimeRange(value)}
                        />
                    </div>
                </div>
                <div className="SiteScope">
                    Location
                    <div className="SiteScopeRow">
                        <div className="SiteScopeButtonContainer">
                            <button value="onPage"
                                className={classNames({ filterButton: true, selected: this.selection.siteScope.includes('onPage') })}
                                onClick={value => this.updateSiteScope(value)}>
                                On Page
                        </button>
                        </div>
                        <div className="SiteScopeButtonContainer">
                            <button value="acrossWholeSite"
                                className={classNames({ filterButton: true, selected: this.selection.siteScope.includes('acrossWholeSite') })}
                                onClick={value => this.updateSiteScope(value)}>
                                Across Whole Site
                        </button>
                        </div>
                    </div>
                </div>
                <div className="AnnotationTypeFilter">
                    Annotation Type &nbsp; &nbsp;
                        {this.selection.annoType.length <= 5 ? (
                        <button className="AnnoTypeButtonSelect" onClick={this.setAnnoTypeListFull}>
                            Select all types
                        </button>) : (<button className="AnnoTypeButtonSelect" onClick={this.setAnnoTypeListEmpty}>
                            De-Select all types
                        </button>)
                    }
                    <div className="AnnoTypeButtonRow">
                        <div className="AnnoTypeButtonContainer">
                            <button value="default"
                                className={classNames({ filterButton: true, selected: this.selection.annoType.includes('default') })}
                                onClick={value => this.updateAnnoType(value)}>
                                Default
                        </button>
                        </div>
                        <div className="AnnoTypeButtonContainer">
                            <button value="to-do"
                                className={classNames({ filterButton: true, selected: this.selection.annoType.includes('to-do') })}
                                onClick={value => this.updateAnnoType(value)}>
                                To-do
                        </button>
                        </div>
                        <div className="AnnoTypeButtonContainer">
                            <button value="question"
                                className={classNames({ filterButton: true, selected: this.selection.annoType.includes('question') })}
                                onClick={value => this.updateAnnoType(value)}>
                                Question/Answer
                        </button>
                        </div>
                        <div className="AnnoTypeButtonContainer">
                            <button value="highlight"
                                className={classNames({ filterButton: true, selected: this.selection.annoType.includes('highlight') })}
                                onClick={value => this.updateAnnoType(value)}>
                                Highlight
                        </button>
                        </div>
                        <div className="AnnoTypeButtonContainer">
                            <button value="issue"
                                className={classNames({ filterButton: true, selected: this.selection.annoType.includes('issue') })}
                                onClick={value => this.updateAnnoType(value)}>
                                Issue
                        </button>
                        </div>
                    </div>
                </div>
                <div className="FilterByTag">
                    Filter By Tag
                    <div className="TagListContainer">
                        {this.selection.tags.length ? (
                            this.selection.tags.map(tag => {
                                return (<div className="TagButtonPad">
                                    <button value={tag}
                                        className={
                                            classNames({ TagButton: true, selected: this.selection.tags.includes(tag) })}
                                        onClick={e => this.handleTagClick(e)}>{tag}
                                    </button>
                                </div>);
                            })
                        ) : (null)}
                        {!this.state.tagSelect ? (
                            <div className="TagButtonPad">
                                <button value="chooseTag" className="TagButton" onClick={e => this.handleTagSelect(e)}>
                                    Choose tag(s) >
                            </button>
                            </div>) : (
                                <React.Fragment>
                                    {this.tagSet.map(tag => {
                                        if (!this.selection.tags.includes(tag))
                                            return (<div className="TagButtonPad">
                                                <button value={tag} className={
                                                    classNames({ TagButton: true, selected: this.selection.tags.includes(tag) })}
                                                    onClick={e => this.handleTagClick(e)}>
                                                    {tag}
                                                </button>
                                            </div>);
                                    })}
                                    <div className="TagButtonPad">
                                        <button className="TagButton" >
                                            <img src={expand} alt="collapse tag list" id="collapseTagList" onClick={e => this.handleTagSelect(e)} />
                                        </button>
                                    </div>
                                </React.Fragment>
                            )}
                    </div>
                </div>
                <div className="Revert">
                    <button className="RevertFilterButton" onClick={this.revertToDefaultFilter}>
                        Revert to Default Filter
                    </button>
                </div>
            </div>
        )
    }
}

export default Filter;