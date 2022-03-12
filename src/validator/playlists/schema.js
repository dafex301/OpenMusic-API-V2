const Joi = require('joi');

const PostPlaylistSchema = Joi.object({
  name: Joi.string().required(),
});

const PostSongToPlaylistSchema = Joi.object({
  songid: Joi.string().required(),
});

module.exports = { PostPlaylistSchema, PostSongToPlaylistSchema };
