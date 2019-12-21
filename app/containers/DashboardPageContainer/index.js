import React from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import classNames from 'classnames';
import { Link, Redirect } from 'react-router-dom';

import arts from '../../arts.css';
import styles from './styles.css';

class DashboardPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      parties: [],
    };

    this.logout = this.logout.bind(this);
  }

  componentDidMount() {
    const user = localStorage.getItem('userName');
    if ((user === undefined) || (user == null) || (user === 'undefined')) {
      return;
    }

    axios.get('/api/party/user', {
      params: {
        user,
      },
    })
      .then((response) => {
        if (response.data.success) {
          this.setState({
            parties: response.data.parties,
          });
        }
      })
      .catch((error) => {
        /* eslint no-console: ["warn", { allow: ["error"] }] */
        console.error(error);
      });
  }

  logout() {
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    const url = 'https://www.spotify.com/logout/';
    const spotifyLogoutWindow = window.open(url, 'Spotify Logout', 'width=700,height=500,top=40,left=40');
    setTimeout(() => {
      spotifyLogoutWindow.close();
      this.props.history.push('/');
    }, 2000);
  }

  render() {
    const user = localStorage.getItem('userName');
    if ((user === undefined) || (user == null) || (user === 'undefined')) {
      return <Redirect to="/" />;
    }

    return (
      <div className={arts.body}>
        <div className={arts.header}>
          Dashboard
        </div>

        <div className={styles.logoutButton} role="button" tabIndex={0} onClick={this.logout}>
          Logout
        </div>

        <div className={styles.partyHolder}>
          <Link className={styles.newPartyContainer} to="/create">
            <i className={classNames('fas fa-plus', styles.newPartyIcon)} />
            <div className={styles.newPartyText}>
              Create a New Party
            </div>
          </Link>

          {this.state.parties.map((party) => (
            <Link className={styles.partyContainer} key={party._id} to={`/party/${party._id}`}>
              <div className={styles.partyText}>
                {party.name}
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }
}

DashboardPage.propTypes = {
  history: PropTypes.object,
};

export default DashboardPage;
