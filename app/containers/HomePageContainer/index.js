import React from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';

import TuneChef from '../../images/TuneChef.png';
import { getQueryVar } from '../../tools/helpers';
import arts from '../../arts.css';
import styles from './styles.css';

const authorize = () => {
  axios.get('/api/spotify/authorize')
    .then((response) => {
      window.open(response.data, '_self');
    })
    .catch((err) => {
      console.error(err);
    });
};

class HomePage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  componentDidMount() {
    // get the query var code from spotify callback
    const code = getQueryVar('code');
    if (code) {
      axios.put('/api/spotify/setcode', {
        code,
      })
        .then((response) => {
          // if the code doens't work, don't use it
          if (!response.data.success) {
            this.props.history.push('/');
            return;
          }

          axios.get('/api/spotify/user', {
          })
            .then((res) => {
              localStorage.setItem('userId', res.data.body.id);
              localStorage.setItem('userName', res.data.body.display_name);
              this.props.history.push('/dashboard');
            })
            .catch((err) => {
              console.error(err);
            });
        })
        .catch((err) => {
          /* eslint no-console: ["warn", { allow: ["error"] }] */
          console.error(err);
        });
    }
  }

  render() {
    return (
      <div className={arts.body}>
        <div className={styles.titleRow}>
          <img src={TuneChef} alt="TuneChef Logo" className={styles.logo} draggable={false} />
          <div className={styles.title}>
            TuneChef
          </div>
        </div>
        <div className={styles.desc}>
          Using AI to Cook Up Playlists for Any Gathering
        </div>
        <div className={styles.button} role="button" tabIndex={0} onClick={authorize}>
          Get Started
        </div>
      </div>
    );
  }
}

HomePage.propTypes = {
  history: PropTypes.object.isRequired,
};

export default HomePage;
