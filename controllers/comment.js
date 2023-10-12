"use strict";
var validator = require("validator");
var Topic = require("../models/topic");

var controller = {
  add: async function (req, res) {
    try {
      // recoger el id del topic de la url
      var topicId = req.params.topicId;

      // find por id del topic
      const topic = await Topic.findById(topicId);

      if (!topic) {
        return res.status(404).send({
          status: "error",
          message: "no existe el tema",
        });
      }

      // comprobar obj usuario y validar datos

      if (!req.body.content) {
        return res.status(200).send({
          message: "No has comentado nada!!",
        });
      }

      var validate_content = !validator.isEmpty(req.body.content);

      if (!validate_content) {
        return res.status(200).send({
          message: "No se han validado los datos del comentario",
        });
      }

      var comment = {
        user: req.user.sub,
        content: req.body.content,
      };

      // En la propiedad comments del objeto resultante hacer un push
      topic.comments.push(comment);

      // Guardar el topic completo
      await topic.save();

      // Devolver respuesta
      return res.status(200).send({
        status: "success",
        topic,
      });
    } catch (error) {
      return res.status(500).send({
        status: "error",
        message: "error en la peticion",
      });
    }
  },

  update: async function (req, res) {
    try {
      var commentId = req.params.commentId;
      var params = req.body;

      if (!params.content) {
        return res.status(200).send({
          message: "No has comentado nada!!",
        });
      }

      const topicUpdated = await Topic.findOneAndUpdate(
        { "comments._id": commentId },
        {
          $set: {
            "comments.$.content": params.content,
          },
        },
        { new: true }
      );

      if (!topicUpdated) {
        return res.status(404).send({
          status: "error",
          message: "no existe el tema",
        });
      }

      return res.status(200).send({
        status: "success",
        topic: topicUpdated,
      });
    } catch (error) {
      return res.status(500).send({
        status: "error",
        message: "error en la peticion",
      });
    }
  },
  delete: async function (req, res) {
    try {
      var topicId = req.params.topicId;
      var commentId = req.params.commentId;

      // Buscar el topic
      const topic = await Topic.findById(topicId);

      if (!topic) {
        return res.status(404).send({
          status: "error",
          message: "no existe el tema",
        });
      }

      // Seleccionar el subdocumento (comentario)
      const comment = topic.comments.id(commentId);

      // Verificar si el comentario existe
      if (comment) {
        // Eliminar el comentario del array de comentarios
        topic.comments.pull(commentId);

        // Guardar el topic
        await topic.save();

        // Devolver respuesta
        return res.status(200).send({
          status: "success",
          topic,
        });
      } else {
        return res.status(404).send({
          status: "error",
          message: "no existe el comentario",
        });
      }
    } catch (error) {
      return res.status(500).send({
        status: "error",
        message: "error en la petición",
      });
    }
  },
};

module.exports = controller;
