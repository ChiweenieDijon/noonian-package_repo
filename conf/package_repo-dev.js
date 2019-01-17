module.exports = {
  instanceId:'sys-pkg',
  instanceName:'sys-pkg',

  serverListen: {
    port: 9000,
    host: '127.0.0.1'
  },

  mongo: {
    uri: 'mongodb://localhost/noonian-sys-pkg'
  },

  enablePackaging:true,
  enableHistory:false, //awaiting fix to system to enable this
  
  packageFsConfig:{
    'sys.package_repo':{
	syncDir:'../noonian-package_repo/noonian_pkg',
	distDir:'../noonian-package_repo/dist'
    }
  },
  
  // Secret for session, TODO configure to use PKI
  secrets: {
    session: 'change me'
  },
  
  urlBase:'sys-pkg',
  
  dev:true

};
