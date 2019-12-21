import express from 'express';
import bodyParser from 'body-parser';
import SpotifyWebApi from 'spotify-web-api-node';

import Party from '../models/partyModel';

const router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

const spotifyCreds = {
  clientId: 'c0d3ae62e6e74f0baa142965fcaa68c6',
  clientSecret: process.env.SPOTIFY_SECRET,
  redirectUri: 'https://tunechef.herokuapp.com/callback',
};

let spotifyApi = new SpotifyWebApi(spotifyCreds);

const joinCreds = {
  clientId: 'c0d3ae62e6e74f0baa142965fcaa68c6',
  clientSecret: process.env.SPOTIFY_SECRET,
  redirectUri: 'https://tunechef.herokuapp.com/thanks',
};

let joinApi = new SpotifyWebApi(joinCreds);

router.get('/authorize', (req, res) => {
  const scopes = ['user-read-private',
    'user-read-email',
    'playlist-read-collaborative',
    'playlist-modify-private',
    'playlist-modify-public',
    'playlist-read-private',
    'user-follow-read',
    'user-top-read',
  ];
  // const redirectUri = 'https://tunechef.herokuapp.com/callback';
  // const clientId = 'c0d3ae62e6e74f0baa142965fcaa68c6';

  // // Setting credentials can be done in the wrapper's constructor, or using the API object's setters.
  // const spotifyApi = new SpotifyWebApi({
  //   redirectUri,
  //   clientId,
  // });

  // Create the authorization URL
  const authorizeURL = spotifyApi.createAuthorizeURL(scopes);

  return res.status(200).send(authorizeURL);
});

router.put('/setcode', (req, res) => {
  // Retrieve an access token and a refresh token
  spotifyApi.authorizationCodeGrant(req.body.code)
    .then(
      (data) => {
        // Set the access token on the API object to use it in later calls
        spotifyApi.setAccessToken(data.body['access_token']);
        spotifyApi.setRefreshToken(data.body['refresh_token']);

        return res.status(200).json({ success: true, result: data.body['access_token'] });
      },
      (err) => {
        return res.status(200).json({ success: false, result: err });
      },
    );
});

router.get('/user', (req, res) => {
  spotifyApi.getMe()
    .then((data) => {
      return res.status(200).send(data);
    }, (err) => {
      return res.status(500).send(err);
    });
});

router.put('/joined', (req, res) => {
  // Retrieve an access token and a refresh token
  joinApi.authorizationCodeGrant(req.body.code)
    .then((data) => {
      // Set the access token on the API object to use it in later calls
      joinApi.setAccessToken(data.body['access_token']);
      joinApi.setRefreshToken(data.body['refresh_token']);
      joinApi.getMe()
        .then((user) => {
          Party.findOne({ _id: req.body.id }, (err, party) => {
            if (err || !party) {
              return res.status(200).json({ success: false, result: err, user: '' });
            }

            let users = {};
            if (party.users) {
              users = JSON.parse(JSON.stringify(party.users));
            }

            let topTracks = [];
            let topArtists = [];

            // get the top artists and tracks for the user info in the database
            async function waitForTop() {
              const promises = [];

              promises.push(new Promise((resolve) => {
                joinApi.getMyTopTracks({ limit: 50 })
                  .then((response) => {
                    topTracks = response.body.items.map((i) => (i.id));
                    resolve();
                  }, (error) => {
                    if (error) {
                      console.error(error);
                    }
                  });
              }));
              promises.push(new Promise((resolve) => {
                joinApi.getMyTopArtists({ limit: 50 })
                  .then((response) => {
                    topArtists = response.body.items.map((i) => (i.id));
                    resolve();
                  }, (error) => {
                    if (error) {
                      console.error(error);
                    }
                  });
              }));

              await Promise.all(promises);

              users[user.body.id] = {
                name: user.body.display_name,
                img: user.body.images && user.body.images[0] ? user.body.images[0].url : '',
                topTracks,
                topArtists,
              };

              Party.findOneAndUpdate(
                { _id: req.body.id },
                { users },
                { new: true },
                (error, newParty) => {
                  if (error) {
                    return res.status(200).json({ success: false, result: err, user: '' });
                  }
                  return res.status(200).json({ success: true, result: newParty, user: user.body.display_name });
                },
              );
            }

            waitForTop();
          });
        }, (err) => {
          return res.status(200).json({ success: false, result: err, user: '' });
        });
    },
    (err) => {
      return res.status(200).json({ success: false, result: err, user: '' });
    });
});

router.get('/join', (req, res) => {
  const scopes = ['user-read-private',
    'user-read-email',
    'playlist-read-collaborative',
    'playlist-modify-private',
    'playlist-modify-public',
    'playlist-read-private',
    'user-follow-read',
    'user-top-read',
  ];

  const state = req.query.id;

  // Create the authorization URL
  const authorizeURL = joinApi.createAuthorizeURL(scopes, state);

  return res.status(200).send(authorizeURL);
});

router.put('/logout', (req, res) => {
  spotifyApi.resetCredentials();
  joinApi.resetCredentials();
  spotifyApi = new SpotifyWebApi(spotifyCreds);
  joinApi = new SpotifyWebApi(joinCreds);
  return res.status(200).send('Success!');
});

/**
 * Get top 3 tracks from each user to playlist
 */
function getTopTracks(tracksList, cb) {
  const tracks = [];
  for (let i = 0; i < tracksList.length; i++) {
    for (let j = 0; j < tracksList[i].length / 2; j++) {
      tracks.push(tracksList[i][j]);
    }
  }
  cb(tracks);
}

/**
 * Returns track importance
 */
function getTrackImportance(trackId, tracksList) {
  let importance = 0;

  for (let i = 0; i < tracksList.length; i++) {
    for (let j = 0; j < tracksList[i].length; j++) {
      if (tracksList[i][j] === trackId) {
        importance += (tracksList[i].length - (j + 1));
        break;
      }
    }
  }

  return importance;
}


/**
 * Returns json object array of tracks that user's have in common
 */
function getCommonTracks(tracksList, cb) {
  const tracksImportance = [];
  const tracks = [];

  for (let i = 0; i < tracksList.length; i++) {
    for (let j = 0; j < tracksList[i].length; j++) {
      tracksImportance.push([tracksList[i][j], getTrackImportance(tracksList[i][j], tracksList)]);
    }
  }

  tracksImportance.sort((a, b) => (b[1] - a[1]));

  for (let i = 0; i < Math.min(tracksImportance.length, 20); i++) {
    tracks.push(tracksImportance[i][0]);
  }

  // for (let i, k = 0; k < tracksList.length * 3 && i < tracksImportance.length; i++, k++) {
  //   let skip = false;
  //   for (let j = 0; j < tracks.length; j++) {
  //     if (tracksImportance[i][0] === tracks[j]) {
  //       skip = true;
  //       k--;
  //     }
  //   }

  //   if (!skip) {
  //     tracks.push(tracksImportance[i][0]);
  //   }
  // }

  cb(tracks);
}

/**
 * gets given artist appropriate amount of times to playlist
 */
function getArtistTopTracks(artistId, amount, cb) {
  spotifyApi.getArtistTopTracks(artistId, 'US')
    .then((data) => {
      const tracks = [];
      for (let i = 0; i < amount && i < data.body.tracks.length; i++) {
        tracks.push(data.body.tracks[i].id);
      }

      cb(tracks);
    }, (err) => {
      /* eslint no-console: ["warn", { allow: ["error"] }] */
      console.error(err);
    });
}

/**
 * Returns artist importance
 */
function getArtistImportance(artistId, artistsList) {
  let importance = -1;

  for (let i = 0; i < artistsList.length; i++) {
    for (let j = 0; j < artistsList[i].length; j++) {
      if (artistsList[i][j].id === artistId) {
        importance++;
        break;
      }
    }
  }

  return importance;
}

/**
 * Returns json object target parameters for recommendation
 */
function getTargets(tracksList, cb) {
  let total = 0;

  const seeds = [];
  let seedCount = 0;

  const targets = {
    target_duration_ms: 0,
    target_key: 0,
    target_mode: 0,
    target_time_signature: 0,
    target_acousticness: 0,
    target_danceability: 0,
    target_energy: 0,
    target_instrumentalness: 0,
    target_liveness: 0,
    target_loudness: 0,
    target_speechiness: 0,
    target_valence: 0,
    target_tempo: 0,
  };

  async function waitForAllTracks() {
    const promises = [];

    for (let i = 0; i < tracksList.length; i++) {
      for (let j = 0; j < tracksList[i].length; j++) {
        /* eslint no-loop-func: ["off"] */
        promises.push(new Promise((resolve) => {
          if (seedCount < 5 && !seeds.includes(tracksList[i][j])) {
            seeds.push(tracksList[i][j]);
            seedCount++;
          }
          spotifyApi.getAudioFeaturesForTrack(tracksList[i][j])
            .then((features) => {
              targets.target_duration_ms += features.body.duration_ms;
              targets.target_key += features.body.key;
              targets.target_mode += features.body.mode;
              targets.target_time_signature += features.body.time_signature;
              targets.target_acousticness += features.body.acousticness;
              targets.target_danceability += features.body.danceability;
              targets.target_energy += features.body.energy;
              targets.target_instrumentalness += features.body.instrumentalness;
              targets.target_liveness += features.body.liveness;
              targets.target_loudness += features.body.loudness;
              targets.target_speechiness += features.body.speechiness;
              targets.target_valence += features.body.valence;
              targets.target_tempo += features.body.tempo;
              total++;
              resolve();
            }, () => {
              resolve();
            });
        }));
      }
    }


    await Promise.all(promises);

    if (total !== 0) {
      Object.entries(targets).forEach(([key, value]) => {
        targets[key] = Math.round(value / total);
      });
      // targets.target_key = Math.round(targets.target_key);
      // targets.target_mode = Math.round(targets.target_mode);
    }

    cb(targets, seeds);
  }

  waitForAllTracks();
}

/**
 * Returns json object array generated recommendations
 */
function getRecommendations(tracksList, cb) {
  const recommendedTracks = [];

  getTargets(tracksList, (targets, seeds) => {
    spotifyApi.getRecommendations({ ...targets, seed_tracks: seeds })
      .then((recommendations) => {
        for (let i = 0; i < recommendations.body.tracks.length; i++) {
          recommendedTracks.push(recommendations.body.tracks[i].id);
        }
        cb(recommendedTracks);
      }, (err) => {
        return err;
      });
  });
}

/**
 * Returns json object array of top 5 artists user's have in common
 */
// function getSeedArtists() {

// }


/**
 * Return json object array of tracks from artists that user's have in common
 */
function getCommonArtists(artistsList, cb) {
  let tracks = [];
  const promises = [];
  for (let i = 0; i < artistsList.length; i++) {
    for (let j = 0; j < artistsList[i].length; j++) {
      promises.push(new Promise((resolve) => {
        getArtistTopTracks(artistsList[i][j].id, getArtistImportance(artistsList[i][j].id, artistsList), (t) => {
          tracks = [...tracks, ...t];
          resolve();
        });
      }));
    }
  }

  async function waitForArtists() {
    await Promise.all(promises);
    cb(tracks);
  }

  waitForArtists();
}


/**
 * Adds passed tracks list to passed playlist id
 */
function addTracks(playlistId, tracksList, res, data) {
  const tracks = tracksList.map((x) => `spotify:track:${x}`);
  spotifyApi.addTracksToPlaylist(playlistId, tracks)
    .then(() => {
      return res.status(200).json({ success: true, result: data });
    }, (err) => {
      return res.status(500).json({ success: false, result: err });
    });
  return tracks;
}

router.post('/generate', (req, res) => {
  let playlistId = -1;
  const tracksList = [];
  const artistsList = [];

  Party.findOne({ _id: req.body.id })
    .then((party) => {
      Object.values(party.users).forEach((user) => {
        tracksList.push(user.topTracks);
        artistsList.push(user.topArtists);
      });
      spotifyApi.createPlaylist(req.body.userId, party.name, { public: true })
        .then((data) => {
          playlistId = data.body.id;
          let tracks = [];
          async function waitForGets() {
            await Promise.all([
              new Promise((resolve) => {
                getTopTracks(tracksList, (t) => {
                  tracks = [...tracks, ...t];
                  resolve();
                });
              }),
              new Promise((resolve) => {
                getCommonTracks(tracksList, (t) => {
                  tracks = [...tracks, ...t];
                  resolve();
                });
              }),
              // new Promise((resolve) => {
              //   getCommonArtists(artistsList, (t) => {
              //     tracks = [...tracks, ...t];
              //     resolve();
              //   });
              // }),
              // new Promise((resolve) => {
              //   getRecommendations(tracksList, (t) => {
              //     console.log(t);
              //     tracks = [...tracks, ...t];
              //     resolve();
              //   });
              // }),
            ]);

            addTracks(playlistId, Array.from(new Set(tracks)), res, data.body);
          }

          waitForGets();
        }, (err) => {
          return res.status(200).json({ success: false, result: err });
        });
    })
    .catch((err) => {
      return res.status(200).json({ success: false, result: err });
    });
});

export default router;
