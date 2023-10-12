"use strict";

// var multipart = require("connect-multiparty");
// var md_upload = multipart({ uploadDir: "./upload/users" });

var validator = require("validator");
var User = require("../models/user");
var jwt = require("./services/jwt");
var bcrypt = require("bcrypt");
var fs = require("fs");
var path = require("path");
var saltRounds = 10;

var controller = {
  probando: function (req, res) {
    return res.status(200).send({
      message: "soy el metodo probando",
    });
  },

  hola: function (req, res) {
    return res.status(200).send({
      message: "soy el metodo hola",
    });
  },

  // METODO SAVE
  save: async function (req, res) {
    try {
      const params = req.body;
      const validate_name = params.name
        ? !validator.isEmpty(params.name)
        : false;
      const validate_surname = params.surname
        ? !validator.isEmpty(params.surname)
        : false;
      const validate_email = params.email
        ? !validator.isEmpty(params.email) && validator.isEmail(params.email)
        : false;
      const validate_password = params.password
        ? !validator.isEmpty(params.password)
        : false;

      if (
        validate_name &&
        validate_surname &&
        validate_password &&
        validate_email
      ) {
        const user = new User();
        user.name = params.name;
        user.surname = params.surname;
        user.email = params.email.toLowerCase();
        user.role = "ROLE_USER";
        user.image = null;

        const issetUser = await User.findOne({ email: user.email });

        if (!issetUser) {
          const hash = await bcrypt.hash(params.password, saltRounds);
          user.password = hash;

          try {
            const userStored = await user.save();
            return res.status(200).send({
              status: "success",
              user: userStored,
            });
          } catch (err) {
            return res.status(500).send({
              message: "Error al guardar el usuario",
            });
          }
        } else {
          return res.status(500).send({
            message: "El usuario ya está registrado",
          });
        }
      } else {
        return res.status(400).send({
          message:
            "La validación de los datos del usuario es incorrecta, inténtalo de nuevo",
        });
      }
    } catch (err) {
      return res.status(500).send({
        message: "Error al comprobar duplicidad de usuario",
      });
    }
  },
  // MÉTODO LOGIN
  login: async function (req, res) {
    var params = req.body;

    try {
      var validate_email =
        !validator.isEmpty(params.email) && validator.isEmail(params.email);
      var validate_password = !validator.isEmpty(params.password);
    } catch (err) {
      return res.status(500).send({
        message: "Faltan datos por enviar",
      });
    }
    if (!validate_email || !validate_password) {
      return res.status(400).send({
        message: "Los datos son incorrectos, envíalos de la manera adecuada",
      });
    }

    const user = await User.findOne({ email: params.email.toLowerCase() });

    if (!user) {
      return res.status(400).send({
        message: "No se encontró ningún usuario con ese correo electrónico",
      });
    }

    const passwordMatch = await bcrypt.compare(params.password, user.password);

    if (passwordMatch) {
      // Generar token de jwt y devolverlo
      if (params.gettoken) {
        return res.status(200).send({
          token: jwt.createToken(user),
        });
      } else {
        user.password = undefined;

        return res.status(200).send({
          message: "success",
          user: user,
          // También puedes incluir el token en la respuesta si lo generas
        });
      }
    } else {
      return res.status(400).send({
        message: "La contraseña no es válida",
      });
    }
  },

  // METODO UPDATE
  update: async function (req, res) {
    try {
      // recoger los datos del usuario
      var params = req.body;

      // validar datos
      const validate_name = params.name
        ? !validator.isEmpty(params.name)
        : false;
      const validate_surname = params.surname
        ? !validator.isEmpty(params.surname)
        : false;
      const validate_email = params.email
        ? !validator.isEmpty(params.email) && validator.isEmail(params.email)
        : false;

      // Comprobar si algún dato no es válido
      if (!(validate_name && validate_surname && validate_email)) {
        throw new Error("Faltan datos por enviar");
      }

      // eliminar propiedades innecesarias
      delete params.password;

      var userId = req.user.sub;

      // Comprobar si el nuevo email ya está en uso
      const existingUser = await User.findOne({ email: params.email });
      if (existingUser && existingUser._id.toString() !== userId) {
        throw new Error("El email ya está en uso");
      }

      // buscar y actualizar documento en la bd
      const userUpdated = await User.findOneAndUpdate({ _id: userId }, params, {
        new: true,
      });

      if (!userUpdated) {
        return res.status(400).send({
          status: "error",
          message: "error al actualizar usuario",
        });
      }

      // devolver una respuesta
      return res.status(200).send({
        status: "success",
        user: userUpdated,
      });
    } catch (err) {
      return res.status(200).send({
        message: err.message, // Devolver el mensaje de error
      });
    }
  },

  uploadAvatar: async function (req, res) {
    try {
      // configurar el modulo multiparty (md) OK
      // recoger el fichero de la peticion
      var file_name = "Avatar no subido...";

      if (!req.files) {
        return res.status(404).send({
          status: "error",
          message: file_name,
        });
      }

      // conseguir el nombre y la ext del archivo subido
      var file_path = req.files.file0.path;
      var file_split = file_path.split("\\");

      // nombre del archivo
      var file_name = file_split[2];

      // extension del archivo
      var ext_split = file_name.split(".");
      var file_ext = ext_split[1];

      // comprobar extension(solo imagenes), si no es valida borrar fichero subido
      if (
        file_ext != "png" &&
        file_ext != "jpg" &&
        file_ext != "jpeg" &&
        file_ext != "gif"
      ) {
        await fs.promises.unlink(file_path);

        return res.status(200).send({
          status: "error",
          message: "la extension del archivo no es valida.",
        });
      } else {
        // sacar el id del usuario identificado
        var userId = req.user.sub;

        // find and update documento de la bd
        const userUpdated = await User.findOneAndUpdate(
          { _id: userId },
          { image: file_name },
          { new: true }
        );

        if (!userUpdated) {
          return res.status(500).send({
            status: "error",
            message: "Error al guardar el usuario",
          });
        }
        // devolver una respuesta
        return res.status(200).send({
          status: "success",
          user: userUpdated,
        });
      }
    } catch (err) {
      console.error(err);
      return res.status(500).send({
        status: "error",
        message: "Error interno del servidor",
      });
    }
  },

  avatar: function (req, res) {
    var fileName = req.params.fileName;
    var pathFile = "./uploads/users/" + fileName;

    if (fs.existsSync(pathFile)) {
      return res.sendFile(path.resolve(pathFile));
    } else {
      return res.status(404).send({
        message: "La imagen no existe",
      });
    }
  },

  getUsers: async function (req, res) {
    try {
      const users = await User.find();

      if (!users || users.length === 0) {
        return res.status(404).send({
          status: "error",
          message: "No hay usuarios que mostrar",
        });
      }

      return res.status(200).send({
        status: "success",
        users,
      });
    } catch (err) {
      return res.status(500).send({
        status: "error",
        message: "Error al obtener usuarios",
        error: err.message,
      });
    }
  },

  getUser: async function (req, res) {
    try {
      var userId = req.params.userId;

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).send({
          status: "error",
          message: "No existe el usuario",
        });
      }

      return res.status(200).send({
        status: "success",
        user,
      });
    } catch (err) {
      return res.status(500).send({
        status: "error",
        message: "Error al obtener el usuario",
        error: err.message,
      });
    }
  },
};

module.exports = controller;
