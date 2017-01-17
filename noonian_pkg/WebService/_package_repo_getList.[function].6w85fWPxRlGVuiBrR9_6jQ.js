function (db, _) {
    return db.HostedPackage.find({}).then(function(hpList){
        var result = [];
        _.forEach(hpList, function(hp) {
            var versions = hp.available_versions;
            result.push({
               key:hp.business_object_package.key,
               latest_version:versions[versions.length-1],
               available_versions: versions
            });
        });
        return result;
    });
}