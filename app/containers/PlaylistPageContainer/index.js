import React from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import { Link, Redirect } from 'react-router-dom';

import { viewportToPixels } from '../../tools/helpers';
import Loader from '../../components/Loader';
import arts from '../../arts.css';
import styles from './styles.css';

class PlaylistPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      ready: false,
      id: '',
      url: '',
    };
  }

  componentDidMount() {
    const user = localStorage.getItem('userName');
    if ((user === undefined) || (user == null) || (user === 'undefined')) {
      return;
    }

    const id = this.props.match.params.id;
    if (id == null) {
      this.setState({ ready: true });
      return;
    }

    axios.post('/api/spotify/generate', {
      id,
      userId: localStorage.getItem('userId'),
    })
      .then((response) => {
        if (!response.data.success) {
          this.setState({ ready: true });
          return;
        }

        this.setState({
          url: response.data.result.external_urls.spotify,
          id: response.data.result.id,
          ready: true,
        });
      })
      .catch((error) => {
        /* eslint no-console: ["warn", { allow: ["error"] }] */
        console.error(error);
      });
  }

  render() {
    const user = localStorage.getItem('userName');
    if ((user === undefined) || (user == null) || (user === 'undefined') || (this.state.ready && !this.state.id)) {
      return <Redirect to="/" />;
    }

    return this.state.ready ? (
      <div className={arts.body}>
        <div className={arts.header}>
          The TechChef has cooked up your playlist!
        </div>
        <Link className={styles.back} to="/dashboard">
          Back
        </Link>

        <div className={styles.openRow}>
          <a href={this.state.url} target="_blank" rel="noopener noreferrer" className={styles.open}>
            Open Spotify
          </a>
          <div className={styles.openText}>
            or just listen to it below!
          </div>
        </div>

        <iframe
          src={`https://open.spotify.com/embed/playlist/${this.state.id}`}
          title="Playlist"
          width={viewportToPixels('60vw')}
          height={viewportToPixels('60vh')}
          frameBorder="0"
          allow="encrypted-media"
          className={styles.playlist}
        />
      </div>
    ) : (
      <div className={arts.body} style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Loader />
      </div>
    );
  }
}

PlaylistPage.propTypes = {
  match: PropTypes.object,
};

export default PlaylistPage;
