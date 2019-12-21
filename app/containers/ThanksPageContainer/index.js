import React from 'react';
import axios from 'axios';
import classNames from 'classnames';
import { Link, Redirect } from 'react-router-dom';

import Loader from '../../components/Loader';
import { getQueryVar } from '../../tools/helpers';
import arts from '../../arts.css';
import styles from './styles.css';

class ThanksPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      ready: false,
      name: '',
      author: '',
      myParty: false,
      id: '',
    };
  }

  componentDidMount() {
    const code = getQueryVar('code');
    const id = getQueryVar('state');

    axios.put('/api/spotify/joined', {
      code,
      id,
    })
      .then((response) => {
        if (!response.data.success) {
          this.setState({ ready: true });
          return;
        }

        this.setState({
          name: response.data.result.name,
          author: response.data.result.author,
          myParty: response.data.result.author === response.data.user,
          id,
          ready: true,
        });
      })
      .catch((error) => {
        /* eslint no-console: ["warn", { allow: ["error"] }] */
        console.error(error);
      });
  }

  render() {
    if (this.state.ready && !this.state.name) {
      return <Redirect to="/" />;
    }

    return (
      <div className={arts.body} style={{ justifyContent: 'center', alignItems: !this.state.ready ? 'center' : null }}>
        {this.state.ready ? (
          <div className={styles.container}>
            <div className={styles.thanks}>
              Thanks!
            </div>

            <i className={classNames('fas fa-check', styles.icon)} />

            <div className={styles.joinText}>
              {`You Joined ${this.state.author}'s Party:`}
            </div>
            <div className={styles.joinBigText}>
              {this.state.name}
            </div>

            {this.state.myParty ? (
              <div className={styles.ownText}>
                <Link to={`/party/${this.state.id}`} className={styles.link}>
                  View Your Party
                </Link>
              </div>
            ) : (
              <div className={styles.ownText}>
                {'Create your own Party at '}
                <Link to="/" className={styles.link}>
                  TuneChef
                </Link>
              </div>
            )}
          </div>
        ) : (
          <Loader />
        )}
      </div>
    );
  }
}

export default ThanksPage;
