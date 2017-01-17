function (db, queryParams, res) {
    var GridFsService = db._svc.GridFsService;
    
    var key=queryParams.key;
    var version=queryParams.version;
    
    if(!key || !version) {
        throw 'missing required parameters';
    }
    
    return db.HostedPackage.findOne({"business_object_package.key":key})
    .then(
        function(hp){
            var pkgIndex=0;
            var versions = hp.available_versions;
            
            for(pkgIndex=0; pkgIndex < versions.length; pkgIndex++) {
                if(versions[pkgIndex] == version) break;
            }
            if(pkgIndex >= versions.length) {
                throw 'version '+version+' not found';
            }
            
            var fileId = hp.package_files[pkgIndex].attachment_id;
            
            return GridFsService.getFile(fileId);
        }
    )
    .then(
        function(f) {
            console.log(f);
            return {
                __stream_response:f.readstream
            }
        }
    );
    
}