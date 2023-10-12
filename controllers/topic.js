"use strict";

var validator = require("validator");
var Topic = require("../models/topic");

var controller = {
  test: function (req, res) {
    return res.status(200).send({
      message: "hola que tal",
    });
  },

  save: async function (req, res) {
    var params = req.body;
    try {
      var validate_title = !validator.isEmpty(params.title);
      var validate_content = !validator.isEmpty(params.content);
      var validate_lang = !validator.isEmpty(params.lang);

      if (validate_content && validate_title && validate_lang) {
        var topic = new Topic();
        topic.title = params.title;
        topic.content = params.content;
        topic.code = params.code;
        topic.lang = params.lang;
        topic.user = req.user.sub;
        const topicStored = await topic.save();

        if (!topicStored) {
          return res.status(404).send({
            status: "error",
            message: "El tema no se ha guardado",
          });
        }

        return res.status(200).send({
          status: "success",
          topic: topicStored,
        });
      } else {
        return res.status(200).send({
          message: "Los datos no son válidos",
        });
      }
    } catch (err) {
      return res.status(200).send({
        message: "Faltan datos por enviar",
      });
    }
  },

  getTopics: function (req, res) {
    // cargar la libreria de paginacion en la clase(modelo)

    // recoger la pag actual
    if (
      !req.params.page ||
      req.params.page == 0 ||
      req.params.page == "0" ||
      req.params.page == undefined
    ) {
      var page = 1;
    } else {
      var page = parseInt(req.params.page);
    }

    // indicar las opciones de paginacion
    var options = {
      sort: { date: -1 },
      populate: "user",
      limit: 5,
      page: page,
    };
    // find paginado

    Topic.paginate({}, options, (err, topics) => {
      if (err) {
        return res.status(500).send({
          status: "error",
          message: "error al hacer la consulta",
        });
      }

      if (!topics) {
        return res.status(404).send({
          status: "notfound",
          message: "no hay topics",
        });
      }
      // devolver  resultado(topics, total de topics, total de pags)
      return res.status(200).send({
        status: "success",
        topics: topics.docs,
        totalDocs: topics.totalDocs,
        totalPages: topics.totalPages,
      });
    });
  },

  getTopicsByUser: function (req, res) {
    var userId = req.params.user;
    Topic.find({ user: userId })
      .sort([["date", "descending"]])
      .then((topics) => {
        if (!topics || topics.length === 0) {
          return res.status(404).send({
            status: "error",
            message: "no hay topics para mostrar",
          });
        }
        return res.status(200).send({
          status: "success",
          topics,
        });
      })
      .catch((err) => {
        return res.status(500).send({
          status: "error",
          message: "error en la peticion",
        });
      });
  },

  getTopic: function (req, res) {
    var topicId = req.params.id;
    Topic.findById(topicId)
      .populate("user")
      .then((topic) => {
        if (!topic) {
          return res.status(404).send({
            status: "error",
            message: "No existe el tema",
          });
        }

        return res.status(200).send({
          status: "success",
          topic,
        });
      })
      .catch((err) => {
        return res.status(500).send({
          status: "error",
          message: "Error en la peticion",
        });
      });
  },

  update: async function (req, res) {
    var topicId = req.params.id;
    var params = req.body;

    try {
      var validate_title = !validator.isEmpty(params.title);
      var validate_content = !validator.isEmpty(params.content);
      var validate_lang = !validator.isEmpty(params.lang);
    } catch (err) {
      return res.status(500).send({
        message: "Faltan datos por enviar",
      });
    }

    if (validate_title && validate_content && validate_lang) {
      var update = {
        title: params.title,
        content: params.content,
        code: params.code,
        lang: params.lang,
      };

      var topicUpdated = await Topic.findOneAndUpdate(
        { _id: topicId, user: req.user.sub },
        update,
        { new: true }
      );

      if (!topicUpdated) {
        return res.status(404).send({
          status: "error",
          message: "No se ha actualizado el tema",
        });
      }

      return res.status(200).send({
        status: "success",
        topic: topicUpdated,
      });
    }
  },

  delete: async function (req, res) {
    try {
      // sacar id del topic de la url
      var topicId = req.params.id;
      // find and delete por topic id y por userid
      const topicRemoved = await Topic.findOneAndDelete({
        _id: topicId,
        user: req.user.sub,
      });

      if (!topicRemoved) {
        return res.status(500).send({
          status: "error",
          message: "No se ha borrado el tema",
        });
      }

      // devolver respuesta
      return res.status(200).send({
        status: "success",
        topic: topicRemoved,
      });
    } catch (err) {
      return res.status(500).send({
        status: "error",
        message: "Error en la peticion",
      });
    }
  },

  search: async function (req, res) {
    try {
      // sacar string a buscar de la url
      var searchString = req.params.search;
      // find or
      const topics = await Topic.find({
        $or: [
          { title: { $regex: searchString, $options: "i" } },
          { content: { $regex: searchString, $options: "i" } },
          { lang: { $regex: searchString, $options: "i" } },
          { code: { $regex: searchString, $options: "i" } },
        ],
      }).sort([["date", "descending"]]);
      if (!topics || topics.length === 0) {
        return res.status(404).send({
          status: "error",
          message: "no hay temas disponibles",
        });
      }

      // devolver resultado
      return res.status(200).send({
        status: "success",
        topics,
      });
    } catch (err) {
      return res.status(500).send({
        status: "error",
        message: "error en la peticion",
      });
    }
  },
};

module.exports = controller;
