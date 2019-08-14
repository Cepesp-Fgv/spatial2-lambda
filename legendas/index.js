"use strict";

const db = require("knex")({
    client: process.env.DB_CONNECTION,
    connection: {
        host : process.env.DB_HOST,
        user : process.env.DB_USERNAME,
        password : process.env.DB_PASSWORD,
        database : process.env.DB_DATABASE
    }
});

exports.handler = function(event, context, callback) {
    const { uf, position, year, turn } = event.params.querystring;
    getCoalitions(uf, position, year, turn)
        .then(result => callback(null, createResponse(result)));
};

function getCoalitions(uf, position, year, turn) {
    return db('legendas')
        .where('sigla_uf', uf)
        .where('codigo_cargo', position)
        .where('ano_eleicao', year)
        .where('num_turno', turn);
}

function createResponse(result, statusCode) {
    return {
        statusCode,
        body: JSON.stringify(result)
    };
}