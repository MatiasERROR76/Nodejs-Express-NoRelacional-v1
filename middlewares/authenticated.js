"use strict";

var jwt = require("jwt-simple");
var moment = require("moment");
var secret = "clave-secreta-para-generar-el-token-9999";

exports.authenticated = function (req, res, next) {
  // comprobar si llega autorizacion
  if (!req.headers.authorization) {
    return res.status(403).send({
      message: "La petición no tiene la cabecera de autorización",
    });
  }

  // limipiar el token y quitar comillas
  var token = req.headers.authorization.replace(/['"']+/g, "");
  try {
    // decodificar token
    var payload = jwt.decode(token, secret);
    // comprobar exp del token
    if (payload.exp <= moment().unix()) {
      return res.status(404).send({
        message: "El token ha expirado",
      });
    }
  } catch (ex) {
    return res.status(404).send({
      message: "El token no es valido",
    });
  }
  // adjuntar usuario identificado a la req
  req.user = payload;
  //   pasar a la accion

  next();
};
