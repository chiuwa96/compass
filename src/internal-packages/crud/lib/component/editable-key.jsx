'use strict';

const React = require('react');

/**
 * The editing class constant.
 */
const EDITING = 'editing';

/**
 * The duplicate key value.
 */
const DUPLICATE = 'duplicate';

/**
 * The document key class.
 */
const KEY_CLASS = 'editable-key';

/**
 * General editable key component.
 */
class EditableKey extends React.Component {

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.element = props.element;
    this.state = { duplcate: false, editing: false };
  }

  /**
   * Focus on this field on mount, so the tab can do it's job and move
   * to the value field.
   */
  componentDidMount() {
    if (this.element.isAdded()) {
      if (this.props.insertIndex) {
        // Focus for inserting new documents.
        if (this.props.insertIndex === 1 && this.element.currentKey === '') {
          this._node.focus();
        }
      } else if (!this.isEditable() && this._node) {
        this._node.focus();
      }
    }
  }

  /**
   * Render a single editable key.
   *
   * @returns {React.Component} The element component.
   */
  render() {
    return (
      <input
        type='text'
        className={this.style()}
        ref={(c) => this._node = c}
        size={this.element.currentKey.length}
        onBlur={this.handleBlur.bind(this)}
        onFocus={this.handleFocus.bind(this)}
        onChange={this.handleChange.bind(this)}
        onKeyDown={this.handleKeyDown.bind(this)}
        value={this.element.currentKey}
        title={this.renderTitle()} />
    );
  }

  /**
   * Render the title.
   *
   * @returns {String} The title.
   */
  renderTitle() {
    if (this.state.duplicate) {
      return `Duplicate key: '${this.element.currentKey}'`
    }
    return this.element.currentKey;
  }
  /**
   * When hitting a key on the last element some special things may happen.
   *
   * @param {Event} evt - The event.
   */
  handleKeyDown(evt) {
    if (evt.keyCode === 27) {
      this._node.blur();
    }
  }

  /**
   * Handles changes to the element key.
   *
   * @param {Event} evt - The event.
   */
  handleChange(evt) {
    var value = evt.target.value;
    this._node.size = value.length;
    if (this.isEditable()) {
      if (this.element.isDuplicateKey(value)) {
        this.setState({ duplicate: true });
      } else if (this.state.duplicate) {
        this.setState({ duplicate: false });
      }
      this.element.rename(value);
    }
  }

  /**
   * Handle focus on the key.
   */
  handleFocus() {
    if (this.isEditable()) {
      this.setState({ editing: true });
    }
  }

  /**
   * Handle blur from the key.
   */
  handleBlur() {
    if (this.isEditable()) {
      this.setState({ editing: false });
    }
  }

  /**
   * Is this component editable?
   *
   * @returns {Boolean} If the component is editable.
   */
  isEditable() {
    return this.element.isKeyEditable() && this.element.parentElement.currentType !== 'Array';
  }

  /**
   * Get the style for the key of the element.
   *
   * @returns {String} The key style.
   */
  style() {
    var style = KEY_CLASS;
    if (this.state.editing) {
      style = style.concat(` ${EDITING}`);
    }
    if (this.state.duplicate) {
      style = style.concat(` ${DUPLICATE}`);
    }
    return style;
  }
}

EditableKey.displayName = 'EditableKey';

module.exports = EditableKey;