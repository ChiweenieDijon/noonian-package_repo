function (db, queryParams, res) {
    const semver = require('semver');
    const GridFsService = db._svc.GridFsService;
    
    const key=queryParams.key;
    const requestedVersion=queryParams.version; //can be specific version,  or range
    
    if(!key) {
        throw 'missing required parameters';
    }
    
    //Simply for backward compatibility
    const normalizeVersionStr = function(v) {
        if(v.split('.').length < 3) {
            v = v+'.0';
        }
        return v;
    };
    
    
    
    
    return db.HostedPackage.findOne({"package_key":key})
    .then(
        function(hp){
            
            if(!hp) {
                throw `Invalid package key ${key}`;
            }
            
            var pkgIndex=0;
            var versions = hp.available_versions;
            
            if(!requestedVersion) {
                requestedVersion = versions[versions.length - 1];
            }
            
            //find the most recent version we have that satisfies requestedVersion
            for(pkgIndex=versions.length-1; pkgIndex >= 0; pkgIndex--) {
                var haveVersion  = normalizeVersionStr(versions[pkgIndex]);
                if(semver.satisfies(haveVersion, requestedVersion)) {
                    break;
                }
            }
            if(pkgIndex < 0) {
                throw `Couldn't find suitable version of ${key} for ${requestedVersion}`;
            }
            
            var fileId = hp.package_files[pkgIndex].attachment_id;
            
            return GridFsService.getFile(fileId);
        }
    )
    .then(
        function(f) {
            // console.log(f);
            return {
                __stream_response:f.readstream
            }
        }
    );
    
}