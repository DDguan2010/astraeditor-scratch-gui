import PropTypes from 'prop-types';
import React from 'react';
import {defineMessages, FormattedMessage, injectIntl, intlShape} from 'react-intl';
import {connect} from 'react-redux';
import {closeExtensionEditorCreate} from '../reducers/modals';
import Modal from '../components/modal/modal.jsx';
import Box from '../components/box/box.jsx';
import Input from '../components/forms/input.jsx';
import BufferedInputHOC from '../components/forms/buffered-input-hoc.jsx';
import styles from './extension-editor-create.css';

const BufferedInput = BufferedInputHOC(Input);

const messages = defineMessages({
    title: {
        defaultMessage: 'Create New Extension',
        description: 'Title of the create extension modal',
        id: 'tw.extensionEditorCreate.title'
    },
    nameLabel: {
        defaultMessage: 'Extension Name',
        description: 'Label for extension name input',
        id: 'tw.extensionEditorCreate.nameLabel'
    },
    namePlaceholder: {
        defaultMessage: 'My Extension',
        description: 'Placeholder for extension name input',
        id: 'tw.extensionEditorCreate.namePlaceholder'
    },
    idLabel: {
        defaultMessage: 'Extension ID',
        description: 'Label for extension ID input',
        id: 'tw.extensionEditorCreate.idLabel'
    },
    idPlaceholder: {
        defaultMessage: 'myextension',
        description: 'Placeholder for extension ID input',
        id: 'tw.extensionEditorCreate.idPlaceholder'
    },
    idHint: {
        defaultMessage: 'Must be lowercase, no spaces, only letters, numbers, and underscores',
        description: 'Hint for extension ID input',
        id: 'tw.extensionEditorCreate.idHint'
    },
    colorLabel: {
        defaultMessage: 'Extension Color',
        description: 'Label for extension color picker',
        id: 'tw.extensionEditorCreate.colorLabel'
    },
    color1Label: {
        defaultMessage: 'Primary Color',
        description: 'Label for primary color',
        id: 'tw.extensionEditorCreate.color1Label'
    },
    color2Label: {
        defaultMessage: 'Secondary Color',
        description: 'Label for secondary color',
        id: 'tw.extensionEditorCreate.color2Label'
    },
    color3Label: {
        defaultMessage: 'Tertiary Color',
        description: 'Label for tertiary color',
        id: 'tw.extensionEditorCreate.color3Label'
    },
    createButton: {
        defaultMessage: 'Create',
        description: 'Button to create the extension',
        id: 'tw.extensionEditorCreate.createButton'
    },
    cancelButton: {
        defaultMessage: 'Cancel',
        description: 'Button to cancel',
        id: 'tw.extensionEditorCreate.cancelButton'
    },
    nameError: {
        defaultMessage: 'Please enter a name',
        description: 'Error message when name is empty',
        id: 'tw.extensionEditorCreate.nameError'
    },
    idError: {
        defaultMessage: 'Please enter a valid ID (lowercase letters, numbers, and underscores only)',
        description: 'Error message when ID is invalid',
        id: 'tw.extensionEditorCreate.idError'
    }
});

class ExtensionEditorCreate extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            name: '',
            id: '',
            color1: '#FF6680',
            color2: '#FF4D6A',
            color3: '#CC3D55',
            errors: {
                name: '',
                id: ''
            }
        };
    }

    handleNameChange = (name) => {
        this.setState({ name, errors: { ...this.state.errors, name: '' } });
    };

    handleIdChange = (id) => {
        // Auto-generate ID from name if ID is empty
        const newId = this.state.id === '' && name ? 
            name.toLowerCase().replace(/[^a-z0-9_]/g, '_') : 
            id;
        this.setState({ id: newId, errors: { ...this.state.errors, id: '' } });
    };

    handleColorChange = (colorKey, color) => {
        this.setState({ [colorKey]: color });
    };

    validate = () => {
        const errors = {
            name: '',
            id: ''
        };

        if (!this.state.name.trim()) {
            errors.name = this.props.intl.formatMessage(messages.nameError);
        }

        if (!this.state.id.trim()) {
            errors.id = this.props.intl.formatMessage(messages.idError);
        } else if (!/^[a-z0-9_]+$/.test(this.state.id)) {
            errors.id = this.props.intl.formatMessage(messages.idError);
        }

        this.setState({ errors });

        return !errors.name && !errors.id;
    };

    handleCreate = () => {
        if (this.validate()) {
            this.props.onCreate({
                name: this.state.name,
                id: this.state.id,
                colors: {
                    color1: this.state.color1,
                    color2: this.state.color2,
                    color3: this.state.color3
                }
            });
            this.props.onClose();
        }
    };

    handleCancel = () => {
        this.props.onClose();
    };

    handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            this.handleCreate();
        }
    };

    render() {
        return (
            <Modal
                contentLabel={this.props.intl.formatMessage(messages.title)}
                onRequestClose={this.props.onClose}
                className={styles.modal}
            >
                <Box className={styles.container}>
                    <div className={styles.content}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>
                                <FormattedMessage {...messages.nameLabel} />
                            </label>
                            <BufferedInput
                                className={styles.input}
                                placeholder={this.props.intl.formatMessage(messages.namePlaceholder)}
                                value={this.state.name}
                                onChange={this.handleNameChange}
                                onKeyPress={this.handleKeyPress}
                            />
                            {this.state.errors.name && (
                                <div className={styles.error}>{this.state.errors.name}</div>
                            )}
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>
                                <FormattedMessage {...messages.idLabel} />
                            </label>
                            <BufferedInput
                                className={styles.input}
                                placeholder={this.props.intl.formatMessage(messages.idPlaceholder)}
                                value={this.state.id}
                                onChange={this.handleIdChange}
                                onKeyPress={this.handleKeyPress}
                            />
                            <div className={styles.hint}>
                                <FormattedMessage {...messages.idHint} />
                            </div>
                            {this.state.errors.id && (
                                <div className={styles.error}>{this.state.errors.id}</div>
                            )}
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>
                                <FormattedMessage {...messages.colorLabel} />
                            </label>
                            <div className={styles.colorPickers}>
                                <div className={styles.colorPicker}>
                                    <label className={styles.colorLabel}>
                                        <FormattedMessage {...messages.color1Label} />
                                    </label>
                                    <input
                                        type="color"
                                        className={styles.colorInput}
                                        value={this.state.color1}
                                        onChange={(e) => this.handleColorChange('color1', e.target.value)}
                                    />
                                </div>
                                <div className={styles.colorPicker}>
                                    <label className={styles.colorLabel}>
                                        <FormattedMessage {...messages.color2Label} />
                                    </label>
                                    <input
                                        type="color"
                                        className={styles.colorInput}
                                        value={this.state.color2}
                                        onChange={(e) => this.handleColorChange('color2', e.target.value)}
                                    />
                                </div>
                                <div className={styles.colorPicker}>
                                    <label className={styles.colorLabel}>
                                        <FormattedMessage {...messages.color3Label} />
                                    </label>
                                    <input
                                        type="color"
                                        className={styles.colorInput}
                                        value={this.state.color3}
                                        onChange={(e) => this.handleColorChange('color3', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.footer}>
                        <button
                            className={styles.button}
                            onClick={this.handleCancel}
                        >
                            <FormattedMessage {...messages.cancelButton} />
                        </button>
                        <button
                            className={`${styles.button} ${styles.primaryButton}`}
                            onClick={this.handleCreate}
                        >
                            <FormattedMessage {...messages.createButton} />
                        </button>
                    </div>
                </Box>
            </Modal>
        );
    }
}

ExtensionEditorCreate.propTypes = {
    intl: intlShape,
    onClose: PropTypes.func,
    onCreate: PropTypes.func
};

const mapDispatchToProps = dispatch => ({
    onClose: () => dispatch(closeExtensionEditorCreate())
});

export default injectIntl(connect(
    null,
    mapDispatchToProps
)(ExtensionEditorCreate));