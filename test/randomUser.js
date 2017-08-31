const randomUser = async function() {

  const db = await require('mongoose').connect('mongodb://mongo:27017', {useMongoClient: true});
  const User = require('../models/user.js');
  const requestPromise = require('request-promise');

  const url = 'https://randomuser.me/api/';
  const person = JSON.parse(await requestPromise({
    method: 'GET',
    url: url
  })).results[0];

  const address = {
    recipient: `${person.name.first} ${person.name.last}`,
    street: person.location.street,
    city: person.location.city,
    post: person.location.postcode,
    country: person.nat,
  }
  const user = new User({
    name: {
      first: person.name.first,
      last: person.name.last
    },
    email: person.email,
  });

  user.save();

  return {
    address,
    _id: user._id
  }

};

module.exports = randomUser;
