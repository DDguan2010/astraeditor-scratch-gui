import PropTypes from 'prop-types';
import React from 'react';
import {defineMessages, FormattedMessage, injectIntl, intlShape} from 'react-intl';
import {connect} from 'react-redux';
import {closeExtensionEditorSettings} from '../reducers/modals';
import {updateFontSize} from '../reducers/extension-editor';
import Modal from '../components/modal/modal.jsx';
import Box from '../components/box/box.jsx';
import styles from './extension-editor-settings.css';

const messages = defineMessages({
    editorOptions: {
        defaultMessage: 'Editor Options',
        description: 'Section header for editor options',
        id: 'tw.extensionEditorSettings.editorOptions'
    },
    fontSize: {
        defaultMessage: 'Font Size',
        description: 'Label for font size setting',
        id: 'tw.extensionEditorSettings.fontSize'
    },
    done: {
        defaultMessage: 'Done',
        description: 'Button text to close settings',
        id: 'tw.extensionEditorSettings.done'
    }
});

class ExtensionEditorSettings extends React.Component {
    handleFontSizeChange = (e) => {
        const newFontSize = parseInt(e.target.value, 10);
        if (this.props.onFontSizeChange) {
            this.props.onFontSizeChange(newFontSize);
        }
    };

    render () {
        return (
            <Modal
                className={styles.modal}
                contentLabel={this.props.intl.formatMessage(messages.editorOptions)}
                id="extensionEditorSettings"
                onRequestClose={this.props.onClose}
            >
                <Box grow={1}>
                    <div className={styles.content}>
                        <div className={styles.body}>
                            <div className={styles.section}>
                                <h3><FormattedMessage {...messages.editorOptions} /></h3>
                                
                                <div className={styles.setting}>
                                    <label>
                                        <span className={styles.label}>
                                            <FormattedMessage {...messages.fontSize} />
                                        </span>
                                        <span className={styles.value}>{this.props.fontSize}px</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="10"
                                        max="40"
                                        value={this.props.fontSize}
                                        onChange={this.handleFontSizeChange}
                                        className={styles.range}
                                    />
                                </div>
                            </div>

                            <div className={styles.footer}>
                                <button className={styles.button} onClick={this.props.onClose}>
                                    <FormattedMessage {...messages.done} />
                                </button>
                            </div>
                        </div>
                    </div>
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