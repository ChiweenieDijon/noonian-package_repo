function (db) {
    if(this.minor_version && this.package_file) {
        var currentVersion = (this.major_version || 0)+'.'+this.minor_version;
        var attachment = this.package_file;
        db.HostedPackage.findOne({'business_object_package._id':this._id}).then(function(hp) {
            if(!hp) {
                return;
            }
            
            for(var i=0; i < hp.available_versions.length; i++) {
                if(hp.available_versions[i] == currentVersion) {
                    return;
                }
            }
            hp.package_files.push(attachment);
            hp.available_versions.push(currentVersion);
            hp.save();
        });
    }
}