function (db, Q, _) {
    
    if(!this.package_files || !this.package_files.length) {
        return;
    }
    
    const PackagingService = db._svc.PackagingService;
    const GridFsService = db._svc.GridFsService;
    
    if(!PackagingService.getPackageMetadataFromStream) {
        console.log('Upgrade Noonan core codebase to add metadata indexing to HostedPackage');
        return;
    }
    
    const pmd = this.package_metadata = this.package_metadata || {};
    
    const getPkgVersion = function(md) {
		return  md.version || ((md.major_version||'0')+'.'+(md.minor_version||'0')+'.0');
	};
    
    const addPkgMetadata = function(attObj) {
        return GridFsService.getFile(attObj.attachment_id).then(fd=>{
            return PackagingService.getPackageMetadataFromStream(fd.readstream);
        })
        .then(md=>{
            pmd[getPkgVersion(md)] = md;
            console.log(pmd);
        });
    };
    
    const promiseList = [];
    for(let i=0; i < this.available_versions.length; i++) {
        let ver = this.available_versions[i];
        if(ver.split('.').length < 3) {
            ver = ver+'.0';
        }
        if(!pmd[ver] && this.package_files[i]) {
            promiseList.push(addPkgMetadata(this.package_files[i]));
        }
    }
    
    return Q.allSettled(promiseList);
}