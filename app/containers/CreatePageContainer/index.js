import React from 'react';
import isMobile from 'react-device-detect';
import axios from 'axios';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { Redirect } from 'react-router-dom';

import Loader from '../../components/Loader';
import arts from '../../arts.css';
import styles from './styles.css';

class CreatePage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      name: '',
      nameError: '',
      desc: '',
      loading: false,
    };

    this.onCreate = this.onCreate.bind(this);
  }

  onCreate(e) {
    e.preventDefault();
    this.setState({ loading: true });

    let nameError = '';

    if (!this.state.name) {
      nameError = "You can't have a party without a cool name!";
    }

    this.setState({ nameError });

    if (!nameError) {
      axios.post('/api/party/create', {
        name: this.state.name,
        desc: this.state.desc,
        author: localStorage.getItem('userName'),
        id: localStorage.getItem('userId'),
      })
        .then((response) => {
          this.props.history.push(`/party/${response.data._id}`);
        })
        .catch((error) => {
          /* eslint no-console: ["warn", { allow: ["error"] }] */
          console.error(error);
        });
    } else {
      this.setState({ loading: false });
    }
  }

  render() {
    const user = localStorage.getItem('userName');
    if ((user === undefined) || (user == null) || (user === 'undefined')) {
      return <Redirect to="/" />;
    }

    return (
      <div className={arts.body}>
        <div className={arts.header}>
          Create
        </div>

        <form onSubmit={this.onCreate} className={styles.form}>
          <div className={styles.subheader}>
            Party Name
          </div>
          <input
            className={classNames(styles.nameInput, { [styles.inputError]: this.state.nameError })}
            placeholder="Ex. Super Cool Party Mix #72"
            onChange={(e) => this.setState({ name: e.target.value.substring(0, 50), nameError: '' })}
            type="text"
            autoFocus={!isMobile ? 'autofocus' : ''}
            value={this.state.name}
          />
          {this.state.nameError ? (
            <div className={styles.errorContainer}>
              <i className="fas fa-times" style={{ marginRight: 20 }} />
              {this.state.nameError}
            </div>
          ) : null}

          <div className={styles.subheader}>
            Description
          </div>
          <textarea
            className={styles.descInput}
            placeholder="Optional!"
            onChange={(e) => this.setState({ desc: e.target.value.substring(0, 200) })}
            data-gramm_editor="false"
            value={this.state.desc}
          />

          {this.state.loading ? (
            <Loader />
          ) : (
            <input
              type="submit"
              value="Start the Party!"
              tabIndex={0}
              className={classNames(styles.submitButton, { [styles.buttonError]: this.state.nameError })}
              style={{ backgroundColor: this.state.name ? 'rgba(129, 30, 250, 1)' : 'rgba(129, 30, 250, 0.4)' }}
            />
          )}
        </form>
      </div>
    );
  }
}

CreatePage.propTypes = {
  history: PropTypes.object.isRequired,
};

export default CreatePage;
