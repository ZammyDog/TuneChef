import express from 'express';
import bodyParser from 'body-parser';
import moment from 'moment';

import Party from '../models/partyModel';

const router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

router.post('/create', (req, res) => {
  Party.create({
    name: req.body.name,
    id: req.body.id,
    author: req.body.author,
    desc: req.body.desc,
    date: moment(),
  },
  (err, party) => {
    if (err) {
      return res.status(500).send('There was a problem adding the information to the database');
    }

    return res.status(200).send(party);
  });
});

router.get('/id', (req, res) => {
  Party.findOne({ _id: req.query.id }, (err, party) => {
    if (err || !party) {
      return res.status(200).json({ success: false });
    }
    return res.status(200).json({ success: true, party });
  });
});

router.get('/user', (req, res) => {
  Party.find({ author: req.query.user }, (err, parties) => {
    if (err || !parties) {
      return res.status(200).json({ success: false });
    }
    return res.status(200).json({ success: true, parties });
  });
});

router.delete('/id', (req, res) => {
  Party.deleteOne({ _id: req.query.id }, (err) => {
    if (err) {
      res.status(500).send(err);
    }
    res.status(200).send('Success!');
  });
});

export default router;
