const app = require('ampersand-app');
const Reflux = require('reflux');
const StateMixin = require('reflux-state-mixin');

const SidebarActions = require('../actions');
const InstanceActions = app.appRegistry.getAction('App.InstanceActions');

const debug = require('debug')('mongodb-compass:stores:sidebar');

/**
* Compass Sidebar store.
*/

const SidebarStore = Reflux.createStore({
  /**
  * adds a state to the store, similar to React.Component's state
  * @see https://github.com/yonatanmn/Super-Simple-Flux#reflux-state-mixin
  */
  mixins: [StateMixin.store],

  /**
  * listen to all actions defined in ../actions/index.jsx
  */
  listenables: [InstanceActions, SidebarActions],

  /**
  * Initialize everything that is not part of the store's state.
  */
  init() {},

  /**
  * Initialize the Compass Sidebar store state.
  *
  * @return {Object} initial store state.
  */
  getInitialState() {
    return {
      instance: {},
      databases: [],
      filterRegex: /.*/
    };
  },

  setInstance(instance) {
    this.setState({
      instance,
      databases: this._filterDatabases(this.state.filterRegex, instance.databases)
    });
  },

  filterDatabases(re) {
    this.setState({
      databases: this._filterDatabases(re, this.state.instance.databases),
      filterRegex: re
    });
  },

  _filterDatabases(re, databases) {
    if (databases.isEmpty()) {
      return [];
    }

    return databases.reduce((filteredDbs, db) => {
      if (re.test(db._id)) {
        filteredDbs.push(db.toJSON());
      } else {
        const collections = db.collections.models.filter(c => re.test(c._id));
        if (collections.length) {
          filteredDbs.push({
            _id: db._id,
            collections
          });
        }
      }

      return filteredDbs;
    }, []);
  },

  /**
  * log changes to the store as debug messages.
  * @param  {Object} prevState   previous state.
  */
  storeDidUpdate(prevState) {
    debug('Sidebar store changed from', prevState, 'to', this.state);
  }
});

module.exports = SidebarStore;