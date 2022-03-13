const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');

class PlaylistsService {
  constructor(collaborationService) {
    this._pool = new Pool();
    this._collaborationService = collaborationService;
  }

  async addPlaylist({ name, owner }) {
    const id = `playlist-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO playlists (id, name, owner) VALUES ($1, $2, $3) RETURNING id',
      values: [id, name, owner],
    };
    const result = await this._pool.query(query);
    if (!result.rows[0].id) {
      throw new InvariantError('Playlist gagal dibuat');
    }
    return result.rows[0].id;
  }

  async getPlaylists(owner) {
    const query = {
      text: `SELECT playlists.id, playlists.name, users.username FROM playlists
      LEFT JOIN collaborations ON playlists.id = collaborations.playlistid
      LEFT JOIN users ON playlists.owner = users.id
      WHERE playlists.owner = $1 OR collaborations.userid = $1`,
      values: [owner],
    };
    const result = await this._pool.query(query);
    return result.rows;
  }

  async deletePlaylist(id) {
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id',
      values: [id],
    };
    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }
  }

  async addSongToPlaylist(playlistId, songId) {
    const id = `p-s-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO playlists_songs (id, playlistid, songid) VALUES ($1, $2, $3) RETURNING id',
      values: [id, playlistId, songId],
    };

    // TODO: not found error if the song is not exist.

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Lagu gagal ditambah di playlist');
    }
  }

  async getPlaylistDetails(playlistId) {
    const query = {
      text: 'SELECT id, name, owner AS username FROM playlists WHERE id = $1',
      values: [playlistId],
    };
    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }
    return result.rows[0];
  }

  async getPlaylistSongs(playlistId) {
    const query = {
      text: 'SELECT songs.* FROM songs, playlists_songs WHERE songs.id = playlists_songs.songid AND playlists_songs.playlistid = $1',
      values: [playlistId],
    };
    const result = await this._pool.query(query);
    return result.rows;
  }

  async deleteSongFromPlaylist(playlistId, songId) {
    const query = {
      text: 'DELETE FROM playlists_songs WHERE playlistid = $1 AND songid = $2',
      values: [playlistId, songId],
    };
    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Lagu tidak ditemukan');
    }
  }

  async verifyPlaylistOwner(id, owner) {
    const query = {
      text: 'SELECT * FROM playlists WHERE id = $1',
      values: [id],
    };
    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }
    const note = result.rows[0];
    if (note.owner !== owner) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }

  async verifyPlaylistsAccess(id, userId) {
    try {
      await this.verifyPlaylistOwner(id, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      try {
        await this._collaborationService.verifyCollaborator(id, userId);
      } catch {
        throw error;
      }
    }
  }
}

module.exports = PlaylistsService;
