'use strict';

const _ = require('lodash');
const React = require('react');
const ReactDOM = require('react-dom');
const app = require('ampersand-app');
const Action = require('hadron-action');
const ObjectID = require('bson').ObjectID;
const Document = require('./document');
const ResetDocumentListStore = require('../store/reset-document-list-store');
const LoadMoreDocumentsStore = require('../store/load-more-documents-store');
const RemoveDocumentStore = require('../store/remove-document-store');
const InsertDocumentStore = require('../store/insert-document-store');
const InsertDocumentDialog = require('./insert-document-dialog');
const SamplingMessage = require('./sampling-message');
const Actions = require('../actions');

/**
 * The full document list container class.
 */
const LIST_CLASS = 'document-list';

/**
 * The scroll event name.
 */
const SCROLL_EVENT = 'scroll';

/**
 * Base empty doc for insert dialog.
 */
const EMPTY_DOC = { '': '' };

/**
 * Component for the entire document list.
 */
class DocumentList extends React.Component {

  /**
   * Attach the scroll event to the parent container.
   */
  attachScrollEvent() {
    this._node.parentNode.addEventListener(
      SCROLL_EVENT,
      this.handleScroll.bind(this)
    );
  }

  /**
   * Fetch the state when the component mounts.
   */
  componentDidMount() {
    this.attachScrollEvent();
    this.unsubscribeReset = ResetDocumentListStore.listen(this.handleReset.bind(this));
    this.unsubscribeLoadMore = LoadMoreDocumentsStore.listen(this.handleLoadMore.bind(this));
    this.unsubscribeRemove = RemoveDocumentStore.listen(this.handleRemove.bind(this));
    this.unsibscribeInsert = InsertDocumentStore.listen(this.handleInsert.bind(this));
  }

  /**
   * Unsibscribe from the document list store when unmounting.
   */
  componentWillUnmount() {
    this.unsubscribeReset();
    this.unsubscribeLoadMore();
    this.unsubscribeRemove();
    this.unsubscribeInsert();
  }

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.state = { docs: [], nextSkip: 0 };
  }

  /**
   * Handle the loading of more documents.
   *
   * @param {Array} documents - The next batch of documents.
   */
  handleLoadMore(documents) {
    // If not resetting we append the documents to the existing
    // list and increment the page. The loaded count is incremented
    // by the number of new documents.
    this.setState({
      docs: this.state.docs.concat(this.renderDocuments(documents)),
      nextSkip: (this.state.nextSkip + documents.length),
      loadedCount: (this.state.loadedCount + documents.length)
    });
  }

  /**
   * Handle the reset of the document list.
   *
   * @param {Array} documents - The documents.
   * @param {Integer} count - The count.
   */
  handleReset(documents, count) {
    // If resetting, then we need to go back to page one with
    // the documents as the filter changed. The loaded count and
    // total count are reset here as well.
    this.setState({
      docs: this.renderDocuments(documents),
      nextSkip: documents.length,
      count: count,
      loadedCount: documents.length
    });
  }

  /**
   * Handles removal of a document from the document list.
   *
   * @param {Object} id - The id of the removed document.
   */
  handleRemove(id) {
    var index = _.findIndex(this.state.docs, (component) => {
      if (id instanceof ObjectID) {
        return id.equals(component.props.doc._id);
      }
      return component.props.doc._id === id;
    });
    this.state.docs.splice(index, 1);
    this.setState({
      docs: this.state.docs,
      loadedCount: (this.state.loadedCount - 1),
      nextSkip: (this.state.nextSkip - 1)
    });
  }

  /**
   * Handle the scroll event of the parent container.
   *
   * @param {Event} evt - The scroll event.
   */
  handleScroll(evt) {
    var container = evt.srcElement;
    if (container.scrollTop > (this._node.offsetHeight - this._scrollDelta())) {
      // If we are scrolling downwards, and have hit the distance to initiate a scroll
      // from the end of the list, we will fire the event to load more documents.
      this.loadMore();
    }
  }

  /**
   * Handle opening of the insert dialog.
   */
  handleOpenInsert() {
    Actions.openInsertDocumentDialog(EMPTY_DOC);
  }

  /**
   * Handle insert of a new document.
   *
   * @param {Boolean} success - If the insert was successful.
   * @param {Object} object - The new document or error.
   */
  handleInsert(success, object) {
    if (success) {
      this.setState({ count: this.state.count + 1 });
      this.loadMore();
    }
  }

  /**
   * Get the next batch of documents. Will only fire if there are more documents
   * in the collection to load.
   */
  loadMore() {
    if (this.state.loadedCount < this.state.count) {
      Action.fetchNextDocuments(this.state.nextSkip);
    }
  }

  /**
   * Render the document list.
   *
   * @returns {React.Component} The document list.
   */
  render() {
    return (
      <div>
        <SamplingMessage insertHandler={this.handleOpenInsert.bind(this)} />
        <div className='column-container with-refinebar-and-message'>
          <div className='column main'>
            <ol className={LIST_CLASS} ref={(c) => this._node = c}>
              {this.state.docs}
              <InsertDocumentDialog />
            </ol>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Get the document list item components.
   *
   * @param {Array} docs - The raw documents.
   *
   * @return {Array} The document list item components.
   */
  renderDocuments(docs) {
    return _.map(docs, (doc) => {
      return (<Document doc={doc} key={doc._id} />);
    });
  }

  /**
   * Determine if the component should update.
   *
   * @param {Object} nextProps - The next properties.
   * @param {Object} nextState - The next state.
   */
  shouldComponentUpdate(nextProps, nextState) {
    return (nextState.docs.length !== this.state.docs.length) ||
      (nextState.nextSkip !== this.state.nextSkip) ||
      (nextState.loadedCount !== this.state.loadedCount);
  }

  /**
   * Get the distance in pixels from the end of the document list to the point when
   * scrolling where we want to load more documents.
   *
   * @returns {Integer} The distance.
   */
  _scrollDelta() {
    if (!this.scrollDelta) {
      this.scrollDelta = this._node.offsetHeight;
    }
    return this.scrollDelta;
  }
}

DocumentList.displayName = 'DocumentList';
DocumentList.Document = Document;

module.exports = DocumentList;