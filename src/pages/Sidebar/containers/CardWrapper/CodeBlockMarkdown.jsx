import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { coy } from "react-syntax-highlighter/dist/esm/styles/prism";

class CodeBlock extends PureComponent {

    static propTypes = {
        children: PropTypes.string.isRequired,
        language: PropTypes.string
    };

    static defaultProps = {
        language: "javascript"
    };

    render() {
        const { language, children } = this.props;
        return (
            <SyntaxHighlighter language={language} style={coy} className="CodeBox">
                {children[0]}
            </SyntaxHighlighter>
        );
    }
}

export default CodeBlock;

