exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('plans').del()
    .then(function () {
      // Inserts seed entries
      return knex('plans').insert([
        {id: 1, name: 'Basic', price: 99, features: 'Basic market analysis, Standard portfolio tracking'},
        {id: 2, name: 'Pro', price: 299, features: 'Advanced market analysis, AI-powered insights, Portfolio risk analysis'},
        {id: 3, name: 'Premium', price: 599, features: 'All Pro features, Personalized investment suggestions, Priority support'}
      ]);
    });
};