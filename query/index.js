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

const handlers = {
    legendas: getParties,
    candidatos: getCandidates,
    votos_mun: getMunVotes,
    ql: getQl,
};

exports.handler = async function(event, context) {
    context.callbackWaitsForEmptyEventLoop = false; 
    const { table, ...params } = event.queryStringParameters || {};
    
    try {
        let action = handlers[table];
        if (action)
            return createResponse(await action(params));
        else
            throw Error("Invalid Table");
    } catch (e) {
        return createResponse("Could not run query: " + e, 402);
    }
       
};

function getParties(params) {
    let { uf, position, year, turn } = params;
    
    if (position == 1) uf = "BR";
    
    return db('candidatos')
        .select(['sigla_partido', 'numero_partido'])
        .where('sigla_uf', uf.toUpperCase())
        .where('codigo_cargo', position)
        .where('ano_eleicao', year)
        .where('num_turno', turn)
        .groupBy(['sigla_partido', 'numero_partido']);
}

function getCandidates(params) {
    let { uf, position, year, turn, party } = params;
    
    if (position == 1) uf = "BR";
    
    return db('candidatos')
        .select(['id_candidato', 'nome_candidato', 'numero_candidato'])
        .where('sigla_uf', uf.toUpperCase())
        .where('codigo_cargo', position)
        .where('ano_eleicao', year)
        .where('num_turno', turn)
        .where('numero_partido', party);
}

function getMunVotes(params) {
    let { uf, year, turn, candidate_id } = params;
    
    return db('votos_mun')
        .select([
            'id_candidato',
            'id_legenda',
            'numero_candidato',
            'codigo_macro',
            'nome_macro',
            'uf',
            'nome_uf',
            'codigo_meso',
            'nome_meso',
            'codigo_micro',
            'nome_micro',
            'nome_municipio',
            'cod_mun_tse',
            'cod_mun_ibge',
            'qtde_votos'
        ])
        .where('uf', uf.toUpperCase())
        .where('ano_eleicao', year)
        .where('num_turno', turn)
        .where('id_candidato', candidate_id);
}

function getQl(params) {
    let { uf, year, turn, candidate_id, position } = params;
    
    return  db.raw(`
        select numero_candidato, 
        cod_mun_tse, 
        total_votos_estado, 
        total_votos_cand, 
        qtde_votos_mun, 
        (qtde_votos * total_votos_estado) / (total_votos_cand * qtde_votos_mun) as QL 
        from(
            select numero_candidato, 
            m.cod_mun_tse, m.qtde_votos, 
            s.qtde_votos as qtde_votos_mun,
            (select sum(qtde_votos) 
                from votos_mun where ano_eleicao = '${year}' and uf = '${uf.toUpperCase()}' and turn = ${turn} and codigo_cargo = '${position}' and id_candidato = ${candidate_id}) as total_votos_cand,
            (select sum(qtde_votos) 
                from votos_mun where ano_eleicao = '${year}' and uf = '${uf.toUpperCase()}' and turn = ${turn} and codigo_cargo = '${position}') as total_votos_estado
        from votos_mun as m
        join(select cod_mun_tse, 
            sum(qtde_votos) as qtde_votos 
            from votos_mun where ano_eleicao = '${year}' and uf = '${uf.toUpperCase()}' and turn = ${turn} and codigo_cargo = '${position}' group by cod_mun_tse) as s on m.cod_mun_tse = s.cod_mun_tse
        where id_candidato = ${candidate_id}) as t
    `);
}

function createResponse(result, statusCode) {
    return {
        statusCode,
        body: JSON.stringify(result),
        headers: {
          "Access-Control-Allow-Credentials": true,
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        }
    };
}