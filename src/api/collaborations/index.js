const CollaborationsHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'collaborations',
  version: '1.0.0',
  register: async (
    server,
    { collaborationsSerice, playlistsService, validator },
  ) => {
    const collaborationsHandler = new CollaborationsHandler(
      collaborationsSerice,
      playlistsService,
      validator,
    );
    server.route(routes(collaborationsHandler));
  },
};
