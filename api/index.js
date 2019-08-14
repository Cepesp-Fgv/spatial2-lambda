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
    const params = event.queryStringParameters;
    var promise;
    
    if (params.table === 'legendas') {
        const { uf, codigo_cargo, ano_eleicao, num_turno } = params;
        promise = getCoalitions(uf, codigo_cargo, ano_eleicao, num_turno);
    } else if (params.table === 'candidatos') {
        const { uf, codigo_cargo, ano_eleicao, num_turno, id_legenda } = params;
        promise = getCandidates(uf, codigo_cargo, ano_eleicao, num_turno, id_legenda);
    } else if (params.table === 'votos_mun') {
        const { uf, ano_eleicao, num_turno, id_candidato } = params;
        promise = getMunVotes(uf, ano_eleicao, num_turno, id_candidato);
    }
    
    if (promise)
        promise.then(result => callback(null, createResponse(result)));
    else
        callback("Invalid Table");
};

function getCoalitions(uf, position, year, turn) {
    return db('candidatos')
        .where('sigla_uf', uf)
        .where('codigo_cargo', position)
        .where('ano_eleicao', year)
        .where('num_turno', turn)
        .group_by('sigla_partido');
}

function getCandidates(uf, position, year, turn, coalition_id) {
    return db('candidatos')
        .where('sigla_uf', uf)
        .where('codigo_cargo', position)
        .where('ano_eleicao', year)
        .where('num_turno', turn)
        .where('id_legenda', coalition_id);
}

function getMunVotes(uf, year, turn, candidate_id) {
    return db('votos_mun')
        .where('sigla_uf', uf)
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