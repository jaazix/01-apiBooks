const express = require('express');
require('../config');
const { TextServiceClient } = require("@google-ai/generativelanguage").v1beta2;
const { GoogleAuth } = require("google-auth-library");
const translator = require('@parvineyvazov/json-translator');
const MODEL_NAME = "models/text-bison-001";
const API_KEY = process.env.API_KEY;
const app = express();
const _ = require('underscore');
let res = "";

const client = new TextServiceClient({
    authClient: new GoogleAuth().fromAPIKey(API_KEY),
  });

  async function traducir (str){
    const salida = await translator.translateWord(
      str,
      translator.languages.Spanish,
      translator.languages.English
    );
    return salida
  }
  
  async function translate(text) {
    const salida = await translator.translateWord(
      text,
      translator.languages.English,
      translator.languages.Spanish
    );
    return salida
  }
  
  async function llm(str){
    const prompt = await traducir(str)
    const result = await client.generateText({
      model: MODEL_NAME,
      prompt: {
        text: prompt,
      }
    });
    if (result[0] && result[0].candidates && result[0].candidates[0]) {
      res = JSON.stringify(result[0].candidates[0].output, null, 2);
    } else {
      res = "I don't understand, can you repeat it"
    }
    let salida = await translate(res);
    return salida
  }

  app.post('/chat', async (req, res) => {
    let body = req.body;
    let str = body.texto;
    str = str.replace("?"," ");
    let salida = await llm(str);
    res.json({
        ok: true,
        msg: 'Texto generado con exito',
        salida
    });
  });

module.exports = app;