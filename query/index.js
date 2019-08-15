"use strict";

const db = require("knex")({
    client: process.env.DB_CONNECTION,
    connection: {
        host: process.env.DB_HOST,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE
    }
});

exports.handler = function(event, context, callback) {
    context.callbackWaitsForEmptyEventLoop = false; 
    const params = event.queryStringParameters;
    let promise;
    
    if (params.table === 'legendas') {
        promise = getCoalitions(params);
    } else if (params.table === 'candidatos') {
        promise = getCandidates(params);
    } else if (params.table === 'votos_mun') {
        promise = getMunVotes(params);
    }
    
    if (promise)
        promise.then(result => callback(null, createResponse(result)));
    else
        callback("Invalid Table");
};

function getCoalitions(params) {
    const { uf, position, year, turn } = params;
    
    return db('candidatos')
        .select(['sigla_partido', 'numero_partido'])
        .where('sigla_uf', uf)
        .where('codigo_cargo', position)
        .where('ano_eleicao', year)
        .where('num_turno', turn)
        .groupBy(['sigla_partido', 'numero_partido']);
}

function getCandidates(params) {
    const { uf, position, year, turn, party } = params;
    
    return db('candidatos')
        .where('sigla_uf', uf)
        .where('codigo_cargo', position)
        .where('ano_eleicao', year)
        .where('num_turno', turn)
        .where('numero_partido', party);
}

function getMunVotes(params) {
    const { uf, year, turn, candidate_id} = params;
    
    return db('votos_mun')
        .where('uf', uf)
        .where('ano_eleicao', year)
        .where('num_turno', turn)
        .where('id_candidato', candidate_id);
}

function createResponse(result, statusCode) {
    return {
        statusCode,
        body: JSON.stringify(result)
    };
}