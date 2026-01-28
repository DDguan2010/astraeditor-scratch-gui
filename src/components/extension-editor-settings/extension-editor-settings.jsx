import PropTypes from 'prop-types';
import React from 'react';
import { defineMessages, FormattedMessage, injectIntl, intlShape } from 'react-intl';
import { connect } from 'react-redux';
import { closeExtensionEditorSettings } from '../../reducers/modals';
import { updateFontSize } from '../../reducers/extension-editor';
import Modal from '../modal/modal.jsx';
import Box from '../box/box.jsx';
import { ExtensionEditorSettingsContent } from 'scratch-extension-editor';

const messages = defineMessages({
    editorOptions: {
        defaultMessage: 'Editor Options',
        description: 'Section header for editor options',
        id: 'tw.extensionEditorSettings.editorOptions'
    }
});

class ExtensionEditorSettings extends React.Component {
    render() {
        return (
            <Modal
                contentLabel={this.props.intl.formatMessage(messages.editorOptions)}
                id="extensionEditorSettings"
                onRequestClose={this.props.onClose}
            >

                <Box grow={1}>
                    <ExtensionEditorSettingsContent
                        fontSize={this.props.fontSize}
                        onFontSizeChange={this.props.onFontSizeChange}
                        onClose={this.props.onClose}
                    />
                </Box>

            </Modal>
        );
    }
}

ExtensionEditorSettings.propTypes = {
    intl: intlShape,
    onClose: PropTypes.func,
    fontSize: PropTypes.number,
    onFontSizeChange: PropTypes.func
};

const mapStateToProps = state => ({
    fontSize: state.scratchGui.extensionEditor.fontSize
});

const mapDispatchToProps = dispatch => ({
    onClose: () => dispatch(closeExtensionEditorSettings()),
    onFontSizeChange: (fontSize) => dispatch(updateFontSize(fontSize))
});

export default injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(ExtensionEditorSettings));