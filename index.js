"use strict";

var mongoose = require("mongoose");
var app = require("./app");
var port = process.env.PORT || 3999;

mongoose.Promise = global.Promise;

mongoose
  .connect("mongodb://127.0.0.1:27017/api_rest_node", {
    useNewUrlParser: true,
  })
  .then(() => {
    console.log("conexion a la bd se ha realizado correctamente");
    // Crear el servidor
    app.listen(port, () => {
      console.log("el servidor http://127.0.0.1:3999 está funcionando!!");
    });
  })
  .catch((error) => console.log(error));
