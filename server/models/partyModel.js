import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const PartySchema = new Schema({
  name: String,
  id: String,
  desc: String,
  author: String,
  date: Date,
  users: Object,
});

const Party = mongoose.model('Party', PartySchema, 'Parties');

module.exports = Party;
