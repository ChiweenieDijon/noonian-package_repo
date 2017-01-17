function (db, _, Q) {
    return db.BusinessObjectPackage.find({}).then(function(bopList) {
        var promiseList = [];
        _.forEach(bopList, function(bopObj) {
            if(bopObj.package_file) {
                var versionStr = (bopObj.major_version || '0')+'.'+(bopObj.minor_version || '0');
                var hostedObj = new db.HostedPackage({
                    business_object_package:{_id:bopObj._id},
                    available_versions:[versionStr],
                    package_files:[bopObj.package_file]
                });
                
                promiseList.push(hostedObj.save());
            }
        });
        
        return Q.all(promiseList).then(function() {
            return {message:'Success'};
        });
    });
}