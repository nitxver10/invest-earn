exports.up = function(knex) {
  return knex.schema
    .createTable('plans', function (table) {
       table.increments('id');
       table.string('name', 255).notNullable();
       table.decimal('price').notNullable();
       table.text('features').notNullable();
    })
    .createTable('subscriptions', function (table) {
       table.increments('id');
       table.integer('user_id').unsigned().references('id').inTable('users');
       table.integer('plan_id').unsigned().references('id').inTable('plans');
       table.datetime('start_date').notNullable();
       table.datetime('end_date').notNullable();
       table.string('status', 255).notNullable();
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTable('subscriptions')
    .dropTable('plans');
};